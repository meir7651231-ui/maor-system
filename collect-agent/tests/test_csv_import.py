"""ייבוא CSV — חלופה ל-API (הכרעת מאיר 6.11)."""
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app import csv_import
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)

CSV_HE = ("מספר מסמך,שם לקוח,טלפון,מייל,יתרה לתשלום,תאריך,תאריך לתשלום\n"
          "2001,דנה כהן,050-1234567,dana@example.com,\"1,200.50\",01/09/2026,01/10/2026\n"
          "2002,יוסי לוי,,yossi@example.com,450,2026-09-15,\n"
          "2003,שולם כבר,050-1111111,,0,2026-09-15,2026-10-15\n"
          "2004,בלי קשר,,,300,2026-09-15,2026-10-15\n"
          "2005,סכום רע,050-2222222,,abc,2026-09-15,2026-10-15\n")


def test_parse_hebrew_export():
    r = csv_import.parse(CSV_HE.encode("utf-8-sig"))
    assert [i.number for i in r.invoices] == ["2001", "2002"]
    a, b = r.invoices
    assert a.amount_agorot == 120050 and a.due.isoformat() == "2026-10-01"
    assert b.due.isoformat() == "2026-10-15" and b.due_estimated     # בלי מועד ⇒ +30
    assert {e["row"] for e in r.errors} == {5, 6}                      # בלי קשר · סכום פסול


def test_parse_english_and_missing_columns():
    r = csv_import.parse("number,customer,phone,amount\n7,A,0501234567,10\n")
    assert r.invoices[0].amount_agorot == 1000
    with pytest.raises(ValueError, match="חסרות עמודות"):
        csv_import.parse("foo,bar\n1,2\n")
    with pytest.raises(ValueError):
        csv_import.parse(b"x" * (csv_import.MAX_BYTES + 1))


def test_duplicate_number_rejected():
    r = csv_import.parse("number,client,phone,amount\n1,A,0501234567,10\n1,B,0501234568,20\n")
    assert len(r.invoices) == 1 and "כפול" in r.errors[0]["error"]


def test_csv_import_endpoint_and_24h_validity(api, svc, clock):
    """ר-4 ל-CSV: אין API לרענון ⇒ תקף 24 שעות מהייבוא; אחרי כן לא נשלח עד ייבוא חדש."""
    assert api.post("/import/csv", content=CSV_HE.encode()).json()["imported"] == 2
    assert api.post("/import/csv", content=b"bad").status_code == 400
    ids = api.post("/plan").json()["created"]
    assert ids
    for i in ids:
        api.post(f"/reminders/{i}/approve")
    clock.now += timedelta(hours=25)
    api.post("/dispatch")
    assert svc.sender.sent == []
    assert {svc._reminder(i)["block_reason"] for i in ids} == {"csv_stale"}
    api.post("/import/csv", content=CSV_HE.encode())                    # ייבוא מחדש = אימות
    api.post("/dispatch")
    assert svc.sender.sent


def test_csv_import_requires_owner_auth(svc):
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert pub.post("/import/csv", content=CSV_HE.encode()).status_code == 401


def test_partial_csv_does_not_close_other_invoices(api, svc):
    api.post("/sync")                                  # 2 חשבוניות מה-API
    api.post("/import/csv", content=b"number,client,phone,amount\n9,X,0501234569,10\n")
    assert svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open'")["n"] == 3

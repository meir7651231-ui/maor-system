"""משימת מקשר (21.11, מעיצוב 1b2eefec): `DEMO=1` יחד עם `SOURCE_SYSTEM=csv` ⇒ ההדגמה עולה כעסק CSV.

קודם: ההדגמה התעלמה מ-SOURCE_SYSTEM (הגדרות קבועות) ⇒ e2e של עסק CSV נאלץ להחליף מקור דרך PUT /settings, ותרחיש
ההדגמה (sync) לא התאים למקור CSV (sync זורק במכוון — אין API). עכשיו: ייבוא דמו בקובץ Windows-1255 ⇒ רשימת פתוחות
מאושרת ⇒ תזכורות ממתינות לאישור, בלי שליחה. בלי SOURCE_SYSTEM=csv ⇒ ההדגמה הרגילה, ללא שינוי.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app import demo
from app.main import create_app
from app.service import is_synthetic_contact
from tests.conftest import OWNER_TOKEN


def _boot(monkeypatch, source: str | None):
    monkeypatch.setenv("DEMO", "1")
    for k in ("DEMO_CLOCK", "DEMO_USER_EMAIL", "DEMO_STAFF_EMAIL", "REQUIRE_USER_LOGIN", "SOURCE_SYSTEM"):
        monkeypatch.delenv(k, raising=False)
    if source is not None:
        monkeypatch.setenv("SOURCE_SYSTEM", source)
    c = TestClient(create_app(owner_token=OWNER_TOKEN), headers={"Authorization": f"Bearer {OWNER_TOKEN}"})
    return c, c.app.state.svc


@pytest.mark.parametrize("value", ["csv", "CSV", " csv "])
def test_demo_csv_boots_with_imported_file(monkeypatch, value):
    c, svc = _boot(monkeypatch, value)
    assert svc.s.source_system == "csv"
    assert svc.sender.sent == []                                     # אף הודעה לא יצאה
    d = c.get("/dashboard").json()
    assert d["csv_freshness"] == {"last_import": demo.DEMO_NOW.date().isoformat(), "upload_needed": False}
    invs = svc.db.q("SELECT number, source FROM invoices WHERE status='open'")
    assert len(invs) == 9 and {i["source"] for i in invs} == {"csv"}
    ol = c.get("/open-list").json()
    assert ol["pending"] == [] and len(ol["confirmed"]) == 9
    pend = [r for r in c.get("/reminders").json() if r["status"] == "pending_approval"]
    assert pend, "בדמו CSV אין תזכורת לאשר"
    # /sync ידני בעסק CSV ⇒ תשובה מוסברת (503 + «ייבוא דרך…»), לא קריסה
    r = c.post("/sync")
    assert r.status_code == 503 and "CSV" in r.json()["detail"]


def test_demo_default_unchanged(monkeypatch):
    _, svc = _boot(monkeypatch, None)
    assert svc.s.source_system == "greeninvoice"
    assert svc.db.one("SELECT COUNT(*) n FROM invoices WHERE source='csv'")["n"] == 0


def test_demo_other_source_value_is_regular_demo(monkeypatch):
    _, svc = _boot(monkeypatch, "icount")                            # לא csv ⇒ ההדגמה הרגילה (mock GI)
    assert svc.s.source_system == "greeninvoice"


def test_demo_csv_file_is_hebrew_excel_and_synthetic():
    raw = demo.demo_csv()
    with pytest.raises(UnicodeDecodeError):
        raw.decode("utf-8")                                          # Windows-1255, כמו Excel בעברית
    from app import csv_import
    r = csv_import.parse(raw)
    assert len(r.invoices) == 9 and [e["row"] for e in r.errors] == [7]   # «בלי פרטים» נדחה עם הסבר
    assert all(is_synthetic_contact(i.client_phone, i.client_email) for i in r.invoices)
    assert {i.currency for i in r.invoices} == {"ILS", "USD"}

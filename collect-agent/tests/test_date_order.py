"""הפעלה 112 — תאריכים מקלט חיצוני.

באג: קובץ CSV מ-Excel באנגלית (MM/DD/YYYY) נקרא בשקט כ-DD/MM ⇒ "03/05/2026" (5 במרץ) נקלט כ-3 במאי,
ומועד התשלום זז בחודשים ⇒ תזכורת לחייב לפני המועד (או איחור מדומה). וגם: שנה שגויה ("0226") התקבלה,
ותאריך בלי אפס מוביל מה-API ("5/3/2026") הפך בשקט למועד מוערך הנפקה+30.
"""
from datetime import date

import pytest

from app import csv_import
from app.integrations.sources import parse_il_date

HEAD = "מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך,תאריך לתשלום\n"


def _parse(rows: str):
    return csv_import.parse((HEAD + rows).encode("utf-8"))


def test_us_file_detected_and_read_month_first():
    r = _parse("1,א,0501234567,100,03/05/2026,03/25/2026\n"
               "2,ב,0501234568,100,04/01/2026,05/01/2026\n")
    assert r.date_order == "mdy" and not r.errors
    a, b = r.invoices
    assert a.issued == date(2026, 3, 5) and a.due == date(2026, 3, 25)
    assert b.issued == date(2026, 4, 1) and b.due == date(2026, 5, 1)


def test_israeli_file_unchanged():
    r = _parse("1,א,0501234567,100,25/03/2026,03/05/2026\n")
    assert r.date_order == "dmy" and not r.errors
    assert r.invoices[0].issued == date(2026, 3, 25) and r.invoices[0].due == date(2026, 5, 3)


def test_no_evidence_defaults_to_israeli():
    r = _parse("1,א,0501234567,100,03/05/2026,\n")
    assert r.date_order == "dmy" and r.invoices[0].issued == date(2026, 5, 3)


def test_mixed_file_rejects_only_ambiguous_rows():
    r = _parse("1,א,0501234567,100,25/03/2026,\n"     # DMY ודאי
               "2,ב,0501234568,100,03/25/2026,\n"     # MDY ודאי
               "3,ג,0501234569,100,03/05/2026,\n"     # דו-משמעי ⇒ נדחה
               "4,ד,0501234560,100,04/04/2026,\n")    # יום=חודש ⇒ לא דו-משמעי
    assert r.date_order == "mixed"
    assert {i.number: i.issued for i in r.invoices} == {
        "1": date(2026, 3, 25), "2": date(2026, 3, 25), "4": date(2026, 4, 4)}
    assert [e["row"] for e in r.errors] == [4] and "דו-משמעי" in r.errors[0]["error"]


@pytest.mark.parametrize("v", ["01/10/0226", "01/10/1926", "2226-10-01", "01/10/2126"])
def test_absurd_year_rejected(v):
    r = _parse(f"1,א,0501234567,100,{v},\n")
    assert not r.invoices and "שנה לא סבירה" in r.errors[0]["error"]


@pytest.mark.parametrize("v,exp", [
    ("2026-09-15 00:00:00", date(2026, 9, 15)),     # ייצוא Excel/Sheets עם שעה
    ("2026-09-15T10:00:00", date(2026, 9, 15)),
    ("15.09.2026", date(2026, 9, 15)),
    ("15-09-2026", date(2026, 9, 15)),
    ("5/9/2026", date(2026, 9, 5)),
    ("15/09/26", date(2026, 9, 15)),
])
def test_common_formats(v, exp):
    r = _parse(f"1,א,0501234567,100,{v},\n")
    assert not r.errors and r.invoices[0].issued == exp


@pytest.mark.parametrize("v", ["31/02/2026", "abc", "46000", "2026/09/15"])
def test_garbage_still_row_error(v):
    r = _parse(f"1,א,0501234567,100,{v},\n")
    assert not r.invoices and "תאריך" in r.errors[0]["error"]


@pytest.mark.parametrize("v,exp", [
    ("2026-10-20", date(2026, 10, 20)),
    ("2026-10-20T00:00:00+03:00", date(2026, 10, 20)),
    ("20/10/2026", date(2026, 10, 20)),
    ("5/3/2026", date(2026, 3, 5)),
    ("05.03.2026", date(2026, 3, 5)),
    ("20/10/2026 00:00", date(2026, 10, 20)),
    ("0226-10-20", None), ("20/10/0226", None), ("31/02/2026", None),
    ("", None), (None, None), (True, None), ("garbage", None),
])
def test_api_parse_il_date(v, exp):
    assert parse_il_date(v) == exp


def test_api_reports_date_order(svc):
    from fastapi.testclient import TestClient

    from app.main import create_app
    from tests.conftest import AUTH, OWNER_TOKEN
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    body = (HEAD + "1,א,050-1234567,100,03/25/2026,\n").encode()
    r = api.post("/settings/source/csv", content=body)
    assert r.status_code == 200, r.text
    assert r.json()["date_order"] == "mdy"

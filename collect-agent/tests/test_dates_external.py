"""הפעלה 118 — תאריכים מקלט חיצוני (GI/iCount/EZcount/רווחית) מול מועד התזכורת.

באגים שנמצאו (בדיקה דרך parse_il_date/_parse_date, מיפוי כל מקור, ו-/sync ⇒ /plan):
- מועד תשלום אמיתי בפורמט שלא זוהה ("15-10-2026", "1/10/26", "2026/10/15", epoch, "/Date(ms)/",
  RLM מוביל) נפל ל-None בשקט ⇒ מועד "מוערך" הנפקה+30 ⇒ «טרם שולמה» לפני המועד האמיתי.
- חותמת UTC של חצות-ישראל ("2026-10-19T21:00:00Z") נקראה כיום הקודם ⇒ תזכורת יום מוקדם מדי.
- iCount: "0000-00-00" ב-duedate הסתיר מועד אמיתי בשדה החלופי due_date.
"""
from __future__ import annotations

from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.greeninvoice import _parse_date, map_document
from app.integrations.base import parse_ext_date
from app.integrations.ezcount import map_ezcount_doc
from app.integrations.icount import map_icount_doc
from app.integrations.rivhit import map_rivhit_open_doc
from app.integrations.sources import parse_il_date
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc

RLM, LRM, ZWSP, NBSP = "\u200f", "\u200e", "\u200b", "\u00a0"


@pytest.mark.parametrize("raw,exp", [
    ("2026-10-15", date(2026, 10, 15)),
    ("2026-10-15T10:00:00", date(2026, 10, 15)),
    ("2026-10-15 10:00:00", date(2026, 10, 15)),
    ("2026-10-15T00:00:00+03:00", date(2026, 10, 15)),
    ("2026-10-14T21:00:00Z", date(2026, 10, 15)),        # חצות ישראל ב-UTC
    ("2026-10-14T21:00:00.000Z", date(2026, 10, 15)),
    ("2026-10-14 23:30:00+00", date(2026, 10, 15)),
    ("2026-10-15T10:00:00Z", date(2026, 10, 15)),
    ("15/10/2026", date(2026, 10, 15)),
    ("15.10.2026", date(2026, 10, 15)),
    ("15-10-2026", date(2026, 10, 15)),
    ("5/3/2026", date(2026, 3, 5)),
    ("15/10/26", date(2026, 10, 15)),
    ("15/10/2026 14:30", date(2026, 10, 15)),
    ("2026/10/15", date(2026, 10, 15)),
    ("2026.10.15", date(2026, 10, 15)),
    ("20261015", date(2026, 10, 15)),
    (20261015, date(2026, 10, 15)),
    (1792015200, date(2026, 10, 15)),                    # epoch שניות (00:00 ישראל)
    ("1792015200", date(2026, 10, 15)),
    (1792015200000, date(2026, 10, 15)),                 # epoch מילישניות
    (1792015200.0, date(2026, 10, 15)),
    ("1792015200.0", date(2026, 10, 15)),
    ("/Date(1792015200000)/", date(2026, 10, 15)),
    (f"{RLM}15/10/2026", date(2026, 10, 15)),
    (f" 15/10/2026{LRM} ", date(2026, 10, 15)),
    (f"2026-10-15{RLM}", date(2026, 10, 15)),
    (f"{ZWSP}2026-10-15", date(2026, 10, 15)),
    (f"{NBSP}15.10.2026{NBSP}", date(2026, 10, 15)),
    (date(2026, 10, 15), date(2026, 10, 15)),
])
def test_real_dates_are_read(raw, exp):
    assert parse_ext_date(raw) == exp
    assert parse_il_date(raw) == exp
    assert _parse_date(raw) == exp


@pytest.mark.parametrize("raw", [
    None, "", "  ", True, False, 0, "0", "None", "null", "-", "garbage",
    "0000-00-00", "0000-00-00 00:00:00", "00/00/0000", "00.00.0000",
    "31/02/2026", "2026-02-31", "2026-10-15T25:00:00Z",
    "1900-01-01", "2999-12-31", "15/10/1900", "15/10/0226",
    46000, "46000",                       # מספר סידורי של Excel — לא epoch, לא נקרא
    1.5, float("nan"), float("inf"), RLM,
])
def test_placeholders_and_garbage_are_unknown(raw):
    assert parse_ext_date(raw) is None
    assert parse_il_date(raw) is None
    assert _parse_date(raw) is None


# ------------------------------------------------------------------ מיפוי כל מקור: מועד אמיתי, לא "מוערך"
def _icount(**kw):
    d = {"doctype": "invoice", "docnum": 3001, "client_id": 11, "client_name": "נועה ברק",
         "dateissued": "2026-09-01", "duedate": "2026-10-01", "currency_code": "ILS",
         "totalwithvat": 1500.0, "remainingsum": 1500.0, "status": 0, "is_cancelled": False}
    d.update(kw)
    return map_icount_doc(d)


def _ezcount(**kw):
    d = {"doc_uuid": "ez-1", "doc_number": "40001", "type": 305, "date": "01/09/2026",
         "pay_until": "01/10/2026", "customer_name": "ליאת רום", "customer_email": "liat@example.com",
         "customer_phone": "053-0000031", "main_currency_iso": "ILS", "price_total": 1800.0,
         "balance": 1800.0}
    d.update(kw)
    return map_ezcount_doc(d)


def _rivhit(**kw):
    d = {"customer_id": 21, "document_type": 1, "document_number": 7001, "customer_name": "שירה גל",
         "issue_date": "01/09/2026", "due_date": "01/10/2026", "total_amount": 2200.0,
         "paid_amount": 0.0, "balance": 2200.0, "currency_id": 1}
    d.update(kw)
    return map_rivhit_open_doc(d)


def _gi(**kw):
    d = gi_doc(1)
    d["documentDate"] = "2026-09-01"
    d.update(kw)
    return map_document(d)


@pytest.mark.parametrize("due_raw", ["15-12-2026", "15/12/26", "2026/12/15", f"{RLM}15/12/2026",
                                     "1797285600", 1797285600000, "2026-12-14T22:00:00Z"])
def test_every_source_keeps_the_real_due_date(due_raw):
    for inv in (_icount(duedate=due_raw), _ezcount(pay_until=due_raw), _rivhit(due_date=due_raw),
                _gi(dueDate=due_raw)):
        assert inv.due == date(2026, 12, 15), (inv.external_id, due_raw)
        assert not inv.due_estimated


@pytest.mark.parametrize("issued_raw", ["01-09-2026", "1/9/26", f"{RLM}01/09/2026", "2026/09/01"])
def test_every_source_estimates_from_real_issue_date(issued_raw):
    for inv in (_icount(dateissued=issued_raw, duedate=""), _ezcount(date=issued_raw, pay_until=""),
                _rivhit(issue_date=issued_raw, due_date=""), _gi(documentDate=issued_raw, dueDate=None)):
        assert inv.issued == date(2026, 9, 1), inv.external_id
        assert inv.due == date(2026, 10, 1) and inv.due_estimated


def test_icount_zero_date_does_not_hide_alternate_field():
    inv = _icount(duedate="0000-00-00", due_date="2026-12-15")
    assert inv.due == date(2026, 12, 15) and not inv.due_estimated
    inv = _icount(dateissued="0000-00-00", doc_date="2026-09-01", duedate="")
    assert inv.issued == date(2026, 9, 1) and inv.due == date(2026, 10, 1) and inv.due_estimated


def test_zero_due_is_estimated_not_overdue_since_year_zero():
    for inv in (_icount(duedate="0000-00-00"), _ezcount(pay_until="00/00/0000"),
                _rivhit(due_date="0000-00-00"), _gi(dueDate="0000-00-00")):
        assert inv.due == date(2026, 10, 1) and inv.due_estimated


# ------------------------------------------------------------------ מקצה לקצה: אין תזכורת לפני המועד האמיתי
@pytest.mark.parametrize("due_raw", [f"{RLM}2026-12-31", "2026/12/31", "31-12-2026", "1798668000"])
def test_future_due_in_odd_format_gets_no_overdue_reminder(svc, fake_gi, due_raw):
    """היום 8.11.2026 (clock). הנפקה 1.10 ⇒ "מוערך" 31.10 = באיחור. המועד האמיתי 31.12 ⇒ אין תזכורת.
    לפני התיקון: הפורמט לא זוהה ⇒ נוצרה תזכורת «טרם שולמה» על חוב שעוד לא הגיע מועדו."""
    doc = gi_doc(1)
    doc["documentDate"], doc["dueDate"] = "2026-10-01", due_raw
    fake_gi.docs = [doc]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    assert api.post("/sync").json()["open"] == 1
    assert api.post("/plan").json()["created"] == []


def test_same_doc_iso_due_already_overdue_still_reminded(svc, fake_gi):
    """בקרה: אותו מסמך עם מועד שעבר ⇒ כן נוצרת תזכורת (הבדיקה למעלה לא עוברת סתם)."""
    doc = gi_doc(1)
    doc["documentDate"], doc["dueDate"] = "2026-10-01", "31/10/2026"
    fake_gi.docs = [doc]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    assert len(api.post("/plan").json()["created"]) == 1

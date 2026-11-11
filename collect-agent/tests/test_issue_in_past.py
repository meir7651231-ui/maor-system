"""הפעלה 122 — תאריך הנפקה עם טעות בשנה **אחורה** (2024 / 2016 במקום 2026), כשמועד התשלום אמיתי וקרוב.

באג (לפני התיקון):
- הנפקה 1.11.2024 (טעות; האמיתי 1.11.2026), מועד 1.12.2026 אמיתי ⇒ «מועד מעל שנתיים אחרי ההנפקה» (הפעלה 120)
  מחק את המועד האמיתי ⇒ הוערך 1.12.2024 ⇒ החוב «באיחור שנתיים» ⇒ תזכורת **לפני** המועד האמיתי.
- הנפקה 1.9.2016 (טעות) ⇒ ר-7 «בת יותר מ-3 שנים» — נכון לטפל ידנית, אבל ההתראה לא אמרה איזה תאריך
  ולא רמזה לטעות אפשרית, כך שבעל העסק לא ידע שאולי צריך רק לתקן תאריך.
התיקון: מועד רחוק מההנפקה נחשב טעות רק כשהוא עצמו רחוק בעתיד (מעל שנה מהיום); מועד קרוב להיום = האמיתי,
וההנפקה היא החשודה ⇒ המועד נשמר. התראת ר-7 כוללת את תאריך ההנפקה ואת «אם התאריך שגוי — תקנו».
"""
from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient

from app.greeninvoice import due_or_estimate
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc
from tests.test_dates_external import _ezcount, _gi, _icount, _rivhit

T = date(2026, 11, 8)


def test_rule_unit():
    old = date(2024, 11, 1)
    assert due_or_estimate(date(2026, 12, 1), old, today=T) == (date(2026, 12, 1), False)   # מועד אמיתי נשמר
    assert due_or_estimate(date(2027, 11, 8), old, today=T) == (date(2027, 11, 8), False)   # בדיוק שנה — גבול
    # בקרות (הפעלה 120): מועד רחוק בעתיד = הוא הטעות ⇒ הנפקה+30 מוערך
    assert due_or_estimate(date(2027, 11, 9), old, today=T) == (date(2024, 12, 1), True)
    assert due_or_estimate(date(2062, 10, 1), date(2026, 9, 1), today=T) == (date(2026, 10, 1), True)


def test_every_api_source_keeps_real_due_when_issue_year_typo_back():
    for inv in (_icount(dateissued="2024-11-01", duedate="2026-12-01"),
                _ezcount(date="01/11/2024", pay_until="01/12/2026"),
                _rivhit(issue_date="01/11/2024", due_date="01/12/2026"),
                _gi(documentDate="2024-11-01", dueDate="2026-12-01")):
        assert inv.due == date(2026, 12, 1) and not inv.due_estimated, inv.external_id


def _api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def test_e2e_no_reminder_before_real_due(svc, fake_gi):
    """היום 8.11.2026. לפני התיקון: מוערך 1.12.2024 ⇒ תזכורת מיידית, לפני המועד האמיתי 1.12.2026."""
    doc = gi_doc(1)
    doc["documentDate"], doc["dueDate"] = "2024-11-01", "2026-12-01"
    fake_gi.docs = [doc]
    api = _api(svc)
    assert api.post("/sync").json()["open"] == 1
    assert api.post("/plan").json()["created"] == []


def test_e2e_control_overdue_real_due_reminded(svc, fake_gi):
    doc = gi_doc(1)
    doc["documentDate"], doc["dueDate"] = "2024-09-01", "2026-10-01"
    fake_gi.docs = [doc]
    api = _api(svc)
    api.post("/sync")
    assert len(api.post("/plan").json()["created"]) == 1


def test_e2e_too_old_alert_names_date_and_hints_typo(svc, fake_gi):
    doc = gi_doc(1)
    doc["documentDate"], doc["dueDate"] = "2016-09-01", "2016-10-01"
    fake_gi.docs = [doc]
    api = _api(svc)
    api.post("/sync")
    assert api.post("/plan").json()["created"] == []
    rows = svc.db.q("SELECT body FROM messages WHERE intent='manual_only_old'")
    assert len(rows) == 1
    body = rows[0]["body"]
    assert "בת יותר מ-3 שנים" in body and "01/09/2016" in body and "טעות" in body

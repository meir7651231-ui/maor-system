"""הפעלה 120 — מועד תשלום רחוק בצורה לא סבירה (מעל שנתיים אחרי ההנפקה — טעות בשנה, 2062 במקום 2026).

באג: מועד כזה התקבל כמו שהוא בכל מקורות ה-API ובקובץ CSV ⇒ החוב נחשב «טרם הגיע מועדו» עשרות שנים
⇒ אף תזכורת לא נשלחה לעולם, ובעל העסק לא ידע. התיקון: ב-API ⇒ המועד "לא ידוע" ⇒ הנפקה+30 "מוערך"
(כמו מסמך בלי מועד / מועד לפני ההנפקה, הפעלה 119). ב-CSV ⇒ השורה נדחית עם הודעה גלויה («אולי טעות בשנה?»).
תנאי תשלום ארוכים אמיתיים (עד שנתיים) נשמרים.
"""
from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient

from app import csv_import
from app.greeninvoice import MAX_TERMS_DAYS, due_or_estimate
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc
from tests.test_dates_external import _ezcount, _gi, _icount, _rivhit


def test_rule_unit():
    i = date(2026, 9, 1)
    assert MAX_TERMS_DAYS == 730
    assert due_or_estimate(date(2062, 10, 1), i) == (date(2026, 10, 1), True)
    assert due_or_estimate(date(2028, 9, 1), i) == (date(2026, 10, 1), True)        # 731 יום
    assert due_or_estimate(date(2028, 8, 31), i) == (date(2028, 8, 31), False)      # 730 — גבול, נשמר
    assert due_or_estimate(date(2027, 3, 1), i) == (date(2027, 3, 1), False)        # שוטף+180 אמיתי
    # טעות בשנה היא טעות גם במסמך מקושר
    assert due_or_estimate(date(2062, 10, 1), i, inherited=True) == (date(2026, 10, 1), True)
    assert due_or_estimate(date(2062, 10, 1), None) == (date(2062, 10, 1), False)   # בלי הנפקה — אין מה להשוות


def test_every_api_source_estimates_when_due_too_far():
    for inv in (_icount(duedate="2062-10-01"), _ezcount(pay_until="01/10/2062"),
                _rivhit(due_date="01/10/2062"), _gi(dueDate="2062-10-01")):
        assert inv.issued == date(2026, 9, 1), inv.external_id
        assert inv.due == date(2026, 10, 1) and inv.due_estimated, inv.external_id


def test_every_api_source_keeps_long_real_terms():
    for inv in (_icount(duedate="2027-09-01"), _ezcount(pay_until="01/09/2027"),
                _rivhit(due_date="01/09/2027"), _gi(dueDate="2027-09-01")):
        assert inv.due == date(2027, 9, 1) and not inv.due_estimated, inv.external_id


def test_e2e_year_typo_still_gets_reminder(svc, fake_gi):
    """היום 8.11.2026 (clock). הנפקה 1.9, מועד 1.10.2062 (טעות בשנה) ⇒ לפני התיקון: אין תזכורת לעולם.
    אחרי: מוערך 1.10.2026 ⇒ באיחור ⇒ תזכורת."""
    doc = gi_doc(1)
    doc["documentDate"], doc["dueDate"] = "2026-09-01", "2062-10-01"
    fake_gi.docs = [doc]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    assert api.post("/sync").json()["open"] == 1
    assert len(api.post("/plan").json()["created"]) == 1


def test_e2e_control_real_future_due_not_reminded(svc, fake_gi):
    doc = gi_doc(1)
    doc["documentDate"], doc["dueDate"] = "2026-09-01", "2027-06-01"
    fake_gi.docs = [doc]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    assert api.post("/plan").json()["created"] == []


HEAD = "מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך,תאריך לתשלום\n"


def test_csv_row_rejected_visibly():
    r = csv_import.parse((HEAD + "1,א,0501234567,100,01/09/2026,01/10/2062\n"
                                 "2,ב,0501234568,100,01/09/2026,01/10/2026\n").encode("utf-8"))
    assert [i.number for i in r.invoices] == ["2"]
    assert len(r.errors) == 1 and "טעות בשנה" in r.errors[0]["error"]


def test_csv_long_real_terms_ok():
    r = csv_import.parse((HEAD + "1,א,0501234567,100,01/09/2026,01/09/2027\n").encode("utf-8"))
    assert not r.errors and r.invoices[0].due == date(2027, 9, 1) and not r.invoices[0].due_estimated

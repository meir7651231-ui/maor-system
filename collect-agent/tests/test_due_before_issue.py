"""הפעלה 119 — מועד תשלום **לפני** תאריך ההנפקה (עמודות הפוכות / הקלדה שגויה) מקלט חיצוני.

באג: מועד כזה התקבל כמו שהוא בכל מקורות ה-API (GI/iCount/EZcount/רווחית) וב-CSV ⇒ החוב נראה «באיחור»
כבר ביום ההנפקה ⇒ תזכורת «טרם שולמה» מיידית לחייב שעוד לא הגיע מועדו (נניח שוטף+30 אמיתי).
התיקון: ב-API ⇒ המועד "לא ידוע" ⇒ הנפקה+30 "מוערך" (שמרני, כמו מסמך בלי מועד). ב-CSV ⇒ השורה נדחית
עם הודעה גלויה («אולי העמודות הפוכות?»). מועד = יום ההנפקה (תשלום מיידי) תקין ונשמר.
"""
from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient

from app import csv_import
from app.greeninvoice import due_or_estimate
from app.integrations import sources
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc
from tests.test_dates_external import _ezcount, _gi, _icount, _rivhit


def test_rule_unit():
    i = date(2026, 9, 1)
    assert due_or_estimate(date(2026, 8, 31), i) == (date(2026, 10, 1), True)
    assert due_or_estimate(i, i) == (i, False)                       # תשלום מיידי — תקין
    assert due_or_estimate(date(2026, 9, 15), i) == (date(2026, 9, 15), False)
    assert due_or_estimate(None, i) == (date(2026, 10, 1), True)
    assert due_or_estimate(date(2026, 8, 31), None) == (date(2026, 8, 31), False)  # בלי הנפקה — אין מה להשוות
    assert due_or_estimate(None, None) == (None, False)
    # מסמך מקושר (300⇒305): המועד המקורי של חשבון העסקה אמיתי גם אם קודם להמרה
    assert due_or_estimate(date(2026, 8, 31), i, inherited=True) == (date(2026, 8, 31), False)
    assert sources.due_or_estimate is due_or_estimate                # מקור אחד לכל ה-adapters


def test_every_api_source_estimates_when_due_precedes_issue():
    for inv in (_icount(duedate="2026-08-01"), _ezcount(pay_until="01/08/2026"),
                _rivhit(due_date="01/08/2026"), _gi(dueDate="2026-08-01")):
        assert inv.issued == date(2026, 9, 1), inv.external_id
        assert inv.due == date(2026, 10, 1) and inv.due_estimated, inv.external_id


def test_gi_converted_doc_keeps_inherited_due():
    """הומר מ-300 (linkedDocumentIds) ⇒ מועד ה-300 המקורי נשמר — לא נדחה ב-30 יום
    (נתפס ב-test_converted_proforma_not_counted_twice)."""
    inv = _gi(dueDate="2026-08-01", linkedDocumentIds=["p-300"])
    assert inv.due == date(2026, 8, 1) and not inv.due_estimated and inv.linked_ids == ("p-300",)


def test_every_api_source_keeps_same_day_due():
    for inv in (_icount(duedate="2026-09-01"), _ezcount(pay_until="01/09/2026"),
                _rivhit(due_date="01/09/2026"), _gi(dueDate="2026-09-01")):
        assert inv.due == date(2026, 9, 1) and not inv.due_estimated, inv.external_id


def test_e2e_due_before_issue_gets_no_immediate_reminder(svc, fake_gi):
    """היום 8.11.2026 (clock). הנפקה 5.11, מועד שגוי 1.10 ⇒ לפני התיקון: «באיחור» 38 יום ⇒ תזכורת מיידית.
    אחרי: מוערך 5.12 ⇒ אין תזכורת."""
    doc = gi_doc(1)
    doc["documentDate"], doc["dueDate"] = "2026-11-05", "2026-10-01"
    fake_gi.docs = [doc]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    assert api.post("/sync").json()["open"] == 1
    assert api.post("/plan").json()["created"] == []


def test_e2e_control_real_overdue_still_reminded(svc, fake_gi):
    doc = gi_doc(1)
    doc["documentDate"], doc["dueDate"] = "2026-09-01", "2026-10-01"
    fake_gi.docs = [doc]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    assert len(api.post("/plan").json()["created"]) == 1


HEAD = "מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך,תאריך לתשלום\n"


def test_csv_row_rejected_visibly():
    r = csv_import.parse((HEAD + "1,א,0501234567,100,05/11/2026,01/10/2026\n"
                                 "2,ב,0501234568,100,01/09/2026,01/10/2026\n").encode("utf-8"))
    assert [i.number for i in r.invoices] == ["2"]
    assert len(r.errors) == 1 and r.errors[0]["row"] and "העמודות הפוכות" in r.errors[0]["error"]


def test_csv_same_day_due_ok():
    r = csv_import.parse((HEAD + "1,א,0501234567,100,05/11/2026,05/11/2026\n").encode("utf-8"))
    assert not r.errors and r.invoices[0].due == date(2026, 11, 5) and not r.invoices[0].due_estimated

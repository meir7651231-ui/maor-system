"""הפעלה 121 — תאריך הנפקה רחוק בעתיד (טעות בשנה: 2062 במקום 2026) במקורות ה-API ובקובץ CSV.

באג (לפני התיקון):
- בלי מועד ⇒ המועד הוערך כ-הנפקה+30 = 2062 ⇒ החוב נחשב «טרם הגיע מועדו» עשרות שנים ⇒ אין תזכורת לעולם, בשקט.
- עם מועד אמיתי (1.10.2026) ⇒ «מועד לפני ההנפקה» (הפעלה 119) מחק אותו ⇒ שוב הנפקה+30 = 2062 ⇒ אין תזכורת.
- CSV: השורה נדחתה בהודעה מטעה («אולי העמודות הפוכות?») או נקלטה עם מועד 2062.
התיקון: הנפקה מעל שנה אחרי היום (שעון השירות) = "לא ידועה" לצורך חישוב המועד. מועד אמיתי נשמר; בלי מועד ⇒
אין מועד ⇒ התראה גלויה לבעל העסק («רחוק בעתיד — אולי טעות בשנה?») במקום שקט. ב-CSV ⇒ שגיאה גלויה.
"""
from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient

from app import csv_import
from app.greeninvoice import MAX_FUTURE_ISSUE_DAYS, due_or_estimate
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc
from tests.test_dates_external import _ezcount, _gi, _icount, _rivhit

T = date(2026, 11, 8)


def test_rule_unit():
    assert MAX_FUTURE_ISSUE_DAYS == 365
    far = date(2062, 9, 1)
    assert due_or_estimate(None, far, today=T) == (None, False)                       # אין בסיס להערכה
    assert due_or_estimate(date(2026, 10, 1), far, today=T) == (date(2026, 10, 1), False)  # מועד אמיתי נשמר
    assert due_or_estimate(date(2062, 10, 1), far, today=T) == (None, False)          # שניהם טעות
    # בקרות: הנפקה עתידית קרובה (חשבונית מוקדמת) — ההתנהגות הקיימת
    near = date(2027, 11, 8)                                                          # בדיוק 365 — גבול, תקין
    assert due_or_estimate(None, near, today=T) == (date(2027, 12, 8), True)
    assert due_or_estimate(None, date(2026, 9, 1), today=T) == (date(2026, 10, 1), True)


def test_every_api_source_keeps_real_due_when_issue_year_typo():
    for inv in (_icount(dateissued="2062-09-01"), _ezcount(date="01/09/2062"),
                _rivhit(issue_date="01/09/2062"), _gi(documentDate="2062-09-01")):
        assert inv.due == date(2026, 10, 1) and not inv.due_estimated, inv.external_id


def test_every_api_source_no_estimate_from_future_issue():
    for inv in (_icount(dateissued="2062-09-01", duedate=""), _ezcount(date="01/09/2062", pay_until=""),
                _rivhit(issue_date="01/09/2062", due_date=""), _gi(documentDate="2062-09-01", dueDate=None)):
        assert inv.due is None and not inv.due_estimated, inv.external_id


def _api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def test_e2e_real_due_still_reminded(svc, fake_gi):
    doc = gi_doc(1)
    doc["documentDate"], doc["dueDate"] = "2062-09-01", "2026-10-01"
    fake_gi.docs = [doc]
    api = _api(svc)
    assert api.post("/sync").json()["open"] == 1
    assert len(api.post("/plan").json()["created"]) == 1


def test_e2e_no_due_owner_notified_not_silent(svc, fake_gi):
    doc = gi_doc(1)
    doc["documentDate"], doc["dueDate"] = "2062-09-01", None
    fake_gi.docs = [doc]
    api = _api(svc)
    api.post("/sync")
    assert api.post("/plan").json()["created"] == []
    rows = svc.db.q("SELECT body FROM messages WHERE intent='no_due_date'")
    assert len(rows) == 1 and "טעות בשנה" in rows[0]["body"]


HEAD = "מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך,תאריך לתשלום\n"


def test_csv_future_issue_rejected_visibly():
    r = csv_import.parse((HEAD + "1,א,0501234567,100,01/09/2062,01/10/2026\n"
                                 "2,ב,0501234568,100,01/09/2062,\n"
                                 "3,ג,0501234569,100,01/09/2026,\n").encode("utf-8"), today=T)
    assert [i.number for i in r.invoices] == ["3"]
    assert len(r.errors) == 2 and all("רחוק בעתיד" in e["error"] for e in r.errors)


def test_csv_import_uses_service_clock(svc):
    res = svc.import_csv((HEAD + "1,א,0501234567,100,01/09/2062,\n").encode("utf-8"))
    assert res["errors"] and "רחוק בעתיד" in res["errors"][0]["error"]

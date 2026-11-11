"""הפעלה 124 — סכום חריג כבר בייבוא CSV (לא רק בתכנון).

באג (לפני התיקון): קובץ CSV עם שורה של 12000 ללקוח שמשלם תמיד 120–130 (נקודה עשרונית שגויה) יובא
בהצלחה עם «✓ יובאו 3 חשבוניות», בלי שום סימן. בעל העסק גילה את החריגה רק אחרי «תכנון», כשהקובץ
כבר לא פתוח אצלו, ואם לא תכנן — לא גילה בכלל.
התיקון: תשובת הייבוא מחזירה `amount_check` (מספר, סכום, רגיל) + אותה התראה לבעל העסק כמו בתכנון
(מפתח זהה ⇒ התכנון לא מכפיל אותה). הממשק מציג את השורות האלה באדום בתוצאת הייבוא.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

HEAD = "מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך,תאריך לתשלום\n"


def _api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _csv(*amounts: str) -> bytes:
    rows = "".join(f"{3001 + k},דנה כהן,050-1234567,{a},01/09/2026,01/10/2026\n"
                   for k, a in enumerate(amounts))
    return (HEAD + rows).encode("utf-8")


def test_settings_import_flags_outlier(svc):
    api = _api(svc)
    r = api.post("/settings/source/csv", content=_csv("120", "130", "12000"))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["imported"] == 3
    assert body["amount_check"] == [{"number": "3003", "amount_agorot": 1_200_000,
                                     "usual_agorot": 12_500, "currency": "ILS"}]
    notes = svc.db.q("SELECT body FROM messages WHERE intent='amount_check'")
    assert len(notes) == 1 and "3003" in notes[0]["body"]
    # התכנון אחרי הייבוא לא מכפיל את ההתראה, והתזכורת עדיין מחכה לאישור מפורש
    api.post("/plan")
    assert len(svc.db.q("SELECT 1 FROM messages WHERE intent='amount_check'")) == 1
    assert svc.db.one("SELECT 1 FROM reminders WHERE block_reason='amount_check'")


def test_import_csv_endpoint_flags_outlier(svc):
    body = _api(svc).post("/import/csv", content=_csv("120", "130", "12000")).json()
    assert [x["number"] for x in body["amount_check"]] == ["3003"]


def test_outlier_against_history_from_earlier_import(svc):
    api = _api(svc)
    assert api.post("/settings/source/csv", content=_csv("120", "130")).json()["amount_check"] == []
    later = (HEAD + "3009,דנה כהן,050-1234567,12000,01/10/2026,01/11/2026\n").encode("utf-8")
    assert [x["number"] for x in
            api.post("/settings/source/csv", content=later).json()["amount_check"]] == ["3009"]


def test_control_normal_amounts_no_flag(svc):
    api = _api(svc)
    body = api.post("/settings/source/csv", content=_csv("120", "130", "140")).json()
    assert body["amount_check"] == [] and body["imported"] == 3
    assert not svc.db.q("SELECT 1 FROM messages WHERE intent='amount_check'")


def test_control_new_customer_single_big_invoice(svc):
    body = _api(svc).post("/settings/source/csv", content=_csv("12000")).json()
    assert body["amount_check"] == []    # בלי היסטוריה ⇒ לא מנחשים

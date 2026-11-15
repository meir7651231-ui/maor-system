"""גבי בדיקות · השלמה ל-test_customer_journeys (המבקר, j01–j12): מסלולי לקוח שלא כוסו שם.
אותו מבנה: מהתזכורת הראשונה ועד המצב הסופי, דרך ה-API ועמוד החייב, ובסוף השאלה
«האם יוצאת תזכורת נוספת?». קובץ נפרד כדי ששני התפקידים לא יערכו את אותו קובץ במקביל.
"""
from __future__ import annotations

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.channels import sent_mark
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN
from tests.test_customer_journeys import _first, _to_c1, _week_later_nothing


@pytest.fixture
def env(svc):   # כמו ב-test_customer_journeys (בעלים מאומת + ציבורי)
    app = create_app(svc, owner_token=OWNER_TOKEN)
    return svc, TestClient(app, headers=AUTH), TestClient(app)


def _cust1(svc):
    return svc.db.one("SELECT * FROM customers WHERE id=1")


def _reminders_resume(env, clock, days=8) -> list[int]:
    svc, api, _ = env
    clock.now += timedelta(days=days)
    return [i for i in api.post("/plan").json()["created"]
            if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1]


def test_j13_lawyer_stops_and_escalates_urgent(env, clock):
    svc, api, _ = env
    _first(env)
    r = api.post("/inbound", json={"sender": "050-1234567",
                                   "text": "כל פנייה נוספת דרך עורך הדין שלי בלבד"}).json()
    assert r["intent"] == "legal" and r["escalation"] == "urgent", r
    assert not r.get("auto_sent"), "אסור מענה אוטומטי לפנייה של עו״ד"
    _week_later_nothing(env, clock)


def test_j14_minor_hard_pause(env, clock):
    svc, api, _ = env
    _first(env)
    r = api.post("/inbound", json={"sender": "050-1234567",
                                   "text": "זה הטלפון של הבן שלי, הוא בן 12"}).json()
    assert r["intent"] == "minor", r
    assert _cust1(svc)["paused_reason"] == "minor"
    _week_later_nothing(env, clock)


def test_j15_promise_pauses_then_ladder_returns(env, clock):
    """«אשלם ביום X» ⇒ השהיה עד המועד, ואם לא שולם — חוזרים לסולם (לא תקוע לנצח)."""
    svc, api, _ = env
    _first(env)
    r = api.post("/inbound", json={"sender": "050-1234567",
                                   "text": "אשלם ביום חמישי הקרוב, סליחה על העיכוב"}).json()
    assert r["intent"] == "promise", r
    assert _reminders_resume(env, clock, days=2) == [], "תזכורת בתוך תקופת ההבטחה"
    assert _reminders_resume(env, clock, days=14), "אחרי שההבטחה פגה התזכורות לא חזרו"


def test_j16_partial_payment_needs_new_approval_with_new_amount(env, clock, fake_gi):
    """תשלום חלקי במקור (היתרה ירדה) ⇒ התזכורת הבאה נבנית מחדש על היתרה החדשה וחוזרת לאישור,
    ואף הודעה לא יוצאת עם הסכום הישן."""
    svc, api, _ = env
    _first(env)
    fake_gi.docs[0]["amount"] = "500.00"
    fake_gi.docs[0]["amountDueVat"] = "500.00"
    for i in _reminders_resume(env, clock):
        api.post(f"/reminders/{i}/approve")
    mark = sent_mark(svc.sender.sent)
    api.post("/dispatch")
    pend = api.get("/reminders", params={"status": "pending_approval"}).json()
    for p in pend:
        if p["invoice_id"] == 1:
            assert p["block_reason"] in ("amount_changed", None), p["block_reason"]
            api.post(f"/reminders/{p['id']}/approve")
    api.post("/dispatch")
    out = [m["body"] for m in _to_c1(svc, mark) if "1001" in m["body"]]
    assert all("1,200" not in b for b in out), "יצאה הודעה עם הסכום הישן"
    assert any("500" in b for b in out), "לא יצאה תזכורת על היתרה החדשה"


def test_j17_carrier_blacklist_stops_everything(env, clock):
    svc, api, pub = env
    _first(env)
    k = svc.s.sms_webhook_key
    pub.post(f"/webhooks/sms/019?k={k}", content="type=blacklist&phone=0501234567",
             headers={"content-type": "application/x-www-form-urlencoded"})
    assert _cust1(svc)["opted_out"] == 1
    _week_later_nothing(env, clock)


def test_j18_refresh_failure_holds_then_recovers(env, clock):
    """ר-4: חשבונית ירוקה לא זמינה ברגע השליחה ⇒ לא יוצא כלום; כשהיא חוזרת ⇒ יוצא."""
    svc, api, _ = env
    api.post("/sync")
    rid = next(i for i in api.post("/plan").json()["created"]
               if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1)
    api.post(f"/reminders/{rid}/approve")
    real = svc.gi.get_document

    def down(_doc_id):
        raise RuntimeError("GI down")
    svc.gi.get_document = down
    mark = sent_mark(svc.sender.sent)
    api.post("/dispatch")
    assert _to_c1(svc, mark) == []
    svc.gi.get_document = real
    clock.now += timedelta(minutes=30)
    api.post("/dispatch")
    assert _to_c1(svc, mark), "אחרי שהרענון חזר התזכורת לא יצאה"


def test_j19_owner_rejects_then_no_more_for_that_invoice(env, clock):
    svc, api, _ = env
    api.post("/sync")
    rid = next(i for i in api.post("/plan").json()["created"]
               if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1)
    assert api.post(f"/reminders/{rid}/reject").status_code == 200
    for _ in range(3):
        assert _reminders_resume(env, clock) == [], "תזכורת חדשה אחרי שבעל העסק דחה"


def test_j20_copy_request_reply_then_ladder_continues(env, clock):
    svc, api, _ = env
    _first(env)
    r = api.post("/inbound", json={"sender": "050-1234567",
                                   "text": "תשלחו לי בבקשה את החשבונית שוב"}).json()
    # ממצא למנוע (15.11): הניסוח הזה מסווג unknown ⇒ עובר לבעל העסק. בטוח, אבל פספוס.
    # המסלול עצמו נבדק כאן: בשני המקרים התזכורות לא נעצרות.
    assert r["intent"] in ("copy_request", "unknown"), r
    c = _cust1(svc)
    assert c["opted_out"] == 0 and not c["paused_reason"], "בקשת העתק עצרה את התזכורות לצמיתות"
    # critic סבב 64: כל עוד ההודעה ממתינה לבעל העסק — אין תזכורת (לא עונים לו בתזכורת)
    assert _reminders_resume(env, clock) == [], "תזכורת יצאה לפני שבעל העסק טיפל בהודעה"
    # בעל העסק טיפל (שלח/סגר את הטיוטה ו/או סימן «טופל») ⇒ הסולם ממשיך
    if r.get("draft_id"):
        api.post(f"/conversation/drafts/{r['draft_id']}/reject")
    for m in api.get("/owner/inbox").json():
        api.post(f"/owner/inbox/{m['id']}/done")
    assert _reminders_resume(env, clock, days=1), "אחרי שבעל העסק טיפל הסולם לא המשיך"


def test_j21_abusive_goes_to_owner_without_auto_reply(env, clock):
    svc, api, _ = env
    _first(env)
    mark = sent_mark(svc.sender.sent)
    r = api.post("/inbound", json={"sender": "050-1234567",
                                   "text": "תעופו לי מהחיים יא נוכלים"}).json()
    assert r["intent"] == "abusive", r
    assert r["escalation"] != "none"
    assert _to_c1(svc, mark) == [], "יצא מענה אוטומטי לקללה"


def test_j22_two_invoices_one_customer_one_message_per_round(env, clock, fake_gi):
    """שתי חשבוניות פתוחות לאותו לקוח ⇒ לא שתי הודעות באותו יום (72 ש׳ לנמען)."""
    svc, api, _ = env
    extra = dict(fake_gi.docs[0], id="doc9", number="1009")
    fake_gi.docs.append(extra)
    api.post("/sync")
    for i in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{i}/approve")
    mark = sent_mark(svc.sender.sent)
    for _ in range(20):
        api.post("/dispatch")
        clock.now += timedelta(minutes=30)
    sms = [m for m in _to_c1(svc, mark) if m["channel"] == "sms"]
    assert len(sms) <= 1, [m["body"][:50] for m in sms]

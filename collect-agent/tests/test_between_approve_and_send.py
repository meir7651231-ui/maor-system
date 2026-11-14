"""critic סבב 58: מגן «בין האישור לשליחה». בעל העסק אישר; עד שהתזכורת יוצאת (חלון/תור) משהו קרה:
הלקוח שילם (המסמך נסגר במקור, עם או בלי סנכרון), שילם חלק, כתב «שילמתי», ביקש הסרה ב-SMS, או לחץ על
הסרה בלחיצה אחת במייל. בכל אחד מהמקרים: **אף הודעה לא יוצאת** אליו על הנוסח שאושר.
בקרה חיובית: בלי אירוע, אותו מסלול כן שולח (אחרת «לא יצא» היה עובר גם כשהכול שבור).
אותו כלל לתשובת מענה שאושרה בלילה וחיכתה לחלון: הלקוח ביקש הסרה בינתיים ⇒ לא יוצאת.
**באג שנמצא כאן:** «איך משלמים?» ⇒ טיוטה עם קישור תשלום ⇒ אושרה בלילה ⇒ הלקוח לחץ «הסר» ⇒ בבוקר הטיוטה
**יצאה**, כי HOW_TO_PAY ברשימת המותרים אחרי הסרה (שנועדה לשאלה שנשאלה *אחרי* ההסרה). תוקן ב-`_opt_out`."""
from __future__ import annotations

from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.channels import sent_mark, sent_since
from app.main import create_app
from app.policy import TZ
from tests.conftest import AUTH, OWNER_TOKEN

PHONE, MAIL = "972501234567", "c1@example.com"


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _approved(api, svc) -> int:
    api.post("/sync")
    rid = next(i for i in api.post("/plan").json()["created"]
               if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1)
    assert api.post(f"/reminders/{rid}/approve").status_code == 200
    return rid


def _to_customer(svc, since: int) -> list:
    return [m for m in sent_since(svc.sender.sent, since) if m["to"] in (PHONE, MAIL)]


def test_control_nothing_happened_it_is_sent(api, svc):
    _approved(api, svc)
    api.post("/dispatch")
    assert len(_to_customer(svc, 0)) == 2


def test_paid_at_source_without_sync(api, svc, fake_gi):
    rid = _approved(api, svc)
    fake_gi.docs = [d for d in fake_gi.docs if d["id"] != "doc1"]   # נסגר במקור; עוד לא סונכרן
    api.post("/dispatch")
    assert _to_customer(svc, 0) == [] and svc._reminder(rid)["status"] != "sent_dry_run"


def test_paid_at_source_with_sync(api, svc, fake_gi):
    rid = _approved(api, svc)
    fake_gi.docs = [d for d in fake_gi.docs if d["id"] != "doc1"]
    api.post("/sync")
    api.post("/dispatch")
    assert _to_customer(svc, 0) == [] and svc._reminder(rid)["status"] == "cancelled"


def test_partial_payment_old_amount_never_sent(api, svc, fake_gi):
    rid = _approved(api, svc)
    fake_gi.docs[0]["amount"] = "700.00"                          # שילם 500 מתוך 1,200
    api.post("/dispatch")
    assert _to_customer(svc, 0) == []
    r = svc._reminder(rid)
    assert r["status"] == "pending_approval" and "700" in r["body"] and "1,200" not in r["body"]


@pytest.mark.parametrize("text", ["הסר", "שילמתי כבר"])
def test_customer_replied_before_send(api, svc, text):
    _approved(api, svc)
    api.post("/inbound", json={"sender": "050-1234567", "text": text})
    before = [m for m in _to_customer(svc, 0)]           # אישור הסרה / מענה — לא התזכורת
    api.post("/dispatch")
    after = _to_customer(svc, 0)[len(before):]
    assert after == [], [m["body"][:60] for m in after]
    assert not any("טרם סומנה כשולמה" in m["body"] for m in _to_customer(svc, 0))


def test_one_click_unsubscribe_from_email_before_send(api, svc):
    _approved(api, svc)
    # מייל קודם ללקוח (שלב אחר) נשא קישור הסרה; כאן: טוקן חדש לאותו לקוח, כמו בכל הודעה
    token = svc.new_unsub_token(1)
    assert api.post(f"/u/{token}").status_code == 200
    api.post("/dispatch")
    assert _to_customer(svc, 0) == []


def test_reply_draft_approved_at_night_then_opt_out(api, svc, clock):
    _approved(api, svc)
    api.post("/dispatch")                                  # התזכורת יצאה (בקרה)
    n0 = sent_mark(svc.sender.sent)
    api.post("/inbound", json={"sender": "050-1234567", "text": "איך אפשר לשלם?"})
    drafts = api.get("/conversation/drafts").json()
    if not drafts:
        pytest.skip("מנוע השיחה ענה אוטומטית (אין טיוטה) — המסלול הזה לא רלוונטי בהגדרות האלה")
    clock.now = datetime(2026, 11, 8, 21, 30, tzinfo=TZ)   # לילה ⇒ אושר, ממתין לחלון
    d = drafts[0]
    api.post(f"/conversation/drafts/{d['id']}/approve", json={})
    assert sent_mark(svc.sender.sent) == n0, "יצא בלילה"
    token = svc.new_unsub_token(1)
    api.post(f"/u/{token}")
    clock.now = datetime(2026, 11, 9, 9, 0, tzinfo=TZ)
    api.post("/dispatch")
    late = [m for m in sent_since(svc.sender.sent, n0) if m["to"] in (PHONE, MAIL)]
    assert late == [], [m["body"][:60] for m in late]


def test_shared_contact_opt_out_stops_the_other_customers_drafts(svc, fake_gi, clock):
    """critic סבב 59: A ו-B חולקים נייד. B שאל במייל «איך משלמים?» ⇒ טיוטה (מותרת אחרי הסרה) ⇒ אושרה בלילה.
    A לחץ «הסר» ⇒ גם B מוסר (כתובת משותפת). התיקון של סבב 58 עצר רק את הטיוטות של A ⇒ זו של B יצאה בבוקר."""
    from tests.conftest import gi_doc
    fake_gi.docs = [gi_doc(1, phone="050-1234567", name="דנה כהן"),
                    gi_doc(2, phone="050-1234567", name="רון כהן", client_id="cl2")]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    b = svc.db.one("SELECT * FROM customers WHERE name='רון כהן'")
    a = svc.db.one("SELECT * FROM customers WHERE name='דנה כהן'")
    r = api.post("/conversation/inbound", json={"channel": "email", "sender": b["email"],
                                                "text": "איך אפשר לשלם?"}).json()
    did = r.get("draft_id")
    if not did:
        pytest.skip("המנוע ענה אוטומטית — אין טיוטה ממתינה")
    clock.now = datetime(2026, 11, 8, 21, 30, tzinfo=TZ)
    api.post(f"/conversation/drafts/{did}/approve", json={})
    n0 = sent_mark(svc.sender.sent)
    assert api.post(f"/u/{svc.new_unsub_token(a['id'])}").status_code == 200
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (b["id"],))["opted_out"] == 1
    clock.now = datetime(2026, 11, 9, 9, 0, tzinfo=TZ)
    api.post("/dispatch")
    late = sent_since(svc.sender.sent, n0)
    assert late == [], [(m["to"], m["body"][:60]) for m in late]


def test_plan_proposed_before_opt_out_is_not_sent_after(api, svc):
    _approved(api, svc)
    api.post("/dispatch")
    n0 = sent_mark(svc.sender.sent)
    api.post("/inbound", json={"sender": "050-1234567", "text": "אפשר פריסה?"})
    pid = api.get("/plans").json()[-1]["id"]
    n1 = sent_mark(svc.sender.sent)
    api.post(f"/u/{svc.new_unsub_token(1)}")
    res = api.post(f"/plans/{pid}/approve")
    late = sent_since(svc.sender.sent, n1)
    assert late == [], [m["body"][:60] for m in late]
    assert res.status_code in (200, 409), res.text
    assert n1 >= n0


def test_address_only_suppression_stops_pending_draft_to_that_address(api, svc, clock):
    """critic סבב 59: הסרה לפי כתובת בלבד (`suppress` — כתובת משותפת לא מזוהה / חסימת ספק 019), בלי
    `_opt_out` ללקוח. טיוטת «איך משלמים» שאושרה לאותה כתובת דילגה על בדיקת הכתובת בשער (opt_out_ack) ויצאה."""
    _approved(api, svc)
    api.post("/dispatch")
    r = api.post("/conversation/inbound", json={"channel": "sms", "sender": "050-1234567",
                                                "text": "איך אפשר לשלם?"}).json()
    if not r.get("draft_id"):
        pytest.skip("המנוע ענה אוטומטית — אין טיוטה ממתינה")
    clock.now = datetime(2026, 11, 8, 21, 30, tzinfo=TZ)
    api.post(f"/conversation/drafts/{r['draft_id']}/approve", json={})
    n0 = sent_mark(svc.sender.sent)
    svc.suppress("sms", "050-1234567", "carrier_blacklist")     # כתובת בלבד, הלקוח עצמו לא סומן
    clock.now = datetime(2026, 11, 9, 9, 0, tzinfo=TZ)
    api.post("/dispatch")
    late = sent_since(svc.sender.sent, n0)
    assert late == [], [(m["to"], m["body"][:60]) for m in late]


def test_owner_is_told_when_an_approved_draft_is_stopped(api, svc, clock):
    """critic סבב 60: בסבבים 58–59 הטיוטה שנעצרה נעלמה בשקט מהתור (גם כשבעל העסק כבר אישר אותה) ⇒ הוא חשב
    שהלקוח קיבל את קישור התשלום. עכשיו: הודעה בתיבה שלו, עם השם ועם «שאישרתם»."""
    _approved(api, svc)
    api.post("/dispatch")
    r = api.post("/conversation/inbound", json={"channel": "sms", "sender": "050-1234567",
                                                "text": "איך אפשר לשלם?"}).json()
    if not r.get("draft_id"):
        pytest.skip("המנוע ענה אוטומטית — אין טיוטה ממתינה")
    clock.now = datetime(2026, 11, 8, 21, 30, tzinfo=TZ)
    api.post(f"/conversation/drafts/{r['draft_id']}/approve", json={})
    api.post(f"/u/{svc.new_unsub_token(1)}")
    notes = [m for m in api.get("/owner/inbox").json() if m["intent"] == "draft_stopped_opt_out"]
    assert len(notes) == 1, api.get("/owner/inbox").json()
    assert "שאישרתם" in notes[0]["body"] and "דנה" in notes[0]["body"] and "הסרה" in notes[0]["body"]


def test_reverse_opt_out_ack_still_sent_on_both_channels(api, svc):
    """הכיוון ההפוך: העצירה לא חוסמת את אישור ההסרה עצמו (SMS), והלקוח לא מקבל שום דבר אחר."""
    _approved(api, svc)
    api.post("/dispatch")
    n0 = sent_mark(svc.sender.sent)
    api.post("/conversation/inbound", json={"channel": "sms", "sender": "050-1234567", "text": "הסר"})
    drafts = [d for d in api.get("/conversation/drafts").json() if d["intent"] == "opt_out"]
    for d in drafts:
        api.post(f"/conversation/drafts/{d['id']}/approve", json={})
    out = sent_since(svc.sender.sent, n0)
    assert out and all("תזכורות" in m["body"] for m in out), [m["body"][:60] for m in out]
    assert not any("לתשלום" in m["body"] or "קישור" in m["body"] for m in out)


def test_reverse_other_customer_with_similar_name_untouched(svc, fake_gi, clock):
    """הסרה של «דנה כהן» לא עוצרת טיוטה של «דני כהן» בנייד אחר (העצירה לפי לקוח/כתובת, לא לפי שם)."""
    from tests.conftest import gi_doc
    fake_gi.docs = [gi_doc(1, phone="050-1234567", name="דנה כהן"),
                    gi_doc(2, phone="052-7654321", name="דני כהן", client_id="cl2")]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    other = svc.db.one("SELECT * FROM customers WHERE name='דני כהן'")
    for rid in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{rid}/approve")
    api.post("/dispatch")
    r = api.post("/conversation/inbound", json={"channel": "sms", "sender": "052-7654321",
                                                "text": "איך אפשר לשלם?"}).json()
    if not r.get("draft_id"):
        pytest.skip("המנוע ענה אוטומטית — אין טיוטה ממתינה")
    a = svc.db.one("SELECT * FROM customers WHERE name='דנה כהן'")
    api.post(f"/u/{svc.new_unsub_token(a['id'])}")
    d = svc.db.one("SELECT status FROM drafts WHERE id=?", (r["draft_id"],))
    assert d["status"] == "pending_approval", dict(d)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (other["id"],))["opted_out"] == 0
    assert not [m for m in api.get("/owner/inbox").json() if m["intent"] == "draft_stopped_opt_out"]

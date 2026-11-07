"""תיבת השיחה מקצה לקצה: סנכרון sandbox מדומה ⇒ תשובת חייב ⇒ השפעות ⇒ טיוטה ⇒ אישור ⇒ dry-run."""
from datetime import timedelta

import pytest

from app.conversation import OwnerPolicy
from app.inbox import ConversationInbox

DANA = "050-1234567"


@pytest.fixture
def inbox(svc):
    svc.sync()
    return ConversationInbox(svc)


def cust(svc, name="דנה כהן"):
    return svc.db.one("SELECT * FROM customers WHERE name=?", (name,))


def test_nothing_is_sent_without_owner_approval(inbox, svc):
    res = inbox.handle("sms", DANA, "איך אפשר לשלם?")
    assert res["intent"] == "how_to_pay" and res["draft_id"] and not res["auto_sent"]
    assert svc.sender.sent == []
    q = inbox.drafts()
    assert len(q) == 1 and q[0]["body"].startswith("סטודיו מאיר:")
    inbox.approve_draft(res["draft_id"])
    assert len(svc.sender.sent) == 1
    out = svc.sender.sent[0]
    assert out["channel"] == "sms" and out["to"] == "972501234567"
    assert "https://www.greeninvoice.co.il/pay/studio?invoice=1001" in out["body"]


def test_paid_claim_pauses_and_blocks_next_reminder(inbox, svc, clock):
    res = inbox.handle("sms", DANA, "שילמתי כבר בשבוע שעבר")
    assert res["intent"] == "paid_claim" and res["stop"] == "pause"
    assert cust(svc)["paused_reason"].startswith("paid_claim")
    clock.now += timedelta(days=8)
    created = svc.plan()
    dana_inv = svc.db.one("SELECT id FROM invoices WHERE customer_id=?", (cust(svc)["id"],))["id"]
    assert not any(svc.db.one("SELECT 1 FROM reminders WHERE id=? AND invoice_id=?", (r, dana_inv))
                   for r in created)


def test_dispute_marks_customer_and_escalates_urgent_first(inbox, svc):
    inbox.handle("sms", DANA, "איך אפשר לשלם?")
    res = inbox.handle("sms", DANA, "רגע, הסכום לא נכון, סיכמנו על 800")
    assert res["escalation"] == "urgent"
    assert cust(svc)["disputed"] == 1
    assert inbox.drafts()[0]["intent"] == "dispute"   # דחוף ראשון בתור


def test_opt_out_is_immediate_and_later_drafts_blocked(inbox, svc):
    first = inbox.handle("sms", DANA, "איך אפשר לשלם?")["draft_id"]
    res = inbox.handle("sms", DANA, "הסר")
    assert cust(svc)["opted_out"] == 1 and res["stop"] == "permanent"
    # אישור ההסרה מותר; הטיוטה הקודמת הוחלפה ואי אפשר לאשר אותה
    inbox.approve_draft(res["draft_id"])
    assert svc.sender.sent[-1]["body"].endswith("תזכורות אוטומטיות.")
    with pytest.raises(ValueError, match="superseded"):
        inbox.approve_draft(first)
    assert len(svc.sender.sent) == 1


def test_opted_out_customer_promise_gets_no_reply(inbox, svc):
    inbox.handle("sms", DANA, "הסר")
    inbox.handle("sms", DANA, "אשלם מחר")
    assert inbox.drafts("pending_approval") == []   # אין טיוטת תשובה ללקוח שהוסר


def test_wrong_number_opts_out_without_leaking(inbox, svc):
    res = inbox.handle("sms", DANA, "טעות במספר, אין פה דנה")
    assert res["intent"] == "wrong_person" and cust(svc)["opted_out"] == 1
    body = inbox.drafts()[0]["body"]
    assert "דנה" not in body and "1,200" not in body and "1001" not in body


def test_plan_negotiation_creates_and_replaces_plan(inbox, svc):
    r1 = inbox.handle("sms", DANA, "אין לי כסף כרגע, אפשר תשלומים?")
    assert r1["plan_id"]
    r2 = inbox.handle("sms", DANA, "אפשר 4?")
    assert r2["plan_id"] and r2["plan_id"] != r1["plan_id"]
    plans = svc.db.q("SELECT status FROM plans ORDER BY id")
    assert [p["status"] for p in plans] == ["rejected", "proposed"]
    r3 = inbox.handle("sms", DANA, "מאשר")
    assert r3["intent"] == "plan_accept" and r3["plan_id"] == r2["plan_id"]
    conv = svc.db.one("SELECT * FROM conversations WHERE customer_id=?", (cust(svc)["id"],))
    assert conv["state"] == "plan_pending_owner" and conv["bot_turns"] == 3


def test_promise_pause_expires_by_itself(inbox, svc, clock):
    res = inbox.handle("sms", DANA, "אשלם ביום שלישי")
    assert res["pause_until"] == "2026-11-11"
    assert cust(svc)["paused_reason"] == "promise:until=2026-11-11"
    clock.now += timedelta(days=2)
    assert inbox.release_expired_pauses() == 0
    clock.now += timedelta(days=1)
    assert inbox.release_expired_pauses() == 1 and cust(svc)["paused_reason"] is None


def test_paid_claim_pause_does_not_expire_by_itself(inbox, svc, clock):
    inbox.handle("sms", DANA, "שילמתי")
    clock.now += timedelta(days=30)
    inbox.release_expired_pauses()
    assert cust(svc)["paused_reason"].startswith("paid_claim")


def test_shabbat_approval_waits_for_window(inbox, svc, clock):
    d = inbox.handle("sms", DANA, "איך אפשר לשלם?")["draft_id"]
    clock.now += timedelta(days=6)          # שבת 14.11 10:00
    assert inbox.approve_draft(d)["status"] == "approved" and svc.sender.sent == []
    clock.now += timedelta(days=1)          # ראשון
    assert inbox.flush() == [d] and len(svc.sender.sent) == 1


def test_owner_edit_is_filtered(inbox, svc):
    d = inbox.handle("sms", DANA, "איך אפשר לשלם?")["draft_id"]
    with pytest.raises(ValueError, match="נחסם"):
        inbox.approve_draft(d, body="שלמו מייד, אחרת נאלץ לפנות להוצאה לפועל")
    # הקישור המותר = עמוד התשלום של העסק (לא נוצר דף תשלום ב-GI — review חור 3)
    link = svc._payment_link(svc.db.one("SELECT * FROM invoices WHERE number='1001'"))
    out = inbox.approve_draft(d, body=f"בשמחה! הקישור: {link}")
    assert out["edited"] == 1 and out["body"].startswith("סטודיו מאיר: בשמחה")


def test_reject_draft(inbox, svc):
    d = inbox.handle("sms", DANA, "מי זה?")["draft_id"]
    assert inbox.reject_draft(d)["status"] == "rejected"
    with pytest.raises(ValueError):
        inbox.approve_draft(d)
    assert svc.sender.sent == []


def test_unknown_sender_is_logged_not_answered(inbox, svc):
    res = inbox.handle("sms", "054-0000000", "מי אתם?")
    assert res["intent"] == "unknown_sender" and res["draft_id"] is None


def test_email_reply_has_subject_and_unsubscribe(inbox, svc):
    res = inbox.handle("email", "c1@example.com", "איך אפשר לשלם?")
    inbox.approve_draft(res["draft_id"])
    out = svc.sender.sent[-1]
    assert out["channel"] == "email" and out["subject"].startswith("תשובה מ-")


def test_safe_auto_sends_information_only(svc):
    svc.sync()
    inbox = ConversationInbox(svc, OwnerPolicy(approval_mode="safe_auto"))
    assert inbox.handle("sms", DANA, "איך אפשר לשלם?")["auto_sent"] is True
    assert inbox.handle("sms", DANA, "אין לי כסף")["auto_sent"] is False
    assert len(svc.sender.sent) == 1


def test_audit_trail(inbox, svc):
    d = inbox.handle("sms", DANA, "איך אפשר לשלם?")["draft_id"]
    inbox.approve_draft(d)
    actions = [r["action"] for r in svc.db.q("SELECT action FROM audit")]
    assert {"conversation", "draft_approved", "draft_sent_dry_run"} <= set(actions)


def test_send_gate_blocks_old_draft_after_opt_out(inbox, svc):
    old = inbox.handle("sms", DANA, "מי זה?")["draft_id"]
    svc.unsubscribe(svc.new_unsub_token(cust(svc)["id"]))        # הוסר דרך קישור — לא דרך השיחה
    out = inbox.approve_draft(old)
    assert out["status"] == "rejected" and out["decided_by"] == "system:opted_out"
    assert svc.sender.sent == []


def test_api_routes(svc):
    from fastapi.testclient import TestClient

    from app.main import create_app
    from tests.conftest import AUTH, OWNER_TOKEN
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    r = api.post("/conversation/inbound", json={"channel": "sms", "sender": DANA,
                                                "text": "אפשר בתשלומים?"}).json()
    assert r["intent"] == "plan_request" and r["plan_id"]
    drafts = api.get("/conversation/drafts").json()
    assert drafts[0]["id"] == r["draft_id"] and "3 תשלומים" in drafts[0]["body"]
    bad = api.post(f"/conversation/drafts/{r['draft_id']}/approve", json={"body": "יש ריבית"})
    assert bad.status_code == 409
    ok = api.post(f"/conversation/drafts/{r['draft_id']}/approve").json()
    assert ok["status"] == "sent_dry_run"
    assert api.post(f"/conversation/drafts/{r['draft_id']}/reject").status_code == 409


def test_new_offer_supersedes_stale_offer(inbox, svc):
    a = inbox.handle("sms", DANA, "אפשר בתשלומים?")["draft_id"]
    b = inbox.handle("sms", DANA, "אפשר 5?")["draft_id"]
    q = inbox.drafts()
    assert [d["id"] for d in q] == [b]
    with pytest.raises(ValueError):
        inbox.approve_draft(a)   # אי אפשר לאשר הצעה ישנה


def test_urgent_card_is_not_superseded_and_owner_can_answer(inbox, svc):
    legal = inbox.handle("sms", DANA, "העברתי את זה לעורך דין")["draft_id"]
    inbox.handle("sms", DANA, "איך אפשר לשלם?")
    q = inbox.drafts()
    assert q[0]["id"] == legal and q[0]["status"] == "needs_owner" and q[0]["escalate"] == "urgent"
    with pytest.raises(ValueError):
        inbox.approve_draft(legal)               # אין טיוטה — בעל העסק כותב בעצמו
    with pytest.raises(ValueError, match="נחסם"):
        inbox.approve_draft(legal, body="נעביר לתביעה")
    out = inbox.approve_draft(legal, body="קיבלנו, נחזור אליכם בהקדם.")
    assert out["status"] == "sent_dry_run" and out["body"].startswith("סטודיו מאיר: ")


def test_wrong_number_deletes_phone_but_apology_still_reaches_sender(inbox, svc):
    d = inbox.handle("sms", DANA, "טעות במספר")["draft_id"]
    assert cust(svc)["phone"] is None and cust(svc)["opted_out"] == 1
    out = inbox.approve_draft(d)
    assert out["status"] == "sent_dry_run" and svc.sender.sent[-1]["to"] == "972501234567"


def test_plan_approval_via_plans_supersedes_parallel_draft(inbox, svc):
    """רגרסיה: אישור פריסה ב-/plans/{id}/approve שלח את ההצעה, אבל טיוטת plan_request המקבילה
    נשארה בתור ⇒ בעל העסק יכול היה לאשר אותה ולשלוח את ההצעה ללקוח פעמיים."""
    res = inbox.handle("sms", DANA, "אין לי כסף כרגע, אפשר תשלומים?")
    draft_id, plan_id = res["draft_id"], res["plan_id"]
    assert inbox.drafts("pending_approval")
    svc.approve_plan(plan_id)
    assert len(svc.sender.sent) == 1
    assert inbox.drafts("pending_approval") == []
    with pytest.raises(ValueError, match="superseded"):
        inbox.approve_draft(draft_id)
    assert len(svc.sender.sent) == 1   # לא נשלח שוב


def test_queued_approved_reply_goes_out_with_the_regular_dispatch_cron(svc, clock):
    """critic סבב 13 (שוחזר): לפי MVP-SPEC יש cron אחד, «dispatch כל 15 דק׳». תשובה או הצעת פריסה
    שבעל העסק אישר מחוץ לחלון (שישי אחה״צ/שבת) נשארה approved ונשלחה **רק** ב-/conversation/flush
    ידני. כלומר בפועל לעולם לא. עכשיו dispatch שולח גם את התור הזה (דרך אותו שער שליחה)."""
    from datetime import datetime as _dt

    from app.policy import TZ as _TZ
    svc.sync()
    for rid in svc.plan():
        svc.approve(rid)
    svc.dispatch()
    res = svc.inbound("sms", "0501234567", "אפשר לפרוס לשלושה תשלומים?")
    clock.now = _dt(2026, 11, 14, 11, 0, tzinfo=_TZ)              # שבת: בעל העסק מאשר
    n = len(svc.sender.sent)
    out = svc.approve_plan(res["plan_id"])
    assert out["queued"] is True and len(svc.sender.sent) == n
    clock.now = _dt(2026, 11, 15, 8, 15, tzinfo=_TZ)              # ראשון: ה-cron הרגיל
    svc.dispatch()
    assert len(svc.sender.sent) == n + 1 and "פריסה" in svc.sender.sent[-1]["body"]

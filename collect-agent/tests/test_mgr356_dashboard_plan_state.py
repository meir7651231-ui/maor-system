"""מנהל 356 · מבקר 202🟠 — הצעת פריסה שנשלחה מהדשבורד מעבירה את השיחה ל«הצעת פריסה נשלחה».

`app/service.py` → `_mark_plan_offered` (נקרא מ-`_approve_plan_claimed` רק כשההצעה יצאה בפועל).
בקרות: SMS, «מסכים», תשובת האישור ללקוח, דחייה מסמנת את ההסדר rejected, ושליחה שנכשלה לא משנה מצב."""
import pytest

from app.conversation import Intent


def _offer(svc, *, sms: bool):
    svc.sync()
    if not sms:
        svc.db.x("UPDATE customers SET phone=NULL WHERE id=1")
    pid = svc.propose_plan(1, 3)
    out = svc.approve_plan(pid, confirm_amount=True)
    c = svc.db.one("SELECT phone, email FROM customers WHERE id=1")
    return pid, out, (c["phone"] if sms else c["email"])


@pytest.mark.parametrize("sms", [True, False])
@pytest.mark.parametrize("reply", ["מאשר", "מסכים", "כן, מאשרת"])
def test_accept_after_dashboard_offer(svc, sms, reply):
    pid, out, addr = _offer(svc, sms=sms)
    assert out["channel"] == ("sms" if sms else "email")
    conv = svc.db.one("SELECT state, offered_plan FROM conversations WHERE customer_id=1")
    assert conv["state"] == "awaiting_plan_reply" and conv["offered_plan"]
    r = svc.inbound(out["channel"], addr, reply)
    assert r["intent"] == Intent.PLAN_ACCEPT.value, r
    assert r["plan_id"] == pid
    assert svc.db.one("SELECT COUNT(*) n FROM plans WHERE customer_id=1")["n"] == 1
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == "approved"
    d = svc.db.one("SELECT body FROM drafts WHERE id=?", (r["draft_id"],)) if r["draft_id"] else None
    # ההסדר כבר אושר ונשלח ע״י בעל העסק ⇒ אישור «ההסדר בתוקף», לא «הועבר לאישור סופי» ולא «לא זיהיתי»
    assert d and "ההסדר בתוקף" in d["body"], d
    assert "לא זיהיתי" not in (r["owner_summary"] or "")


def test_reject_after_dashboard_offer_marks_rejected(svc):
    pid, out, addr = _offer(svc, sms=False)
    svc.inbound("email", addr, "לא מתאים לי, אפשר ב-6 תשלומים?")
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == "rejected"


def test_failed_send_keeps_state(svc, monkeypatch):
    svc.sync()
    svc.db.x("UPDATE customers SET phone=NULL WHERE id=1")
    pid = svc.propose_plan(1, 3)
    monkeypatch.setattr(svc.inbox, "_try_send", lambda did: (svc.db.x(
        "UPDATE drafts SET status='rejected' WHERE id=?", (did,)), False)[1])
    svc.approve_plan(pid, confirm_amount=True)
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == "proposed"
    assert svc.db.one("SELECT 1 FROM conversations WHERE customer_id=1 AND state='awaiting_plan_reply'") is None

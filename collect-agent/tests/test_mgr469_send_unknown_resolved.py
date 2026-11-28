"""מנהל 469 (STATUS 464–468 «הבא» מנוע): שליחה שסומנה send_unknown וחזרה בהצלחה ⇒ כרטיס «נקטעה» יורד.

תרחיש: `sender.send` נתקע מעל CLAIM_STALE (30 דק׳). בינתיים ריצה אחרת (`_recover_stuck_drafts` /
`_recover_stuck_sends`) סימנה send_unknown ופתחה לבעל העסק כרטיס «השליחה נקטעה… בדקו ביומן היוצאים לפני שליחה
ידנית». ואז השליחה חזרה בהצלחה וסימנה sent_dry_run — אבל הכרטיס נשאר פתוח ⇒ בעל העסק בודק/שולח ידנית הודעה
שכבר יצאה (כפילות ללקוח). עכשיו: המעבר send_unknown ⇒ sent_dry_run מוריד את הכרטיס + audit send_unknown_resolved.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from app.policy import TZ
from tests.test_no_silent_draft_drop import _approved_reply_at_night, api  # noqa: F401 — fixture


def _card(svc, mid):
    return svc.db.one("SELECT needs_owner FROM messages WHERE message_id=? AND intent='send_unknown'", (mid,))


def test_draft_send_unknown_then_success_closes_card(api, svc, clock):  # noqa: F811
    did = _approved_reply_at_night(api, svc, clock)
    clock.now = datetime(2026, 11, 9, 9, 0, tzinfo=TZ)
    real = svc.sender.send

    def slow_send(msg):
        # השליחה נתקעה 31 דק׳ ⇒ ריצה אחרת מסמנת send_unknown + כרטיס; ואז הספק מחזיר הצלחה
        clock.now += timedelta(minutes=31)
        svc.inbox._recover_stuck_drafts()
        assert svc.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"] == "send_unknown"
        assert _card(svc, f"sendunk-draft:{did}")["needs_owner"] == 1
        return real(msg)
    svc.sender.send = slow_send
    try:
        assert svc.inbox._try_send(did) is True
    finally:
        svc.sender.send = real
    row = svc.db.one("SELECT status, message_id FROM drafts WHERE id=?", (did,))
    assert row["status"] == "sent_dry_run" and row["message_id"]
    assert _card(svc, f"sendunk-draft:{did}")["needs_owner"] == 0          # הכרטיס ירד
    assert not [m for m in api.get("/owner/inbox").json() if m["intent"] == "send_unknown"]
    assert svc.db.one("SELECT 1 FROM audit WHERE action='send_unknown_resolved'")


def test_draft_normal_send_no_resolve_audit(api, svc, clock):  # noqa: F811
    did = _approved_reply_at_night(api, svc, clock)
    clock.now = datetime(2026, 11, 9, 9, 0, tzinfo=TZ)
    assert svc.inbox._try_send(did) is True
    assert svc.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"] == "sent_dry_run"
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='send_unknown_resolved'")


def test_other_send_unknown_cards_stay_open(api, svc, clock):  # noqa: F811
    did = _approved_reply_at_night(api, svc, clock)
    clock.now = datetime(2026, 11, 9, 9, 0, tzinfo=TZ)
    # כרטיס send_unknown של טיוטה אחרת (שבאמת נקטעה) — לא נוגעים בו
    svc.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,message_id,created_at) "
             "VALUES(1,'system','owner','x','send_unknown',1,'sendunk-draft:999','2026-11-09T09:00:00+02:00')")
    real = svc.sender.send

    def slow_send(msg):
        clock.now += timedelta(minutes=31)
        svc.inbox._recover_stuck_drafts()
        return real(msg)
    svc.sender.send = slow_send
    try:
        svc.inbox._try_send(did)
    finally:
        svc.sender.send = real
    assert _card(svc, "sendunk-draft:999")["needs_owner"] == 1


def test_reminder_send_unknown_then_success_closes_card(svc, clock):
    svc.sync()
    rid = svc.plan()[0]
    svc.approve(rid)
    assert svc._reminder(rid)["status"] == "approved"
    real = svc.sender.send
    hit = {"n": 0}

    def slow_send(msg):
        hit["n"] += 1
        if hit["n"] == 1:
            later = clock.now + timedelta(minutes=31)
            svc._recover_stuck_sends(later)
            assert svc._reminder(rid)["status"] == "send_unknown"
            assert _card(svc, f"sendunk:{rid}")["needs_owner"] == 1
        return real(msg)
    svc.sender.send = slow_send
    try:
        out = svc.dispatch()
    finally:
        svc.sender.send = real
    assert any(o["reminder_id"] == rid for o in out)
    assert svc._reminder(rid)["status"] == "sent_dry_run"
    assert _card(svc, f"sendunk:{rid}")["needs_owner"] == 0
    assert svc.db.one("SELECT 1 FROM audit WHERE action='send_unknown_resolved'")

"""מנהל 464 (check-then-update · סריקת ה-UPDATE-בלי-תנאי שנותרו, STATUS 462/463): `_drop_approved`.

`_try_send` קורא את הטיוטה, מריץ שער/רענון/אימות-סכום, ורק אז דוחה (`system:*`). ה-UPDATE היה בלי תנאי מצב ⇒
אם בינתיים ריצה מקבילה (אישור ‖ flush) **שלחה** את הטיוטה, או שבעל העסק דחה אותה בעצמו, או ש-_recover_stuck_drafts
סימן send_unknown — הדחייה דרסה ל-rejected/system ובעל העסק קיבל «התשובה שאישרתם לא נשלחה» על תשובה שיצאה.
עכשיו: `AND status=<מה שנבדק>`; 0 שורות ⇒ אין דריסה, אין הודעה, audit `draft_drop_skipped` בלבד.
"""
from __future__ import annotations

from datetime import datetime

from app.channels import sent_mark
from app.policy import TZ
from tests.test_no_silent_draft_drop import _approved_reply_at_night, _notes, api  # noqa: F401 — fixture


def _status(svc, did):
    return svc.db.one("SELECT status, decided_by FROM drafts WHERE id=?", (did,))


def test_sent_concurrently_is_not_overwritten_as_rejected(api, svc, clock, fake_gi):  # noqa: F811
    did = _approved_reply_at_night(api, svc, clock)
    fake_gi.docs[0]["amount"] = "700.00"                               # היתרה תשתנה ⇒ amount_changed
    real = svc.refresh_customer

    def refresh_while_other_worker_sends(cid):
        # ריצה אחרת (אישור‖flush) תפסה ושלחה את הטיוטה בזמן שזו רעננה
        svc.db.x("UPDATE drafts SET status='sent_dry_run', message_id='other' WHERE id=?", (did,))
        return real(cid)
    svc.refresh_customer = refresh_while_other_worker_sends
    clock.now = datetime(2026, 11, 9, 9, 0, tzinfo=TZ)
    n0 = sent_mark(svc.sender.sent)
    try:
        svc.inbox._try_send(did)
    finally:
        svc.refresh_customer = real
    st = _status(svc, did)
    assert st["status"] == "sent_dry_run", dict(st)                     # לא נדרס ל-rejected
    assert not (st["decided_by"] or "").startswith("system:")
    assert _notes(api) == []                                            # אין «לא נשלחה» שקרית
    assert sent_mark(svc.sender.sent) == n0                             # ולא נשלח שוב
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='draft_blocked_amount_changed'")
    assert svc.db.one("SELECT 1 FROM audit WHERE action='draft_drop_skipped'")


def test_owner_rejected_meanwhile_keeps_owner_decision(api, svc, clock, fake_gi):  # noqa: F811
    did = _approved_reply_at_night(api, svc, clock)
    fake_gi.docs[0]["amount"] = "700.00"
    real = svc.refresh_customer

    def refresh_while_owner_rejects(cid):
        svc.inbox.reject_draft(did, actor="owner")
        return real(cid)
    svc.refresh_customer = refresh_while_owner_rejects
    clock.now = datetime(2026, 11, 9, 9, 0, tzinfo=TZ)
    try:
        svc.inbox._try_send(did)
    finally:
        svc.refresh_customer = real
    st = _status(svc, did)
    assert st["status"] == "rejected" and st["decided_by"] == "owner", dict(st)
    assert _notes(api) == []


def test_send_error_after_recover_marked_unknown_is_not_rejected(api, svc, clock):  # noqa: F811
    did = _approved_reply_at_night(api, svc, clock)
    clock.now = datetime(2026, 11, 9, 9, 0, tzinfo=TZ)

    def send_hangs_then_fails(msg):
        # השליחה נתקעה; בינתיים _recover_stuck_drafts סימן send_unknown (אולי יצאה) — ואז חריגה
        svc.db.x("UPDATE drafts SET status='send_unknown' WHERE id=?", (did,))
        raise RuntimeError("timeout")
    real = svc.sender.send
    svc.sender.send = send_hangs_then_fails
    try:
        assert svc.inbox._try_send(did) is False
    finally:
        svc.sender.send = real
    assert _status(svc, did)["status"] == "send_unknown"               # «ייתכן שיצאה» לא הופך ל«לא נשלחה»
    assert not [m for m in api.get("/owner/inbox").json() if m["intent"] == "send_error"]


def test_plain_amount_change_still_drops_and_notifies(api, svc, clock, fake_gi):  # noqa: F811
    did = _approved_reply_at_night(api, svc, clock)
    fake_gi.docs[0]["amount"] = "700.00"
    clock.now = datetime(2026, 11, 9, 9, 0, tzinfo=TZ)
    api.post("/dispatch")
    st = _status(svc, did)
    assert st["status"] == "rejected" and st["decided_by"] == "system:amount_changed"
    assert len(_notes(api)) == 1
    assert svc.db.one("SELECT 1 FROM audit WHERE action='draft_blocked_amount_changed'")
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='draft_drop_skipped'")


def test_send_error_while_sending_still_drops_and_notifies(api, svc, clock):  # noqa: F811
    did = _approved_reply_at_night(api, svc, clock)
    clock.now = datetime(2026, 11, 9, 9, 0, tzinfo=TZ)
    real = svc.sender.send

    def boom(msg):
        raise RuntimeError("provider down")
    svc.sender.send = boom
    try:
        svc.inbox._try_send(did)
    finally:
        svc.sender.send = real
    st = _status(svc, did)
    assert st["status"] == "rejected" and st["decided_by"] == "system:send_error"
    assert [m for m in api.get("/owner/inbox").json() if m["intent"] == "send_error"]

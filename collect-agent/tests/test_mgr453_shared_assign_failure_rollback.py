"""מנהל 453 · תיקון מבקר 278🟡 — שיוך כרטיס משותף שנכשל אחרי התפיסה.

מאז 451 הכרטיס נתפס (`needs_owner=0`) וההשהיות של כל המקושרים משתחררות לפני `handle_customer`. חריגה שם ⇒ הכרטיס
«טופל», אף לקוח לא מושהה, «שילמתי» אבד, ניסיון חוזר ⇒ «כבר טופל», ולמחרת תזכורות לשני הלקוחות.
עכשיו: כשל **לפני** שההודעה נרשמה ללקוח ⇒ הכרטיס חוזר, ההשהיות חוזרות, בקשות עיון/מחיקה חוזרות לכרטיס, וניסיון
חוזר עובד. כשל **אחרי** שההודעה נרשמה ⇒ לא פותחים שוב (טיפול כפול), רק audit.
"""
from __future__ import annotations

import json
from datetime import timedelta

import pytest

from tests.test_critic_round233_shared_phone_promise import _split
from tests.test_mgr319_dsr_detect_and_due import _cid, _shared_card


def _card(svc):
    _split(svc)
    svc.inbound("sms", "050-0000111", "שילמתי אתמול בהעברה")
    card = svc.db.one("SELECT id FROM messages WHERE needs_owner=1 AND intent IN (SELECT value FROM json_each(?))",
                      (json.dumps(svc.inbox.SHARED_CARDS),))["id"]
    ids = [c["id"] for c in svc.db.q("SELECT id FROM customers WHERE phone='050-0000111' ORDER BY id")]
    return card, ids


def _paused(svc, ids):
    return [svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (i,))["paused_reason"] for i in ids]


def _boom(svc):
    def boom(*a, **k):
        raise RuntimeError("תקלה זמנית")
    svc.inbox.handle_customer = boom


def _events(svc, action):
    return [json.loads(r["detail"]) for r in svc.db.q("SELECT detail FROM audit WHERE action=?", (action,))]


def test_failure_restores_pauses_and_retry_records_paid_claim(svc, clock):
    card, ids = _card(svc)
    before = _paused(svc, ids)
    assert all(before)
    orig = svc.inbox.handle_customer
    _boom(svc)
    with pytest.raises(RuntimeError):
        svc.inbox.assign_shared_card(card, ids[0])
    svc.inbox.handle_customer = orig
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (card,))["needs_owner"] == 1
    assert _paused(svc, ids) == before
    assert _events(svc, "shared_assign_rolled_back")[0]["error"] == "RuntimeError"
    # ניסיון חוזר עובד — «שילמתי» נרשם לנבחר, השני משתחרר
    svc.inbox.assign_shared_card(card, ids[0])
    assert _paused(svc, ids) == ["paid_claim", None]
    clock.now += timedelta(days=1)
    reminded = {svc.db.one("SELECT customer_id FROM reminders WHERE id=?", (r,))["customer_id"] for r in svc.plan()}
    assert ids[0] not in reminded


def test_pause_set_elsewhere_meanwhile_is_not_overwritten(svc):
    card, ids = _card(svc)
    orig = svc.inbox.handle_customer

    def boom(*a, **k):
        # בזמן הטיפול הלקוח השני קיבל השהיה אחרת — לא דורסים אותה בשחזור
        svc.db.x("UPDATE customers SET paused_reason='minor' WHERE id=?", (ids[1],))
        raise RuntimeError("x")
    svc.inbox.handle_customer = boom
    with pytest.raises(RuntimeError):
        svc.inbox.assign_shared_card(card, ids[0])
    svc.inbox.handle_customer = orig
    assert _paused(svc, ids)[1] == "minor"


def test_failure_unlinks_dsr_back_to_card(svc):
    out = _shared_card(svc)
    rid = json.loads(svc.db.one("SELECT payload FROM messages WHERE id=?", (out["card_id"],))["payload"])["dsr_ids"][0]
    orig = svc.inbox.handle_customer
    _boom(svc)
    with pytest.raises(RuntimeError):
        svc.inbox.assign_shared_card(out["card_id"], _cid(svc, "משה כהן"))
    svc.inbox.handle_customer = orig
    assert svc.db.one("SELECT customer_id FROM dsr WHERE id=?", (rid,))["customer_id"] is None
    # שיוך מחדש ללקוחה אחרת — הבקשה הולכת אליה
    svc.inbox.assign_shared_card(out["card_id"], _cid(svc, "רונית לוי"))
    assert svc.db.one("SELECT customer_id FROM dsr WHERE id=?", (rid,))["customer_id"] == _cid(svc, "רונית לוי")


def test_failure_after_message_recorded_does_not_reopen(svc):
    card, ids = _card(svc)
    orig_draft = svc.inbox._draft

    def boom(*a, **k):
        raise RuntimeError("אחרי ההשפעות")
    svc.inbox._draft = boom
    with pytest.raises(RuntimeError):
        svc.inbox.assign_shared_card(card, ids[0])
    svc.inbox._draft = orig_draft
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (card,))["needs_owner"] == 0
    assert _events(svc, "shared_assign_failed_after_effects")[0]["customer"] == ids[0]
    assert not _events(svc, "shared_assign_rolled_back")
    with pytest.raises(ValueError):
        svc.inbox.assign_shared_card(card, ids[0])


def test_source_guard_undo_wraps_handle_customer():
    import inspect

    from app import inbox
    src = inspect.getsource(inbox.ConversationInbox.assign_shared_card)
    assert "_undo_failed_assign" in src and src.index("try:") < src.index("self.handle_customer(")

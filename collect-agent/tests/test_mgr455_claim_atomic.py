"""מנהל 455 (מבקר 279א+ב🟡): תפיסה ואז השפעות — בלי חצי-מצב.

279א — `assign_shared_card`: התפיסה+שחרור ההשהיות+DSR בטרנזקציה אחת עם «רשומת תפיסה» (payload.assign_claim);
   BaseException ⇒ פיצוי; הריגה קשה (שום except לא רץ) ⇒ `_recover_stuck_assigns` (ב-plan/dispatch) אחרי 30 דק׳.
279ב — `decide_promise_request`: רישום+השפעות+טיוטה בטרנזקציה אחת ⇒ כשל = כלום לא נרשם, ניסיון חוזר מצליח.
"""
from __future__ import annotations

import json
from datetime import timedelta

import pytest

from tests.test_critic_round279_claim_then_fail import _card, _promise


def _claim(svc, card):
    p = svc.db.one("SELECT payload FROM messages WHERE id=?", (card,))["payload"]
    return json.loads(p or "{}").get("assign_claim")


def test_success_clears_claim(svc):
    card, ids = _card(svc)
    svc.inbox.assign_shared_card(card, ids[0])
    assert _claim(svc, card) is None
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (card,))["needs_owner"] == 0


def _hard_kill(svc, card, cid):
    """מדמה SIGKILL: handle_customer «לא חוזר» ושום except לא רץ — עוקפים את ה-try ע״י שמירת המצב שאחרי התפיסה."""
    class Kill(BaseException):
        pass
    orig_h, orig_u = svc.inbox.handle_customer, svc.inbox._undo_failed_assign
    svc.inbox.handle_customer = lambda *a, **k: (_ for _ in ()).throw(Kill())
    svc.inbox._undo_failed_assign = lambda *a, **k: None    # התהליך מת — הפיצוי לא רץ
    with pytest.raises(Kill):
        svc.inbox.assign_shared_card(card, cid)
    svc.inbox.handle_customer, svc.inbox._undo_failed_assign = orig_h, orig_u


def test_hard_kill_recovered_after_stale(svc, clock):
    card, ids = _card(svc)
    _hard_kill(svc, card, ids[0])
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (card,))["needs_owner"] == 0
    assert _claim(svc, card)["customer"] == ids[0]
    # לפני 30 דק׳ — לא נוגעים (אולי השיוך עוד רץ)
    assert svc.inbox._recover_stuck_assigns() == 0
    clock.now += timedelta(days=1)
    assert svc.plan() == []      # plan מריץ את השחזור לפני התכנון ⇒ ההשהיות חזרו, אין תזכורות
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (card,))["needs_owner"] == 1
    assert _claim(svc, card) is None
    assert svc.db.one("SELECT 1 FROM audit WHERE action='shared_assign_rolled_back' "
                      "AND json_extract(detail,'$.error')='interrupted'")
    # ניסיון חוזר מצליח
    svc.inbox.assign_shared_card(card, ids[0])
    assert _claim(svc, card) is None


def test_hard_kill_after_message_recorded_not_reopened(svc, clock):
    card, ids = _card(svc)

    class Kill(BaseException):
        pass
    orig_s, orig_u = svc.inbox._save_state, svc.inbox._undo_failed_assign
    svc.inbox._save_state = lambda *a, **k: (_ for _ in ()).throw(Kill())   # אחרי שההודעה נרשמה ללקוח
    svc.inbox._undo_failed_assign = lambda *a, **k: None
    with pytest.raises(Kill):
        svc.inbox.assign_shared_card(card, ids[0])
    svc.inbox._save_state, svc.inbox._undo_failed_assign = orig_s, orig_u
    clock.now += timedelta(hours=1)
    assert svc.inbox._recover_stuck_assigns() == 1
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (card,))["needs_owner"] == 0
    assert svc.db.one("SELECT 1 FROM audit WHERE action='shared_assign_failed_after_effects'")
    assert svc.inbox._recover_stuck_assigns() == 0       # פעם אחת בלבד


def test_already_handled_inside_batch_writes_nothing(svc):
    card, ids = _card(svc)
    svc.inbox.assign_shared_card(card, ids[0])
    n = svc.db.one("SELECT COUNT(*) AS n FROM audit")["n"]
    with pytest.raises(ValueError, match="כבר טופל"):
        svc.inbox.assign_shared_card(card, ids[1])
    assert svc.db.one("SELECT COUNT(*) AS n FROM audit")["n"] == n


@pytest.mark.parametrize("approve", [True, False])
def test_failed_decision_leaves_no_trace(svc, approve):
    cid = _promise(svc)
    before = svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))["paused_reason"]
    orig = svc._promise_decision_notice
    svc._promise_decision_notice = lambda *a, **k: (_ for _ in ()).throw(RuntimeError("x"))
    with pytest.raises(RuntimeError):
        svc.decide_promise_request(cid, approve)
    svc._promise_decision_notice = orig
    assert not svc.db.one("SELECT 1 FROM audit WHERE action IN ('promise_request_approved','promise_request_refused')")
    assert svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))["paused_reason"] == before
    res = svc.decide_promise_request(cid, approve)
    assert res["customer_update"] is not None
    with pytest.raises(ValueError, match="כבר הוכרעה"):
        svc.decide_promise_request(cid, not approve)

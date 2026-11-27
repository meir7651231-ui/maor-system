"""מנהל 451 (מבקר 276א🟡 + 276ב🟡): הכרעה שנייה במקביל ⇒ «כבר הוכרעה/טופל», לא הכרעה כפולה.

ההתערבות כאן בנקודה הקשה ביותר: ההחלטה השנייה רצה **מיד אחרי** שהראשונה קראה את המצב («עוד לא הוכרע»), לפני כל
כתיבה שלה. בלי ה-UPDATE/INSERT המותנה שתיהן מצליחות.
"""
from __future__ import annotations

import pytest

from tests.test_critic_round276_more_concurrent_decisions import DANA, _promise_pending, _shared_paid_card


def _after_read(svc, needle, during):
    """הקריאה הראשונה ל-db.one שה-SQL שלה מכיל needle מחזירה את התוצאה — ואז רצה during() לפני שהקוד ממשיך."""
    orig = svc.db.one
    state = {"done": False}

    def one(sql, args=()):
        row = orig(sql, args)
        if not state["done"] and needle in sql:
            state["done"] = True
            during()
        return row
    svc.db.one = one

    def undo():
        assert state["done"], needle
        svc.db.one = orig
    return undo


def _decisions(svc):
    return [a["action"] for a in svc.db.q("SELECT action FROM audit WHERE action IN "
                                          "('promise_request_approved','promise_request_refused') ORDER BY id")]


@pytest.mark.parametrize("first,second", [(True, False), (False, True), (True, True)])
def test_promise_decision_race_after_check_one_wins(svc, first, second):
    cid = _promise_pending(svc)
    undo = _after_read(svc, "promise_request_approved','promise_request_refused",
                       lambda: svc.decide_promise_request(cid, second, actor="user:3"))
    try:
        with pytest.raises(ValueError, match="כבר הוכרעה"):
            svc.decide_promise_request(cid, first, actor="owner")
    finally:
        undo()
    want = "promise_request_approved" if second else "promise_request_refused"
    assert _decisions(svc) == [want]
    notices = svc.db.q("SELECT body FROM drafts WHERE customer_id=? AND status='pending_approval' "
                       "AND body LIKE '%בעל העסק%'", (cid,))
    assert len(notices) <= 1
    paused = svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))["paused_reason"]
    # המנצחת קובעת: אישור ⇒ ההשהיה הוארכה; סירוב ⇒ נשארה בתקרה. המפסידה לא נגעה.
    assert paused.startswith("promise:until=")


def test_promise_decision_sequential_still_works(svc):
    cid = _promise_pending(svc)
    before = svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))["paused_reason"]
    res = svc.decide_promise_request(cid, True)
    after = svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))["paused_reason"]
    assert res["approved"] and after != before and after == f"promise:until={res['paused_until']}"
    assert _decisions(svc) == ["promise_request_approved"]
    assert DANA


def test_shared_assign_race_after_check_one_customer(svc):
    card, ids = _shared_paid_card(svc)
    undo = _after_read(svc, "FROM messages WHERE id=? AND intent IN",
                       lambda: svc.inbox.assign_shared_card(card, ids[1], actor="user:3"))
    try:
        with pytest.raises(ValueError, match="כבר טופל"):
            svc.inbox.assign_shared_card(card, ids[0], actor="user:2")
    finally:
        undo()
    paused = [c["id"] for c in svc.db.q("SELECT id FROM customers WHERE phone='050-0000111' "
                                         "AND paused_reason='paid_claim'")]
    assert paused == [ids[1]]
    assigned = svc.db.q("SELECT detail FROM audit WHERE action='shared_contact_assigned'")
    assert len(assigned) == 1


def test_shared_assign_nobody_race(svc):
    card, ids = _shared_paid_card(svc)
    undo = _after_read(svc, "FROM messages WHERE id=? AND intent IN",
                       lambda: svc.inbox.assign_shared_card(card, None, actor="user:3"))
    try:
        with pytest.raises(ValueError, match="כבר טופל"):
            svc.inbox.assign_shared_card(card, ids[0], actor="user:2")
    finally:
        undo()
    assert not svc.db.q("SELECT id FROM customers WHERE phone='050-0000111' AND paused_reason='paid_claim'")

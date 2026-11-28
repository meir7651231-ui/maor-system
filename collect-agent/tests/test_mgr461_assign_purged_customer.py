"""מנהל 461 (check-then-update שנשאר מ-458/459/460): שיוך כרטיס «כתובת משותפת» ‖ התממת הלקוח (ר-10).

`assign_shared_card` בדק `cust is None` בלבד, ומחוץ לטרנזקציה. התממה (purge_closed) לא מוחקת את השורה — היא מאפסת
שם/טלפון/מייל ומסמנת purged_at. כך:
 (א) שיוך ללקוח שכבר הותמם (כרטיס רגיל לא דוחה התממה) ⇒ גוף ההודעה («שילמתי אתמול…») נרשם מחדש תחת הלקוח
     המותמם — PII חוזר אחרי מחיקה — ונוצרת טיוטה לכתובת NULL.
 (ב) התממה בין הבדיקה לתפיסה ⇒ אותו דבר, אף שהבדיקה «עברה».
עכשיו: הבדיקה (קיים + לא מותמם) חוזרת **בתוך** ה-batch אחרי התפיסה; כשל ⇒ 409, הכרטיס נשאר פתוח וההשהיות לא זזות.
"""
from __future__ import annotations

import pytest

from tests.test_critic_round279_claim_then_fail import _card


def _anon(svc, cid):
    svc.db.x("UPDATE customers SET name=NULL, phone=NULL, email=NULL, purged_at='2026-01-01T00:00:00' WHERE id=?",
             (cid,))


def _state(svc, card, ids):
    return (svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (card,))["needs_owner"],
            [svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (i,))["paused_reason"] for i in ids])


def test_assign_to_already_purged_is_rejected(svc):
    card, ids = _card(svc)
    before = _state(svc, card, ids)
    _anon(svc, ids[0])
    n_msgs = svc.db.one("SELECT COUNT(*) n FROM messages")["n"]
    with pytest.raises(ValueError, match="כבר לא קיים"):
        svc.inbox.assign_shared_card(card, ids[0])
    assert _state(svc, card, ids) == before
    assert svc.db.one("SELECT COUNT(*) n FROM messages")["n"] == n_msgs
    assert not svc.db.one("SELECT 1 FROM messages WHERE customer_id=? AND body<>''", (ids[0],))
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='shared_contact_assigned'")


def test_purge_between_check_and_claim_is_rejected(svc):
    card, ids = _card(svc)
    before = _state(svc, card, ids)
    db_batch = svc.db.batch
    fired = {"n": 0}

    def batch_then_purge():
        # ההתממה «נכנסת» בדיוק לפני שהשיוך פותח את הטרנזקציה שלו
        if not fired["n"]:
            fired["n"] = 1
            _anon(svc, ids[0])
        return db_batch()
    svc.db.batch = batch_then_purge
    try:
        with pytest.raises(ValueError, match="כבר לא קיים"):
            svc.inbox.assign_shared_card(card, ids[0])
    finally:
        svc.db.batch = db_batch
    assert fired["n"] == 1
    assert _state(svc, card, ids) == before
    assert not svc.db.one("SELECT 1 FROM messages WHERE customer_id=? AND body<>''", (ids[0],))
    assert not svc.db.one("SELECT 1 FROM drafts WHERE customer_id=?", (ids[0],))


def test_other_customer_still_assignable_after_purge(svc):
    card, ids = _card(svc)
    _anon(svc, ids[0])
    res = svc.inbox.assign_shared_card(card, ids[1])
    assert res["assigned"] == ids[1]
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (card,))["needs_owner"] == 0


def test_nobody_still_works_after_purge(svc):
    card, ids = _card(svc)
    _anon(svc, ids[0])
    assert svc.inbox.assign_shared_card(card, None)["assigned"] is None

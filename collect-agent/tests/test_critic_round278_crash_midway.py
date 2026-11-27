"""מבקר סבב 278: קריסה באמצע פעולה (חריגה מוזרקת אחרי צעד ראשון) — מה נשאר אחרי עלייה מחדש.

✓ אימות ℹ️ 277 (מנהל 452): שורת לקוח טרייה בין ה-SMS למייל של אותה תזכורת (`_midsend_block`) — בדיקות הצוות ירוקות.
✓ נבדק בלי ממצא [מאומת, BaseException אחרי `sender.send` — כמו תהליך שנהרג]:
  · dispatch: התזכורת נשארת `sending`; dispatch נוסף בתוך 30 דק׳ לא שולח שוב; אחרי 30 דק׳ ⇒ `send_unknown` + כרטיס
    לבעל העסק «ייתכן שחלק מההודעות יצא — לא תישלח שוב אוטומטית». סה״כ הודעה אחת.
  · תשובה ללקוח (approve_draft) ⇒ אותו מסלול (`_recover_stuck_drafts` ⇒ send_unknown + כרטיס), הודעה אחת.
  · הצעת פריסה (approve_plan) ⇒ הטיוטה `send_unknown`, הודעה אחת, כרטיס לבעל העסק.
🟡 278 (גבי מנוע) — `inbox.assign_shared_card`: מאז מנהל 451 הכרטיס «נתפס» (`needs_owner=0`) וההשהיות של כל המקושרים
  משתחררות **לפני** `handle_customer`, בלי טרנזקציה אחת. כל חריגה ב-handle_customer (גם RuntimeError רגילה, לא רק
  קריסה) ⇒ הכרטיס כבר «טופל», אף לקוח לא מושהה, «שילמתי» לא נרשם לאף אחד, וניסיון חוזר ⇒ «הכרטיס כבר טופל». למחרת
  plan() בונה תזכורות **לשני** הלקוחות על הטלפון שהודיע «שילמתי».
מצופה: כשל אחרי התפיסה ⇒ הכרטיס חוזר ל«דורש טיפול» (או הכול ב-db.batch אחד).
רכיב: app/inbox.py → assign_shared_card.
"""
from __future__ import annotations

import json
from datetime import timedelta

import pytest

from tests.test_critic_round233_shared_phone_promise import _split


def _card(svc):
    _split(svc)
    svc.inbound("sms", "050-0000111", "שילמתי אתמול בהעברה")
    card = svc.db.one("SELECT id FROM messages WHERE needs_owner=1 AND intent IN (SELECT value FROM json_each(?))",
                      (json.dumps(svc.inbox.SHARED_CARDS),))["id"]
    ids = [c["id"] for c in svc.db.q("SELECT id FROM customers WHERE phone='050-0000111' ORDER BY id")]
    return card, ids


def test_assign_without_failure_pauses_chosen_control(svc):
    card, ids = _card(svc)
    svc.inbox.assign_shared_card(card, ids[0])
    paused = [c["paused_reason"] for c in svc.db.q("SELECT paused_reason FROM customers WHERE id IN (?,?) ORDER BY id",
                                                   tuple(ids))]
    assert paused == ["paid_claim", None]



def test_failed_assign_keeps_card_retryable(svc, clock):
    card, ids = _card(svc)
    orig = svc.inbox.handle_customer

    def boom(*a, **k):
        raise RuntimeError("תקלה זמנית")
    svc.inbox.handle_customer = boom
    with pytest.raises(RuntimeError):
        svc.inbox.assign_shared_card(card, ids[0])
    svc.inbox.handle_customer = orig
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (card,))["needs_owner"] == 1
    clock.now += timedelta(days=1)
    assert svc.plan() == []

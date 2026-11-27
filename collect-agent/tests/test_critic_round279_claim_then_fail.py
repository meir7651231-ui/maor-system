"""מבקר סבב 279 (🟡 ×2, גבי מנוע): «תפיסה ואז השפעות בלי טרנזקציה» — כשל אחרי הצעד הראשון.

✓ אימות 278 (מנהל 453) [מאומת]: RuntimeError ב-handle_customer ⇒ הכרטיס חוזר ל«דורש טיפול», ההשהיות חוזרות, ניסיון
   חוזר מצליח ולמחרת אין תזכורות. ✓ נסרק בלי ממצא: accept_mass_close (db.batch ⇒ rollback), אישור/דחייה של תזכורת
   (UPDATE מותנה הוא הצעד היחיד), lift_inherited_optout (כתיבות אידמפוטנטיות).
279א — `assign_shared_card`: הפיצוי של 453 רץ ב-`except Exception` בלבד. קריסה אמיתית (BaseException — SIGTERM בפריסה,
   KeyboardInterrupt, OOM) אחרי התפיסה ⇒ כמו לפני 453: `needs_owner=0`, אף לקוח לא מושהה, «שילמתי» אבד, ניסיון חוזר
   ⇒ «הכרטיס כבר טופל». פיצוי לא יכול לרוץ בקריסה — רק טרנזקציה אחת (או תפיסה עם claimed_at + שחזור כמו send_unknown).
279ב — `decide_promise_request`: מאז 276א ההכרעה נרשמת ביומן (INSERT מותנה) **לפני** ההשפעות. כשל ב-
   `_promise_decision_notice` ⇒ ההכרעה «נרשמה», ההשהיה עודכנה, אבל טיוטת העדכון ללקוחה לא נוצרה, וניסיון חוזר ⇒
   «הבקשה כבר הוכרעה». הלקוחה שנאמר לה «בעל העסק יאשר את המועד ונעדכן אתכם» לא מקבלת עדכון — לא באישור ולא בסירוב.
רכיב: app/inbox.py → assign_shared_card · app/service.py → decide_promise_request.
"""
from __future__ import annotations

import json
from datetime import timedelta

import pytest

from tests.test_critic_round233_shared_phone_promise import _split


class Killed(BaseException):
    """קריסה שלא נתפסת ב-except Exception (כמו SIGTERM/KeyboardInterrupt)."""


def _card(svc):
    _split(svc)
    svc.inbound("sms", "050-0000111", "שילמתי אתמול בהעברה")
    card = svc.db.one("SELECT id FROM messages WHERE needs_owner=1 AND intent IN (SELECT value FROM json_each(?))",
                      (json.dumps(svc.inbox.SHARED_CARDS),))["id"]
    return card, [c["id"] for c in svc.db.q("SELECT id FROM customers WHERE phone='050-0000111' ORDER BY id")]


def _fail_assign(svc, exc):
    card, ids = _card(svc)
    orig = svc.inbox.handle_customer

    def boom(*a, **k):
        raise exc("x")
    svc.inbox.handle_customer = boom
    with pytest.raises(exc):
        svc.inbox.assign_shared_card(card, ids[0])
    svc.inbox.handle_customer = orig
    return card


def test_runtime_error_compensated_control(svc, clock):
    card = _fail_assign(svc, RuntimeError)
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (card,))["needs_owner"] == 1
    clock.now += timedelta(days=1)
    assert svc.plan() == []


def test_crash_after_claim_keeps_card(svc, clock):
    card = _fail_assign(svc, Killed)
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (card,))["needs_owner"] == 1
    clock.now += timedelta(days=1)
    assert svc.plan() == []


def _promise(svc):
    svc.sync()
    did = svc.inbound("sms", "050-1234567", "I'll pay on November 25")["draft_id"]
    svc.inbox.approve_draft(did)
    return svc.db.one("SELECT id FROM customers WHERE phone='050-1234567'")["id"]


def test_decision_creates_update_control(svc):
    cid = _promise(svc)
    assert svc.decide_promise_request(cid, False)["customer_update"] is not None


@pytest.mark.parametrize("approve", [True, False])
def test_failed_decision_can_be_retried(svc, approve):
    cid = _promise(svc)
    orig = svc._promise_decision_notice

    def boom(*a, **k):
        raise RuntimeError("x")
    svc._promise_decision_notice = boom
    with pytest.raises(RuntimeError):
        svc.decide_promise_request(cid, approve)
    svc._promise_decision_notice = orig
    assert svc.decide_promise_request(cid, approve)["customer_update"] is not None

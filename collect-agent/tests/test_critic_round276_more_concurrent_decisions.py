"""מבקר סבב 276 (🟡 ×2): אותו דפוס check-then-update של 275 בשתי פעולות נוספות.

✓ אימות 275 (מנהל, ac7f4273) [מאומת גם במרוץ אמיתי — שני חוטים + Barrier, 20 הרצות נקיות לכל תרחיש]: אישור‖דחייה
⇒ תמיד אחת 200 והשנייה 409 («התזכורת כבר נדחתה»), בלי דריסה; עריכה+אישור‖אישור של תשובה ⇒ הודעה אחת בדיוק, המפסידה
מקבלת 409 (לא אובדת בשקט). ℹ️ ה-409 עדיין לא אומר מי החליט.
✓ נסרק בלי ממצא: accept_mass_close (כל הסגירה תחת db.batch + בדיקת status='open' לכל חשבונית ⇒ השני סוגר 0).
276א (גבי מנוע) — `service.decide_promise_request`: «כבר הוכרעה?» נבדק ביומן, ואז ההכרעה נרשמת בלי תנאי. בעל העסק
   משני מכשירים (או לחיצה כפולה): «אשר» ‖ «סרב» ⇒ שתיהן מצליחות — ביומן `promise_request_refused` **וגם**
   `promise_request_approved`, ובתור **שתי טיוטות עדכון סותרות** ללקוחה («בעל העסק אישר: … עד 25.11» / «נוכל להמתין
   עד … ולא עד 25.11»).
276ב (גבי מנוע) — `inbox.assign_shared_card`: `needs_owner` נבדק ואז `UPDATE messages SET needs_owner=0 WHERE id=?`.
   «שילמתי» מטלפון משותף (דויד + שרה) ⇒ עובדת a משייכת לדויד ‖ עובדת b לשרה ⇒ שתיהן מצליחות: **שני הלקוחות** מושהים
   `paid_claim` (התזכורות לשניהם נעצרות — בדיוק מה שהכרטיס נועד למנוע) ושתי טיוטות לאותו טלפון.
הבדיקות דטרמיניסטיות: הפעולה השנייה רצה בין הבדיקה לעדכון של הראשונה (עטיפת `db.x` על העדכון הראשון).
מצופה: עדכון מותנה (`… AND needs_owner=1` / סימון הכרעה אטומי) ⇒ השנייה 409.
רכיב: app/service.py → decide_promise_request · app/inbox.py → assign_shared_card.
"""
from __future__ import annotations

import json

import pytest

from tests.test_critic_round233_shared_phone_promise import _split

DANA = "050-1234567"


def _run_inside(svc, prefix, during):
    """הקריאה הראשונה ל-db.x שמתחילה ב-prefix מריצה את during() לפני שהיא מתבצעת."""
    # מנהל 451: עוטפים גם את db.update — התיקון (276א/ב) הוא UPDATE מותנה דרך update, אחרת ההתערבות לא הייתה רצה
    # והבדיקה עוברת בלי לבדוק כלום.
    orig_x, orig_u = svc.db.x, svc.db.update
    state = {"done": False}

    def wrap(orig):
        def f(sql, args=()):
            if not state["done"] and sql.startswith(prefix):
                state["done"] = True
                during()
            return orig(sql, args)
        return f
    svc.db.x, svc.db.update = wrap(orig_x), wrap(orig_u)

    def undo():
        assert state["done"], f"ההתערבות לא רצה (prefix={prefix!r})"
        svc.db.x, svc.db.update = orig_x, orig_u
    return undo


def _promise_pending(svc):
    svc.sync()
    did = svc.inbound("sms", DANA, "I'll pay on November 25")["draft_id"]
    svc.inbox.approve_draft(did)
    return svc.db.one("SELECT id FROM customers WHERE phone=?", (DANA,))["id"]


def test_second_promise_decision_rejected_control(svc):
    cid = _promise_pending(svc)
    svc.decide_promise_request(cid, False)
    with pytest.raises(ValueError, match="כבר הוכרעה"):
        svc.decide_promise_request(cid, True)


def test_concurrent_promise_decisions_one_wins(svc):
    cid = _promise_pending(svc)
    undo = _run_inside(svc, "UPDATE customers SET paused_reason",
                       lambda: svc.decide_promise_request(cid, False, actor="user:3"))
    try:
        svc.decide_promise_request(cid, True, actor="owner")
    except ValueError:
        pass   # «כבר הוכרעה» לשנייה = ההתנהגות הנכונה
    finally:
        undo()
    acts = [a["action"] for a in svc.db.q("SELECT action FROM audit WHERE action LIKE 'promise_request_%'")]
    updates = svc.db.q("SELECT id FROM drafts WHERE customer_id=? AND status='pending_approval' "
                       "AND body LIKE '%בעל העסק%'", (cid,))
    assert len(acts) == 1 and len(updates) <= 1, (acts, len(updates))


def _shared_paid_card(svc):
    _split(svc)
    svc.inbound("sms", "050-0000111", "שילמתי אתמול בהעברה")
    card = svc.db.one("SELECT id FROM messages WHERE needs_owner=1 AND intent IN (SELECT value FROM json_each(?))",
                      (json.dumps(svc.inbox.SHARED_CARDS),))["id"]
    ids = [c["id"] for c in svc.db.q("SELECT id FROM customers WHERE phone='050-0000111' ORDER BY id")]
    return card, ids


def test_second_assign_rejected_control(svc):
    card, ids = _shared_paid_card(svc)
    svc.inbox.assign_shared_card(card, ids[0])
    with pytest.raises(ValueError, match="כבר טופל"):
        svc.inbox.assign_shared_card(card, ids[1])


def test_concurrent_shared_assign_one_customer(svc):
    card, ids = _shared_paid_card(svc)
    undo = _run_inside(svc, "UPDATE messages SET needs_owner=0 WHERE id=?",
                       lambda: svc.inbox.assign_shared_card(card, ids[1], actor="user:3"))
    try:
        svc.inbox.assign_shared_card(card, ids[0], actor="user:2")
    except ValueError:
        pass   # «כבר טופל» לשנייה = ההתנהגות הנכונה
    finally:
        undo()
    paused = [c["id"] for c in svc.db.q("SELECT id FROM customers WHERE phone='050-0000111' "
                                         "AND paused_reason='paid_claim'")]
    assert len(paused) == 1, paused

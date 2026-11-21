"""מבקר סבב 204 · 🟠 — רגרסיה של 54767d27 (תיקון 202): «מאשר» אחרי הסדר שנסגר מתפרש כאישור הצעה.

רכיבים: `app/service.py` → `approve_plan` (54767d27: מעביר את השיחה למצב «הצעה נשלחה») + `app/inbox.py` (PLAN_ACCEPT
מחפש הסדר proposed/approved — לא מוצא ⇒ plan=None) + `app/conversation.py` (מצב השיחה לא מתאפס כשההסדר נסגר).
אחרי שההסדר **הושלם** (שולם במלואו) או **הוחמץ** (`_sweep_plans`), הלקוח כותב «מאשר» (למשל «מאשר שקיבלתי») ⇒
intent=plan_accept, audit `plan_accepted_by_customer {"plan": null}`, טיוטה ללקוח: «מעולה, תודה דנה! ההסדר הועבר
לאישור סופי, ואחרי האישור **נשלח את פרטי התשלום הראשון**» — ללקוח ששילם הכול — וכרטיס לבעל העסק «✅ אישר/ה את
הצעת הפריסה (3×400…). נדרש אישור סופי שלך» על הסדר שכבר סגור. ב-773f2880 (לפני התיקון) ⇒ unknown (כרטיס «לא זיהיתי»).
xfail(strict=True); בקרה ירוקה (202 נשמר)."""
from datetime import timedelta

import pytest


def _plan(svc):
    svc.sync()
    pid = svc.propose_plan(1, 3)
    svc.approve_plan(pid, confirm_amount=True)
    return pid


@pytest.mark.xfail(strict=True, reason="204🟠: «מאשר» אחרי הסדר שהושלם/הוחמץ ⇒ «הועבר לאישור סופי»")
@pytest.mark.parametrize("case", ["completed", "missed"])
def test_marer_after_closed_plan_is_not_plan_accept(svc, clock, fake_gi, case):
    pid = _plan(svc)
    if case == "missed":
        clock.now += timedelta(days=20)
        svc.plan()
    else:
        fake_gi.docs[0]["amount"] = "0.00"
        fake_gi.docs[0]["status"] = 2
        svc.sync()
        svc.plan()
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == case
    r = svc.inbound("sms", "050-1234567", "מאשר")
    assert r["intent"] != "plan_accept", r
    body = svc.db.one("SELECT body FROM drafts WHERE id=?", (r["draft_id"],))["body"] if r.get("draft_id") else ""
    assert "התשלום הראשון" not in body, body


def test_control_marer_after_open_offer_still_accepts(svc):
    pid = _plan(svc)
    r = svc.inbound("sms", "050-1234567", "מאשר")
    assert r["intent"] == "plan_accept"
    assert svc.db.one("SELECT 1 FROM audit WHERE action='plan_accepted_by_customer' "
                      "AND json_extract(detail,'$.plan')=?", (pid,))

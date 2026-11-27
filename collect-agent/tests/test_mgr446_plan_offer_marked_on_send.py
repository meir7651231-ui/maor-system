"""מנהל 446 (מבקר 272א🟠 + 272ב🟠): השיחה «מציעה» הסדר רק כשההצעה יצאה בפועל, והצעה שבוטלה כישנה יורדת מהשיחה.

272א: `_approve_plan_claimed` סימן awaiting_plan_reply גם כשההצעה נשארה בתור ⇒ «מאשר» לפני שהלקוח קיבל = plan_accept.
      עכשיו: בתור ⇒ השיחה לא נוגעת; כשהטיוטה יוצאת (`inbox._try_send`, גם ב-flush/dispatch) ⇒ מסמנים.
272ב: `_withdraw_if_stale` דחה את ההסדר אבל השאיר את offered_plan ⇒ עכשיו `_clear_plan_offer` (רק אם זה הלוח שבשיחה).
"""
from __future__ import annotations

import json
from dataclasses import replace
from datetime import timedelta

PHONE = "050-1234567"


def _conv(svc, cid):
    return svc.db.one("SELECT state, offered_plan FROM conversations WHERE customer_id=?", (cid,))


def _queued(svc):
    svc.sync()
    cid = svc.db.one("SELECT id FROM customers WHERE phone=?", (PHONE,))["id"]
    pid = svc.propose_plan(cid, 3)
    svc.s = replace(svc.s, trial_start=(svc.clock().date() - timedelta(days=30)).isoformat())
    r = svc.approve_plan(pid)
    assert r["queued"] is True
    return cid, pid


def test_queued_offer_does_not_touch_conversation(svc):
    cid, _ = _queued(svc)
    c = _conv(svc, cid)
    assert c is None or c["state"] != "awaiting_plan_reply"


def test_offer_marked_when_it_goes_out_after_resume(svc):
    cid, pid = _queued(svc)
    svc.s = replace(svc.s, trial_start="")
    svc.dispatch()
    assert svc.db.one("SELECT status FROM drafts WHERE plan_id=?", (pid,))["status"] == "sent_dry_run"
    c = _conv(svc, cid)
    items = json.loads(svc.db.one("SELECT installments FROM plans WHERE id=?", (pid,))["installments"])
    assert c["state"] == "awaiting_plan_reply"
    assert [i["due"] for i in json.loads(c["offered_plan"])] == [i["due"] for i in items]
    # עכשיו «מאשר» הוא באמת אישור של הצעה שהלקוח קיבל
    assert svc.inbound("sms", PHONE, "מאשר")["intent"] == "plan_accept"


def test_offer_sent_immediately_still_marks(svc):
    """בקרה: בלי עצירה ההצעה יוצאת מיד והשיחה מסומנת כמו קודם (מבקר 202)."""
    svc.sync()
    cid = svc.db.one("SELECT id FROM customers WHERE phone=?", (PHONE,))["id"]
    pid = svc.propose_plan(cid, 3)
    r = svc.approve_plan(pid)
    if r["queued"]:   # מחוץ לחלון בשעון הבדיקה — שולחים בחלון
        return
    assert _conv(svc, cid)["state"] == "awaiting_plan_reply"


def test_stale_withdraw_clears_conversation_offer(svc, clock):
    """גם הצעה שהשיחה כבר ידעה עליה (מסלול השיחה) — ביטול כישנה מחזיר את השיחה ל-idle."""
    cid, pid = _queued(svc)
    items = json.loads(svc.db.one("SELECT installments FROM plans WHERE id=?", (pid,))["installments"])
    svc._mark_plan_offered(cid, items)   # מדמה הצעה שנוסחה בשיחה עצמה
    clock.now += timedelta(days=7)
    svc.s = replace(svc.s, trial_start="")
    svc.dispatch()
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == "rejected"
    c = _conv(svc, cid)
    assert c["state"] == "idle" and c["offered_plan"] is None

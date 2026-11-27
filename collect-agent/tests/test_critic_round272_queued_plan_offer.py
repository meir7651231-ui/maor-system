"""מבקר סבב 272 (🟠 ×2, גבי מנוע): הצעת פריסה שאושרה אבל **לא יצאה** (בתור) — השיחה כבר «הציעה» אותה.

`service._approve_plan_claimed` קורא ל-`_mark_plan_offered` (מבקר 202) גם כשההצעה נשארה בתור (`queued`: שירות
עצור / מחוץ לחלון / עצירת שחזור) ⇒ השיחה עוברת ל-`awaiting_plan_reply` עם `offered_plan`, אף שללקוח לא נשלח דבר.
[מאומת]:
272א: בזמן שההצעה בתור הלקוח כותב «מאשר» (לכל דבר) ⇒ `plan_accept`: «✅ … אישר/ה את ההסדר שאישרת (3 תשלומים…
      החל מ-15.11). ההסדר בתוקף» — הסכמה לתנאים שהלקוח לא קיבל. ההצעה יוצאת רק אחרי זה.
272ב: ההצעה חיכתה >4 ימים ⇒ `inbox._withdraw_if_stale` דוחה את ההסדר (plans=rejected) ובעל העסק מקבל «הצעת הפריסה
      שאישרת לא נשלחה». השיחה נשארת `awaiting_plan_reply` ⇒ «מאשר» של הלקוח ⇒ כרטיס «אישר/ה את הצעת הפריסה…
      נדרש אישור סופי שלך» על הסדר שנדחה (ותאריך ראשון שכבר עבר), והתזכורת שתוכננה ללקוח **בוטלה**.
מצופה: השיחה מסמנת «הוצעה» רק כשההצעה יצאה בפועל (או ב-flush כשתצא); דחיית הצעה ישנה מנקה את offered_plan.
רכיב: app/service.py → _approve_plan_claimed / _mark_plan_offered · app/inbox.py → _withdraw_if_stale.
"""
from __future__ import annotations

from dataclasses import replace
from datetime import timedelta

import pytest

PHONE = "050-1234567"


def _stopped_plan_approved(svc):
    svc.sync()
    cid = svc.db.one("SELECT id FROM customers WHERE phone=?", (PHONE,))["id"]
    pid = svc.propose_plan(cid, 3)
    svc.s = replace(svc.s, trial_start=(svc.clock().date() - timedelta(days=30)).isoformat())
    r = svc.approve_plan(pid)
    assert r["queued"] is True and r["message_id"] is None
    return cid, pid


def _resume(svc):
    svc.s = replace(svc.s, trial_start="")
    assert svc.trial()["active"] is True


def test_queued_offer_goes_out_after_resume_control(svc):
    cid, pid = _stopped_plan_approved(svc)
    _resume(svc)
    svc.dispatch()
    assert svc.db.one("SELECT status FROM drafts WHERE plan_id=?", (pid,))["status"] == "sent_dry_run"


@pytest.mark.xfail(strict=True, reason="מבקר 272א🟠: «מאשר» לפני שההצעה יצאה ⇒ plan_accept על תנאים שלא נשלחו")
def test_reply_before_offer_sent_is_not_acceptance(svc):
    _stopped_plan_approved(svc)
    r = svc.inbound("sms", PHONE, "מאשר")
    assert r["intent"] != "plan_accept", r.get("owner_summary")


@pytest.mark.xfail(strict=True, reason="מבקר 272ב🟠: הצעה שנדחתה כישנה נשארת «הוצעה» בשיחה ⇒ «מאשר» מבטל תזכורת")
def test_withdrawn_offer_is_not_accepted_later(svc, clock):
    cid, pid = _stopped_plan_approved(svc)
    clock.now += timedelta(days=7)   # ראשון 15.11 10:00 — בחלון
    _resume(svc)
    svc.dispatch()
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == "rejected"
    clock.now += timedelta(days=1)
    svc.plan()
    r = svc.inbound("sms", PHONE, "מאשר")
    assert r["intent"] != "plan_accept", r.get("owner_summary")
    rem = svc.db.q("SELECT r.status FROM reminders r JOIN invoices i ON i.id=r.invoice_id WHERE i.customer_id=?",
                   (cid,))
    assert rem and all(x["status"] != "cancelled" for x in rem)

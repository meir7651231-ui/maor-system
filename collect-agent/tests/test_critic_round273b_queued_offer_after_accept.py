"""מבקר סבב 273ב (🟡, גבי מנוע): הצעת פריסה **מהשיחה** שאושרה ונשארה בתור — יוצאת גם אחרי שהלקוח כבר כתב «מאשר».

[מאומת] שירות עצור. הלקוח: «אפשר לשלם ב-3 תשלומים?» ⇒ גבי מנסח הצעה (plan_request, plans=proposed) ⇒ בעל העסק
מאשר ⇒ `approved` + `queued_reason: trial_expired`. השיחה כבר `awaiting_plan_reply` (מצב השיחה נקבע בקבלה, לא
בשליחה — אותה משפחה כמו 272א, שתוקן רק במסלול הדשבורד). הלקוח: «מאשר» ⇒ `plan_accept` («אישר/ה את הצעת
הפריסה… נדרש אישור סופי שלך»), השיחה `plan_pending_owner`. חידוש ⇒ dispatch ⇒ **ההצעה שבתור יוצאת**: «בשמחה. הצעה
לפריסת 1,200 ₪… השיבו מאשר» — אחרי שהלקוח כבר אישר, וכרטיס האישור הסופי עדיין פתוח. מצופה: אישור/דחייה של
הלקוח מוציאים מהתור את ההצעה הישנה (superseded), כמו שקורה כשהטיוטה עוד לא אושרה.
רכיב: app/inbox.py → handle_customer / _apply_effects (PLAN_ACCEPT לא סוגר טיוטת הצעה ב-`approved`).
"""
from __future__ import annotations

from dataclasses import replace
from datetime import timedelta

PHONE = "050-1234567"


def _accepted_while_queued(svc):
    svc.sync()
    svc.s = replace(svc.s, trial_start=(svc.clock().date() - timedelta(days=30)).isoformat())
    r = svc.inbound("sms", PHONE, "אפשר לשלם ב-3 תשלומים?")
    did = r["draft_id"]
    assert svc.inbox.approve_draft(did)["queued_reason"] == "trial_expired"
    assert svc.inbound("sms", PHONE, "מאשר")["intent"] == "plan_accept"
    svc.s = replace(svc.s, trial_start="")
    svc.dispatch()
    return did


def test_unapproved_offer_superseded_by_accept_control(svc):
    svc.sync()
    did = svc.inbound("sms", PHONE, "אפשר לשלם ב-3 תשלומים?")["draft_id"]
    svc.inbound("sms", PHONE, "מאשר")
    assert svc.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"] == "superseded"


def test_queued_offer_not_sent_after_customer_accepted(svc):
    did = _accepted_while_queued(svc)
    assert svc.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"] != "sent_dry_run"

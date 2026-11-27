"""מבקר סבב 283 (🟡, גבי מנוע): «אפשר לשלם ב-3 תשלומים?» נשאר «דורש טיפול שלך» אחרי שההסדר הוצע, אושר
ע״י הלקוחה ונכנס לתוקף.

✓ אימות 282 (מנהל 458): sent_to = הכתובת שבה נשלח הקישור — בדיקות הצוות ירוקות (ℹ️ לא אומת כאן מסלול /u/ בתשובה
   ללקוח: מייל «מתי צריך לשלם?» סווג unknown בלי טיוטה).
✓ נבדק בלי ממצא — מטבע זר: חוב בדולר בלבד ⇒ הצעה «$900 … 3 תשלומים של $300», אישור «$300 עד 15.11», plan_progress
   בדולר (אחרי תשלום חלקי $300 ⇒ done=1, next=$300 ב-15.12), בדשבורד ב-`other_currency` (לא נספר כשקלים). חוב מעורב
   ₪+$ ⇒ אין הצעה אוטומטית («נחזור אליכם אישית»). חשבונית חדשה (₪ או $) שמחוץ להסדר ⇒ כרטיס `plan_outside_invoice`.
🟡 283: ההודעה הנכנסת `plan_request` (needs_owner=1) לא יורדת לאורך כל המסלול — הצעה אושרה ונשלחה ⇒ «מאשר» ⇒ אישור
   ההסדר נשלח ⇒ ההסדר `approved` ⇒ עדיין needs_owner=1. ב-/ui: KPI «דורש טיפול שלך» = 1 מודגש + «יש 1 פריט שדורש
   טיפול שלך» לנצח (עד «טופל» ידני); `/dashboard` totals.owner_inbox=1. `_resolve_plan_cards` (237) מטפל רק ב-
   csv_contact_plan / plan_amount_changed / plan_missed.
מצופה: אישור הצעת הפריסה (או הסדר שנכנס לתוקף) מוריד את בקשת הפריסה מ«דורש טיפול».
רכיב: app/inbox.py → approve_draft (plan_request) · app/service.py → _resolve_plan_cards.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.ratelimit import RateLimiter
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc

PHONE = "050-1234567"


def _plan_in_force(svc, fake_gi):
    fake_gi.docs[:] = [gi_doc(1, amount="900.00")]
    svc.sync()
    svc.inbound("sms", PHONE, "אפשר לשלם ב-3 תשלומים?")
    svc.inbox.approve_draft(svc.db.one("SELECT id FROM drafts ORDER BY id DESC LIMIT 1")["id"])
    svc.inbound("sms", PHONE, "מאשר")
    acc = svc.db.one("SELECT id FROM drafts WHERE intent='plan_accept' ORDER BY id DESC LIMIT 1")["id"]
    svc.inbox.approve_draft(acc)
    svc.plan()
    assert svc.db.one("SELECT status FROM plans ORDER BY id DESC LIMIT 1")["status"] == "approved"
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})), headers=AUTH)


def test_request_card_open_before_offer_control(svc, fake_gi):
    fake_gi.docs[:] = [gi_doc(1, amount="900.00")]
    svc.sync()
    svc.inbound("sms", PHONE, "אפשר לשלם ב-3 תשלומים?")
    assert svc.db.one("SELECT needs_owner FROM messages WHERE intent='plan_request'")["needs_owner"] == 1


@pytest.mark.xfail(strict=True, reason="מבקר 283🟡: בקשת פריסה נשארת «דורש טיפול» אחרי שההסדר בתוקף")
def test_request_card_resolved_when_plan_in_force(svc, fake_gi):
    api = _plan_in_force(svc, fake_gi)
    assert api.get("/dashboard").json()["totals"]["owner_inbox"] == 0

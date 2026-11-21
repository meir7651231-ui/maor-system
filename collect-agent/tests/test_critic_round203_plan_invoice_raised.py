"""מבקר סבב 203 · 🟠 — סכום החשבונית עולה בזמן הסדר פעיל ⇒ תשלום בזמן נספר כ«לא התקבל» וההסדר «הוחמץ».

רכיבים: `app/service.py` → `plan_progress` / `_sweep_plans` («שולם» = סה״כ ההסדר − היתרה הפתוחה עכשיו) + `sync`
(שינוי סכום בחשבונית של הסדר `approved` לא מסומן — `plan_amount_changed` קיים רק לפני האישור, ב-`approve_plan`).
נבדק: הסדר 3×400 ₪ על 1,200 ₪ אושר ונשלח ⇒ החשבונית מתוקנת ל-1,500 ₪ (sync) — אין כרטיס, ההסדר נשאר approved ⇒
הלקוח משלם את תשלום 1 (400 ₪) בזמן (היתרה 1,100) ⇒ `plan_progress`: paid=100 ₪, done=0 ⇒ 20 יום אחרי:
status=`missed`, כרטיס לבעל העסק «תשלום 1 מתוך 3 (400 ₪, מועד 2026-11-15) **לא התקבל**» — לא נכון — והתזכורות חוזרות
ללקוח שעמד בהסדר. הצעה: שינוי סכום בחשבונית של הסדר פעיל ⇒ כרטיס לבעל העסק (כמו `plan_amount_changed` לפני האישור),
ו«שולם» נמדד מול הסכום שהיה כשההסדר אושר. xfail(strict=True); בקרה ירוקה."""
from datetime import timedelta

import pytest


def _plan_then_raise_and_pay(svc, fake_gi):
    svc.sync()
    pid = svc.propose_plan(1, 3)
    svc.approve_plan(pid, confirm_amount=True)
    fake_gi.docs[0]["amount"] = "1500.00"     # תיקון החשבונית כלפי מעלה, בזמן שההסדר פעיל
    svc.sync()
    fake_gi.docs[0]["amount"] = "1100.00"     # הלקוח שילם את תשלום 1 (400 ₪) בזמן
    svc.sync()
    return pid


@pytest.mark.xfail(strict=True, reason="203🟠: תשלום 1 בזמן ⇒ «לא התקבל» + missed, כי החשבונית עלתה בזמן ההסדר")
def test_on_time_installment_not_reported_missed(svc, clock, fake_gi):
    pid = _plan_then_raise_and_pay(svc, fake_gi)
    clock.now += timedelta(days=20)
    svc.plan()
    status = svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"]
    flagged = svc.db.one("SELECT 1 FROM audit WHERE action LIKE 'plan_amount_changed%' "
                         "AND json_extract(detail,'$.plan')=?", (pid,))
    false_card = svc.db.one("SELECT 1 FROM messages WHERE needs_owner=1 AND body LIKE '%תשלום 1 מתוך 3%לא התקבל%'")
    assert (status != "missed" or flagged) and not false_card, status


def test_control_unchanged_invoice_on_time_payment(svc, clock, fake_gi):
    svc.sync()
    pid = svc.propose_plan(1, 3)
    svc.approve_plan(pid, confirm_amount=True)
    fake_gi.docs[0]["amount"] = "800.00"
    svc.sync()
    clock.now += timedelta(days=20)
    svc.plan()
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == "approved"


@pytest.mark.xfail(strict=True, reason="203ב🟡: תשלום חלקי (200 מתוך 400) ⇒ הכרטיס אומר «לא התקבל» בלי להזכיר את ה-200")
def test_partial_first_installment_card_mentions_partial(svc, clock, fake_gi):
    """203ב: הלקוח שילם 200 ₪ מתוך תשלום 1 (400 ₪). אחרי החסד — «missed» (סביר), אבל הכרטיס: «תשלום 1 מתוך 3 (400 ₪)
    לא התקבל» — בעל העסק שמתקשר ללקוח לא יודע שהגיעו 200 ₪. `_sweep_plans` → נוסח הכרטיס."""
    svc.sync()
    pid = svc.propose_plan(1, 3)
    svc.approve_plan(pid, confirm_amount=True)
    fake_gi.docs[0]["amount"] = "1000.00"
    svc.sync()
    clock.now += timedelta(days=20)
    svc.plan()
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == "missed"
    card = svc.db.one("SELECT body FROM messages WHERE needs_owner=1 AND body LIKE '%הסדר%'")["body"]
    assert "200" in card, card

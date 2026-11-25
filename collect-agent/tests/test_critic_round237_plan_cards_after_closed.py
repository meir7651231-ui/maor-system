"""מבקר סבב 237 · 🟡 — כרטיסי הסדר («פרטי הקשר השתנו — עדכנו וחדשו», «הסכום עלה בזמן ההסדר») נשארים ב«דורש טיפול»
אחרי שהקובץ סימן את החשבונית «שולם» וההסדר הושלם.

רכיבים: `app/service.py` → `_resolve_csv_cards` (מבקר 227 — מוריד רק `csv_reopened`/`csv_balance_rose`) מול
`_csv_contact_card` (`csv_contact_plan:{external_id}`, «הלקוח הושהה … עדכנו את הטלפון/המייל בכרטיס הלקוח וחדשו»)
ו-`_note_plan_raises` (`plan_amount_changed`, «הסכום של 9001 עלה מ-1,200 ל-1,500 בזמן שהסדר…»); `plan_progress`
מסמן completed. תרחיש: 9001 דנה 1,200 בהסדר 3×400 («מאשר»); יום 2 קובץ: 9001 על מיכל לוי/050-0000999 ⇒ כרטיס
csv_contact_plan; יום 3: 1,500 ⇒ כרטיס plan_amount_changed; יום 4: «שולם» ⇒ ההסדר completed — ושני הכרטיסים עדיין
ב«דורש טיפול» (בעל העסק מתבקש לעדכן טלפון ולחדש לקוח על חשבונית ששולמה). ✓ נבדק: 236 (מנהל 400) — קובץ שהועלה
ביום המועד עצמו נחשב ישן (`last_import` = תאריך, `<=`) ⇒ לא «הוחמץ». ℹ️ כרטיס shared_contact (פיצול 7001/7002)
נשאר גם אחרי ששתיהן שולמו — עדיין רלוונטי לחשבוניות עתידיות, לא ממצא.
הצעה: להרחיב את `_resolve_csv_cards` לכרטיסי ההסדר — החשבונית נסגרה/ההסדר הושלם אחרי הכרטיס ⇒ יורד (audit בלי PII).
xfail(strict=True)."""
from dataclasses import replace
from datetime import timedelta

import pytest

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
DANA = "050-1234567"


def _row(name, phone, amt, status="פתוח"):
    return (H + f"9001,{name},{phone},,{amt},{status},01/10/26,15/10/26\n").encode()


def _open_cards(svc):
    return {m["intent"] for m in svc.db.q("SELECT intent FROM messages WHERE needs_owner=1")}


@pytest.mark.xfail(strict=True, reason="237🟡: כרטיסי csv_contact_plan/plan_amount_changed נשארים אחרי «שולם»")
def test_plan_cards_resolve_when_invoice_paid(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv(_row("דנה כהן", DANA, 1200))
    clock.now += timedelta(days=1)
    rids = svc.plan()
    svc.approve(rids[0], confirm_open=True)
    svc.dispatch()
    r = svc.inbound("sms", DANA, "אפשר בשלושה תשלומים?")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    r = svc.inbound("sms", DANA, "מאשר")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", "050-0000999", 1200))
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", "050-0000999", 1500))
    assert {"csv_contact_plan", "plan_amount_changed"} <= _open_cards(svc)
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", "050-0000999", 1500, "שולם"))
    svc.plan()
    assert svc.db.one("SELECT status FROM plans")["status"] == "completed"
    left = _open_cards(svc) & {"csv_contact_plan", "plan_amount_changed"}
    assert not left, left

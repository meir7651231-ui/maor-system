"""מבקר סבב 241 · 🟡 — בעל העסק ביטל הסרה שעברה בירושה (מנהל 405), וקובץ שמעביר חשבונית נוספת מאותו לקוח קודם מחזיר
את ההסרה בשקט — בלי כרטיס חדש.

רכיבים: `app/service.py` → `_csv_contact_moved` (`opted_out=MAX(opted_out, <של הקודם>)` בכל מעבר חשבונית) ·
`lift_inherited_optout` (audit `inherited_optout_lifted`) · `_inherited_optout_card` (מפתח `inherited_optout:{cid}` —
כרטיס אחד ללקוח לתמיד, גם אחרי שירד).
תרחיש: דנה (050-1234567) עם 9001+9002 ⇒ «הסר אותי». קובץ: 9001 על מיכל לוי/050-0000999 ⇒ ירושה; מיכל כותבת ⇒ כרטיס;
בעל העסק «זה אדם אחר» ⇒ `lift_inherited_optout` ⇒ opted_out=0. קובץ למחרת: 9001+9002 על מיכל ⇒ 9002 עוברת מדנה ⇒
opted_out=1 שוב. מיכל כותבת «מתי צריך לשלם?» ⇒ `_inherited_optout` אמת ⇒ `_inherited_optout_card` חוזר בלי כלום
(המפתח קיים) ⇒ אין כרטיס, אין תזכורות (plan ריק). ההכרעה המפורשת של בעל העסק נדרסה בלי שיידע.
✓ 240א/ב (מנהל 405, בדיקות הצוות עוברות; קצוות נקראו בקוד) — ביטול = בעלים בלבד (403 + audit לעובד/ת);
ייצוא דנה מקבל את התזכורת שנשלחה אליה, של
מיכל לא; מעבר כפול דנה⇒מיכל⇒דנה — הבעלות לפי `upto_reminder` לכל מעבר.
הצעה: אחרי `inherited_optout_lifted` — אותו לקוח קודם לא מוריש שוב את ההסרה (או: מעבר נוסף ⇒ כרטיס חדש עם מפתח
שכולל את המעבר). xfail(strict=True)."""
from dataclasses import replace
from datetime import timedelta

import pytest

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
DANA, MICHAL = "050-1234567", "050-0000999"


def _r(num, name, phone):
    return f"{num},{name},{phone},,1200,פתוח,01/10/26,15/10/26\n"


@pytest.mark.xfail(strict=True, reason="241🟡: הסרה שבוטלה ע״י בעל העסק חוזרת בשקט במעבר חשבונית נוספת")
def test_lifted_inherited_optout_not_silently_reapplied(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + _r(9001, "דנה כהן", DANA) + _r(9002, "דנה כהן", DANA)).encode())
    clock.now += timedelta(days=1)
    for rid in svc.plan():
        svc.approve(rid, confirm_open=True)
    svc.dispatch()
    svc.inbound("sms", DANA, "הסר אותי")
    clock.now += timedelta(days=1)
    svc.import_csv((H + _r(9001, "מיכל לוי", MICHAL)).encode())
    m = svc.db.one("SELECT id FROM customers WHERE phone=?", (MICHAL,))["id"]
    svc.inbound("sms", MICHAL, "איך אפשר לשלם?")
    svc.lift_inherited_optout(m)
    clock.now += timedelta(days=1)
    svc.import_csv((H + _r(9001, "מיכל לוי", MICHAL) + _r(9002, "מיכל לוי", MICHAL)).encode())
    svc.inbound("sms", MICHAL, "מתי צריך לשלם?")
    opted = svc.db.one("SELECT opted_out FROM customers WHERE id=?", (m,))["opted_out"]
    card = svc.db.one("SELECT 1 FROM messages WHERE intent='inherited_optout' AND needs_owner=1")
    assert opted == 0 or card, (opted, bool(card))

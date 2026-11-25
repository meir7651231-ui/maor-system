"""מבקר סבב 240 · 🟡×2 — אחרי מעבר חשבונית בקובץ (219א): (א) כרטיס «ההסרה עברה בירושה» מבקש הכרעה שאין דרך לבצע;
(ב) ייצוא זכות-עיון של הלקוחה החדשה כולל את התזכורת שנשלחה ללקוחה הקודמת.

רכיבים: (א) `app/service.py` → `_inherited_optout_card` (מנהל 404: «אם זה אדם אחר שלא ביקש הסרה — עדכנו בכרטיס
הלקוח») — אבל אין שום מסלול שמבטל `opted_out` (אין `SET opted_out=0` בקוד; `resume_customer` ⇒ «הלקוח לא מושהה»;
«טופל» רק מוריד את הכרטיס) ⇒ מיכל, שלא ביקשה, נשארת מוסרת לתמיד, בלי תזכורות. (ב) `customer_data_export`
(reminders לפי `invoice_id` של החשבוניות הנוכחיות של הלקוח) ⇒ ייצוא של מיכל מכיל «סטודיו מאיר: שלום דנה, חשבונית
9001 ע"ס 1,200 ₪…» שנשלחה לטלפון של דנה לפני המעבר — מידע על צד שלישי (שם + שפנו אליה), בניגוד לעיקרון של
critic 164 בייצוא; בייצוא של דנה עצמה רשימת reminders ריקה.
✓ נבדק: 239 (מנהל 404) — «איך משלמים?» לא נרשם כהסרה; «הסר אותי» אמיתי של מיכל אחרי הירושה ⇒ נרשם (suppression).
הצעה: (א) פעולה «זה אדם אחר — בטל את ההסרה שעברה» (בעלים, audit) מהכרטיס, או ניסוח שלא מבטיח הכרעה; (ב) בייצוא —
תזכורת שנשלחה לכתובת שאינה של הלקוח (to/payload) או לפני `csv_contact_changed` אליו ⇒ שייכת לייצוא של הלקוח הקודם.
xfail(strict=True)."""
from datetime import timedelta

import pytest

from tests.test_critic_round239_inherited_optout import DANA, MICHAL, _row, _sent_to_dana


def _michal(svc):
    return svc.db.one("SELECT id FROM customers WHERE phone=?", (MICHAL,))["id"]


def test_real_optout_after_inheritance_is_recorded(svc, clock):
    """שומר: «הסר אותי» אמיתי מהלקוחה החדשה אחרי הירושה ⇒ נרשם (suppression)."""
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "הסר אותי")
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    svc.inbound("sms", MICHAL, "הסר אותי")
    assert svc.suppressed("sms", MICHAL)


@pytest.mark.xfail(strict=True, reason="240א🟡: כרטיס inherited_optout מבקש הכרעה — אין מסלול לבטל את ההסרה שעברה")
def test_inherited_optout_can_be_lifted_by_owner(svc, clock):
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "הסר אותי")
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    svc.inbound("sms", MICHAL, "איך אפשר לשלם?")
    m = _michal(svc)
    lift = getattr(svc, "lift_inherited_optout", None)
    if lift is None:
        try:
            svc.resume_customer(m)
        except ValueError:
            pass
    else:
        lift(m)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (m,))["opted_out"] == 0


@pytest.mark.xfail(strict=True, reason="240ב🟡: ייצוא העיון של מיכל כולל את התזכורת «שלום דנה» שנשלחה לפני המעבר")
def test_export_of_new_customer_excludes_previous_contact_reminders(svc, clock):
    _sent_to_dana(svc, clock)
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    bodies = [r["body"] for r in svc.customer_data_export(_michal(svc))["reminders"]]
    assert not any("דנה" in b for b in bodies), bodies

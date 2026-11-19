"""critic סבב 165 · 🟠 לתיקון בונה — רכיב: `app/service.py` → `customer_data_export` (תיקון 164, `ba5dcf70`).

הסינון של צד שלישי בייצוא העיון נשען על `messages.intent == 'wrong_person'` / `drafts.intent='wrong_person'` —
כלומר על הכוונה **הראשית** בלבד. כשהזר כותב «מספר שגוי» יחד עם בקשת הסרה או גיל, הכוונה הראשית היא
opt_out / minor (ו-WRONG_PERSON משני — `_apply_effects` עדיין מוחק את הטלפון ושומר אותו ב-`blocked_phone`),
ולכן ההודעה **בתוכנה המלא** נמסרת ללקוחה: «זה לא המספר של דנה, תפסיקו לשלוח לי», «wrong number, stop texting me»,
«אני לא דנה, אל תשלחו לי יותר», ואף «טעות במספר. אני בן 13» — הצהרת גיל של קטין זר. [מאומת בהרצה]
הצעה: לסמן את ההודעה כצד-שלישי לפי **כל** הכוונות (`d.all_intents`), למשל לשמור WRONG_PERSON ב-tags/payload או
להחליף את intent ל-wrong_person כשהיא קיימת, ולסנן לפי זה. הבדיקות xfail(strict=True)."""
import pytest

MIXED = ["זה לא המספר של דנה, תפסיקו לשלוח לי", "wrong number, stop texting me",
         "אני לא דנה, אל תשלחו לי יותר", "טעות במספר. אני בן 13"]


@pytest.mark.xfail(strict=True, reason="critic 165: wrong_person משני ⇒ תוכן הזר בייצוא העיון (לתיקון בונה)")
@pytest.mark.parametrize("msg", MIXED)
def test_wrong_person_secondary_not_exported(svc, msg):
    svc.sync()
    svc.inbound("sms", "0501234567", msg)
    assert svc.db.one("SELECT phone FROM customers WHERE id=1")["phone"] is None   # המערכת זיהתה «מספר שגוי»
    assert msg not in str(svc.customer_data_export(1))


def test_control_plain_wrong_number_hidden(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", "טעות במספר, אני לא מכיר את דנה")
    assert "טעות במספר, אני לא מכיר" not in str(svc.customer_data_export(1))

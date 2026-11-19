"""critic סבב 164 · 🟠 לתיקון בונה — רכיב: `app/service.py` → `CollectService.customer_data_export`
(`efa11277`, מנהל 309, זכות עיון — GET /customers/{cid}/data).

הייצוא שנמסר ללקוחה (דנה) כולל מידע על **אדם שלישי**: מי שקיבל SMS במספר שגוי וענה «טעות במספר, אני לא מכיר את דנה»:
  • `customer.blocked_phone` = '050-1234567' — הטלפון של הזר (כך גבי חוסמת אותו), לא של דנה;
  • `messages`: ההודעה שהזר כתב (intent=wrong_person);
  • `drafts`: «סליחה על ההטרדה!…» — טיוטת התשובה לזר.
בקשת עיון לפי סעיף 13 נותנת לאדם את המידע **עליו**; מסירת מספר הטלפון וההודעה של מי שאינו הלקוח = חשיפת PII של
צד שלישי (הקובץ נוסף כ-«⬇ ייצוא מידע (בקשת עיון)» ב-`a9f0c520` — מיועד למסירה ללקוח). [מאומת בהרצה]
הצעה: להחריג `blocked_phone`/`blocked_email` ואת ההודעות/הטיוטות של intent `wrong_person` (או להחליף בשורה
«התקבלה הודעה ממספר שאינו שלך; פרטיו לא נמסרים»). הבדיקות xfail(strict=True); הבקרה חייבת להישאר ירוקה."""
import pytest

WRONG = "טעות במספר, אני לא מכיר את דנה"


@pytest.fixture
def exported(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", WRONG)
    return svc.customer_data_export(1)


@pytest.mark.xfail(strict=True, reason="critic 164: ייצוא עיון חושף טלפון של צד שלישי (לתיקון בונה)")
def test_export_has_no_third_party_phone(exported):
    assert "1234567" not in str(exported["customer"])


@pytest.mark.xfail(strict=True, reason="critic 164: ייצוא עיון חושף הודעה/טיוטה של צד שלישי (לתיקון בונה)")
def test_export_has_no_wrong_person_messages(exported):
    assert WRONG not in str(exported["messages"])
    assert not [d for d in exported["drafts"] if d["intent"] == "wrong_person"]


def test_control_export_keeps_customers_own_data(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", "אשלם ב-1.12")
    e = svc.customer_data_export(1)
    assert e["customer"]["name"] == "דנה כהן" and e["customer"]["email"] == "c1@example.com"
    assert "אשלם ב-1.12" in str(e["messages"]) and e["invoices"]

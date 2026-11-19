"""critic סבב 172 · 🟠 לתיקון בונה — רכיב: `app/dsr.py` → `detect` (`_DELETE`; ב-`dc10bdfc` והורחב ב-`c8b48c2b`).

הזיהוי לא מכיר שלילה: לקוח שכותב **שלא** למחוק נרשם במרשם כבקשת **מחיקה** + התראה לבעל העסק «התקבלה בקשת מחיקת
מידע… יש להשיב עד <30 יום>» — בדיוק ההפך ממה שביקש:
  «אל תמחקו את המידע שלי, אני עוד לקוח» · «לא ביקשתי למחוק את הפרטים שלי» · «אני לא רוצה שתמחקו את הנתונים» ·
  «I don't want you to delete my information» · «please don't delete my details, I'll pay friday».
[מאומת: `dsr.detect` ⇒ ['deletion'] לכל החמישה, וב-inbound נפתחת בקשה.] בעל עסק שעוקב אחרי המרשם עלול למחוק מידע של
לקוח פעיל בניגוד לרצונו המפורש. הצעה: שלילה לפני הפועל (אל/לא/אף פעם לא/don't/do not/never/didn't ask) ⇒ אין
בקשה. הבדיקות xfail(strict=True); הבקרות (בקשות אמיתיות) נשארות ירוקות."""
import pytest

from app import dsr

NEGATED = ["אל תמחקו את המידע שלי, אני עוד לקוח", "לא ביקשתי למחוק את הפרטים שלי",
           "אני לא רוצה שתמחקו את הנתונים", "I don't want you to delete my information",
           "please don't delete my details, I'll pay friday"]


@pytest.mark.xfail(strict=True, reason="critic 172: «אל תמחקו» נרשם כבקשת מחיקה (לתיקון בונה)")
@pytest.mark.parametrize("text", NEGATED)
def test_negated_deletion_not_registered(svc, text):
    svc.sync()
    svc.inbound("sms", "0501234567", text)
    assert [r["kind"] for r in dsr.listing(svc)] == []


@pytest.mark.parametrize("text", ["מחקו את המידע שלי", "תמחקו את כל הפרטים שלי מהמאגר",
                                  "please delete my information", "אני מבקש למחוק את כל המידע עליי"])
def test_control_real_deletion_registered(svc, text):
    svc.sync()
    svc.inbound("sms", "0501234567", text)
    assert [r["kind"] for r in dsr.listing(svc)] == ["deletion"]

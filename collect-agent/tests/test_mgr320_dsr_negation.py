"""מנהל 320 · תיקון critic 172: שלילה צמודה לפועל המחיקה ⇒ אין בקשת מחיקה במרשם (ואין התראת «יש להשיב עד»).

השלילה נבדקת רק בתוך אותו משפט (פסיק/נקודה/סימן שאלה חותכים), ורק כשבינה לבין הפועל יש מילות-מילוי
(רוצה/ביקשתי/צריך/want/you/to…). «אל תשכחו למחוק», «don't forget to delete» — בקשה אמיתית.
"""
import pytest

from app import dsr

NEGATED = [
    "אל תמחקו את המידע שלי, אני עוד לקוח",
    "ואל תמחקו את הפרטים",
    "לא ביקשתי למחוק את הפרטים שלי",
    "אני לא רוצה שתמחקו את הנתונים",
    "אני ממש לא רוצה שתמחקו את המידע",
    "אין צורך למחוק את המידע",
    "I don't want you to delete my information",
    "please don't delete my details, I'll pay friday",
    "please do not delete my data",
    "Don’t delete my info",
    "I never asked you to delete my data",
]

REAL = [
    "מחקו את המידע שלי",
    "תמחקו את כל הפרטים שלי מהמאגר",
    "please delete my information",
    "אני מבקש למחוק את כל המידע עליי",
    "אל תשכחו למחוק את המידע שלי",
    "don't forget to delete my data",
    "לא, תמחקו את המידע שלי",
    "לא שילמתי. מחקו את המידע שלי",
    "אני לא לקוח שלכם תמחקו את הפרטים שלי",
    "למה לא? אני מבקש למחוק את המידע",
    # מופע שלול ומופע אמיתי באותה הודעה ⇒ בקשה
    "אל תמחקו את המידע בינתיים. בעצם, מחקו את המידע שלי",
    "why not delete my data already",
    "לא רוצה יותר, תמחקו את המידע",
    # «אל»/«לא» בסוף מילה אחרת (ישראל, מלא) אינם שלילה
    "שלום מישראל תמחקו את המידע שלי",
]


@pytest.mark.parametrize("text", NEGATED)
def test_negated_deletion_not_detected(text):
    assert "deletion" not in dsr.detect(text)


@pytest.mark.parametrize("text", REAL)
def test_real_deletion_still_detected(text):
    assert "deletion" in dsr.detect(text)


def test_negation_does_not_touch_access_or_correction():
    # השלילה חלה רק על מחיקה — «למה לא נתתם לי לעיין במידע» עדיין בקשת עיון
    assert dsr.detect("למה לא נתתם לי לעיין במידע שלי") == ["access"]
    assert dsr.detect("לא, אני רוצה לתקן את הפרטים") == ["correction"]


def test_negated_inbound_no_alert(svc):
    svc.sync()
    before = svc.db.conn.execute("SELECT COUNT(*) FROM dsr").fetchone()[0]
    svc.inbound("sms", "0501234567", "אל תמחקו את המידע שלי, אני עוד לקוח")
    assert svc.db.conn.execute("SELECT COUNT(*) FROM dsr").fetchone()[0] == before

"""critic סבב 113 · 🟡 מחלוקת/עו״ד/מספר שגוי/טענת תשלום ברוסית או בערבית ⇒ «שפה זרה» רגיל: מושהה (בטוח), אבל
בעל העסק שלא קורא את השפה לא יודע שזה עו״ד או מחלוקת, ומייל הדחוף לא נשלח. תיקון: רמז בעברית בכרטיס
(«ייתכן: …»), ועו״ד/מחלוקת ⇒ דחוף. הכוונה עצמה לא משתנה (בעל העסק מאשר אחרי תרגום) — בלי הסרה אוטומטית."""
import pytest

from app.conversation import Escalation, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text, hint, urgent", [
    ("Мой адвокат с вами свяжется", "עו״ד", True), ("سأتوجه إلى المحامي", "עו״ד", True),
    ("Я ничего не должен, это ошибка", "מחלוקת", True), ("لم أطلب شيئا، هذا خطأ", "מחלוקת", True),
    ("Это не мой номер, вы ошиблись", "מספר שגוי", False), ("هذا ليس رقمي، أخطأتم", "מספר שגוי", False),
    ("Я уже заплатил", "ששילם", False), ("دفعت بالفعل", "ששילם", False)])
def test_foreign_hint(text, hint, urgent):
    d = _d(text)
    assert hint in d.owner_summary, d.owner_summary
    assert (d.escalate == Escalation.URGENT) == urgent, d.escalate
    assert d.stop == Stop.PAUSE and d.reply is None

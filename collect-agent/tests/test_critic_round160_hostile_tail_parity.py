"""critic סבב 160 · 🟡 לתיקון בונה — רכיב: `app/conversation.py` → `_PROMISE_HOSTILE_TAIL` (`7ecd29f2`)
ו-`_HE_SALARY_HOSTILE` / `_salary_cond_hostile_tail` (`9891397c`).

התיקון ל-159 עובד על הדוגמאות שלו, אבל אין שוויון עברית⇄אנגלית ואין אותיות-שימוש:
  • «switching to another studio» ⇒ כרטיס ✓, אבל «ואז אני עובר לסטודיו אחר» / «עוברים למתחרים» ⇒ הבטחה שקטה.
  • «and cancel the lessons» ⇒ כרטיס ✓, אבל «ואבטל את החוג» ⇒ שקט
    (אין עתיד גוף ראשון + ו׳ החיבור חוסמת את `(?<![\\w])`).
  • «ותשכחו ממני» אחרי «כשתיכנס המשכורת» ⇒ שקט (אותו ו׳ לפני «תשכחו»).
  • «זו הפעם האחרונה» ⇒ כרטיס ✓, אבל «last time though» ⇒ שקט.
  • ביטול בניסוח «מוציא את הילד מהחוג» / «pulling my kid out of the class» ⇒ שקט בשתי השפות.
הצעה: אותיות-שימוש (ו/ש/כש) לפני הסמנים, «עובר/ת/ים ל(סטודיו|מתחרים|מקום אחר)», «אבטל/נבטל», «מוציא/ה את
(הילד|הילדה|הבן|הבת) מ(ה)?חוג», «pull(ing)? (my|our) (kid|son|daughter) out», «last time» בלי «i».
הבדיקות xfail(strict=True); בדיקות הבקרה חייבות להישאר ירוקות."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx

MISSED = ["אשלם ביום שישי, ואז אני עובר לסטודיו אחר",
          "אשלם מחר ואז אנחנו עוברים למתחרים",
          "אשלם ביום שישי ואבטל את החוג",
          "כשתיכנס המשכורת אשלם, ותשכחו ממני",
          "I'll pay on the 10th, last time though",
          "I'll pay tomorrow, then I'm pulling my kid out of the class",
          "אשלם מחר, אחרי זה אני מוציא את הילד מהחוג"]


def _card(text):
    d = respond(text, build_ctx({"channel": "sms"}))
    return d.intent != Intent.PROMISE or d.escalate != Escalation.NONE


@pytest.mark.xfail(strict=True, reason="critic 160: המשך ביטול/עוין בלי שוויון עברית-אנגלית ⇒ הבטחה שקטה (לתיקון בונה)")
@pytest.mark.parametrize("text", MISSED)
def test_hostile_tail_parity_reaches_owner(text):
    assert _card(text), text


@pytest.mark.parametrize("text", ["Ill pay friday, switching to another studio after",
                                  "אשלם בעשירי אבל זו הפעם האחרונה",
                                  "I'll pay on Friday and cancel the lessons"])
def test_control_caught_today(text):
    assert _card(text)


@pytest.mark.parametrize("text", ["אשלם מחר אל תדאגו", "I'll pay tomorrow, nothing to worry about",
                                  "אשלם מחר, תודה רבה"])
def test_control_plain_promise_stays_silent(text):
    d = respond(text, build_ctx({"channel": "sms"}))
    assert d.intent == Intent.PROMISE and d.escalate == Escalation.NONE

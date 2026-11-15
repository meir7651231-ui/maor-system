"""critic סבב 79 · רגרסיות של סבב 4 של המנוע (027acca7). שלושת חוקי ה-discard החדשים הורידו כוונה מגינה
בביטחון גם כשההודעה מכילה סימן מפורש שמחייב אותה:
1. «הלינק לא עובד» + «אני לא חייב» ⇒ היה מחלוקת דחופה, נהיה how_to_pay בלי הסלמה (המחלוקת נבלעה).
2. «אשלם רק דרך עורך הדין שלי, תפנו אליו» ⇒ היה legal דחוף, נהיה promise (פנייה ישירה למיוצג).
3. «עורך הדין שלי אמר שכדאי לשלם, תדברו איתו» ⇒ היה legal, נהיה unknown.
4. «טעיתם, זה לא אני. אשלם רק אם תוכיחו» ⇒ היה wrong_person, נהיה promise בלי הסלמה (התניה = לא הכרה בחוב).
5. (קיים מקודם) «please don't remove me from the list, I will pay» ⇒ opt_out לצמיתות (שלילה באנגלית)."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text, intent", [
    ("הלינק לא עובד וגם אני לא חייב לכם כלום", Intent.DISPUTE),
    ("הקישור לא נפתח, ובכלל החוב הזה לא שלי", Intent.DISPUTE),
    ("אשלם רק דרך עורך הדין שלי, תפנו אליו", Intent.LEGAL),
    ("עורך הדין שלי אמר שכדאי לשלם, תדברו איתו", Intent.LEGAL),
    ("עורך הדין שלי אמר שכדאי לשלם, אבל רק אחרי שהוא יבדוק את החשבונית", Intent.LEGAL),
])
def test_protective_intent_not_swallowed(text, intent):
    d = _d(text)
    assert d.intent == intent and d.escalate == Escalation.URGENT, (d.intent, d.escalate)


def test_conditional_pay_is_not_admission():
    d = _d("טעיתם, זה לא אני. אשלם רק אם תוכיחו")
    assert d.intent != Intent.PROMISE and d.escalate != Escalation.NONE, (d.intent, d.escalate)


def test_round4_fixes_still_hold():
    """מה שסבב 4 תיקן נשאר מתוקן."""
    assert _d("הלינק לא עובד, איך עוד אפשר לשלם?").intent == Intent.HOW_TO_PAY
    assert _d("זה לא אני שהזמנתי, זה אחי, אבל אשלם בשבוע הבא").intent != Intent.WRONG_PERSON
    assert _d("עורך הדין שלי אמר שכדאי לשלם, איך משלמים?").intent != Intent.LEGAL


@pytest.mark.parametrize("text", [
    "please don't remove me from the list, I will pay next week",
    "no need to remove my number, I will pay",
])
def test_english_negated_remove_is_not_opt_out(text):
    assert _d(text).intent != Intent.OPT_OUT


@pytest.mark.parametrize("text", ["remove me from your list", "please remove my number from the list",
                                  "don't text me again, remove my number"])
def test_english_remove_still_opts_out(text):
    assert _d(text).intent == Intent.OPT_OUT

"""מנהל הפעלה 248 · פספוסי AI שנותרו מ-qa6 ומ-qa2/qa3 — תיקון **לפי מחלקה**, בניסוחים שונים מהסטים בכוונה.

1. חשש מהונאה («אמיתי או ספאם?», «מפחד לפתוח את הקישור») נפל ל«לא ברור». עכשיו: who_is_this, **בלי קישור תשלום**,
   תג phishing_concern וכרטיס לבעל העסק («לפנות מהמספר הרגיל»). חשש גובר על «איך משלמים» באותה הודעה.
2. «רק צריך עוד שבוע» (בלי המילה «זמן») ⇒ הבטחה/בקשת דחייה, לא «לא ברור».
3. פריסה באנגלית: «split it into monthly payments», «pay it in parts».
4. בקשת פירוט: «אפשר פירוט?», «לא הבנתי את הסכום», «breakdown» ⇒ copy_request.
5. «רק עכשיו ראיתי. איך משלמים?» — «משלמים» בתוך שאלת «איך» + «עכשיו» נרשם כהבטחה. עכשיו: how_to_pay + קישור.
מלכודות: «זה לא ספאם, אשלם מחר», «I already made the monthly payments», «הבנתי את הסכום, תודה», «אני משלם עכשיו».
"""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t, ch="sms"):
    return respond(t, build_ctx({"channel": ch}))


CH = pytest.mark.parametrize("ch", ["sms", "email"])

PHISH = [
    "רגע, ההודעה הזאת אמיתית או הונאה?",
    "זה ספאם?",
    "נראה לי שהקישור הזה עוקץ",
    "אני חוששת ללחוץ על הלינק",
    "לא סומך על זה, מפחד להיכנס לקישור",
    "is this a scam?",
    "looks like phishing to me",
    "ההודעה אמיתית או פישינג? איך משלמים?",
]


@CH
@pytest.mark.parametrize("text", PHISH)
def test_phishing_concern_identifies_without_link(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.WHO_IS_THIS
    assert "phishing_concern" in d.tags
    assert d.escalate == Escalation.NORMAL
    assert d.reply and "http" not in d.reply and "קישור המאובטח" not in d.reply


MORE_TIME = [
    "אני צריכה עוד שבועיים",
    "לא מתווכחת, רק צריכים עוד כמה ימים",
    "נצטרך עוד חודש, תודה על ההבנה",
]


@CH
@pytest.mark.parametrize("text", MORE_TIME)
def test_need_more_time_is_promise(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.PROMISE
    assert d.stop == Stop.PAUSE


PLAN_EN = [
    "could we split the balance into three monthly payments?",
    "can I pay it in parts?",
    "is it ok to pay over 4 months",
    "I'd prefer monthly payments if possible",
]


@CH
@pytest.mark.parametrize("text", PLAN_EN)
def test_english_plan_request(text, ch):
    assert _d(text, ch).intent == Intent.PLAN_REQUEST


BREAKDOWN = [
    "אשמח לפירוט בבקשה",
    "לא הבנתי את החיוב.",
    "אפשר לקבל את הפירוט?",
    "can you send a breakdown?",
    "I need an itemized bill",
]


@CH
@pytest.mark.parametrize("text", BREAKDOWN)
def test_breakdown_is_copy_request(text, ch):
    assert _d(text, ch).intent == Intent.COPY_REQUEST


@CH
@pytest.mark.parametrize("text", ["חזרתי מחופשה, רק עכשיו ראיתי. לאן מעבירים?",
                                  "ראיתי עכשיו את ההודעה, איך אני משלמת?"])
def test_how_question_with_now_is_not_promise(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.HOW_TO_PAY
    assert d.reply and "http" in d.reply


# ═══ מלכודות ═══
def test_trap_not_spam_with_promise():
    d = _d("זה לא ספאם, הבנתי. אשלם מחר")
    assert d.intent == Intent.PROMISE and "phishing_concern" not in d.tags


def test_trap_already_made_monthly_payments_not_plan():
    assert _d("I already made the monthly payments").intent != Intent.PLAN_REQUEST


def test_trap_understood_amount_not_copy():
    assert _d("הבנתי את הסכום, תודה").intent != Intent.COPY_REQUEST


def test_trap_paying_now_still_promise():
    assert _d("אני משלם עכשיו").intent == Intent.PROMISE


def test_trap_dispute_with_not_understanding_stays_dispute():
    """«לא הבנתי את החיוב, לא הזמנתי כלום» — מחלוקת גוברת על בקשת פירוט."""
    assert _d("לא הבנתי את החיוב, לא הזמנתי כלום").intent == Intent.DISPUTE


@pytest.mark.parametrize("text", ["אני לחוץ כלכלית החודש", "ממש לחוצים בכסף עכשיו"])
def test_financially_pressed_still_cant_pay(text):
    assert _d(text).intent == Intent.CANT_PAY


def test_trap_to_click_is_not_financially_pressed():
    """באג שנמצא בהפעלה 248: «ללחוץ» (על קישור) הכיל «לחוץ» ⇒ cant_pay (השהיה + כרטיס) בלי סיבה."""
    d = _d("לא הצלחתי ללחוץ על הקישור, איך משלמים?")
    assert Intent.CANT_PAY not in (d.intent, *d.secondary)

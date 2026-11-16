"""מנהל הפעלה 242 · AI — 4 הכשלים הקריטיים שנותרו בסט המוחזק self4, מתוקנים **לפי מחלקה** (לא לפי הניסוח).

1. שאלה על השולח («לא מכיר את המספר… ממי?») סווגה wrong_person ⇒ הסרה במקום תשובה עם שם העסק.
   עכשיו who_is_this, ורצפת ההגנה עדיין משהה ומעלה כרטיס (fail-safe: אולי באמת מספר שגוי).
2. שאלה על הסכום הכולל («כמה זה עולה בסך הכל?») ⇒ unknown. עכשיו how_to_pay.
3. צד שלישי ישלם («הבן שלי בן 20 ישלם») ⇒ unknown. עכשיו promise, ובלי קטין. ילד בגיל קטין ⇒ נשאר minor.
4. «מתי נוח לדבר?» / «החזרתי לכם טלפון» ⇒ unknown. עכשיו callback.
הניסוחים כאן שונים מהסט המוחזק בכוונה.
"""
import pytest

from app.conversation import Intent, Stop, respond
from evals.harness import build_ctx


def _d(t, ch="sms"):
    return respond(t, build_ctx({"channel": ch}))


@pytest.mark.parametrize("text", ["אני לא מזהה את המספר, ממי ההודעה?", "לא מכירה את השולח, זה ממי?",
                                  "לא מכיר את הטלפון הזה. ממי זה?"])
@pytest.mark.parametrize("ch", ["sms", "email"])
def test_sender_question_is_who_is_this_with_floor(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.WHO_IS_THIS, d.intent
    assert d.intent != Intent.OPT_OUT


@pytest.mark.parametrize("text", ["לא מכירה את השולח, זה ממי?", "לא מכיר את הטלפון הזה. ממי זה?"])
def test_dont_know_number_keeps_protective_floor(text):
    d = _d(text)  # «לא מכיר» נתפס גולמית כמספר שגוי ⇒ עדיין משהים ובעל העסק מחליט
    assert d.intent == Intent.WHO_IS_THIS and d.stop != Stop.NONE and "protective_floor" in d.tags


@pytest.mark.parametrize("text", ["טעות במספר, לא מכיר אתכם", "אין פה אף אחד בשם הזה", "זה לא אני, טעות",
                                  "לא מכיר את המספר הזה, טעות, ממי זה?"])
def test_real_wrong_number_stays_wrong_person(text):
    assert _d(text).intent == Intent.WRONG_PERSON


@pytest.mark.parametrize("text", ["כמה זה יוצא בסך הכל?", "מה הסכום הכולל?", "כמה נשאר לשלם?",
                                  "how much do I owe?", "כמה עליי לשלם?"])
@pytest.mark.parametrize("ch", ["sms", "email"])
def test_total_amount_question_is_how_to_pay(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.HOW_TO_PAY, d.intent


@pytest.mark.parametrize("text", ["למה זה עולה כל כך הרבה? אני לא משלם", "כמה ימים יש לי?"])
def test_amount_traps(text):
    assert _d(text).intent != Intent.HOW_TO_PAY


@pytest.mark.parametrize("text", ["בעלי יעביר את זה מחר", "הבת שלי בת 30 תשלם", "רואה החשבון שלי יסדר את זה",
                                  "אבא שלי ישלם השבוע", "המשרד ישלם בסוף החודש"])
def test_third_party_promise(text):
    d = _d(text)
    assert d.intent == Intent.PROMISE, d.intent


@pytest.mark.parametrize("text", ["הבן שלי בן 12 ישלם", "בעלי לא ישלם את זה", "בעלי אמר שהוא לא ישלם"])
def test_third_party_traps(text):
    d = _d(text)
    assert d.intent != Intent.PROMISE, d.intent


def test_minor_child_still_minor():
    assert _d("הבן שלי בן 12 ישלם").intent == Intent.MINOR


@pytest.mark.parametrize("text", ["מתי יהיה לכם נוח לדבר?", "באיזו שעה זמינים לשיחה?", "התקשרתי אליכם ולא ענו",
                                  "ניסיתי להשיג אתכם, מתי אפשר?", "when can we talk?"])
@pytest.mark.parametrize("ch", ["sms", "email"])
def test_callback_time_question(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.CALLBACK, d.intent

"""לולאת גבי מנוע 17.11 בוקר — המשך לסבב 120 (מספר שגוי). אחרי הצמצום של d212b34 («המספר שלי משתנה») בדקתי
שהזיהוי האמיתי עדיין נתפס ומצאתי פער ותיק: «אני לא האדם הזה», «אני לא מי שאתם מחפשים», «im not that person»,
«i am not her» ⇒ unknown בלי עצירה (ממשיכים לשלוח לאדם הלא נכון)."""
import pytest

from app.conversation import Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["אני לא האדם הזה", "אני לא האישה הזאת", "אני לא מי שאתם מחפשים",
                                  "אני לא הבן אדם שאתם מחפשים", "im not that person", "i am not her",
                                  "I'm not who you're looking for"])
def test_not_that_person_is_wrong_person(text):
    d = _d(text)
    assert d.intent == Intent.WRONG_PERSON and d.stop == Stop.PERMANENT, (text, d.intent)


@pytest.mark.parametrize("text", ["i am not happy with the service", "המספר שלי מסתיים ב-55", "המספר שלי משתנה בקרוב"])
def test_not_wrong_person(text):
    assert _d(text).intent != Intent.WRONG_PERSON

"""critic סבב 144 · המשך לסבב 143 («כבר»): מילות מילוי/חיזוק סביב פועל ההסרה שוברות את התבנית «המילה לבדה»:
«יאללה די», «אחי תפסיקו», «בחייאת מספיק», «נו באמת תפסיקו», «די נו», «די באמת», «תפסיקו עם זה כבר», «פשוט תפסיקו»,
«אחי די», «יאללה תפסיקו», «באמת די עם זה», «בחיאת תפסיקו», «די כבר נו», «just stop already» ⇒ unknown — ההסרה
אבדה; «I literally dont owe you anything» ⇒ unknown (לא מחלוקת). בהודעה קצרה: מסירים מילות מילוי ומסווגים שוב."""
import pytest

from app.conversation import Intent, respond
from evals.harness import build_ctx

OPT = ["יאללה די", "אחי תפסיקו", "בחייאת מספיק", "נו באמת תפסיקו", "די נו", "די באמת", "תפסיקו עם זה כבר",
       "פשוט תפסיקו", "אחי די", "יאללה תפסיקו", "באמת די עם זה", "בחיאת תפסיקו", "די כבר נו", "just stop already"]


@pytest.mark.parametrize("t", OPT)
def test_filler_optout(t):
    assert respond(t, build_ctx({"channel": "sms"})).intent == Intent.OPT_OUT, t


def test_filler_dispute():
    assert respond("I literally dont owe you anything", build_ctx({"channel": "sms"})).intent == Intent.DISPUTE


@pytest.mark.parametrize("t", ["אחי אשלם מחר", "יאללה אשלם עכשיו", "די מהר אשלם", "נו באמת, מתי אפשר לשלם?",
                               "פשוט תשלחו קישור", "just send the link already", "די לי בקישור אחד"])
def test_filler_traps(t):
    d = respond(t, build_ctx({"channel": "sms"}))
    assert d.intent != Intent.OPT_OUT, (t, d.intent)

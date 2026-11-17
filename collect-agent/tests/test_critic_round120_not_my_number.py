"""critic סבב 120 · פער ותיק (לא רגרסיה של d212b349): הניסוח הנפוץ ביותר למספר שגוי לא נתפס —
«זה לא המספר שלי», «המספר לא שלי», «זה לא הטלפון שלי», «this is not my number» ⇒ unknown;
«המספר הזה לא שלי» ⇒ מחלוקת (בגלל «לא שלי»). צפוי: wrong_person ⇒ עצירה לצמיתות למספר + כרטיס.
מלכודות (d212b349): «המספר שלי מסתיים ב-55», «המספר שלי השתנה» ⇒ לא מספר שגוי."""
import pytest

from app.conversation import Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["זה לא המספר שלי", "המספר לא שלי", "זה לא הטלפון שלי", "המספר הזה לא שלי",
                                  "לא המספר שלי, טעיתם", "this is not my number", "not my number"])
def test_not_my_number_is_wrong_person(text):
    d = _d(text)
    assert d.intent == Intent.WRONG_PERSON and d.stop == Stop.PERMANENT, (d.intent, d.stop)


@pytest.mark.parametrize("text", ["המספר שלי מסתיים ב-55", "המספר שלי השתנה", "החשבונית הזאת לא שלי"])
def test_traps(text):
    assert _d(text).intent != Intent.WRONG_PERSON

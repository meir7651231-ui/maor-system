"""לולאה 18.11 (המשך לסבב 145 — «this isn't my number»):
  1. «not my bill» / «this isnt my debt» / «the invoice isnt mine» ⇒ היה מספר שגוי **לצמיתות** (הלקוח יורד מהגבייה),
     בעוד «החוב לא שלי» בעברית = מחלוקת (סבב 121). אחידות: מחלוקת דחופה. עם «wrong number/person» ⇒ מספר שגוי.
  2. מספר ממוחזר: «this number used to be hers», «המספר הזה היה שלה פעם» ⇒ unknown, בלי עצירה ⇒ מספר שגוי."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["not my bill", "this isnt my debt", "the invoice isnt mine", "that bill is not mine",
                                  "this is my number but the invoice isnt mine"])
def test_not_my_bill_is_dispute(text):
    d = _d(text)
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT and d.stop == Stop.PAUSE


@pytest.mark.parametrize("text", ["not my bill, wrong number", "This is not my invoice, you have the wrong person",
                                  "this number used to be hers", "this used to be his number", "המספר הזה היה שלה פעם"])
def test_wrong_person(text):
    d = _d(text)
    assert d.intent == Intent.WRONG_PERSON and d.stop == Stop.PERMANENT

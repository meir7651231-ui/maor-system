"""מנהל 308 · «הבא» AI ממבקר 161: שלילה באנגלית לפני סמן עוין בהבטחה.

«I'll pay tomorrow, I'm not switching to another studio» ⇒ היה כרטיס מיותר (promise_hostile_tail),
כשבעברית «אשלם מחר, אני לא עובר לסטודיו אחר» כבר שקט. עכשיו שוויון: שלילה בתוך הפסוקית ⇒ הבטחה שקטה.
שמרני: שלילה בפסוקית אחרת («not happy, switching…»), «I'm not done with you», ו«last time» בלי שלילה ⇒ כרטיס."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx


def _d(text):
    return respond(text, build_ctx({"channel": "sms"}))


NEGATED = ["I'll pay tomorrow, I'm not switching to another studio",
           "I'll pay friday, not switching to anyone else",
           "I'll pay friday, I'm not leaving you",
           "I'll pay friday, I'm not cancelling the lessons",
           "I'll pay friday, I won't be switching to another studio",
           "I'll pay friday, never switching to anyone else",
           "I'll pay friday, I'm not pulling my kid out",
           "I'll pay tomorrow, it won't be the last time"]

STILL_CARD = ["I'll pay friday, I'm not done with you",
              "I'll pay friday, switching to another studio after",
              "I'll pay friday, not happy, switching to another studio",
              "I'll pay friday, I'm not happy and I'm switching to another studio",
              "I'll pay friday, I'm not happy but I'm cancelling the lessons",
              "I'll pay on the 10th, last time though",
              "I'll pay friday, I'm not leaving you, but this is the last time",
              "I'll pay tomorrow, then I'm pulling my kid out of the class"]


@pytest.mark.parametrize("text", NEGATED)
def test_negated_tail_is_silent_promise(text):
    d = _d(text)
    assert d.intent == Intent.PROMISE and d.escalate == Escalation.NONE, text
    assert "promise_hostile_tail" not in d.tags


@pytest.mark.parametrize("text", STILL_CARD)
def test_unnegated_or_other_clause_still_card(text):
    d = _d(text)
    assert d.intent != Intent.PROMISE or d.escalate != Escalation.NONE, text


@pytest.mark.parametrize("text", ["אשלם מחר, אני לא עובר לסטודיו אחר", "אשלם מחר, לא מבטל את החוג"])
def test_hebrew_parity_control(text):
    d = _d(text)
    assert d.intent == Intent.PROMISE and d.escalate == Escalation.NONE

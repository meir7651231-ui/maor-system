"""מבקר סבב 159 (BACKLOG «גבי מנוע»): הבטחה + המשך עוין/ביטול/«לא מבטיח» ⇒ ההבטחה נשמרת, אבל כרטיס רגיל לבעלים
(tag promise_hostile_tail). שלילה («אני לא מבטל את החוג») אינה ביטול. גם מחוץ לתנאי-משכורת."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["Ill pay friday, switching to another studio after",
                                  "אשלם מחר אבל זו הפעם האחרונה שאני אצלכם", "אעביר בשבוע הבא ואני עוזבת את החוג"])
def test_promise_with_hostile_tail_gets_card(text):
    d = _d(text)
    assert d.intent == Intent.PROMISE and d.escalate == Escalation.NORMAL and "promise_hostile_tail" in d.tags
    assert not d.auto_send


@pytest.mark.parametrize("text", ["אשלם מחר, אני לא מבטל את החוג", "I will pay tomorrow", "אשלם מחר"])
def test_plain_promise_no_card(text):
    d = _d(text)
    assert d.intent == Intent.PROMISE and "promise_hostile_tail" not in d.tags

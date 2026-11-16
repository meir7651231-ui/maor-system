"""critic סבב 105 · אחרי 33b3a79f (צד שלישי ישלם ⇒ הבטחה): הסירוב עצמו בגוף שלישי/הווה לא נתפס ⇒ unknown —
«הבן שלי לא ישלם לכם כלום», «בעלי לא יעביר לכם כלום», «לא משלם לכם שקל». «לא אשלם» כבר מחלוקת ⇒ אותה מחלקה."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["הבן שלי לא ישלם לכם כלום", "בעלי לא יעביר לכם כלום", "לא משלם לכם שקל",
                                  "אנחנו לא משלמים על זה"])
def test_refusal_is_dispute(text):
    d = _d(text)
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT, (d.intent, d.escalate)


@pytest.mark.parametrize("text", ["בעלי ישלם מחר", "הבן שלי ישלם בשבוע הבא", "אני משלם עכשיו"])
def test_third_party_promise_stays_promise(text):
    assert _d(text).intent == Intent.PROMISE

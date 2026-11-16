"""critic סבב 103 · אחרי 0c822125 (invoice_fix — בקשה לתקן פרט בחשבונית): בקשה לתקן את **הסכום/המחיר** היא מחלוקת
(לא פרט טכני). «תתקנו את הסכום בחשבונית ואשלם» ⇒ promise בלי הסלמה (המחלוקת הוסתרה כהבטחה);
«תתקנו, הסכום צריך להיות 800 ולא 1200» ⇒ unknown. תיקון שם/ח.פ. נשאר invoice_fix/רגיל."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["תתקנו את הסכום בחשבונית ואשלם", "תתקנו, הסכום צריך להיות 800 ולא 1200",
                                  "תקנו את המחיר בבקשה ואז אעביר", "הסכום צריך להיות 950"])
def test_amount_correction_is_urgent_dispute(text):
    d = _d(text)
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT, (d.intent, d.escalate)


@pytest.mark.parametrize("text", ["טעות בשם בחשבונית, תתקנו ואשלם", "תוסיפו ח.פ. לחשבונית בבקשה"])
def test_detail_fix_is_not_urgent_dispute(text):
    assert _d(text).intent != Intent.DISPUTE

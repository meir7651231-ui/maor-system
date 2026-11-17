"""המשך לסבב 134: הווטו על תבניות המחלוקת של 133 («will pay» / «אשלם» / «כרטיס») מונע מחלוקת-שווא דחופה —
אבל בלע תלונה אמיתית: «I will pay but the technician never came» ⇒ הבטחה בלי כרטיס (עד e57cc17: מחלוקת).
עכשיו: בלי מחלוקת ובלי דחוף (ההכרעה של 134 נשמרת), אבל כרטיס רגיל עם התלונה. שגרתיות — ללא שינוי."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["I will pay but the technician never came",
                                  "ok ill pay, but the technician never came",
                                  "ביקשתי לבטל אבל אשלם בכל זאת"])
def test_complaint_with_payment_gets_card(text):
    d = _d(text)
    assert d.intent != Intent.DISPUTE and d.escalate == Escalation.NORMAL and "complaint_with_payment" in d.tags
    assert not d.auto_send


@pytest.mark.parametrize("text", ["ביקשתי לבטל את הוראת הקבע ואשלם בהעברה", "they didnt finish yet, will pay",
                                  "I will pay tomorrow", "אשלם מחר"])
def test_routine_untouched(text):
    d = _d(text)
    assert "complaint_with_payment" not in d.tags and d.escalate == Escalation.NONE

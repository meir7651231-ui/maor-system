"""לולאה 18.11 (המשך לסבב 136): «אני לא עובדת» (מובטלת) נתפס בתבנית «לא עובד/ת» של מוצר תקול ⇒ מחלוקת.
«הילד חולה מאוד ואני לא עובדת, אין כסף» ⇒ תשובה «נחזור כדי לברר את העניין» וכרטיס «חולק/ת על החוב».
עכשיו: גוף ראשון / בן-זוג + «לא עובד/ת» ⇒ קושי בתשלום. מוצר/אפליקציה שלא עובדים ⇒ מחלוקת כמו קודם."""
import pytest

from app.conversation import Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["הבת חולה ואני לא עובדת, אין לי כסף כרגע", "בעלי לא עובד כבר חודשיים",
                                  "אנחנו לא עובדים בגלל המצב", "אני כרגע לא עובד"])
def test_jobless_is_cant_pay(text):
    d = _d(text)
    assert d.intent == Intent.CANT_PAY and Intent.DISPUTE not in d.secondary and d.stop == Stop.PAUSE


@pytest.mark.parametrize("text", ["המוצר לא עובד", "האפליקציה שקניתי לא עובדת", "אני לא עובד והמזגן שהתקנתם לא עובד",
                                  "השעון לא עובד ואני לא אשלם"])
def test_broken_product_still_dispute(text):
    assert _d(text).intent == Intent.DISPUTE

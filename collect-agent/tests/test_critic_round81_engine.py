"""critic סבב 81 · 🔴 bb18bc50 (בעקבות 🟡 של סבב 80): «התשלום לא עבר» ⇒ how_to_pay. אבל החוק מוריד גם טענת תשלום
מפורשת: «שילמתי בביט אבל כתוב שההעברה לא עברה», «שילמתי… ירד לי מהחשבון» ⇒ how_to_pay בלי השהיה ⇒ התזכורות
ממשיכות וללקוח שהכסף ירד לו נשלח קישור לשלם שוב (חשש לתשלום כפול). הלוקאהד `שילמתי(?![^.!?]*לא)` נכשל בדיוק כשיש
«לא עבר» אחרי «שילמתי». תיקון: יש טענת תשלום מפורשת (שילמתי/העברתי/ירד מהחשבון/חויבתי) ⇒ נשאר paid_claim."""
import pytest

from app.conversation import Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", [
    "שילמתי בביט אבל כתוב שההעברה לא עברה",
    "שילמתי, אבל ההעברה לא נקלטה אצלכם? ירד לי מהחשבון",
    "העברתי אתמול, ירד לי מהחשבון, ואתם אומרים שהתשלום לא עבר?",
])
def test_paid_claim_with_failed_transfer_stays_paid_claim(text):
    d = _d(text)
    assert d.intent == Intent.PAID_CLAIM and d.stop != Stop.NONE, (d.intent, d.stop)


@pytest.mark.parametrize("text", ["התשלום לא בוצע בגלל תקלה בכרטיס, אנסה שוב מחר",
                                  "ההעברה לא בוצעה, אפשר לשלוח שוב קישור?"])
def test_plain_failed_payment_is_still_how_to_pay(text):
    assert _d(text).intent == Intent.HOW_TO_PAY

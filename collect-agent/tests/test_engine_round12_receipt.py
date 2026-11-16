"""סבב 12 — critic סבב 102 🟡: «אפשר לקבל קבלה?» ⇒ copy_request עם טיוטה «נשלח שוב את חשבונית 1001».
בקשת *קבלה* רומזת שהלקוח שילם ⇒ השהיה + כרטיס "לבדוק אם התקבל תשלום", וטיוטה שלא מבטיחה חשבונית ולא מאשרת תשלום."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def d(text):
    return respond(text, build_ctx({}))


@pytest.mark.parametrize("text", ["אפשר לקבל קבלה?", "תשלחו לי קבלה על מה ששילמתי", "צריך קבלה בבקשה",
                                  "can you send me a receipt?"])
def test_receipt_request_pauses_and_tells_owner(text):
    r = d(text)
    assert r.stop == Stop.PAUSE and r.escalate != Escalation.NONE
    # "תשלחו קבלה על מה ששילמתי" = טענת תשלום מפורשת ⇒ מסלול "שילמתי" (גם הוא השהיה + בדיקה)
    assert r.intent == Intent.PAID_CLAIM or any("קבלה" in a for a in r.owner_actions), r.owner_actions
    assert r.reply is None or "חשבונית 1001" not in r.reply


@pytest.mark.parametrize("text", ["אחרי קבלת המשכורת אשלם", "שלחו העתק של החשבונית"])
def test_not_a_receipt_request(text):
    assert "receipt_request" not in d(text).tags


def test_english_invoice_copy():
    assert d("send me the invoice again please").intent == Intent.COPY_REQUEST

"""critic סבב 100 · נמצא בהוספת המלכודות של סבב 94 לסט ה-evals (6e2fec76 הכניס רק את 29 הקריטיים, בלי מלכודות):
🔴 «תפסיקו לחייב אותי כפול» / «עצרו את החיוב הכפול» ⇒ unknown — תלונה על חיוב כפול היא מחלוקת (דחוף לבעל העסק).
🟡 «I am 14 days late, … paying tomorrow» / «עזבו, אני כבר משלם» ⇒ unknown במקום הבטחה."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["תפסיקו לחייב אותי כפול", "עצרו את החיוב הכפול", "חויבתי פעמיים על אותה עבודה",
                                  "you charged me twice"])
def test_double_charge_is_urgent_dispute(text):
    d = _d(text)
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT, (d.intent, d.escalate)
    assert d.stop != Stop.PERMANENT


@pytest.mark.parametrize("text", ["I am 14 days late, sorry, paying tomorrow", "עזבו, אני כבר משלם"])
def test_paying_now_is_promise(text):
    assert _d(text).intent == Intent.PROMISE

"""לולאת גבי מנוע 16.11 ערב — המשך לסבב 111 (מצוקה באנגלית). בדיקה יזומה מצאה:
  🔴 «im done with life», «i wanna kms» (kms = kill myself) ⇒ unknown, בלי מייל דחוף.
  🟡 «i cant go on vacation» / «…the site» ⇒ מצוקה (חיובי-שווא שמבהיל את בעל העסק).
התיקון מצמצם רק לפי שמות-עצם קונקרטיים (חופשה/אתר/טיול), כך ש-«i cant go on the way things are» נשאר מצוקה."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "email"}))


@pytest.mark.parametrize("text", ["im done with life", "i'm so done with everything", "i wanna kms", "kms",
                                  "i cant go on the way things are", "cant go on anymore", "i cannot go on",
                                  "i cant go on like this", "i cant go on with my life"])
def test_english_distress_caught(text):
    d = _d(text)
    assert d.intent == Intent.DISTRESS and d.escalate == Escalation.URGENT and d.stop == Stop.PAUSE, (text, d.intent)


@pytest.mark.parametrize("text", ["i cant go on vacation before paying", "i cant go on the site, link broken",
                                  "i cant go on a trip this month", "im done with the invoice, paid"])
def test_not_distress(text):
    assert _d(text).intent != Intent.DISTRESS

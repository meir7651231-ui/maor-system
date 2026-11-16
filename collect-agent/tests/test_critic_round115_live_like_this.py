"""critic סבב 115 · 🔴 «בשבוע הבא, אני כבר לא יכול לחיות ככה» ⇒ promise בלי הסלמה (בכל הקשר) — המצוקה לא נתפסה, אין
כרטיס דחוף ואין מייל לבעלים. 🟡 «15 לחודש, אבל אני לא חייב על הכל» ⇒ unknown (מחלוקת חלקית)."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx


def _d(t, state="idle"):
    return respond(t, build_ctx({"channel": "sms", "state": state, "offered_n": 3}))


@pytest.mark.parametrize("state", ["idle", "awaiting_date", "promised"])
@pytest.mark.parametrize("text", ["בשבוע הבא, אני כבר לא יכול לחיות ככה", "אני לא מסוגלת לחיות ככה יותר",
                                  "לא יכולה לחיות ככה"])
def test_cant_live_like_this_is_distress(text, state):
    d = _d(text, state)
    assert Intent.DISTRESS in d.all_intents and d.escalate == Escalation.URGENT, (d.intent, d.escalate)


def test_trap_cant_live_without_coffee():
    assert Intent.DISTRESS not in _d("אני לא יכול לחיות בלי הקפה של הבוקר, אשלם מחר").all_intents


@pytest.mark.parametrize("text", ["15 לחודש, אבל אני לא חייב על הכל", "אני לא חייבת על החלק של ההתקנה"])
def test_partial_not_owed_is_dispute(text):
    d = _d(text)
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT, (d.intent, d.escalate)

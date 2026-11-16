"""critic סבב 111 · 🔴 מצוקה באנגלית בניסוחים נפוצים לא נתפסה (אחרי c4eee8b9 שתיקן «thinking of killing myself»):
«i wanna die», «i might end it», «cant go on» (בלי I / בלי גרש), «I cant take this anymore» (כמשפט שלם) ⇒ unknown +
כרטיס רגיל ⇒ **מייל הדחוף לבעלים (סבב 102) לא נשלח**, אדם במצוקה מחכה. מלכודות: «this debt is killing me lol,
paying friday», «killing it at work» ⇒ לא מצוקה."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["i wanna die", "i might end it", "everything is falling apart, cant go on",
                                  "I cant take this anymore", "i just want to disappear", "I want it all to end"])
def test_english_distress_is_urgent(text):
    d = _d(text)
    assert d.intent == Intent.DISTRESS and d.escalate == Escalation.URGENT, (d.intent, d.escalate)


@pytest.mark.parametrize("text", ["this debt is killing me lol, paying friday", "killing it at work, will pay tomorrow",
                                  "I cant take this anymore, the app keeps crashing, how do I pay?",
                                  "the deadline is ending it for me, paying on monday"])
def test_traps(text):
    assert _d(text).intent != Intent.DISTRESS

"""critic סבב 101 · 🟡 מחלוקות נפוצות שלא נתפסו ⇒ unknown + כרטיס רגיל (שער awaiting_owner עוצר תזכורות, אבל
מחלוקת צריכה להגיע לבעל העסק בדחיפות ולהשהות עד שהוא מכריע)."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["המחיר שונה ממה שאמרתם לי", "יש פה טעות בחשבון", "זה לא מה שהזמנתי",
                                  "החזרתי את המוצר", "מבקש זיכוי", "ההנחה שהובטחה לא מופיעה", "הטכנאי לא תיקן כלום",
                                  "מחיר מופקע", "the amount is wrong", "I never received the service",
                                  "you overcharged me"])
def test_dispute(text):
    d = _d(text)
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT, (d.intent, d.escalate)


@pytest.mark.parametrize("text", ["מה המחיר? אשלם היום", "יש טעות קטנה בשם שלי בחשבונית, אבל אשלם מחר",
                                  "הטכנאי תיקן מעולה, תודה, אשלם היום", "the amount is fine, paying tomorrow"])
def test_traps_not_urgent_dispute_with_stop(text):
    d = _d(text)
    assert d.stop != Stop.PERMANENT and d.intent != Intent.OPT_OUT
    assert not (d.intent == Intent.DISPUTE and "מעולה" in text), d.intent

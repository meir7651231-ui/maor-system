"""critic סבב 114 · בהקשר awaiting_plan_reply: «כן, ותפסיקו לשלוח לי הודעות» / «yes that works, but stop texting me»
⇒ הסרה לצמיתות עם escalate=none. PLAN_ACCEPT נזרק (הסרה גוברת — נכון), אבל ההסכמה לפריסה אובדת בשקט: בעל העסק
לא יודע שהלקוח הסכים לשלם בתשלומים. כמו סבב 89 (הסרה + כוונת תשלום ⇒ כרטיס): ההסרה נשארת + כרטיס רגיל."""
import pytest

from app.conversation import Escalation, Stop, respond
from evals.harness import build_ctx


def _d(t, state="awaiting_plan_reply"):
    return respond(t, build_ctx({"channel": "sms", "state": state, "offered_n": 3}))


@pytest.mark.parametrize("text", ["כן, ותפסיקו לשלוח לי הודעות", "yes that works, but stop texting me",
                                  "מתאים לי, רק אל תשלחו לי יותר הודעות"])
def test_accept_plus_stop_tells_owner(text):
    d = _d(text)
    assert d.stop == Stop.PERMANENT and d.escalate == Escalation.NORMAL, (d.intent, d.stop, d.escalate)
    assert "פריסה" in d.owner_summary or "תשלומים" in d.owner_summary, d.owner_summary


def test_plain_stop_in_plan_context_stays_quiet():
    d = _d("תפסיקו לשלוח לי הודעות")
    assert d.stop == Stop.PERMANENT and d.escalate == Escalation.NONE


def test_yes_plus_stop_outside_plan_context_unchanged():
    d = _d("כן, ותפסיקו לשלוח לי הודעות", state="idle")
    assert d.stop == Stop.PERMANENT

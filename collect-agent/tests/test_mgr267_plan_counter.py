"""מנהל הפעלה 267 · «הבא» AI מ-266: הצעה נגדית במספר תשלומים אחרי שהלקוח כבר אישר הסדר.

היה (PLAN_PENDING_OWNER, הלקוח אישר 3/4 תשלומים):
  · «לא מסתדר לי, אולי 6?» / «3 payments is still too much, can we do 6 instead?» / «זה יותר מדי, אפשר 6»
    ⇒ plan_retract ⇒ כרטיס «↩️ חוזר/ת בו מההסדר» — הבקשה הממשית (6 תשלומים) אבדה.
  · «אולי 6?» / «what about 6?» / «6 instead» / «4 זה הרבה, אולי 8» ⇒ «לא ברור», כרטיס בלי הקשר.
  · AWAITING_PLAN_REPLY: «3 payments is still too much, can we do 6 instead?» ⇒ הצעה ב-*3* תשלומים (המספר הראשון
    בהודעה = ההסדר הקיים); «six instead?» / «6 instead» ⇒ «לא ברור».

עכשיו (`plan_counter`, רק כשיש הסדר בשיחה):
  · המספר שאחרי סמן ההצעה הנגדית ⇒ הצעה מעודכנת בטיוטה לאישור בעל העסק, עם ההסדר הקודם בכרטיס.
  · PLAN_PENDING_OWNER זהיר: «ב-6» / «עד ה-6» / ספרה לבד / סכום / אותו מספר ⇒ כמו קודם (אולי תאריך).
  · כוונות מגינות גוברות; חזרה מההסדר בלי מספר ⇒ כמו ב-266.
"""
from __future__ import annotations

from dataclasses import replace

import pytest

from app.conversation import Escalation, Intent, State, detect, normalize, plan_counter, plan_retract, respond
from evals.harness import build_ctx
from evals.sequences import run_seq

CH = pytest.mark.parametrize("ch", ["sms", "email"])

COUNTER = [("לא מסתדר לי, אולי 6?", 6), ("3 payments is still too much, can we do 6 instead?", 6),
           ("אולי 6?", 6), ("אפשר 6?", 6), ("what about 6?", 6), ("can we do 6?", 6), ("6 instead", 6),
           ("six instead?", 6), ("4 זה הרבה, אולי 8", 8), ("מה עם 5", 5), ("זה יותר מדי, אפשר 6", 6),
           ("3 תשלומים זה הרבה, אולי 6?", 6), ("can we make it 6 payments instead of 4?", 6),
           ("אולי חמישה?", 5), ("how about five payments?", 5), ("ואולי 6 תשלומים?", 6)]
# ב-PLAN_PENDING_OWNER: לא הצעה נגדית (תאריך אפשרי / סכום / ספרה לבד / אותו מספר)
NOT_COUNTER_PENDING = ["אפשר ב-6?", "אפשר עד ה-6?", "6", "ב-6", "אולי ב-20?", "אפשר ב-20 לחודש?", "אולי 300?",
                       "אולי מחר?", "יש לי 6 ילדים, קשה", "אולי 4?", "maybe the 6th?", "what about 6 days?",
                       "אולי 6 ימים?", "אולי 6 ₪?", "אולי 1?"]


def _ctx(state="plan_pending_owner", ch="sms", approved=True, n=4):
    return replace(build_ctx({"state": state, "channel": ch, "offered_n": n}), plan_approved=approved)


@pytest.mark.parametrize(("text", "n"), COUNTER)
def test_plan_counter_extracts_the_counter_number(text, n):
    assert plan_counter(normalize(text), 4, pending=True) == n


@pytest.mark.parametrize("text", NOT_COUNTER_PENDING)
def test_not_counter_when_pending(text):
    assert plan_counter(normalize(text), 4, pending=True) is None


@pytest.mark.parametrize(("text", "n"), COUNTER)
def test_counter_is_not_retract(text, n):
    assert not plan_retract(normalize(text))


@CH
@pytest.mark.parametrize("approved", [True, False])
@pytest.mark.parametrize(("text", "n"), COUNTER)
def test_counter_after_accept_is_updated_offer(text, n, approved, ch):
    d = respond(text, _ctx(ch=ch, approved=approved))
    assert d.intent == Intent.PLAN_REQUEST, d
    assert "plan_retract" not in d.tags and "plan_change" in d.tags
    assert len(d.plan) == min(n, 6)                       # תקרת ברירת המחדל: 6
    assert d.next_state == State.AWAITING_PLAN_REPLY
    assert d.reply and "מאשר" in d.reply
    assert "הצעה מעודכנת" in d.reply or "עד 6 תשלומים" in d.reply
    assert "ההסדר שהלקוח/ה אישר/ה קודם" in d.owner_summary and "4 תשלומים" in d.owner_summary
    assert ("נשאר בתוקף" if approved else "ממתין לאישורך") in d.owner_summary
    if n > 6:
        assert "מעל התקרה" in d.owner_summary


@pytest.mark.parametrize("text", NOT_COUNTER_PENDING)
def test_pending_non_counter_unchanged(text):
    d = respond(text, _ctx())
    assert not d.plan and "plan_change" not in d.tags


@pytest.mark.parametrize(("text", "n"), [("3 payments is still too much, can we do 6 instead?", 6),
                                         ("3 תשלומים זה הרבה, אולי 6?", 6), ("six instead?", 6),
                                         ("6 instead", 6), ("4 זה עדיין הרבה, can we do 5 instead?", 5)])
def test_awaiting_counter_uses_counter_number_not_first(text, n):
    """AWAITING_PLAN_REPLY: היה — המספר הראשון בהודעה (= ההסדר שהוצע) או «לא ברור»."""
    d = respond(text, _ctx(state="awaiting_plan_reply", approved=False, n=3))
    assert len(d.plan) == n and d.next_state == State.AWAITING_PLAN_REPLY


def test_awaiting_reject_plus_counter_keeps_frozen_label():
    """f034 (סט קפוא): «לא מסתדר לי, אולי 6?» ב-AWAITING_PLAN_REPLY = דחייה + בקשה, הצעה ב-6."""
    found = detect("לא מסתדר לי, אולי 6?", _ctx(state="awaiting_plan_reply", approved=False, n=3))
    assert found[0] == Intent.PLAN_REJECT and Intent.PLAN_REQUEST in found
    assert len(respond("לא מסתדר לי, אולי 6?", _ctx(state="awaiting_plan_reply", approved=False, n=3)).plan) == 6


@pytest.mark.parametrize(("text", "intent"), [("הסר אותי, אולי 6", Intent.OPT_OUT),
                                              ("כבר שילמתי, אולי 6?", Intent.PAID_CLAIM),
                                              ("אני לא חייבת כלום, אולי 6?", Intent.DISPUTE)])
def test_protective_intents_win(text, intent):
    found = detect(text, _ctx())
    assert found[0] == intent and Intent.PLAN_REQUEST not in found


@pytest.mark.parametrize("text", ["אני מבטלת את ההסדר", "לא מתאים לי בסוף", "לא אוכל לעמוד בתשלומים"])
def test_retract_without_number_unchanged(text):
    d = respond(text, _ctx())
    assert d.intent == Intent.PLAN_REJECT and "plan_retract" in d.tags and not d.plan
    assert d.escalate == Escalation.NORMAL


def test_change_request_still_wins():
    """264: «להזיז את התשלום הראשון ל-20» — לא «20 תשלומים» וגם לא הצעה נגדית."""
    d = respond("אפשר להזיז את התשלום הראשון ל-20?", _ctx())
    assert len(d.plan) in (0, 4)


def test_regression_sequences_pass():
    import json
    from pathlib import Path
    p = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr267.jsonl"
    for line in p.read_text(encoding="utf-8").splitlines():
        seq = json.loads(line)
        assert run_seq(seq) == [], seq["id"]

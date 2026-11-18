"""מנהל הפעלה 289 · שלילות נוספות לפני paid_claim/promise + קריאה לעזרה לבד — «הבא» ביקורת מ-286/287/288.

היה:
- «לא באמת שילמתי» / «לא באמת העברתי» ⇒ paid_claim ⇒ טיוטה «תודה שעדכנתם! נבדוק את התשלום» — הלקוח אמר שלא שילם.
- «לא הבטחתי שאשלם מחר» / «לא אמרתי שאשלם מחר» ⇒ promise עם מועד (PROMISED) — נרשמה הבטחה שהלקוח מכחיש.
  «מעולם לא / בכלל לא / אף פעם לא אמרתי שאשלם» ⇒ «עד איזה תאריך יהיה נוח לכם?».
- «הצילו» / «🆘» / «SOS» / «אני במצוקה» לבד ⇒ unknown, escalate=normal, stop=none (אף השהיה).
- «אני במצוקה כלכלית» ⇒ unknown (לא קושי בתשלום).
עכשיו: השלילות ⇒ לא paid_claim/promise (unknown ⇒ בעל העסק); קריאה לעזרה לבד ⇒ distress (דחוף + השהיה);
מצוקה כלכלית ⇒ cant_pay. «הצילו, עוד תזכורת?» (בתוך משפט), «לא נורא, אשלם מחר», «אמרתי שאשלם מחר» — ללא שינוי.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.conversation import Escalation, Intent, State, Stop, detect, respond
from evals.harness import build_ctx
from evals.sequences import run_seq


def _r(text, state="idle", offered=0):
    spec = {"state": state, "channel": "sms", "total": 120000}
    if offered:
        spec["offered_n"] = offered
    return respond(text, build_ctx(spec))


NOT_PAID = ["לא באמת שילמתי", "לא באמת העברתי", "לא באמת שילמתי את זה", "ולא באמת שילמנו"]
NOT_PROMISED = ["לא הבטחתי שאשלם מחר", "לא אמרתי שאשלם מחר", "מעולם לא אמרתי שאשלם", "בכלל לא אמרתי שאשלם",
                "אף פעם לא אמרתי שאשלם", "לא התחייבתי שאשלם מחר", "לא הסכמתי שאשלם ב-1 לחודש", "לא באמת אשלם מחר"]


@pytest.mark.parametrize("text", NOT_PAID)
def test_not_really_paid_is_not_paid_claim(text):
    assert Intent.PAID_CLAIM not in detect(text)
    assert _r(text).intent != Intent.PAID_CLAIM


@pytest.mark.parametrize("state", ["idle", "promised"])
@pytest.mark.parametrize("text", NOT_PROMISED)
def test_denied_promise_is_not_promise(text, state):
    assert Intent.PROMISE not in detect(text)
    d = _r(text, state)
    assert d.intent != Intent.PROMISE and Intent.PROMISE not in d.secondary
    assert d.next_state not in (State.PROMISED, State.AWAITING_DATE)
    assert d.promise_date is None


@pytest.mark.parametrize("text", ["שילמתי", "שילמתי באמת", "באמת שילמתי", "כבר שילמתי"])
def test_paid_unchanged(text):
    assert _r(text).intent == Intent.PAID_CLAIM


@pytest.mark.parametrize("text", ["אשלם מחר", "אמרתי שאשלם מחר", "הבטחתי שאשלם ב-1 לחודש", "לא נורא, אשלם מחר",
                                  "לא נורא אשלם מחר"])
def test_promise_unchanged(text):
    assert _r(text).intent == Intent.PROMISE


SOS = ["הצילו", "הצילו!!!", "הצילו אותי", "🆘", "🆘🆘!", "🆘 ❗", "SOS", "sos!", "אני במצוקה", "במצוקה",
       "אני במצוקה נפשית", "אני במצוקה קשה", "אנחנו במצוקה"]


@pytest.mark.parametrize("state,offered", [("idle", 0), ("awaiting_plan_reply", 3), ("promised", 0)])
@pytest.mark.parametrize("text", SOS)
def test_cry_for_help_alone_is_distress(text, state, offered):
    d = _r(text, state, offered)
    assert d.intent == Intent.DISTRESS
    assert d.escalate == Escalation.URGENT
    assert d.stop != Stop.NONE
    assert not d.plan


@pytest.mark.parametrize("text", ["אני במצוקה כלכלית", "אנחנו במצוקה כלכלית קשה", "נמצאת במצוקה כספית"])
def test_financial_distress_is_cant_pay(text):
    d = _r(text)
    assert d.intent == Intent.CANT_PAY
    assert d.stop != Stop.NONE


@pytest.mark.parametrize("text", ["הצילו, עוד תזכורת?", "אני לא במצוקה כלכלית", "שלחו לי SOS בקבוצה, מה זה?",
                                  "שולחת 🆘 לחברה, סליחה"])
def test_not_cry_for_help(text):
    assert _r(text).intent not in (Intent.DISTRESS, Intent.CANT_PAY)


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr289.jsonl"


@pytest.mark.parametrize("seq", [json.loads(x) for x in SEQ.read_text(encoding="utf-8").splitlines() if x.strip()],
                         ids=lambda s: s["id"])
def test_sequences(seq):
    assert run_seq(seq) == []


@pytest.mark.parametrize("state", ["promised", "awaiting_date"])
@pytest.mark.parametrize("text", ["I never said I'd pay tomorrow", "I didn't promise to pay next week",
                                  "לא אמרתי שאשלם ביום ראשון", "לא באמת אשלם ב-1 לחודש"])
def test_denial_in_date_states_not_new_promise(text, state):
    d = _r(text, state)
    assert d.intent != Intent.PROMISE and d.promise_date is None
    assert d.next_state != State.PROMISED


@pytest.mark.parametrize("state", ["promised", "awaiting_date"])
@pytest.mark.parametrize("text", ["בעצם מחר", "ביום ראשון", "tomorrow"])
def test_date_update_in_date_states_unchanged(text, state):
    assert _r(text, state).intent == Intent.PROMISE

"""מנהל 303 («הבא» AI מ-302): תנאי-משכורת באנגלית לבד.

🔴 נמצא: «when I get paid» לבד ⇒ UNKNOWN (כרטיס «לא ברור» לבעל העסק), גם כשהמערכת עצמה שאלה «עד איזה תאריך?»
(AWAITING_DATE). ו«when I get paid on the 10th» בהודעה ראשונה ⇒ UNKNOWN — המועד שהלקוח נתן אבד.
בעברית «כשאקבל משכורת» = הבטחה ⇒ «עד איזה תאריך?». עכשיו שוויון. שמרני: שאלה, שלילה, או המשך שאינו מועד/תשלום ⇒ לא.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from app.conversation import Intent, detect, respond
from evals.harness import build_ctx

STATES = ["idle", "awaiting_date", "promised"]


def _ctx(state="idle"):
    return build_ctx({"state": state, "channel": "sms", "total": 120000})


VAGUE = ["when I get paid", "When I get paid.", "once I get paid", "ok, as soon as I get my salary", "after payday",
         "soon, when I get paid", "on payday", "after my paycheck", "once I get paid, I'll pay you",
         "when I get paid then I'll transfer it", "once we get paid"]
DATED = [("when I get paid on the 10th", "2026-11-10"), ("when I get paid on Friday", "2026-11-13"),
         ("once I get my salary on the 20th", "2026-11-20")]
NOT = ["when I get paid?", "when do I get paid", "not even when I get paid", "I'm not paying until I get paid",
       "when I get paid I will buy a new phone", "when I get paid I'll call you", "I don't know when I get paid",
       "unless I get paid"]


@pytest.mark.parametrize("state", STATES)
@pytest.mark.parametrize("text", VAGUE)
def test_salary_cond_is_vague_promise(text, state):
    d = respond(text, _ctx(state))
    assert d.intent is Intent.PROMISE, (text, state, d.intent)
    assert d.next_state.value == "awaiting_date" and d.promise_date is None
    assert Intent.PAID_CLAIM not in detect(text, _ctx(state))


@pytest.mark.parametrize("state", STATES)
@pytest.mark.parametrize("text,iso", DATED)
def test_salary_cond_with_date_records_it(text, iso, state):
    d = respond(text, _ctx(state))
    assert d.intent is Intent.PROMISE and d.next_state.value == "promised"
    assert d.promise_date is not None and d.promise_date.isoformat() == iso


@pytest.mark.parametrize("text", NOT)
def test_not_salary_promise(text):
    got = detect(text, _ctx())
    assert Intent.PROMISE not in got and Intent.PAID_CLAIM not in got, (text, got)


def test_other_intent_wins():
    d = respond("when I get paid, sorry I am in hospital", _ctx())
    assert d.intent is not Intent.PROMISE


def test_hebrew_parity_unchanged():
    assert respond("כשאקבל משכורת", _ctx()).next_state.value == "awaiting_date"


def test_source_guard_only_when_nothing_else():
    src = Path(__file__).resolve().parents[1].joinpath("app", "conversation.py").read_text(encoding="utf-8")
    assert re.search(r"if not found and _en_salary_promise\(t\)", src)

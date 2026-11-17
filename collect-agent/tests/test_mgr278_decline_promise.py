"""מנהל הפעלה 278 · דחיית הצעת פריסה + «אשלם הכל» במועד ⇒ הבטחה רשומה (q17-42, q10-02 🔴).

שני סטים עיוורים (qa10 קריטי, qa17) ציפו שאחרי הצעת פריסה, «לא צריך בעצם, אשלם הכל ביום חמישי» / «לא מתאים לי. אשלם
הכל ב-20» יירשמו כהבטחה. עד עכשיו (מדיניות 253/256): PLAN_REJECT עיקרי ⇒ כרטיס לבעלים עם המועד, ההבטחה לא נרשמה
והתזכורות הושהו בלי מועד חזרה. עכשיו: PROMISE עיקרי, PLAN_REJECT משני (ההצעה מסומנת rejected), והסיכום לבעל העסק
אומר שההצעה בוטלה. רק כשההצעה פתוחה (AWAITING_PLAN_REPLY), יש «הכל/את כל החוב/in full», אין סימן שאלה, ויש מועד
עתידי. בלי אחד מהם ⇒ כמו קודם. חזרה מהסדר שהלקוח כבר אישר (PLAN_PENDING_OWNER, 266) ⇒ נשארת כרטיס.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.conversation import Intent, State, respond
from evals.harness import build_ctx
from evals.sequences import run_seq


def _d(text, state="awaiting_plan_reply", offered_n=3):
    spec = {"state": state, "channel": "sms", "total": 120000}
    if offered_n:
        spec["offered_n"] = offered_n
    return respond(text, build_ctx(spec))


@pytest.mark.parametrize("text", [
    "לא צריך בעצם, אשלם הכל ביום חמישי", "לא, זה לא מתאים לי. אשלם הכל ב-20", "לא, אשלם הכל מחר",
    "זה יותר מדי. אעביר את הכל מחר", "לא מתאים, אשלם את כל החוב ב-20 לחודש",
    "No thanks, I'll pay it in full on Friday", "no, I will pay everything tomorrow"])
def test_decline_pay_all_with_date_is_promise(text):
    d = _d(text)
    assert d.intent is Intent.PROMISE, d.all_intents
    assert Intent.PLAN_REJECT in d.all_intents
    assert d.promise_date is not None and not d.plan
    assert d.next_state in (State.PROMISED, State.AWAITING_OWNER)


def test_owner_summary_says_offer_cancelled():
    d = _d("לא צריך בעצם, אשלם הכל מחר")
    assert d.next_state is State.PROMISED
    assert "דחה/תה את הצעת הפריסה" in d.owner_summary and "ההצעה בוטלה" in d.owner_summary


@pytest.mark.parametrize("text", [
    "לא מתאים לי, אשלם ב-20",          # בלי «הכל» — אולי רק חלק
    "לא, אפשר לשלם הכל ב-20?",          # שאלה, לא התחייבות
    "לא, אשלם הכל",                     # בלי מועד
    "לא, אשלם הכל אתמול",               # לא מועד עתידי
])
def test_traps_stay_reject(text):
    d = _d(text)
    assert d.intent is not Intent.PROMISE or d.next_state is not State.PROMISED
    assert d.next_state is not State.PROMISED


def test_no_open_offer_unchanged():
    # בלי הצעה פתוחה — המסלול הרגיל של הבטחה, בלי אזכור הצעה
    d = _d("אשלם הכל ביום חמישי", state="idle", offered_n=0)
    assert d.intent is Intent.PROMISE and "הצעת הפריסה" not in d.owner_summary


def test_retract_after_accept_stays_card():
    d = _d("בעצם לא, אשלם הכל ב-20", state="plan_pending_owner")
    assert d.intent is not Intent.PROMISE
    assert d.next_state is State.AWAITING_OWNER


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr278.jsonl"


@pytest.mark.parametrize("seq", [json.loads(line) for line in SEQ.read_text(encoding="utf-8").splitlines()
                                 if line.strip()], ids=lambda s: s["id"])
def test_regress_sequences(seq):
    assert run_seq(seq) == []

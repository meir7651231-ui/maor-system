"""מנהל 258 — מחלקות שנפלו בסט המוחזק #11 (qa11, רצפים עם בעל העסק באמצע).

1. 🔴 מחלוקת: «לא קיבלתי מכם שום שירות» ⇒ «לא ברור» (מילה בין «קיבלתי» ל«שום»).
2. 🔴 מצוקה: «אין לי כסף אפילו לאוכל לילדים, אני לא יודעת מה לעשות יותר» ⇒ cant_pay רגיל (לא דחוף).
3. 🔴 אנגלית: «Who sent this?», «What's the easiest way to pay this?», «Is there a link to pay online?»,
   «I asked how I can pay», «Got it, thank you!» ⇒ «לא ברור».
4. ויתור/הקדמה אחרי מועד רחוק (AWAITING_OWNER): «טוב אני יכולה להקדים, ב-20», «אם זה בעיה אז ב-19 לחודש הזה»,
   «אוקיי אוקיי, ב-13», «Sorry, I meant November 15, not December» ⇒ «לא ברור». עדיין: «ב-25» לבד ⇒ לא נתפס.
5. «I can pay on December 15» (חיווי) ⇒ «לא ברור».
6. «מספר החשבונית לא מופיע לי, אפשר לשלוח שוב?» ⇒ איך משלמים (במקום העתק חשבונית).
7. 🔴 «טוב שילמתי עכשיו את הכל» / «שילמתי ביום ראשון» במצב PROMISED ⇒ טענת תשלום **וגם** הבטחה משנית.
"""
import json
from datetime import date
from pathlib import Path

import pytest

from app.conversation import Context, Escalation, Intent, State, detect, respond

T = date(2026, 11, 8)


def _ctx(state=State.IDLE):
    return Context(today=T, business="x", customer_name="דנה כהן", state=state)


@pytest.mark.parametrize("state", [State.IDLE, State.AWAITING_DATE, State.PROMISED, State.AWAITING_OWNER])
def test_dispute_no_service_with_inner_word(state):
    d = respond("רגע, על מה החוב הזה בכלל? לא קיבלתי מכם שום שירות", _ctx(state))
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT


@pytest.mark.parametrize("text", [
    "אין לי כסף אפילו לאוכל לילדים, אני לא יודעת מה לעשות יותר",
    "אין לנו כסף לאוכל",
    "אין לי מה לאכול",
    "I can't even afford food right now",
])
def test_food_insecurity_is_distress(text):
    d = respond(text, _ctx())
    assert d.intent == Intent.DISTRESS and d.escalate == Escalation.URGENT


@pytest.mark.parametrize("text", [
    "לא יודעת מה לעשות, איך משלמים?",     # בלבול ≠ ייאוש
    "אין לי זמן לאכול אפילו, אשלם מחר",
    "אין לי כסף כרגע, אפשר בתשלומים?",
])
def test_not_distress(text):
    assert Intent.DISTRESS not in detect(text, _ctx())


@pytest.mark.parametrize("text,want", [
    ("Who sent this?", Intent.WHO_IS_THIS),
    ("who is this from?", Intent.WHO_IS_THIS),
    ("What company is this?", Intent.WHO_IS_THIS),
    ("What's the easiest way to pay this?", Intent.HOW_TO_PAY),
    ("Is there a link to pay online?", Intent.HOW_TO_PAY),
    ("Hello? I asked how I can pay", Intent.HOW_TO_PAY),
    ("Got it, thank you!", Intent.THANKS),
    ("Noted, thanks", Intent.THANKS),
    ("מספר החשבונית לא מופיע לי, אפשר לשלוח שוב?", Intent.COPY_REQUEST),
])
def test_english_and_copy(text, want):
    assert detect(text, _ctx())[0] == want


@pytest.mark.parametrize("text,want", [
    ("טוב אני יכולה להקדים, ב-20", date(2026, 11, 20)),
    ("אם זה בעיה אז ב-19 לחודש הזה", date(2026, 11, 19)),
    ("אוקיי אוקיי, ב-13", date(2026, 11, 13)),
    ("בסדר, עד ה-15", date(2026, 11, 15)),
    ("Sorry, I meant November 15, not December", date(2026, 11, 15)),
    ("טוב, אז בחודש הבא", date(2026, 12, 10)),
])
def test_owner_concession_day(text, want):
    d = respond(text, _ctx(State.AWAITING_OWNER))
    assert d.intent == Intent.PROMISE and (d.requested_date or d.promise_date) == want


@pytest.mark.parametrize("text", [
    "ב-25",                       # rm257-03: בלי מילה מובילה
    "טוב, ב-3 תשלומים",            # פריסה ≠ מועד
    "טוב",                         # בלי תאריך
    "טוב שילמתי ב-5",              # טענת תשלום
])
def test_owner_concession_traps(text):
    d = respond(text, _ctx(State.AWAITING_OWNER))
    assert d.promise_date is None or d.intent == Intent.PAID_CLAIM
    assert d.intent != Intent.PROMISE


@pytest.mark.parametrize("state", [State.IDLE, State.AWAITING_OWNER])
def test_english_indicative_can_pay(state):
    d = respond("I can pay on December 15", _ctx(state))
    assert d.intent == Intent.PROMISE and (d.requested_date or d.promise_date) == date(2026, 12, 15)


def test_cant_pay_not_promise():
    assert Intent.PROMISE not in detect("I can't pay on December 15", _ctx())


@pytest.mark.parametrize("state", [State.AWAITING_DATE, State.PROMISED])
@pytest.mark.parametrize("text", ["טוב שילמתי עכשיו את הכל", "שילמתי ביום ראשון דרך האתר", "עכשיו עבד, שילמתי"])
def test_paid_claim_no_phantom_promise(state, text):
    out = detect(text, _ctx(state))
    assert out[0] == Intent.PAID_CLAIM and Intent.PROMISE not in out


def test_paid_partial_keeps_future_promise():
    out = detect("שילמתי חצי, את השאר אשלם ב-20", _ctx(State.PROMISED))
    assert out[0] == Intent.PAID_CLAIM and Intent.PROMISE in out


SEQ = Path(__file__).resolve().parent.parent / "evals" / "seq" / "regress-mgr258.jsonl"


@pytest.mark.parametrize("seq", [json.loads(ln) for ln in SEQ.read_text(encoding="utf-8").splitlines() if ln.strip()],
                         ids=lambda s: s["id"])
def test_regress_seq(seq):
    from evals.sequences import run_seq
    assert run_seq(seq) == []

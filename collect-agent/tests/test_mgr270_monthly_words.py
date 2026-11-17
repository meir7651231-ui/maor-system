"""מנהל הפעלה 270 · «הבא» AI מ-269: סכום חודשי במילים (אנגלית ועברית).

היה:
  · 🔴 «can we do two hundred a month?» ⇒ «ביקש/ה **2** תשלומים» (two נקרא מספר תשלומים) — הצעה של 2×600 במקום 6×200.
  · «I can pay two hundred a month» / «what about one hundred fifty per month?» / «אולי מאתיים בחודש?» ⇒ «לא ברור».
  · «אשלם שלוש מאות לחודש» ⇒ הבטחה בלי תאריך («עד מתי?») במקום פריסה.
עכשיו: `normalize` ממיר לספרות רצף מילות-מספר שצמוד לעוגן חודשי (מטבע אופציונלי), רק ≥100 או עם מטבע מפורש;
ההמשך זהה לגמרי לצורה בספרות (אותו מנוע 268).
"""
from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

import pytest

from app.conversation import Intent, extract_monthly_amount, normalize, plan_counter_amount, respond
from evals.harness import build_ctx
from evals.sequences import run_seq

WORDS = [("can we do two hundred a month?", "can we do 200 a month?"),
         ("what about one hundred fifty per month?", "what about 150 per month?"),
         ("maybe a hundred and fifty monthly?", "maybe 150 monthly?"),
         ("two hundred a month instead", "200 a month instead"),
         ("how about two hundred and fifty a month?", "how about 250 a month?"),
         ("one thousand two hundred nis a month", "1200 nis a month"),
         ("fifteen hundred a month", "1500 a month"),
         ("twenty-five hundred per month", "2500 per month"),
         ("fifty shekels a month", "50 shekels a month"),
         ("אולי מאתיים בחודש?", "אולי 200 בחודש?"),
         ("אפשר מאה וחמישים לחודש?", "אפשר 150 לחודש?"),
         ("אשלם שלוש מאות שקל לחודש", "אשלם 300 שקל לחודש"),
         ("אלף וחמש מאות בכל חודש", "1500 בכל חודש"),
         ("אלף ומאתיים כל חודש", "1200 כל חודש"),
         ("אלפיים בחודש", "2000 בחודש")]

UNCHANGED = ["two payments a month", "twenty a month", "עד עשרים לחודש", "מאתיים בחודש הבא",
             "I paid two hundred last month", "two hundred?", "fifty a month", "one fifty a month",
             "אולי מאתיים?", "שלושה תשלומים בחודש"]


@pytest.mark.parametrize(("words", "digits"), WORDS)
def test_words_become_digits(words, digits):
    assert normalize(words) == normalize(digits)


@pytest.mark.parametrize("text", UNCHANGED)
def test_not_converted(text):
    assert not any(ch.isdigit() for ch in normalize(text))


def _ctx(state, approved=False, n=4, ch="sms"):
    return replace(build_ctx({"state": state, "channel": ch, "offered_n": n}), plan_approved=approved)


PAIRS = [(w, d) for w, d in WORDS if "a month" in d or "per month" in d or "monthly" in d or "בחודש" in d
         or "לחודש" in d or "כל חודש" in d]
STATES = [("plan_pending_owner", True), ("plan_pending_owner", False), ("awaiting_plan_reply", False), ("idle", False)]


@pytest.mark.parametrize(("state", "approved"), STATES)
@pytest.mark.parametrize(("words", "digits"), PAIRS)
def test_same_decision_as_digits(words, digits, state, approved):
    a, b = respond(words, _ctx(state, approved)), respond(digits, _ctx(state, approved))
    got = (a.intent, a.next_state, len(a.plan), sorted(a.tags))
    assert got == (b.intent, b.next_state, len(b.plan), sorted(b.tags))
    assert [i.amount_agorot for i in a.plan] == [i.amount_agorot for i in b.plan]


@pytest.mark.parametrize("ch", ["sms", "email"])
def test_two_hundred_is_not_two_installments(ch):
    """🔴 היה: «ביקש/ה 2 תשלומים» — 2×600 במקום תשלומים של 200."""
    d = respond("can we do two hundred a month?", _ctx("awaiting_plan_reply", n=3, ch=ch))
    assert d.intent == Intent.PLAN_REQUEST and len(d.plan) == 6
    assert max(i.amount_agorot for i in d.plan) <= 20000
    assert "ל-2 תשלומים" not in d.owner_summary


@pytest.mark.parametrize(("text", "agorot"), [("I can pay two hundred a month", 20000), ("אשלם שלוש מאות לחודש", 30000),
                                              ("a thousand shekels a month", 100000)])
def test_extract_monthly_words(text, agorot):
    assert extract_monthly_amount(normalize(text)) == agorot


def test_counter_amount_words():
    assert plan_counter_amount(normalize("300 בחודש זה הרבה, אולי מאתיים בחודש?"), 30000) == 20000
    assert plan_counter_amount(normalize("maybe two hundred a month?"), 30000) == 20000
    assert plan_counter_amount(normalize("maybe three hundred a month?"), 30000) is None   # אותו סכום כמו ההסדר


@pytest.mark.parametrize(("text", "intent"), [("הסר אותי, אולי מאתיים בחודש", Intent.OPT_OUT),
                                              ("כבר שילמתי, אולי מאתיים בחודש?", Intent.PAID_CLAIM),
                                              ("stop texting me, maybe two hundred a month", Intent.OPT_OUT)])
def test_protective_intents_win(text, intent):
    assert respond(text, _ctx("plan_pending_owner", True)).intent == intent


def test_regression_sequences_pass():
    p = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr270.jsonl"
    for line in p.read_text(encoding="utf-8").splitlines():
        seq = json.loads(line)
        assert run_seq(seq) == [], seq["id"]


# ── 🔴 נחשף בדרך: normalize דחס תווים חוזרים גם בספרות («1000» ⇒ «100») ──
@pytest.mark.parametrize(("text", "agorot"), [("שילמתי 1000 ש\"ח", 100000), ("העברתי 3000", 300000)])
def test_paid_amount_with_repeated_zeros(text, agorot):
    """היה: «שילמתי 1000» ⇒ «שילם/ה חלק (100 ₪)» — בעל העסק היה מעדכן יתרה שגויה."""
    d = respond(text, build_ctx({"state": "idle", "channel": "sms", "total": 500000}))
    assert d.intent == Intent.PAID_CLAIM
    assert f"{agorot // 100:,} ₪" in d.owner_summary


@pytest.mark.parametrize("text", ["אשלם 1000 לחודש", "I can pay 1000 a month"])
def test_monthly_1000_not_100(text):
    """היה: ₪100 לחודש ⇒ «פריסה ל-50 תשלומים»."""
    assert extract_monthly_amount(normalize(text)) == 100000
    d = respond(text, build_ctx({"state": "idle", "channel": "sms", "total": 500000}))
    assert len(d.plan) == 5 and "ל-50 תשלומים" not in d.owner_summary


def test_letters_still_squashed():
    assert normalize("תודההההה!!!!") == "תודהה!!"
    assert normalize("0500000000") == "0500000000"

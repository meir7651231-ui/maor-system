"""מנהל הפעלה 251 · סט מוחזק #8 (מעורב, עם הקשר) — תיקון **לפי מחלקה**, בניסוחים שונים מהסט בכוונה.

ריצה יחידה: 25/46 (54.4%), קריטיים 15/24. כמעט כל הכשלים באנגלית, ורובם במצבי הקשר:
1. תאריך באנגלית במצב AWAITING_DATE («Thursday», «tomorrow morning», «on the 15th») ⇒ «לא ברור» במקום promise+תאריך.
   כל לקוח שענה באנגלית «מתי תשלם?» הפך לכרטיס לבעל העסק, והתזכורות לא קיבלו מועד.
2. 🔴 אישור הצעת פריסה «Yes, that works for me, thanks» ⇒ **thanks** (טעות בטוחה): הלקוח אישר, ההסכמה לא נרשמה.
   דחייה «No, that doesn't work for me» ⇒ «לא ברור».
3. «I'm not Dana» / «no Dana here» ⇒ לא מספר שגוי (השם במערכת בעברית), התזכורות ממשיכות לאדם הלא נכון.
4. «a service I never received», «the invoice is wrong» ⇒ לא מחלוקת (בלי הסלמה דחופה).
5. «already transferred it this morning» ⇒ לא טענת תשלום (ממשיכים לתזכר מי ששילם).
6. how_to_pay: «what's the process for paying», «just send me the link», «another way to pay», «הטרנזקציה נכשלה».
7. הבטחה: «Sending it today», «he'll drop by with the cash», «can we push it a few days», «half now, the rest later».
מלכודות: «No problem, sounds good» ≠ דחייה · «I'm not sure» ≠ מספר שגוי · «I haven't transferred it yet» ≠ שולם ·
«yes but the amount is wrong» ≠ אישור · «every Thursday» לא תאריך · תאריך עברי מדויק גובר על «after my salary».
"""
from datetime import date

import pytest

from app.conversation import Escalation, Intent, Stop, extract_date, normalize, respond
from evals.harness import TODAY, build_ctx

PLAN = {"state": "awaiting_plan_reply", "offered_n": 3}
DATE = {"state": "awaiting_date"}
CH = pytest.mark.parametrize("ch", ["sms", "email"])


def _d(t, ch="sms", **ctx):
    return respond(t, build_ctx({"channel": ch, **ctx}))


# ── 1. תאריכים באנגלית (היום = יום ראשון 8.11.2026) ──
DATES = [
    ("friday", 5), ("Monday works", 1), ("by tuesday", 2), ("next Saturday", 6), ("this Sunday", 7),
    ("tmrw", 1), ("tomorrow evening after work", 1), ("day after tomorrow", 2), ("tonight", 0), ("later today", 0),
    ("in 3 days", 3), ("in two weeks", 14), ("within a week", 7), ("in a couple of days", 2),
    ("by the 20th", 12), ("the 1st", 23), ("on 10th", 2), ("end of the month", 22), ("next week", 7),
]


@pytest.mark.parametrize("t,days", DATES)
def test_english_date_extracted(t, days):
    d, vague = extract_date(normalize(t), TODAY)
    assert d is not None and (d - TODAY).days == days and not vague


@CH
@pytest.mark.parametrize("t,days", [("Friday", 5), ("tomorrow afternoon", 1), ("by the 20th", 12), ("in 3 days", 3)])
def test_awaiting_date_english_is_promise(t, days, ch):
    d = _d(t, ch, **DATE)
    assert d.intent == Intent.PROMISE and d.next_state.value == "promised"
    assert (d.promise_date - TODAY).days == days


@pytest.mark.parametrize("t", ["soon, when I get paid", "after my paycheck", "asap"])
def test_english_vague_date(t):
    assert extract_date(normalize(t), TODAY) == (None, True)


def test_hebrew_exact_date_beats_english_vague():
    d, vague = extract_date(normalize("ביום שלישי, after my salary"), TODAY)
    assert d == date(2026, 11, 10) and not vague


def test_every_weekday_is_not_a_date():
    assert extract_date(normalize("I work every Thursday"), TODAY)[0] is None


def test_hebrew_only_text_untouched():
    assert extract_date(normalize("אשלם ביום רביעי"), TODAY) == (date(2026, 11, 11), False)


# ── 2. אישור / דחייה / הצעה נגדית באנגלית ──
@CH
@pytest.mark.parametrize("t", ["yep, go for it", "Sure, that's fine", "Sounds good to me", "We accept the offer",
                               "the plan works, thank you", "Perfect, let's do that"])
def test_plan_accept_english(t, ch):
    d = _d(t, ch, **PLAN)
    assert d.intent == Intent.PLAN_ACCEPT and d.next_state.value == "plan_pending_owner"


@CH
@pytest.mark.parametrize("t", ["nope", "Nah, can't do that", "That won't work for us", "It's too high for me"])
def test_plan_reject_english(t, ch):
    d = _d(t, ch, **PLAN)
    assert d.intent == Intent.PLAN_REJECT and Intent.PLAN_ACCEPT not in d.all_intents


@pytest.mark.parametrize("t", ["what about 5?", "could we do four instead", "6 payments instead"])
def test_counter_offer_english(t):
    d = _d(t, **PLAN)
    assert Intent.PLAN_REQUEST in d.all_intents and Intent.PLAN_ACCEPT not in d.all_intents


@pytest.mark.parametrize("t", ["yes but the amount is wrong", "sure, but I already paid this"])
def test_accept_word_with_objection_is_not_accept(t):
    d = _d(t, **PLAN)
    # כמו בעברית («כן, אבל כבר שילמתי»): הטענה עיקרית, וההסדר לא נרשם כמאושר ⇒ לבעל העסק
    assert d.intent in (Intent.DISPUTE, Intent.PAID_CLAIM) and d.next_state.value != "plan_pending_owner"


def test_no_problem_is_not_reject():
    d = _d("No problem, sounds good", **PLAN)
    assert Intent.PLAN_REJECT not in d.all_intents and d.intent == Intent.PLAN_ACCEPT


def test_english_accept_outside_offer_is_not_accept():
    assert Intent.PLAN_ACCEPT not in _d("Sure, that works").all_intents


# ── 3. «לא <שם>» באנגלית ⇒ מספר שגוי ──
@CH
@pytest.mark.parametrize("t", ["Hi, I'm not Michal", "this isn't Avi, wrong contact", "There's no Yossi at this number",
                               "No Ruth here", "My name is not Shira"])
def test_not_name_english_is_wrong_person(t, ch):
    d = _d(t, ch)
    assert d.intent == Intent.WRONG_PERSON and d.stop == Stop.PERMANENT


@pytest.mark.parametrize("t", ["I'm not sure when I can pay", "I'm not Home until Sunday",
                               "this isn't Dana's fault, I'll pay",
                               "I'm not Interested in excuses, will pay friday"])
def test_not_name_traps(t):
    assert Intent.WRONG_PERSON not in _d(t).all_intents


# ── 4. מחלוקת באנגלית ──
@CH
@pytest.mark.parametrize("t", ["You billed me for work we never agreed to", "I never ordered this",
                               "the total is incorrect", "There's a mistake on the bill"])
def test_dispute_english(t, ch):
    d = _d(t, ch)
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT


# ── 5. טענת תשלום באנגלית ──
@CH
@pytest.mark.parametrize("t", ["wired the money yesterday", "We sent the payment on Friday",
                               "I deposited it at the bank"])
def test_paid_claim_english(t, ch):
    assert _d(t, ch).intent == Intent.PAID_CLAIM


@pytest.mark.parametrize("t", ["I haven't transferred it yet, how do I pay?", "didn't send the money yet, sorry"])
def test_not_yet_transferred_is_not_paid(t):
    assert Intent.PAID_CLAIM not in _d(t).all_intents


# ── 6. איך משלמים ──
@CH
@pytest.mark.parametrize("t", ["what is the procedure to pay?", "text me the payment link please",
                               "is there a different way to pay?", "can I pay by credit card", "how do I try again?",
                               "העסקה נכשלה, מה עושים?", "נתקעתי באמצע התשלום באתר"])
def test_how_to_pay(t, ch):
    d = _d(t, ch)
    assert d.intent == Intent.HOW_TO_PAY and Intent.DISPUTE not in d.all_intents and Intent.OPT_OUT not in d.all_intents


# ── 7. הבטחה / פריסה ──
@pytest.mark.parametrize("t", ["transferring it tonight", "my husband will send it tomorrow",
                               "can we postpone the payment by a week?",
                               "can't make it by Friday, need to move it a few days"])
def test_promise_english(t):
    assert _d(t).intent == Intent.PROMISE


@pytest.mark.parametrize("t", ["can I pay part now and the rest next month?",
                               "half today and the remainder in December?"])
def test_half_now_is_plan_request(t):
    assert _d(t).intent == Intent.PLAN_REQUEST


def test_never_signed_up_is_opt_out_not_dispute():
    d = _d("I never signed up for this, remove me from the list", "email")
    assert d.intent == Intent.OPT_OUT and Intent.DISPUTE not in d.all_intents and d.escalate != Escalation.URGENT

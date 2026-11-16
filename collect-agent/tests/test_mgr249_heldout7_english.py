"""מנהל הפעלה 249 · סט מוחזק #7 (אנגלית ומעורב) — תיקון **לפי מחלקה**, בניסוחים שונים מהסט בכוונה.

ריצה יחידה: 32/46 (69.6%). 🔴 «thinking of killing myself» ⇒ «לא ברור», בלי הסלמה דחופה ובלי השהיה.
המחלקות שנפלו (כולן באנגלית):
1. מצוקה בנטיות (killing/hurting myself, self-harm) ⇒ distress, דחוף, השהיה.
2. עו"ד/בית משפט/תלונה (attorney, small claims, court, filing a complaint, harassment) ⇒ legal, דחוף, השהיה.
3. אובדן עבודה / can't afford / פטירה / אשפוז ⇒ cant_pay; פטירה/אשפוז ⇒ sensitive + דחוף.
4. «this isn't X anymore» ⇒ מספר שגוי (הסרה לצמיתות).
5. «the quote was…» ⇒ מחלוקת.
6. «will transfer…», «I'll take care of it» ⇒ הבטחה (גם אחרי «תודה,» בעברית).
7. «who is this? …», «don't recognize this business» ⇒ who_is_this.
8. 🔴 «I haven't paid yet», «not sure if I paid» ⇒ **לא** טענת תשלום (קודם: «תודה שעדכנתם» + השהיה).
9. «pay link» ⇒ how_to_pay.
מלכודות (TRAPS): «killing me lol», «my lawyer said just pay», «I can afford it»,
«the quote looks fine», «can I pay by card?».
"""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t, ch="sms"):
    return respond(t, build_ctx({"channel": ch}))


CH = pytest.mark.parametrize("ch", ["sms", "email"])

DISTRESS = [
    "sometimes I think about killing myself because of all this",
    "I keep hurting myself, I can't handle these messages",
    "been dealing with self-harm, please be gentle",
    "אני חושב על killing myself, די",
]


@CH
@pytest.mark.parametrize("text", DISTRESS)
def test_english_distress_inflections_urgent(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.DISTRESS
    assert d.escalate == Escalation.URGENT
    assert d.stop in (Stop.PAUSE, Stop.PERMANENT)
    assert "sensitive" in d.tags


LEGAL = [
    "please direct everything to my attorney",
    "see you in small claims",
    "I'll take this to court",
    "I am filing a formal complaint against your company",
    "this is harassment and I'm documenting it",
    "we are considering legal action",
    "expect a lawsuit",
    "העורך דין שלי, my attorney, will contact you",
]


@CH
@pytest.mark.parametrize("text", LEGAL)
def test_english_legal_urgent_pause(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.LEGAL
    assert d.escalate == Escalation.URGENT
    assert d.stop == Stop.PAUSE
    assert "legal" in d.tags


CANT_PAY = [
    "I got laid off last month",
    "we lost our job at the factory, can't afford it",
    "honestly I cannot afford this right now",
    "unemployed since August",
]


@CH
@pytest.mark.parametrize("text", CANT_PAY)
def test_english_cant_pay(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.CANT_PAY
    assert d.stop == Stop.PAUSE


SENSITIVE = [
    "my mother passed away on Monday",
    "the funeral is tomorrow, please wait",
    "I was hospitalized last week",
    "recovering after surgery, will be in touch",
    "my husband is in the ICU",
]


@CH
@pytest.mark.parametrize("text", SENSITIVE)
def test_english_bereavement_hospital_sensitive_urgent(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.CANT_PAY
    assert "sensitive" in d.tags
    assert d.escalate == Escalation.URGENT
    assert d.stop == Stop.PAUSE


@CH
@pytest.mark.parametrize("text", [
    "this isn't Moshe anymore, I got the number in March",
    "it's not Rachel's number any more",
    "no longer David's phone, sorry",
])
def test_english_number_reassigned_is_wrong_person(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.WRONG_PERSON
    assert d.stop == Stop.PERMANENT


@CH
@pytest.mark.parametrize("text", [
    "the estimate was 900, not 1,400",
    "we agreed on 500 for the whole job",
    "please correct the invoice before I pay anything",
])
def test_english_quote_mismatch_is_dispute(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.DISPUTE
    assert d.escalate == Escalation.URGENT


@CH
@pytest.mark.parametrize("text", [
    "will send it on Thursday",
    "I'll handle it next week",
    "תודה רבה, I'll sort it out tomorrow",
    "we will wire the balance after the 10th",
])
def test_english_promise_forms(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.PROMISE
    assert d.stop == Stop.PAUSE


@CH
@pytest.mark.parametrize("text", [
    "who are you? got a text about money",
    "Who is this, I don't recognise the company",
])
def test_english_who_is_this(text, ch):
    assert _d(text, ch).intent == Intent.WHO_IS_THIS


NOT_PAID = [
    "I have not paid yet, where do I pay?",
    "didn't pay yet, send me the pay link",
    "did I already pay this? can you check",
    "I'm not sure whether I paid",
    "haven't paid, will pay Friday",
]


@CH
@pytest.mark.parametrize("text", NOT_PAID)
def test_english_negated_payment_is_not_paid_claim(text, ch):
    d = _d(text, ch)
    assert d.intent != Intent.PAID_CLAIM
    assert d.reply is None or "תודה שעדכנת" not in d.reply


@CH
@pytest.mark.parametrize("text", [
    "I already paid yesterday",
    "paid it this morning, didn't get a receipt",
    "I paid, not sure why you're still texting",
    "it was paid last week by my wife",
])
def test_real_english_paid_claims_still_claims(text, ch):
    """מלכודת הפוכה: השלילה ליד «paid» לא מבטלת טענה אמיתית."""
    d = _d(text, ch)
    assert d.intent == Intent.PAID_CLAIM
    assert d.stop == Stop.PAUSE


TRAPS = [
    ("this week is killing me lol, paying Friday", Intent.PROMISE, {Intent.DISTRESS}),
    ("my lawyer said just pay it, paying now", Intent.PROMISE, {Intent.LEGAL}),
    ("I can afford it, will pay tomorrow", Intent.PROMISE, {Intent.CANT_PAY}),
    ("the quote looks fine, will pay on Sunday", Intent.PROMISE, {Intent.DISPUTE}),
    ("Thanks!", Intent.THANKS, {Intent.PROMISE}),
    ("can I pay by credit card?", Intent.HOW_TO_PAY, {Intent.CANT_PAY}),
]


@CH
@pytest.mark.parametrize("text,want,banned", TRAPS)
def test_traps(text, want, banned, ch):
    d = _d(text, ch)
    assert d.intent == want, d.intent
    assert not (set(d.secondary) & banned), d.secondary

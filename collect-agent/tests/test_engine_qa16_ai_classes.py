"""qa16 (STATUS «הבא» AI): פספוסים לפי מחלקה — ניסוחים חדשים, לא טקסט הסט.
  1. cant_pay באנגלית: «I have no way to pay», «I have nothing to pay with», «I don't have money» ⇒ unknown.
  2. מקדמה/תשלום באנגלית: «I sent you a deposit of 400», «I made a payment» ⇒ unknown, והתזכורות המשיכו.
  3. תואר-זמן בין הפועל לסכום: «שילמתי היום 1200 בביט», «paid yesterday 2000» ⇒ הסכום לא חולץ.
  4. «שילמתי הכל» / «את כל הסכום» / «in full» ⇒ סכום לא ידוע; עכשיו = מלוא החוב (לא «כל חודש»)."""
import pytest

from app.conversation import Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))   # חוב 1,200 ₪


@pytest.mark.parametrize("text", ["I have no way to pay at the moment", "honestly I have nothing to pay with",
                                  "I don't have any money right now", "I have no money this month"])
def test_cant_pay_en(text):
    assert _d(text).intent == Intent.CANT_PAY


@pytest.mark.parametrize("text,amount", [("I sent you a deposit of 300", 30000),
                                         ("i made a payment of 250 today", 25000),
                                         ("I already sent the payment", None)])
def test_deposit_payment_en(text, amount):
    d = _d(text)
    assert d.intent == Intent.PAID_CLAIM and d.paid_agorot == amount


@pytest.mark.parametrize("text,amount", [("העברתי אתמול 700 בביט", 70000), ("שילמתי הבוקר 450", 45000),
                                         ("paid yesterday 900", 90000)])
def test_time_adverb_amount(text, amount):
    assert _d(text).paid_agorot == amount


@pytest.mark.parametrize("text", ["שילמתי את הכל אתמול", "העברתי את כל החוב", "I paid it in full"])
def test_full_claim_is_total(text):
    d = _d(text)
    assert d.intent == Intent.PAID_CLAIM and d.paid_agorot == 120000


@pytest.mark.parametrize("text", ["שילמתי חצי", "שילמתי כל חודש בזמן", "can I make a payment?",
                                  "i dont have money issues, just forgot"])
def test_traps(text):
    d = _d(text)
    assert d.paid_agorot != 120000 and d.intent != Intent.CANT_PAY

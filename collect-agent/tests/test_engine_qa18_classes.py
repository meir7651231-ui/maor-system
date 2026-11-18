"""סט #18 (qa18, ריצה עיוורת 18.11: 21/30, קריטיים 15/24) — תיקון לפי מחלקות, בניסוחים חדשים (לא טקסט הסט)."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["Who's this?", "hey whos this", "who's texting me?"])
def test_whos_this(text):
    assert _d(text).intent == Intent.WHO_IS_THIS


@pytest.mark.parametrize("text", ["not paying until you fix the leak",
                                  "they billed me for a filter that was never installed",
                                  "I'm not gonna pay unless you redo it"])
def test_dispute_en(text):
    d = _d(text)
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT


@pytest.mark.parametrize("text", ["my mom passed on sunday", "sorry, my husband died last month"])
def test_bereavement_en_is_urgent(text):
    d = _d(text)
    assert d.escalate == Escalation.URGENT and d.stop == Stop.PAUSE and "sensitive" in d.tags


def test_falling_apart_is_distress():
    assert _d("I'm literally falling apart right now").intent == Intent.DISTRESS


@pytest.mark.parametrize("text", ["תמחקו אותו מהמערכת", "מחקו אותה בבקשה"])
def test_delete_it_is_opt_out(text):
    d = _d(text)
    assert d.intent == Intent.OPT_OUT and d.stop == Stop.PERMANENT


def test_delete_the_fine_is_not_opt_out():
    assert _d("את הקנס תמחקו אותו ואשלם").intent != Intent.OPT_OUT


@pytest.mark.parametrize("text", ["stop the texts for two weeks, I'll pay on the 20th",
                                  "תפסיקו לשלוח לשבוע, אשלם ב-20"])
def test_temporary_stop_with_promise_is_promise(text):
    d = _d(text)
    assert d.intent == Intent.PROMISE and d.stop == Stop.PAUSE


@pytest.mark.parametrize("text", ["stop the reminders", "stop the reminders for a week"])
def test_stop_without_promise_still_opt_out(text):
    assert _d(text).intent == Intent.OPT_OUT


def test_lawyer_confirmed_amount_with_payment_is_promise():
    text = "Our attorney checked it and the amount is fine. The payment will be sent Friday."
    assert _d(text).intent == Intent.PROMISE


@pytest.mark.parametrize("text", ["our lawyer will contact you, I will pay thursday",
                                  "my lawyer is gonna call you, ill pay monday"])
def test_lawyer_will_contact_stays_legal(text):
    d = _d(text)
    assert d.intent == Intent.LEGAL and d.escalate == Escalation.URGENT

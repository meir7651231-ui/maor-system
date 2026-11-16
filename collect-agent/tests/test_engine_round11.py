"""סבב 11 — מחלקות מסט #4 (self4). טקסטים חדשים, שונים מהסט."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def d(text):
    return respond(text, build_ctx({}))


@pytest.mark.parametrize("text", [
    "הבטחתם לי מחיר אחר בהצעה", "משהו כאן לא תקין בחיוב", "קיבלתי צבע אחר ממה שהזמנתי",
    "החזרנו את המכשיר בשבוע שעבר", "התקלה חזרה יום אחרי", "קורעים אותי עם המחיר הזה",
    "this bill doesn't match what you told me", "no one came to fix it", "you overcharged us big time"])
def test_dispute_variations(text):
    r = d(text)
    assert Intent.DISPUTE in r.all_intents and r.escalate == Escalation.URGENT, (r.intent, r.escalate)


@pytest.mark.parametrize("text", ["די עם הספאם", "תסירי אותי", "תסרו את המספר שלי"])
def test_opt_out_slang_and_typos(text):
    assert d(text).stop == Stop.PERMANENT


def test_new_number_owner_is_wrong_person():
    assert d("המספר הזה חדש אצלי, מי שהיה לפני כבר לא").intent == Intent.WRONG_PERSON


@pytest.mark.parametrize("text", ["לא רוצה כבר כלום מהחיים", "i want it all to end"])
def test_distress_variations(text):
    assert d(text).escalate == Escalation.URGENT


def test_child_phone_with_grade_is_minor():
    assert d("הנייד הזה של הבת שלי, היא בכיתה ג").intent == Intent.MINOR


@pytest.mark.parametrize("text", ["יש טעות בכתובת בחשבונית אבל לא נורא, אשלם",
                                  "stop calling me madam haha, will pay friday"])
def test_traps_not_protective(text):
    r = d(text)
    assert Intent.DISPUTE not in r.all_intents and Intent.OPT_OUT not in r.all_intents


@pytest.mark.parametrize("text", ["stop calling me", "stop calling me please"])
def test_real_stop_calling_still_opt_out(text):
    assert d(text).intent == Intent.OPT_OUT

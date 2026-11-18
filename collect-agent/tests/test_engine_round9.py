"""סבב 9 — מחלקות ממדידה qa3 (15.11). טקסטים חדשים."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def d(text):
    return respond(text, build_ctx({}))


# ── false positives מזיקים ──
@pytest.mark.parametrize("text", ["don't stop me now, I'll pay Monday", "stop stressing, the transfer leaves tomorrow",
                                  "no need to stop anything, paying today"])
def test_english_stop_inside_sentence_is_not_opt_out(text):
    assert Intent.OPT_OUT not in d(text).all_intents


@pytest.mark.parametrize("text", ["stop", "please stop sending me messages", "STOP texting me"])
def test_english_stop_still_opt_out(text):
    assert d(text).intent == Intent.OPT_OUT


@pytest.mark.parametrize("text", ["הבן שלי בן 15 יעביר לכם מחר במקומי", "הנכדה שלי בת 17 תשלם עבורי השבוע"])
def test_child_paying_for_adult_is_not_minor(text):
    assert Intent.MINOR not in d(text).all_intents


def test_child_answering_is_still_minor():
    assert d("הבן שלי בן 12 ענה לכם מהטלפון שלי").intent == Intent.MINOR


@pytest.mark.parametrize("text", ["איך אני משלמת את זה?", "אנחנו משלמים בדרך כלל בהעברה, יש מספר חשבון?"])
def test_present_tense_pay_is_not_paid_claim(text):
    assert Intent.PAID_CLAIM not in d(text).all_intents


# ── פספוסים מזיקים ──
@pytest.mark.parametrize("text", ["הנני לבקש לחדול מלשלוח לי הודעות", "אבקש לחדול ממשלוח מסרונים"])
def test_formal_cease_is_opt_out(text):
    r = d(text)
    assert r.intent == Intent.OPT_OUT and r.stop == Stop.PERMANENT


@pytest.mark.parametrize("text", ["Wrong person, I never ordered from you", "this invoice is not mine"])
def test_english_wrong_person(text):
    assert d(text).intent in (Intent.WRONG_PERSON, Intent.DISPUTE)
    assert d(text).stop != Stop.NONE


@pytest.mark.parametrize("text", ["I'm disputing this bill", "the job was never finished, I won't pay"])
def test_english_dispute(text):
    r = d(text)
    assert r.intent == Intent.DISPUTE and r.escalate == Escalation.URGENT


@pytest.mark.parametrize("text", ["זה טלפון של המשרד, הוא כבר לא עובד פה", "היא עזבה את החברה לפני שנה"])
def test_left_the_company_is_wrong_person(text):
    r = d(text)
    assert r.intent == Intent.WRONG_PERSON and r.stop == Stop.PERMANENT

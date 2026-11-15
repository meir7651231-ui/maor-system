"""סבב 5 — מחלקות מהמדידה החיצונית qa2 (15.11). טקסטים חדשים, לא מהסט."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def d(text):
    return respond(text, build_ctx({}))


@pytest.mark.parametrize("text", ["הצבע שהבטחתם לא נמרח בכל הקירות, תסדרו לפני שאשלם",
                                  "חלק מהעבודה לא בוצע, קודם תשלימו ואז אשלם",
                                  "יש בחשבונית שעות שלא עבדתם, תתקנו בבקשה"])
def test_fix_before_i_pay_is_dispute(text):
    r = d(text)
    assert Intent.DISPUTE in r.all_intents and r.escalate == Escalation.URGENT


@pytest.mark.parametrize("text", ["אני מאושפזת עכשיו ואין לי יכולת להתעסק בזה",
                                  "אני אחרי ניתוח ולא מסוגל לחשוב על כסף"])
def test_sensitive_hardship_is_urgent(text):
    r = d(text)
    assert r.escalate == Escalation.URGENT and r.stop == Stop.PAUSE


@pytest.mark.parametrize("text", ["זה המספר של הבת שלי בת 12, אל תשלחו לה", "המכשיר הזה של ילד קטן"])
def test_child_phone_is_minor(text):
    r = d(text)
    assert Intent.MINOR in r.all_intents and r.escalate == Escalation.URGENT


@pytest.mark.parametrize("text", ["אתם עובדים עם עורך דין או לבד?", "יש לכם משרד עורכי דין שמטפל בזה?"])
def test_question_about_lawyer_is_not_legal_threat(text):
    assert Intent.LEGAL not in d(text).all_intents


@pytest.mark.parametrize("text", ["מה קורה אם לא אשלם בזמן?", "ואם לא אשלם החודש, זה בעיה?"])
def test_conditional_not_paying_is_not_dispute(text):
    assert Intent.DISPUTE not in d(text).all_intents


def test_real_refusal_still_dispute():
    assert d("לא אשלם על עבודה כזאת").intent == Intent.DISPUTE

"""סט #19 (qa19, ריצה עיוורת 19.11: 20/30, קריטיים 18/26, 3 מזיקים) — תיקון לפי מחלקות, בניסוחים חדשים."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from app.inbox import ConversationInbox
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


# q19-27 🔴: שלילת «מספר שגוי» הפכה ללקוח שיורד מהגבייה לצמיתות
@pytest.mark.parametrize("text", ["It's not a wrong number, I'll pay on Monday",
                                  "this isn't the wrong number. paying next week",
                                  "זה לא המספר השגוי, אשלם ביום ראשון"])
def test_negated_wrong_number_is_not_wrong_person(text):
    d = _d(text)
    assert d.intent != Intent.WRONG_PERSON and d.stop != Stop.PERMANENT


# כלל-צמצום: בקשות «מספר שגוי» אמיתיות עדיין נתפסות
@pytest.mark.parametrize("text", ["wrong number", "you have the wrong number buddy",
                                  "it's not the wrong number but I'm not him either", "מספר שגוי"])
def test_real_wrong_number_still_caught(text):
    assert _d(text).intent == Intent.WRONG_PERSON


# q19-22 🔴: חדלות פירעון באנגלית ⇒ דחוף + השהיה
@pytest.mark.parametrize("text", ["we filed for bankruptcy last week", "the company is in liquidation",
                                  "all my debts are frozen by the court"])
def test_insolvency_en_urgent(text):
    d = _d(text)
    assert d.escalate == Escalation.URGENT and d.stop == Stop.PAUSE



@pytest.mark.parametrize("text", ["hey who are you?", "Hello, who is this??"])
def test_hi_who_is_this(text):
    assert _d(text).intent == Intent.WHO_IS_THIS


@pytest.mark.parametrize("text", ["my daughter is 12 and she answered", "this phone belongs to my 15 year old"])
def test_minor_en(text):
    d = _d(text)
    assert d.intent == Intent.MINOR and d.escalate == Escalation.URGENT


def test_drop_off_cash_is_promise():
    assert _d("I'll bring the cash over tomorrow").intent == Intent.PROMISE


# q19-06 🔴: בקשת פריסה בזמן השהיה קשה (קטין) ⇒ לא מוצע הסדר
def test_plan_not_offered_during_minor_pause(svc):
    svc.sync()
    inbox = ConversationInbox(svc, llm=None)
    inbox.handle("sms", "050-1234567", "אני בת 13")
    cid = svc.db.one("SELECT id FROM customers WHERE name='דנה כהן'")["id"]
    inbox.handle("sms", "050-1234567", "אפשר לפרוס לשלושה תשלומים?")
    assert svc.db.one("SELECT COUNT(*) c FROM plans WHERE customer_id=?", (cid,))["c"] == 0


# q19-04: «מי זה <העסק>? לא מכיר» = לא מזהה את העסק ⇒ who_is_this (היה wrong_person לצמיתות — לקוח אמיתי ירד מהגבייה)
@pytest.mark.parametrize("text", ["מי זה הסטודיו הזה? לא מכירה", "מי אתם בכלל? לא מכיר אתכם",
                                  "מי זה מרכז​הריקוד? לא מזהה"])
def test_dont_recognize_business_is_who_is_this(text):
    d = _d(text)
    assert d.intent == Intent.WHO_IS_THIS and d.stop != Stop.PERMANENT


# כלל-צמצום: «לא מכיר» עם טעות/שם/«אין פה» נשאר מספר שגוי
@pytest.mark.parametrize("text", ["מי זה? טעות במספר, לא מכיר", "מי זה? לא מכיר שום דנה", "מי זה? אני לא דנה, לא מכירה",
                                  "לא מכיר את דנה, טעות"])
def test_dont_know_with_wrong_signal_still_wrong_person(text):
    assert _d(text).intent == Intent.WRONG_PERSON

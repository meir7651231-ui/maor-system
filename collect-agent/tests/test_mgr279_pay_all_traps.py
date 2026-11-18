"""מנהל הפעלה 279 · ביקורת מלכודות ל-`_PAY_ALL` (278).

278 הפך «לא, אשלם הכל ב-…» (דחיית פריסה + תשלום מלא + מועד) להבטחה רשומה עם תזכורות מושהות. בדיקת המלכודות
מצאה שגם תשלום **חלקי** נרשם כהבטחה מלאה: «אשלם הכל מלבד 300 מחר», «it all except 200 on Friday», «כמעט הכל»,
«אשלם הכל מחר וחצי בשבוע הבא», ו-«הכל בסדר, אעביר 500 מחר» («הכל» של נימוס + סכום חלקי). התוצאה: התזכורות
מושהות עד המועד בלי שבעל העסק יודע שהוצע רק חלק. עכשיו: נימוס מנוטרל, חלקיות/סכום/פריסה ⇒ כרטיס (מדיניות 253).
"""
from __future__ import annotations

import pytest

from app.conversation import Intent, State, respond
from evals.harness import build_ctx


def _d(text):
    return respond(text, build_ctx({"state": "awaiting_plan_reply", "channel": "sms", "total": 120000,
                                    "offered_n": 3}))


@pytest.mark.parametrize("text", [
    "לא מתאים, אשלם הכל מלבד 300 מחר", "לא, אשלם את כל החוב פחות 100 ביום חמישי",
    "לא, אשלם הכל חוץ מהריבית מחר", "לא, אשלם כמעט הכל מחר", "לא, אשלם את כל הסכום בניכוי 200 מחר",
    "לא, אשלם הכל מחר וחצי בשבוע הבא", "לא, אשלם חצי מחר והכל עד סוף החודש",
    "לא תודה, הכל טוב, אעביר 500 מחר", "לא, הכל בסדר, אשלם מחר",
    "No thanks, I'll pay it all except 200 on Friday", "no, I'll pay everything but 300 tomorrow",
    "no, I will pay it all minus 100 tomorrow", "no, I'll pay almost everything tomorrow",
    "no thanks everything is fine, I'll send 300 tomorrow", "no, I'll pay it all tomorrow and the rest next week",
])
def test_partial_or_filler_is_not_full_promise(text):
    d = _d(text)
    assert d.next_state is not State.PROMISED, (d.intent, d.all_intents)
    assert d.intent is not Intent.PROMISE


@pytest.mark.parametrize("text", [
    "לא צריך בעצם, אשלם הכל ביום חמישי", "לא, זה לא מתאים לי. אשלם הכל ב-20", "לא, אשלם הכל מחר",
    "לא מתאים, אשלם את כל החוב ב-20 לחודש", "No thanks, I'll pay it in full on Friday",
    "no, I will pay everything tomorrow", "לא, אשלם הכל ב-20.11.2026",
])
def test_full_pay_still_promise(text):
    d = _d(text)
    assert d.intent is Intent.PROMISE and Intent.PLAN_REJECT in d.all_intents, d.all_intents


@pytest.mark.parametrize("text", [
    # סירוב לפריסה = תשלום מלא (277/278), לא חלקיות — נמצא ב-diff על טקסטי ה-eval
    "אני אשלם הכל מחר, בלי תשלומים", "I don't want installments, will pay in full tomorrow",
    "Actually no need for installments, I will pay it all on Thursday.", "לא צריך פריסה, אשלם הכל ביום חמישי",
])
def test_negated_installments_still_promise(text):
    d = _d(text)
    assert d.intent is Intent.PROMISE, d.all_intents

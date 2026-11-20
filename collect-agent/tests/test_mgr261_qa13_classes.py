"""מנהל הפעלה 261 · מחלקות סט QA #13 (מוחזק, נכתב עיוור ע״י סוכן נפרד שלא קרא את הריפו; נעול ב-4d494321).

ריצה יחידה: 16/28 (57.1%), קריטיים 11/19. טעויות בטוחות-בעצמן:
1. 🔴 «תפסיקולשלוחלי» (בלי רווחים) ⇒ «לא ברור»; ההודעה הבאה «אשלם ב-20» נרשמה כהבטחה ללקוחה שביקשה להפסיק.
2. 🔴 «החיוב על אוקטובר לא נכון… אבל את ספטמבר אשלם ב-15» ⇒ הבטחה ל-15, בלי מחלוקת ובלי השהיה.
3. 🔴 «אני אשלם ב-20 אבל… אני על סף התמוטטות, בעלי עזב» ⇒ הבטחה, בלי מצוקה ובלי הסלמה דחופה.
4. 🔴 «הבן שלי לומד אצלכם, הוא בן 12 — אני משלמת ב-20» ⇒ קטין (הסלמה דחופה, ההבטחה אבדה).
5. «עורך הדין שלי אמר שזה בסדר לשלם בתשלומים» ⇒ איום משפטי (דחוף) במקום בקשת פריסה.
«לא ברור» (בטוח): «חייבתם אותי גם על שיעור שבוטל», «אשלםב20» (בלי מועד), «כלומר ב-30» אחרי העברה לבעלים.
נתפס בדרך (ותיק): «אני משלמת כל חודש ב-10 את המשכנתא, אין לי כסף לזה עכשיו» ⇒ הבטחה משנית.
"""
from __future__ import annotations

import pytest

from app.conversation import Escalation, Intent, Stop, detect, respond
from evals.harness import build_ctx


def _d(t, ch="sms", state="idle"):
    return respond(t, build_ctx({"channel": ch, "state": state}))


CH = pytest.mark.parametrize("ch", ["sms", "email"])


@CH
@pytest.mark.parametrize("t", ["תפסיקולשלוחלי", "תפסיקו לשלוחלי", "הפסיקולהטריד אותי", "אלתשלחולי יותר", "plz stop",
                               "pls stop sending"])
def test_glued_opt_out(t, ch):
    d = _d(t, ch)
    assert d.intent == Intent.OPT_OUT and d.stop == Stop.PERMANENT, (d.intent, d.stop)


@pytest.mark.parametrize("t", ["תפסיקו לצחוק עליי, אשלם מחר"])
def test_opt_out_traps(t):
    assert Intent.OPT_OUT not in _d(t).all_intents


@CH
@pytest.mark.parametrize("t", ["אני על סף התמוטטות", "אני אשלם ב-20 אבל שתדעו שאני על סף התמוטטות, בעלי עזב",
                               "אני מתמוטטת, אין לי כוח לכלום", "אני ממש על סף ייאוש"])
def test_breakdown_distress(t, ch):
    d = _d(t, ch)
    assert d.intent == Intent.DISTRESS and d.escalate == Escalation.URGENT, (d.intent, d.escalate)
    assert d.promise_date is None


@CH
@pytest.mark.parametrize("t", ["החיוב על אוקטובר לא נכון כי לא הגעתי בכלל, אבל את ספטמבר אשלם ב-15, ואיך משלמים?",
                               "החשבונית הזאת לא נכונה", "הסכום שגוי", "חייבתם אותי גם על שיעור שבוטל, זה לא בסדר",
                               "חייבו אותי על חודש שלא הגעתי בכלל"])
def test_charge_wrong_dispute(t, ch):
    d = _d(t, ch)
    assert d.intent == Intent.DISPUTE and d.stop == Stop.PAUSE, (d.intent, d.stop)
    assert d.promise_date is None


@pytest.mark.parametrize("t", ["מה מספר החשבונית?", "החשבון שלי לא נכון בטופס, אבל אשלם ב-20"])
def test_dispute_traps(t):
    assert Intent.DISPUTE not in _d(t).all_intents


@CH
def test_parent_child_age_is_not_minor(ch):
    d = _d("הבן שלי לומד אצלכם, הוא בן 12 — אני משלמת ב-20", ch)
    assert d.intent == Intent.PROMISE and Intent.MINOR not in d.all_intents
    assert d.promise_date is not None and d.promise_date.day == 20


@pytest.mark.parametrize("t", ["הטלפון של הבן שלי, הוא בן 12", "הבן שלי בן 12 ישלם", "הבן שלי בן 12 קיבל את ההודעה",
                               "אני בן 12", "הבן שלי בכיתה ג"])
def test_child_still_minor(t):
    assert detect(t)[0] == Intent.MINOR, detect(t)


def test_lawyer_ok_installments_is_plan():
    d = _d("היי, עורך הדין שלי אמר שזה בסדר לשלם בתשלומים, אפשר לחלק ל-4?")
    assert Intent.LEGAL not in detect("היי, עורך הדין שלי אמר שזה בסדר לשלם בתשלומים, אפשר לחלק ל-4?")
    assert d.intent == Intent.PLAN_REQUEST


@pytest.mark.parametrize("t", ["העברתי את זה לעורך דין, מעכשיו תפנו אליו", "עורך הדין שלי אמר שזה בסדר לא לשלם",
                               "עורך הדין שלי יתבע אתכם"])
def test_lawyer_still_legal(t):
    assert Intent.LEGAL in _d(t).all_intents or Intent.DISPUTE in _d(t).all_intents


@CH
@pytest.mark.parametrize("t,day", [("אשלםב20", 20), ("אעבירב-15", 15), ("אני אשלםב25", 25)])
def test_glued_promise_date(t, day, ch):
    d = _d(t, ch)
    got = d.requested_date or d.promise_date   # הכרעת q21-19: מעבר ל-14 יום (ב-25) — החילוץ הוא המבוקש
    assert d.intent == Intent.PROMISE and got is not None and got.day == day


@pytest.mark.parametrize("t,day", [("אני משלמת ב-20", 20), ("אנחנו מעבירים לכם ב-15", 15)])
def test_present_tense_promise(t, day):
    d = _d(t)
    assert d.intent == Intent.PROMISE and d.promise_date.day == day


@pytest.mark.parametrize("t", ["אני משלמת כל חודש ב-10 את המשכנתא, אין לי כסף לזה עכשיו",
                               "אני משלמת כל חודש ב-10 משכנתא"])
def test_habitual_payment_not_promise(t):
    assert Intent.PROMISE not in _d(t).all_intents


@pytest.mark.parametrize("t,day", [("כלומר ב-15", 15), ("זאת אומרת ב-12", 12), ("כוונתי ב-14", 14)])
def test_owner_correction_clarifier(t, day):
    d = _d(t, state="awaiting_owner")
    got = d.requested_date or d.promise_date   # הכרעת q21-19: מעבר ל-14 יום (ב-25) — החילוץ הוא המבוקש
    assert d.intent == Intent.PROMISE and got is not None and got.day == day


def test_bare_day_in_awaiting_owner_still_not_promise():
    assert _d("ב-25", state="awaiting_owner").intent != Intent.PROMISE

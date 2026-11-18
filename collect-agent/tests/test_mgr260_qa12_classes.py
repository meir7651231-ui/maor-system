"""מנהל הפעלה 260 · מחלקות סט QA #12 (מוחזק, נכתב עיוור ע״י סוכן נפרד שלא קרא את app/; נעול ב-216a158a).

ריצה יחידה: 8/28 (28.6%), קריטיים 2/16. טעויות בטוחות-בעצמן:
1. 🔴 «המספר שלי יהיה כבוי מחר כל היום, אז אשלם ביום שלישי» ⇒ המועד נרשם «מחר» (התאריך הראשון בהודעה ניצח).
2. 🔴 «התשלומים של האשראי יורדים לי ב-10 לחודש, אז אוכל לשלם לכם ב-11» ⇒ בקשת פריסה (ואחרי תיקון ראשון — 10).
3. «אני אחראית על התשלומים בבית… אשלם ביום חמישי» ⇒ בקשת פריסה («התשלומים» כשם עצם כללי).
4. (ותיק, נתפס ב-diff) «תתקשרו למספר שלי אחרי 5, אני בעבודה עכשיו» כתשובה ל«עד מתי?» ⇒ הבטחה «היום».
מחלקות «לא ברור» (בטוח, אבל כרטיס מיותר / בלי הסלמה דחופה): מצוקה עקיפה («אם פשוט אעלם», «סלי מזון», «nothing in the
fridge»), מחלוקת עקיפה (ביטול מנוי, מחיר שסוכם אחר, «still waiting… what we're paying for»), «מה זאת ההודעה הזאת?»,
«תתקשרו למספר שלי», «give me a call», «את החשבונית שלחתם לכתובת הישנה, אפשר לשלוח שוב?», «אסגור את זה ביום שישי»,
«שלישי הבא» לבד, «:)» באמצע, «אם זה מסבך אותכם אני יכולה גם ב-20» אחרי מועד רחוק.
אחרי: 23/28, קריטיים 12/16, 0 טעויות בטוחות. diff על 1,197 טקסטי eval × 4 מצבים × 2 ערוצים: 130 השתנו, כולם טקסטי qa12.
"""
from datetime import date

import pytest

from app import conversation as cv
from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t, ch="sms", state="idle"):
    return respond(t, build_ctx({"channel": ch, "state": state}))


CH = pytest.mark.parametrize("ch", ["sms", "email"])
NOV8 = date(2026, 11, 8)


def test_today_is_sunday_nov8():
    from evals.harness import TODAY
    assert TODAY == NOV8 and TODAY.weekday() == 6


# ── 1. מצוקה עקיפה ⇒ דחוף ──
DISTRESS = [
    "האמת שאני כבר לא בטוחה שיש טעם בכל זה. אף אחד לא ישים לב אם פשוט אעלם",
    "אני כבר חודשיים נזקקת לעמותה בשביל סלי מזון, אני לא יודעת מאיפה להתחיל",
    "אנחנו מקבלים תלושי מזון מהרווחה",
    "The kids keep asking why there's nothing in the fridge.",
    "Most weeks I honestly don't know how we're going to get through.",
    "We've been going to the food bank since summer",
]


@CH
@pytest.mark.parametrize("t", DISTRESS)
def test_indirect_distress_urgent(t, ch):
    d = _d(t, ch, "awaiting_date")
    assert d.intent == Intent.DISTRESS and d.escalate == Escalation.URGENT and d.promise_date is None


NOT_DISTRESS = ["נזקקתי לקישור, תודה ששלחתם", "אם אני אאחר ביום תעדכנו אותי", "אשלם ב-15, אל תדאגו",
                "My fridge broke so I was busy, I'll pay on Friday"]


@pytest.mark.parametrize("t", NOT_DISTRESS)
def test_distress_traps(t):
    assert Intent.DISTRESS not in _d(t).all_intents


# ── 2. מחלוקת עקיפה ⇒ השהיה + בעלים ──
DISPUTE = [
    "נראה לי שיש פה איזו טעות, ביטלנו את המנוי עוד באוגוסט ומאז לא הגענו לאף שיעור",
    "לפי מה שאני זוכרת המחיר שסגרנו היה אחר לגמרי, לא משהו כזה",
    "ביטלתי את ההזמנה לפני שבועיים",
    "We cancelled the membership back in August and haven't used anything since.",
    "We were supposed to get the final photos back in October and we're still waiting.",
    "Not really sure what exactly we're paying for.",
]


@CH
@pytest.mark.parametrize("t", DISPUTE)
def test_indirect_dispute(t, ch):
    d = _d(t, ch)
    assert d.intent == Intent.DISPUTE and d.stop == Stop.PAUSE
    assert Intent.PROMISE not in d.all_intents and Intent.PAID_CLAIM not in d.all_intents


# ── 3. «התשלומים» כשם עצם ≠ פריסה; פריסה אמיתית נשארת ──
@CH
@pytest.mark.parametrize("t,day", [
    ("אני אחראית על התשלומים בבית, בעלי ביקש שאני אטפל בזה. אשלם ביום חמישי", date(2026, 11, 12)),
    ("התשלומים של האשראי יורדים לי ב-10 לחודש, אז אוכל לשלם לכם ב-11", date(2026, 11, 11)),
    ("בעלי מטפל בתשלומים, אבל את זה אני אשלם ב-15", date(2026, 11, 15)),
])
def test_payments_general_noun(t, day, ch):
    d = _d(t, ch)
    assert d.intent == Intent.PROMISE and d.promise_date == day
    assert Intent.PLAN_REQUEST not in d.all_intents


@pytest.mark.parametrize("t", ["אפשר בתשלומים?", "אני רוצה לחלק לשלושה תשלומים", "אפשר לפרוס את התשלומים?",
                               "אני לא יכולה הכל, אפשר כמה תשלומים?"])
def test_real_plan_request_kept(t):
    assert Intent.PLAN_REQUEST in _d(t).all_intents


# ── 4. תאריך של משפט ההבטחה גובר על תאריך במשפט אחר ──
@pytest.mark.parametrize("t,day", [
    ("המספר שלי יהיה כבוי מחר כל היום, אז אשלם ביום שלישי", date(2026, 11, 10)),
    ("מחר אני בחתונה, אז אעביר ביום רביעי", date(2026, 11, 11)),
    ("המשכורת נכנסת ב-10 לחודש, אשלם ב-12", date(2026, 11, 12)),
    ("אל תעצרו את התזכורות, הן דווקא עוזרות לי לזכור :) אשלם ב-16", date(2026, 11, 16)),
    ("אני אסגור את זה ביום שישי בבוקר", date(2026, 11, 13)),
    ("אשלם מחר, ואם לא אז ביום שלישי", date(2026, 11, 9)),   # המשפט הראשון עם הפועל
    ("אשלם ב-15", date(2026, 11, 15)),                        # משפט אחד ⇒ ביט-זהה
])
def test_promise_clause_date_wins(t, day):
    d = _d(t)
    assert d.intent == Intent.PROMISE and d.promise_date == day


@pytest.mark.parametrize("t", ["לא אסגור את זה ביום שישי", "אשלם חצי ב-15, ואת השאר ב-30"])
def test_promise_clause_traps(t):
    d = _d(t)
    assert d.promise_date in (None,)


def test_busy_now_is_not_a_date():
    d = _d("תתקשרו למספר שלי אחרי 5, אני בעבודה עכשיו", state="awaiting_date")
    assert d.intent == Intent.CALLBACK and d.promise_date is None
    assert _d("אני בעבודה, אשלם עכשיו", state="awaiting_date").promise_date == NOV8


# ── 5. יום בשבוע לבד כתשובה ל«עד מתי?» ──
# מנהל 262: «שלישי הבא» ביום ראשון (השלישי הזה עוד לפנינו) ⇒ מעורפל ⇒ שואלים שוב (היה 10.11); «יום שלישי» נשאר 10.11.
@pytest.mark.parametrize("t,day", [("יום שלישי", date(2026, 11, 10)), ("יום חמישי", date(2026, 11, 12)),
                                   ("חמישי הקרוב", date(2026, 11, 12))])
def test_bare_weekday_awaiting_date(t, day):
    d = _d(t, state="awaiting_date")
    assert d.intent == Intent.PROMISE and d.promise_date == day


def test_bare_next_weekday_same_week_reasks():
    d = _d("שלישי הבא", state="awaiting_date")
    assert d.intent == Intent.PROMISE and d.promise_date is None


def test_bare_weekday_idle_unchanged():
    assert _d("שלישי").promise_date is None


# ── 6. ויתור ב-awaiting_owner: «אם זה מסבך אותכם אני יכולה גם ב-20» ──
def test_owner_concession_can_also():
    d = _d("אם זה מסבך אותכם אני יכולה גם ב-20 לחודש הזה", state="awaiting_owner")
    assert d.intent == Intent.PROMISE and d.promise_date == date(2026, 11, 20)
    assert _d("ב-25", state="awaiting_owner").promise_date is None   # rm257-03 נשמר


# ── 7. שאר המחלקות ──
@CH
@pytest.mark.parametrize("t,it", [
    ("מה זאת ההודעה הזאת?", Intent.WHO_IS_THIS),
    ("תתקשרו למספר שלי אחרי 5, אני בעבודה עכשיו", Intent.CALLBACK),
    ("Could someone from the studio give me a call? I'd rather talk this over by phone.", Intent.CALLBACK),
    ("את החשבונית שלחתם לכתובת הישנה שלי, אפשר לשלוח שוב?", Intent.COPY_REQUEST),
])
def test_other_classes(t, it, ch):
    d = _d(t, ch)
    assert d.intent == it
    assert not {Intent.OPT_OUT, Intent.WRONG_PERSON, Intent.DISPUTE} & set(d.all_intents)


def test_wrong_number_still_caught():
    d = _d("זה לא המספר של דנה. קיבלתי את המספר הזה מסלקום לפני חודשיים")
    assert Intent.WRONG_PERSON in d.all_intents and d.stop == Stop.PERMANENT


def test_extend_keeps_word_start_guard():
    # «סלי מזון» באמצע מילה לא נתפס (שער 250 חל גם על התוספות)
    assert Intent.DISTRESS not in cv.detect(cv.normalize("כרסלי מזונות"))

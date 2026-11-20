"""מנהל הפעלה 252 · AI: תאריך עם **שם חודש** (מ-«הבא» של 251: «ב-15 בדצמבר — לבדוק אם נתמך»).

נבדק ⇒ לא נתמך בכלל:
1. עברית: «אשלם ב-15 בדצמבר», «עד ה-1 לינואר», «בסוף דצמבר», «בעשרים בדצמבר» ⇒ אין תאריך. במצב AWAITING_DATE
   הלקוח ענה בדיוק על השאלה «עד מתי?» והמנוע שאל אותה שוב / העביר לבעל העסק.
2. 🔴 אנגלית: «I'll pay on the 3rd of January» ⇒ **3 בדצמבר** (החודש נבלע ע״י «the Nth»). טעות בטוחה-בעצמה:
   ההבטחה נרשמת לתאריך שגוי והתזכורת יוצאת חודש לפני המועד שהלקוח ביקש. «December 15», «by Dec 5th» ⇒ כלום.
תיקון (`_named_month_he/_en`, `_named_date`): יום+חודש בשני הסדרים, תחילת/אמצע/סוף חודש, חודש בלי יום ⇒ מעורפל.
יום+חודש שעבר לפני ≤90 יום = אזכור עבר («שילמתי ב-5 בנובמבר») ⇒ לא תאריך; ישן יותר ⇒ השנה הבאה.
מלכודות: «יוני»/«מאי» כשם או מילה, «I may», «הבמאי», «500 בדצמבר» (סכום), «31 בנובמבר» (לא קיים).
"""
from datetime import date

import pytest

from app.conversation import Intent, extract_date, normalize, respond
from evals.harness import TODAY, build_ctx

CH = pytest.mark.parametrize("ch", ["sms", "email"])
DATE = {"state": "awaiting_date"}


def _x(t, today=TODAY):
    return extract_date(normalize(t), today)


# היום = יום ראשון 8.11.2026
HE = [
    ("אשלם ב-15 בדצמבר", date(2026, 12, 15)), ("עד ה-1 לינואר", date(2027, 1, 1)), ("ב 20 לנובמבר", date(2026, 11, 20)),
    ("12 בנובמבר", date(2026, 11, 12)), ("ב-3 בינואר", date(2027, 1, 3)), ("ב-15 בחודש דצמבר", date(2026, 12, 15)),
    ("דצמבר 20", date(2026, 12, 20)), ("בעשרים בדצמבר", date(2026, 12, 20)), ("בראשון לינואר", date(2027, 1, 1)),
    ("בחמישה עשר בינואר", date(2027, 1, 15)), ("בשלושים בנובמבר", date(2026, 11, 30)),
    ("בתחילת ינואר", date(2027, 1, 1)), ("עד אמצע דצמבר", date(2026, 12, 15)), ("בסוף דצמבר", date(2026, 12, 31)),
    ("עד סוף נובמבר", date(2026, 11, 30)), ("במרץ 10", date(2027, 3, 10)), ("ב-10 במרס", date(2027, 3, 10)),
    ("ביום שני ה-21 בדצמבר", date(2026, 12, 21)),
]
EN = [
    ("I'll pay on the 3rd of January", date(2027, 1, 3)), ("December 15", date(2026, 12, 15)),
    ("by Dec 5th", date(2026, 12, 5)),
    ("on January 3", date(2027, 1, 3)), ("the 30th of november", date(2026, 11, 30)), ("10 Dec", date(2026, 12, 10)),
    ("early December", date(2026, 12, 1)), ("mid-january", date(2027, 1, 15)), ("end of dec", date(2026, 12, 31)),
    ("Monday, December 21st", date(2026, 12, 21)), ("may 5th", date(2027, 5, 5)), ("by May 3", date(2027, 5, 3)),
]


@pytest.mark.parametrize("t,want", HE + EN)
def test_named_month_date(t, want):
    assert _x(t) == (want, False)


def test_english_month_not_swallowed_by_the_nth():
    """🔴 הבאג: «the 3rd of January» ⇒ 3 בדצמבר. החודש המפורש גובר על «the Nth» שמניח את החודש הבא."""
    d, _ = _x("I'll transfer it on the 3rd of January")
    assert d == date(2027, 1, 3)
    assert _x("by the 20th")[0] == date(2026, 11, 20)  # בלי חודש ⇒ ההתנהגות הקיימת


@pytest.mark.parametrize("t", ["אשלם בינואר", "עד דצמבר", "לקראת פברואר", "אחרי ינואר", "in January",
                               "sometime in march", "by december"])
def test_month_without_day_is_vague(t):
    assert _x(t) == (None, True)


@pytest.mark.parametrize("t", ["שילמתי ב-5 בנובמבר", "העברתי כבר ב-1 בנובמבר", "paid on the 2nd of November"])
def test_recent_past_is_not_a_promise_date(t):
    assert _x(t) == (None, False)


def test_older_past_rolls_to_next_year():
    assert _x("ב-3 בינואר", date(2026, 11, 16)) == (date(2027, 1, 3), False)
    assert _x("ב-1 באוגוסט", date(2026, 11, 16)) == (date(2027, 8, 1), False)  # 107 ימים אחורה (>90)
    assert _x("ב-1 בספטמבר", date(2026, 11, 16)) == (None, False)              # 76 ימים אחורה = אזכור עבר


def test_invalid_day_is_not_a_date():
    assert _x("ב-31 בנובמבר")[0] is None
    assert _x("ב-29 בפברואר", date(2027, 11, 8))[0] == date(2028, 2, 29)  # מעוברת


# ── מלכודות: שם/מילה/סכום ≠ חודש ──
@pytest.mark.parametrize("t,want", [
    ("יוני אמר שישלם מחר", (date(2026, 11, 9), False)),   # «יוני» = שם
    ("מאי נפקא מינה", (None, False)),
    ("הבמאי לא עונה", (None, False)),
    ("I may pay later", (None, False)),
    ("I may be able to in may", (None, True)),           # «in may» = מעורפל, לא «may be»
    ("500 בדצמבר", (None, True)),                          # סכום, לא יום — נשאר רק החודש
    ("שלחתי 3 חשבוניות", (None, False)),
])
def test_traps(t, want):
    assert _x(t) == want


# ── מקצה לקצה דרך respond ──
@CH
@pytest.mark.parametrize("t,want", [("ב-12 בנובמבר", date(2026, 11, 12)),
                                    ("on the 20th of November", date(2026, 11, 20)),
                                    ("עד ה-15 לנובמבר", date(2026, 11, 15))])
def test_awaiting_date_named_month_is_promise(t, want, ch):
    d = respond(t, build_ctx({"channel": ch, **DATE}))
    assert d.intent == Intent.PROMISE and d.next_state.value == "promised" and \
            (d.requested_date or d.promise_date) == want
    assert f"{want.day}.{want.month}" in d.reply


@CH
@pytest.mark.parametrize("t,want", [("אשלם ב-15 בדצמבר", date(2026, 12, 15)),
                                    ("I'll pay on the 3rd of January", date(2027, 1, 3))])
def test_far_named_date_goes_to_owner_with_right_date(t, want, ch):
    """מעבר ל-max_defer_days (14) ⇒ בעל העסק מאשר; התאריך בכרטיס הוא מה שהלקוח כתב (לא חודש קודם).
    הכרעת ראש צוות q21-19 (20.11): ההבטחה מתקבלת עד 14 יום (promised) + כרטיס «בדוק ואשר» — לא awaiting_owner."""
    d = respond(t, build_ctx({"channel": ch}))
    assert d.intent == Intent.PROMISE and d.next_state.value == "promised" and \
            (d.requested_date or d.promise_date) == want
    assert "promise_over_limit" in d.tags and d.escalate.value == "normal"
    assert f"{want.day}.{want.month}" in d.owner_summary


def test_month_only_asks_for_date():
    d = respond("אשלם בדצמבר", build_ctx({"channel": "sms"}))
    assert d.intent == Intent.PROMISE and d.promise_date is None and "vague_date" in d.tags
    assert d.next_state.value == "awaiting_date"


@pytest.mark.parametrize("t,intent", [
    ("שילמתי ב-5 בנובמבר", Intent.PAID_CLAIM),
    ("תפסיקו לשלוח לי הודעות, אני לא אשלם גם בדצמבר", None),
])
def test_critical_intents_unchanged(t, intent):
    """שם חודש לא הופך טענת תשלום/הסרה להבטחה."""
    d = respond(t, build_ctx({"channel": "sms"}))
    assert d.intent != Intent.PROMISE
    if intent:
        assert d.intent == intent

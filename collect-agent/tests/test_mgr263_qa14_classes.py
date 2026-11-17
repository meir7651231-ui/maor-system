"""מנהל הפעלה 263 · מחלקות שנפלו בסט QA #14 (עיוור, סוכן נפרד שלא קרא את הריפו) + «הבא» AI מ-262.

ריצה יחידה: 15/30 רצפים, קריטיים 9/18. נפלו:
(1) 🔴 שגיאות כתיב בעברית בכוונות מגינות — «תפסיקו לשלך לי הודעות», «אני לא חיבת לכם כלום», «טעות במיספר»,
    «לעורכדין שלי» ⇒ «לא ברור» בלי עצירה. פתרון: `_typofix` (מילה שלמה, אוצר סגור) לפני `_deglue`, רק לכוונות מגינות.
(2) 🔴 הדבקה שלא התפרקה — «דיתורידואותימהרשימהשלכם» (חסר «שלכם» באוצר).
(3) צורות הבטחה — «ב20 אני משלמת», «next tuesday אנימשלמת», «אשלם בביט ב-19», «אשלם שני הבא» ⇒ בלי מועד.
(4) הודעה ראשונה שהיא רק מועד («חמישי הבא», «ב-15», «אחרי המשכורת, ב-1 לדצמבר») ⇒ «לא ברור» וכרטיס לבעלים.
(5) «אעביר מתישהו שבוע הבא» ⇒ ראשון הבא (ניחוש בטוח) ⇒ עכשיו מעורפל ⇒ «עד איזה תאריך?».
"""
from __future__ import annotations

from dataclasses import replace
from datetime import date, timedelta

import pytest

from app.conversation import Intent, State, Stop, _typofix, detect, extract_date, extract_date_ctx, normalize, respond
from evals.harness import TODAY, build_ctx

CH = pytest.mark.parametrize("ch", ["sms", "email"])


def _ctx(state="idle", ch="sms", today=None):
    c = build_ctx({"state": state, "channel": ch})
    return replace(c, today=today) if today else c


# ── (1)+(2) כוונות מגינות ──
@CH
@pytest.mark.parametrize("text,intent", [
    ("תפסיקו לשלך לי הודעות", Intent.OPT_OUT),
    ("תפסקו לשלוח לי", Intent.OPT_OUT),
    ("דיתורידואותימהרשימהשלכם", Intent.OPT_OUT),
    ("אני לא חיבת לכם כלום, החוג בוטל באמצה השנה", Intent.DISPUTE),
    ("אני מעבירה את זה לעורכדין שלי שיטפל בכם", Intent.LEGAL),
    ("טעות במיספר אנילא דנה", Intent.WRONG_PERSON),
])
@pytest.mark.parametrize("state", ["idle", "awaiting_date", "promised"])
def test_protective_typos(text, intent, state, ch):
    assert detect(text, _ctx(state, ch))[0] == intent
    d = respond(text, _ctx(state, ch))
    assert d.intent == intent and d.stop != Stop.NONE


@pytest.mark.parametrize("text", [
    "אני מרגישה חיבה גדולה לחוג", "כדילשלוח את הקבלה", "אשלם ב-20", "המספר שלי הוא 0501234567", "תודה רבה",
    "אני חייבת לכם תודה",
])
def test_protective_traps(text):
    got = set(detect(text, _ctx()))
    assert not got & {Intent.OPT_OUT, Intent.DISPUTE, Intent.LEGAL, Intent.WRONG_PERSON, Intent.DISTRESS}


def test_typofix_whole_word_only():
    assert _typofix(normalize("במיספר")) == normalize("במספר")
    assert _typofix(normalize("מיספרים")) == normalize("מיספרים")   # לא חלק ממילה


# ── (3) צורות הבטחה ──
@CH
@pytest.mark.parametrize("text,today,want", [
    ("ב20 אני משלמת", TODAY, date(2026, 11, 20)),
    ("ב-20 אשלם", TODAY, date(2026, 11, 20)),
    ("סבבה אשלם בביט ב-19", TODAY, date(2026, 11, 19)),
    ("אעביר בהעברה בנקאית ב-12", TODAY, date(2026, 11, 12)),
    ("next tuesday אנימשלמת בטוח", date(2026, 11, 12), date(2026, 11, 17)),
    ("אשלם שני הבא", date(2026, 11, 11), date(2026, 11, 16)),
    ("אעביר רביעי הקרוב", TODAY, date(2026, 11, 11)),
])
@pytest.mark.parametrize("state", ["idle", "awaiting_date"])
def test_promise_forms(text, today, want, state, ch):
    c = _ctx(state, ch, today)
    assert Intent.PROMISE in detect(text, c)
    d = respond(text, c)
    assert d.intent == Intent.PROMISE and d.promise_date == want and d.next_state == State.PROMISED


def test_next_weekday_after_verb_still_ambiguous():
    d = respond("אשלם חמישי הבא", _ctx())   # ראשון; חמישי עוד לפנינו השבוע ⇒ מעורפל
    assert d.promise_date is None and d.next_state == State.AWAITING_DATE


@pytest.mark.parametrize("text", [
    "אשלם שני תשלומים", "אני משלמת כל חודש ב-10 את המשכנתא", "ב-3 תשלומים", "תתקשרו אליי ב-5",
])
def test_promise_form_traps(text):
    d = respond(text, _ctx())
    assert d.promise_date is None


# ── (4) הודעה ראשונה שהיא רק מועד ──
@CH
@pytest.mark.parametrize("text,state,want", [
    ("חמישי הבא", State.AWAITING_DATE, None),            # ראשון ⇒ מעורפל ⇒ שואלים
    ("שישי הבא", State.AWAITING_DATE, None),
    ("חמישי הקרוב", State.PROMISED, date(2026, 11, 12)),
    ("ביום שלישי", State.PROMISED, date(2026, 11, 10)),
    ("ב-15", State.PROMISED, date(2026, 11, 15)),
    ("עד ה-17", State.PROMISED, date(2026, 11, 17)),
    ("ב-20 בנובמבר", State.PROMISED, date(2026, 11, 20)),
    ("אחרי המשכורת, ב-1 לדצמבר", State.AWAITING_OWNER, date(2026, 12, 1)),   # 23 יום > 14 ⇒ לבעלים
    ("ב-25", State.AWAITING_OWNER, date(2026, 11, 25)),
])
def test_date_only_first_message(text, state, want, ch):
    d = respond(text, _ctx("idle", ch))
    assert d.intent == Intent.PROMISE and d.promise_date == want and d.next_state == state


@pytest.mark.parametrize("text", ["שני", "17", "חמישי", "תודה, ב-5 אני בעבודה", "ב-3 תשלומים", "?"])
def test_date_only_traps(text):
    assert Intent.PROMISE not in detect(text, _ctx())


@pytest.mark.parametrize("state", ["awaiting_owner", "awaiting_plan_reply", "plan_pending_owner"])
def test_date_only_idle_only(state):
    """ב-AWAITING_OWNER המצב משותף למחלוקת/מצוקה — «ב-25» לבד לא נרשם (257)."""
    c = _ctx(state)
    assert extract_date_ctx(normalize("ב-25"), c)[0] is None
    assert detect("ב-25", c)[0] != Intent.PROMISE


# ── (5) «מתישהו שבוע הבא» ──
@pytest.mark.parametrize("text", ["אעביר מתישהו שבוע הבא", "אשלם במהלך השבוע הבא",
                                  "sorry שכחתי, אעביר מתישהו שבוע הבא"])
def test_sometime_next_week_vague(text):
    assert extract_date(normalize(text), TODAY) == (None, True)
    d = respond(text, _ctx("promised", today=TODAY + timedelta(days=18)))
    assert d.promise_date is None and d.next_state == State.AWAITING_DATE


def test_next_week_still_a_date():
    assert extract_date(normalize("אשלם בשבוע הבא"), TODAY)[0] is not None

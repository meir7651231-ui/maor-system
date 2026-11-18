"""מנהל 257 — (1) תיקון מועד במצב AWAITING_OWNER; (2) חודש עברי ⇒ מעורפל.

באג 1 (qa10 q10-07 #4): «ב-23» (מעל max_defer_days ⇒ AWAITING_OWNER), «תודה», ואז «בעצם ב-25» ⇒ «לא ברור» וכרטיס,
אף שהלקוח רק תיקן את המועד. יום לבד נתפס רק ב-AWAITING_DATE/PROMISED. התיקון: ב-AWAITING_OWNER (מצב משותף לכל
ההעברות) רק מילת תיקון בראש ההודעה + יום עם מילת יחס, וכל ההודעה היא התאריך.

באג 2: «בכסלו» / «עד שבט» כתשובה ל«עד מתי?» ⇒ «לא ברור» וכרטיס; «אשלם בטבת» ⇒ בלי תג vague_date. אין במנוע המרה
עברית⇄לועזית ⇒ מעורפל ושואלים שוב, לא מנחשים תאריך.
"""
from datetime import date

import pytest

from app.conversation import Context, Intent, State, detect, extract_date, extract_date_ctx, normalize
from evals.sequences import run_seq

T = date(2026, 11, 8)


def _ctx(state):
    return Context(today=T, business="x", state=state)


@pytest.mark.parametrize("text,want", [
    ("בעצם ב-25", date(2026, 11, 25)),
    ("סליחה, עד ה-20", date(2026, 11, 20)),
    ("טעיתי, ב-20", date(2026, 11, 20)),
    ("רגע, בעצם ב-12", date(2026, 11, 12)),
    ("תיקון: ב-3 לחודש הבא", date(2026, 12, 3)),
    ("actually on the 25th", date(2026, 11, 25)),
    ("sorry, by the 20th", date(2026, 11, 20)),
])
def test_owner_correction_day(text, want):
    c = _ctx(State.AWAITING_OWNER)
    assert extract_date_ctx(normalize(text), c)[0] == want
    assert Intent.PROMISE in detect(text, c)


@pytest.mark.parametrize("text", [
    "ב-25",                      # בלי מילת תיקון — המצב משותף למחלוקת/מצוקה, לא מנחשים
    "25", "בעצם 25",             # בלי מילת יחס
    "שילמתי ב-25", "בעצם, ב-3 תשלומים", "בעצם החשבונית לא שלי", "סליחה, ב-500",
    "בעצם תתקשרו ב-5",
])
def test_owner_no_correction_no_date(text):
    c = _ctx(State.AWAITING_OWNER)
    assert extract_date_ctx(normalize(text), c)[0] is None
    assert detect(text, c)[0] != Intent.PROMISE


# מנהל 263: IDLE הוצא — שם «בעצם ב-25» כהודעה ראשונה = רק מועד ⇒ תאריך (test_mgr263_qa14_classes).
@pytest.mark.parametrize("state", [State.AWAITING_PLAN_REPLY, State.PLAN_PENDING_OWNER])
def test_correction_only_in_awaiting_owner(state):
    assert extract_date_ctx(normalize("בעצם ב-25"), _ctx(state))[0] is None


@pytest.mark.parametrize("text", ["בכסלו", "עד שבט", "אשלם בטבת", "בסוף כסלו", "ב-10 בטבת", "באב", "עד מנחם אב",
                                  "באדר ב", "בתחילת ניסן", "אחרי אלול", "בחודש תשרי"])
def test_hebrew_month_is_vague_never_a_date(text):
    assert extract_date(normalize(text), T) == (None, True)
    assert Intent.PROMISE in detect(text, _ctx(State.AWAITING_DATE))


@pytest.mark.parametrize("text", ["לאב", "ניסן שלי במוסך", "שבטים", "אדרת", "טבתי"])
def test_hebrew_month_false_friends(text):
    assert extract_date(normalize(text), T) == (None, False)


def _seq(turns, ch="sms"):
    return run_seq({"id": "t", "channel": ch, "turns": turns})


def test_e2e_q10_07_far_date_then_correction():
    assert _seq([
        {"text": "אני אשלם, רק תנו לי קצת זמן", "expect": {"intent": "promise", "state": "awaiting_date"}},
        {"text": "ב-23", "expect": {"promise": "2026-11-23", "state": "awaiting_owner"}},
        {"text": "תודה", "expect": {"intent": "thanks"}},
        {"text": "בעצם ב-20", "expect": {"intent": "promise", "promise": "2026-11-20", "state": "promised"}},
    ]) == []


def test_e2e_hebrew_month_asks_again_email():
    assert _seq([
        {"text": "אני אשלם", "expect": {"state": "awaiting_date"}},
        {"text": "בכסלו", "expect": {"intent": "promise", "promise": None, "state": "awaiting_date"}},
    ], ch="email") == []

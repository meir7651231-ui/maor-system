"""מנהל 255 — יום בחודש לבד כתשובה ל«עד מתי?», ושני באגי «לחודש הבא».

היה: «ב-23», «עד ה-17», «17», «בעשרים», «the twentieth» במצב AWAITING_DATE ⇒ «לא ברור» וכרטיס לבעלים, אף שהלקוח
ענה בדיוק על השאלה. עכשיו: בהקשר בלבד (AWAITING_DATE; ב-PROMISED רק עם מילת יחס), ורק כשכל ההודעה היא התאריך.
🔴 «ב-23 לחודש הבא» ⇒ 23.11 (החודש *הזה*) · «the 20th of next month» ⇒ 20.11 — טעות בטוחה-בעצמה, חודש מוקדם מדי.
"""
from datetime import date

import pytest

from app.conversation import Context, Intent, State, detect, extract_date, extract_date_ctx, normalize, respond

TODAY = date(2026, 11, 8)


def _ctx(state, today=TODAY, channel="sms"):
    return Context(today=today, business="עסק", state=state, channel=channel)


@pytest.mark.parametrize("text,want", [
    ("ב-23", date(2026, 11, 23)), ("ב23", date(2026, 11, 23)), ("עד ה-17", date(2026, 11, 17)),
    ("עד ה 17", date(2026, 11, 17)), ("17", date(2026, 11, 17)), ("עד 17", date(2026, 11, 17)),
    ("ה-20", date(2026, 11, 20)), ("ביום 23", date(2026, 11, 23)), ("על ה-25", date(2026, 11, 25)),
    ("ה-17 בערב", date(2026, 11, 17)), ("ב-15.", date(2026, 11, 15)), ("עד ה-12, בסדר?", date(2026, 11, 12)),
    ("בעשרים", date(2026, 11, 20)), ("עד העשרים", date(2026, 11, 20)), ("אשלם ב-23", date(2026, 11, 23)),
    ("ב-5", date(2026, 12, 5)),            # עבר החודש ⇒ החודש הבא
    ("ב-8", date(2026, 12, 8)),            # היום עצמו ⇒ החודש הבא (כמו «on the 8th» הקיים)
    ("ב-31", date(2026, 11, 30)),          # נובמבר ⇒ היום האחרון
    ("17th", date(2026, 11, 17)), ("23", date(2026, 11, 23)), ("the twentieth", date(2026, 11, 20)),
    ("on the fifth", date(2026, 12, 5)), ("twenty-fifth", date(2026, 11, 25)), ("maybe the 17th", date(2026, 11, 17)),
])
def test_bare_day_in_awaiting_date(text, want):
    assert extract_date_ctx(normalize(text), _ctx(State.AWAITING_DATE)) == (want, False)
    assert Intent.PROMISE in detect(text, _ctx(State.AWAITING_DATE))


@pytest.mark.parametrize("text", ["17 שקל", "100", "יש לי רק 50", "תתקשרו ב-5", "בשעה 5", "שלחתי ב-17", "ב-0", "32",
                                  "2026", "ב-40", "ב-500", "5 חודשים", "3 ימים", "לא"])
def test_bare_day_traps(text):
    assert extract_date_ctx(normalize(text), _ctx(State.AWAITING_DATE))[0] is None
    assert Intent.PROMISE not in detect(text, _ctx(State.AWAITING_DATE))


def test_installments_and_paid_claim_not_dates():
    assert detect("ב-3 תשלומים", _ctx(State.AWAITING_DATE)) == [Intent.PLAN_REQUEST]
    assert Intent.PAID_CLAIM in detect("שילמתי 17", _ctx(State.AWAITING_DATE))


@pytest.mark.parametrize("text", ["ב-23", "17", "עד ה-17", "the 17th"])
def test_no_context_unchanged(text):
    """בלי הקשר (ctx=None) — ביט-זהה: יום בחודש לבד אינו תאריך.
    שינוי מדיניות מנהל 263 (STATUS 262 «הבא» AI, qa14 q14-23/26/27): ב-IDLE הודעה ראשונה שהיא *רק* יום עם מילת יחס
    («ב-23», «עד ה-17») = תשובה לתזכורת ⇒ מועד. בלי מילת יחס («17») ⇒ עדיין לא."""
    assert extract_date_ctx(normalize(text), None) == (None, False)
    if text == "17":
        assert extract_date_ctx(normalize(text), _ctx(State.IDLE))[0] is None
        assert Intent.PROMISE not in detect(text, _ctx(State.IDLE))
    elif text != "the 17th":
        assert extract_date_ctx(normalize(text), _ctx(State.IDLE))[0] is not None
        assert Intent.PROMISE in detect(text, _ctx(State.IDLE))


def test_promised_needs_marker():
    """אחרי הבטחה: «בעצם ב-20» = עדכון מועד; «17» לבד — לא (לא מנחשים)."""
    c = _ctx(State.PROMISED)
    assert extract_date_ctx(normalize("בעצם ב-20"), c) == (date(2026, 11, 20), False)
    assert extract_date_ctx(normalize("17"), c)[0] is None


@pytest.mark.parametrize("text,want", [
    ("ב-23 לחודש הבא", date(2026, 12, 23)), ("עד ה-5 לחודש הבא", date(2026, 12, 5)),
    ("ב-31 לחודש הבא", date(2026, 12, 31)), ("the 20th of next month", date(2026, 12, 20)),
    ("by the 5th next month", date(2026, 12, 5)), ("on the 3rd of next month", date(2026, 12, 3)),
    ("ב-20 לחודש", date(2026, 11, 20)), ("the 3rd", date(2026, 12, 3)),       # בלי «הבא» — ללא שינוי
])
def test_day_of_next_month(text, want):
    assert extract_date(normalize(text), TODAY) == (want, False)


def test_next_month_clamps_and_wraps_year():
    assert extract_date(normalize("ב-31 לחודש הבא"), date(2027, 1, 10)) == (date(2027, 2, 28), False)
    assert extract_date(normalize("the 31st of next month"), date(2026, 12, 20)) == (date(2027, 1, 31), False)
    got = extract_date_ctx(normalize("ב-31"), _ctx(State.AWAITING_DATE, date(2026, 12, 20)))
    assert got == (date(2026, 12, 31), False)


@pytest.mark.parametrize("channel", ["sms", "email"])
def test_end_to_end_respond_records_promise(channel):
    d = respond("עד ה-17", _ctx(State.AWAITING_DATE, channel=channel))
    assert d.intent == Intent.PROMISE
    assert d.promise_date == date(2026, 11, 17)
    assert "17" in d.reply


def test_end_to_end_opt_out_still_wins():
    d = respond("כן, עד ה-17 ותפסיקו לשלוח לי", _ctx(State.AWAITING_DATE))
    assert d.intent == Intent.OPT_OUT

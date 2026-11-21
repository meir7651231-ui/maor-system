"""מנהל 351 (מבקר 199 — אימות 350 «תאריך בנקודה»): סכום באלפים עם נקודה לפני התאריך הסתיר את התאריך.
«אשלם 1.500 ב-10.12» ⇒ היה «עד איזה תאריך בערך?» (promise=None) — החיפוש הנומרי הראשון תפס «1.50» מתוך הסכום
(חודש 50 ⇒ ValueError) ולא המשיך למופע הבא. גם «אעביר 2.000 ש"ח ב-15.12» ו-«I'll pay 1.500 on 10.12»."""
from datetime import date

import pytest

from app.conversation import Intent, extract_date, normalize, respond
from evals.harness import TODAY, build_ctx


@pytest.mark.parametrize("t,want", [
    ("אשלם 1.500 ב-10.12", date(2026, 12, 10)),
    ('אעביר 2.000 ש"ח ב-15.12', date(2026, 12, 15)),
    ("I'll pay 1.500 on 10.12", date(2026, 12, 10)),
    ("אשלם 12.500 עד 20.11", date(2026, 11, 20)),
    ("אשלם 1.500 ב-5.1.27", date(2027, 1, 5)),
])
def test_amount_with_dot_does_not_hide_date(t, want):
    assert extract_date(normalize(t), TODAY) == (want, False), t
    d = respond(t, build_ctx({"channel": "sms"}))
    assert d.intent == Intent.PROMISE, t
    assert (d.requested_date or d.promise_date) == want, (t, d.promise_date, d.requested_date)


@pytest.mark.parametrize("t,want", [
    ("אשלם ב-10.12", date(2026, 12, 10)),       # בקרה: 198
    ("אשלם ב-25.11.2027", date(2027, 11, 25)),
    ("אשלם 1,500 ב-10.12", date(2026, 12, 10)),
    ("אשלם 1500 ב-10.12", date(2026, 12, 10)),
    ("אשלם ב-10/12", date(2026, 12, 10)),
])
def test_controls_unchanged(t, want):
    assert extract_date(normalize(t), TODAY) == (want, False), t


@pytest.mark.parametrize("t", ["אשלם 1.500", "שילמתי 1.500", "I paid 1.500"])
def test_amount_alone_is_not_a_date(t):
    assert extract_date(normalize(t), TODAY) == (None, False), t

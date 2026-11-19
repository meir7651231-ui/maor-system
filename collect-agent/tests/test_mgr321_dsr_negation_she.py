"""מנהל 321 · critic 173: «שלא תמחקו», «אסור לכם למחוק», «dont want u to delete» — שלילה, לא בקשת מחיקה.

הקידומת ש׳/וש׳ לפני מילת השלילה, «אסור» (עם «לכם/לך/לכן» אופציונלי), ו-u/ya/yall כמילוי באנגלית.
בקרות: שלילה בפסוקית אחרת (פסיק/סימן קריאה), «אסור לשכוח למחוק» (פועל משני), גבול מילה («מלא», «משלא»)."""
import pytest

from app import dsr

NEGATED = [
    "אני מבקש שלא תמחקו את המידע שלי",
    "בבקשה שלא תמחקו את הפרטים",
    "חשוב לי שלא תמחקו את הנתונים",
    "ושלא תמחקו את המידע שלי",
    "ושאין צורך למחוק את הפרטים",
    "אסור לכם למחוק את המידע שלי",
    "אסור לך למחוק את הנתונים שלי",
    "אסור למחוק את הפרטים שלי",
    "שאסור לכם למחוק את המידע",
    "I dont want u to delete my info",
    "pls dont u delete my data",
    "I don't want ya to delete my details",
    "don't y'all delete my information",
]
REAL = [
    "לא! תמחקו את המידע שלי",
    "אסור לכם לשלוח לי, תמחקו את המידע שלי",
    "אסור לשכוח למחוק את המידע שלי",
    "מלא תמחקו את המידע",
    "משלא תמחקו את המידע",
    "delete my data u guys",
    "u should delete my information",
    "שלא תשלחו יותר. תמחקו את המידע שלי",
    "אני שלא מבין למה, delete my data",
]


@pytest.mark.parametrize("text", NEGATED)
def test_negated_not_request(text):
    assert dsr.detect(text) == []


@pytest.mark.parametrize("text", REAL)
def test_real_request_still_detected(text):
    assert dsr.detect(text) == ["deletion"]


def test_negated_plus_real_in_same_message():
    assert dsr.detect("שלא תמחקו את הפרטים של אמא, אבל מחקו את המידע שלי") == ["deletion"]


def test_negation_only_affects_deletion():
    assert dsr.detect("שלא תמחקו כלום, רק איזה מידע יש לכם עליי") == ["access"]


@pytest.mark.parametrize("text", ["אני מבקש שלא תמחקו את המידע שלי", "אסור לכם למחוק את המידע שלי"])
def test_inbound_negated_no_register_row(svc, text):
    svc.sync()
    svc.inbound("sms", "0501234567", text)
    assert dsr.listing(svc) == []

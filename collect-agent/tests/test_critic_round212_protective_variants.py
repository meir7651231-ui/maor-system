"""מבקר סבב 212 · 🟠 — המשך 0c23299f (גבי מנוע, «בדיקה שיטתית של כוונות מגינות», 50 ניסוחים): עוד 7 ניסוחים מגינים
שנקראים «לא ברור» (unknown, escalate=normal) במקום דחוף/השהיה מגינה.

רכיב: `app/conversation.py` → `respond` (RX של DISTRESS / MINOR / cant_pay-אבל). אותה הגדרה של «פער» כמו ב-0c23299f:
unknown ⇒ כרטיס **רגיל** (לא «דחוף»), ו«✓ טופל» / «סגירה בלי מענה» משחררים את awaiting_owner ⇒ התזכורות חוזרות,
בלי ההשהיה המגינה שהיה מקבל ניסוח קרוב. הבולט: «בא לי לסיים עם הכל» (סיכון אובדני) — כרטיס רגיל, בלי «דחוף»,
כשלידו «אני רוצה למות» / «אין לי טעם לחיות יותר» / «אני על הקצה» כן distress+URGENT ✓.
  מצוקה: «בא לי לסיים עם הכל», «אני כבר לא יכולה יותר עם כל זה»
  קטין: «אני תלמיד בתיכון», «אני עוד לא בן 18» (לצד «אני בכיתה ט» / «אני קטינה» ✓)
  פטירה: «אבא שלי נפתר» (שגיאת כתיב), «הוא כבר לא בין החיים», «בעלי ז״ל» (לצד «אמא נפטרה לפני שבוע» ✓)
xfail(strict=True) פר-ניסוח; בקרות ירוקות (הניסוחים הקרובים שכבר עובדים)."""
from datetime import date

import pytest

from app import conversation as cv

TODAY = date(2026, 11, 8)


def _d(text):
    return cv.respond(text, cv.Context(business="סטודיו", today=TODAY))


GAPS = ["בא לי לסיים עם הכל", "אני כבר לא יכולה יותר עם כל זה", "אני תלמיד בתיכון", "אני עוד לא בן 18",
        "אבא שלי נפתר", "הוא כבר לא בין החיים", "בעלי ז\"ל"]


@pytest.mark.parametrize("text", GAPS)
def test_protective_variant_is_urgent(text):
    d = _d(text)
    assert d.escalate == cv.Escalation.URGENT, (d.intent, d.escalate)


@pytest.mark.parametrize("text", ["אני רוצה למות", "אין לי טעם לחיות יותר", "אני על הקצה", "אני בכיתה ט",
                                  "אני קטינה", "אמא נפטרה לפני שבוע"])
def test_control_close_variants_already_urgent(text):
    assert _d(text).escalate == cv.Escalation.URGENT


# מנהל 368: תוקן (conversation.py — _HE_BEREAVE + _extend DISTRESS/MINOR). בקרות נגד התראת-שווא:
@pytest.mark.parametrize("text", ["אני רוצה לסיים עם הכל, תשלחו קישור לתשלום", "הבעיה נפתרה, שילמתי", "זה נפתר",
                                  "הבן שלי עוד לא בן 18, אני אשלם ביום ראשון"])
def test_payment_or_solved_context_not_urgent(text):
    assert _d(text).escalate != cv.Escalation.URGENT

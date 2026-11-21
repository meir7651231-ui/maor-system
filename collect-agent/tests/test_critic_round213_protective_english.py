"""מבקר סבב 213 · 🟠 — המראה באנגלית של 212: ניסוחים מגינים באנגלית ⇒ unknown/normal.

רכיב: `app/conversation.py` → `respond` (RX של DISTRESS / MINOR / פטירה / הליך באנגלית). 328d1924 סגר את 7 הניסוחים
בעברית (כולל «הוא כבר לא בין החיים»); המקבילות באנגלית לא: אותה הגדרת «פער» (כרטיס רגיל, בלי «דחוף»; «טופל» ⇒
התזכורות חוזרות בלי השהיה מגינה). לקוחות דוברי אנגלית קיימים במערכת (מסלולי EN בכל הכוונות).
לידם — ניסוחים קרובים שכבר דחופים: «my mother died», «I'm not 18 yet», «I'm 17», «I don't want to live anymore»,
«I'm at my breaking point», «I filed for bankruptcy».
ערבית: הכול unknown (חוץ מהסרה) — לא נתמך, אבל לא מתויג בטעות; לא ממצא.
xfail(strict=True) פר-ניסוח; בקרות ירוקות."""
from datetime import date

import pytest

from app import conversation as cv

TODAY = date(2026, 11, 8)


def _d(text):
    return cv.respond(text, cv.Context(business="Studio", today=TODAY))


GAPS = ["he's no longer with us", "she is no longer with us", "she passed", "the account holder is deceased",
        "RIP dad", "I'm under 18", "this is her 16 year old son", "I'm in a really dark place",
        "I'm in debt relief proceedings"]


@pytest.mark.xfail(strict=True, reason="213🟠: ניסוח מגין באנגלית ⇒ unknown/normal")
@pytest.mark.parametrize("text", GAPS)
def test_protective_english_variant_is_urgent(text):
    d = _d(text)
    assert d.escalate == cv.Escalation.URGENT, (d.intent, d.escalate)


@pytest.mark.parametrize("text", ["my mother died", "I'm not 18 yet", "I'm 17", "I don't want to live anymore",
                                  "I'm at my breaking point", "I filed for bankruptcy"])
def test_control_close_english_variants_urgent(text):
    assert _d(text).escalate == cv.Escalation.URGENT


@pytest.mark.parametrize("text", ["I want to end this subscription", "he no longer works here", "my husband will pay"])
def test_control_no_overmatch(text):
    assert _d(text).intent.value not in ("distress", "minor")

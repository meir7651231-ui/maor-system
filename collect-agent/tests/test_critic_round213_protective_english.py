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


# ── תוקן (גבייה סוכן 21.11): בקרות נוספות נגד התראת-שווא לרגקסים החדשים ─────────────────────────────────
@pytest.mark.parametrize("text", ["she passed the invoice to accounting", "he passed the exam, will pay friday",
                                  "my 16 year old son will pay tomorrow", "this is the 16 year old invoice?",
                                  "I'm under budget this month", "RIP my wallet lol",
                                  "I'm in a bad place financially, can I pay in installments?"])
def test_new_patterns_do_not_overmatch(text):
    d = _d(text)
    assert d.intent.value not in ("distress", "minor") and "sensitive" not in d.tags, (text, d.intent, d.tags)


@pytest.mark.parametrize("text,tag", [("he's no longer with us", "sensitive"), ("RIP dad", "sensitive"),
                                      ("I'm in debt relief proceedings", "insolvency"), ("I'm under 18", "minor")])
def test_english_variants_get_the_same_tags_as_hebrew(text, tag):
    """כמו המקבילות בעברית: תגית ההשהיה הנכונה (רגיש / חדלות פירעון / קטין) — לא רק «דחוף»."""
    d = _d(text)
    assert tag in d.tags and d.stop != cv.Stop.NONE, (d.intent, d.tags, d.stop)

"""critic סבב 63 (המשך 62): ניסוחים טבעיים לכוונות קריטיות שזוהו `unknown` (בלי עצירה, והתזכורות ממשיכות):
  • קטין: «אני רק בן 14», «זה הטלפון של הבן שלי, הוא בן 12» ⇒ תזכורות חוב לקטין
  • מספר שגוי: «המספר הזה כבר לא שלה», «לא אני, טעות» ⇒ מידע על חוב לאדם זר
  • מצוקה: «אני בדיכאון», «אני במצב נוראי», «אני לא יכול יותר» ⇒ בלי עצירה ובלי דחיפות
  • משפטי: «אני מגיש תלונה»
הבדיקה לפי **ההשלכה** (עצירה/דחיפות), לא רק לפי התווית, ועם רשימה שלילית נגד בליעת יתר."""
from __future__ import annotations

from datetime import date

import pytest

from app.conversation import Context, Escalation, Intent, OpenInvoice, Stop, detect, respond

CTX = Context(today=date(2026, 11, 8), business="סטודיו", customer_name="דנה כהן",
              invoices=(OpenInvoice("1001", 120000, due=date(2026, 10, 1)),), payment_link="https://pay.example/x")

CASES = [
    ("אני רק בן 14", Intent.MINOR), ("אני רק בת 15", Intent.MINOR),
    ("זה הטלפון של הבן שלי, הוא בן 12", Intent.MINOR), ("זה המספר של הבת שלי היא בת 16", Intent.MINOR),
    ("המספר הזה כבר לא שלה", Intent.WRONG_PERSON), ("המספר כבר לא שלו", Intent.WRONG_PERSON),
    ("לא אני, טעות", Intent.WRONG_PERSON),
    ("אני בדיכאון", Intent.DISTRESS), ("אני במצב נוראי", Intent.DISTRESS),
    ("אני לא יכול יותר", Intent.DISTRESS), ("אני לא יכולה יותר", Intent.DISTRESS),
    ("אני מגיש תלונה", Intent.LEGAL), ("אגיש תלונה", Intent.LEGAL),
]
NEGATIVE = ["אני לא יכול לשלם יותר מ-300 בחודש", "הבן שלי ישלם", "אני בן אדם הגון, אשלם מחר",
            "שילמתי כבר", "אפשר פריסה?", "תודה", "המספר הזה של העסק"]


@pytest.mark.parametrize("text,intent", CASES)
def test_detected(text, intent):
    assert intent in detect(text), (text, [i.value for i in detect(text)])


@pytest.mark.parametrize("text,intent", CASES)
def test_consequence_is_a_stop(text, intent):
    d = respond(text, CTX)
    assert d.stop != Stop.NONE, (text, d.intent.value, d.stop.value)
    if intent == Intent.DISTRESS:
        assert d.escalate == Escalation.URGENT and not d.auto_send, (text, d.escalate.value)


@pytest.mark.parametrize("text", NEGATIVE)
def test_no_overmatch(text):
    got = set(detect(text)) & {Intent.MINOR, Intent.WRONG_PERSON, Intent.DISTRESS, Intent.LEGAL}
    assert not got, (text, [i.value for i in got])

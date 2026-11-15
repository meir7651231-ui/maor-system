"""critic סבב 80 · רגרסיות של סבב 5 במנוע (7b028d0e) — אותה תבנית כמו סבב 4 (critic סבב 79): חוק discard חדש
עם רשימת חריגים צרה מוריד כוונה מגינה בביטחון.
1. «אתם עובדים עם עו"ד? … ואני אפנה אליו» / «יש לכם עו"ד? שידבר עם עורך הדין שלי» ⇒ היה legal דחוף, נהיה unknown.
2. «ואם לא אשלם…? אני לא חייב לכם כלום» / «מה יקרה אם לא אשלם? החשבונית הזאת לא שלי» ⇒ היה dispute, נהיה unknown.
3. (פספוס של המחלקה החדשה עצמה) «תקנו לי את הפרטים בקבלה ואז אשלם» ⇒ promise; צפוי dispute (תיקון לפני תשלום).
תיקון מבני: סמני הגנה משותפים (_KEEPS_DISPUTE / _KEEPS_LEGAL) שכל חוקי ה-discard מכבדים — לא חריג לכל חוק."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text, intent", [
    ('אתם עובדים עם עו"ד? כי גם לי יש עורך דין ואני אפנה אליו', Intent.LEGAL),
    ("יש לכם עורך דין? שידבר עם עורך הדין שלי", Intent.LEGAL),
    ("ואם לא אשלם, מה תעשו? אני לא חייב לכם כלום", Intent.DISPUTE),
    ("מה יקרה אם לא אשלם? החשבונית הזאת לא שלי", Intent.DISPUTE),
    ("תקנו לי את הפרטים בקבלה ואז אשלם", Intent.DISPUTE),
])
def test_protective_intent_kept(text, intent):
    d = _d(text)
    assert d.intent == intent and d.escalate == Escalation.URGENT, (d.intent, d.escalate)


def test_round5_fixes_still_hold():
    assert _d('אתם עובדים עם עו"ד?').intent != Intent.LEGAL
    assert _d("מה יקרה אם לא אשלם?").intent != Intent.DISPUTE

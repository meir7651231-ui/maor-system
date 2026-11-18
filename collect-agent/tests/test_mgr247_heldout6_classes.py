"""מנהל הפעלה 247 · סט מוחזק #6 (עיוור) — תיקון **לפי מחלקה**, בניסוחים שונים מהסט בכוונה.

1. 🔴 מצוקה באנגלית בצורות נטייה: «ending it all, please stop» נבלע כ**הסרה לצמיתות בלי הסלמה**
   (בעל העסק לא קיבל התראה דחופה על אדם שכותב על סיום חייו). הכלל היה רק «end it all» בזמן הווה.
2. מחלוקת באנגלית — מוצר פגום / לא התקבל / ביטול / «not paying for this» — נפלה ל«לא ברור» בלי השהיה.
3. «ביטלתי את המנוי/החוזה» ⇒ מחלוקת (היה רק הזמנה/עסקה/שירות).
מלכודות: «end of the month», «stop texting lol, paying tomorrow» — לא מצוקה ולא מחלוקת.
"""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t, ch="sms"):
    return respond(t, build_ctx({"channel": ch}))


CH = pytest.mark.parametrize("ch", ["sms", "email"])

DISTRESS_EN = [
    "honestly thinking about ending it all",
    "i ended up wanting to end my own life",
    "considering taking my own life, just stop",
    "I don't want to live anymore",
    "I do not want to be alive",
    "there is no reason to go on",
    "everyone would be better off dead without me, better off dead",
    "life is no longer worth anything to me",
]


@CH
@pytest.mark.parametrize("text", DISTRESS_EN)
def test_english_distress_urgent_and_paused(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.DISTRESS
    assert d.escalate == Escalation.URGENT
    assert d.stop in (Stop.PAUSE, Stop.PERMANENT)
    assert "sensitive" in d.tags


@CH
def test_distress_with_stop_is_not_plain_opt_out(ch):
    """המקרה ההרסני: «stop» באותה הודעה לא מוריד את ההסלמה הדחופה."""
    d = _d("ending my life soon, stop messaging", ch)
    assert d.intent == Intent.DISTRESS and d.escalate == Escalation.URGENT


DISPUTE_EN = [
    "the unit arrived defective",
    "it's faulty and I'm not paying for it",
    "I refuse to pay for a damaged product",
    "we never received the goods",
    "I did not get the service you billed",
    "I canceled the contract last year",
    "I won't pay a cent of this",
]


@CH
@pytest.mark.parametrize("text", DISPUTE_EN)
def test_english_dispute_urgent(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.DISPUTE
    assert d.escalate == Escalation.URGENT
    assert d.stop != Stop.NONE


@CH
@pytest.mark.parametrize("text", ["ביטלתי את המינוי עוד באוגוסט", "ביטלתי את ההסכם איתכם", "ביטלתי את ההתקשרות מזמן"])
def test_hebrew_cancelled_subscription_dispute(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT


@CH
@pytest.mark.parametrize("text", [
    "stop texting lol, paying tomorrow",
    "I'll pay by the end of the month",
    "will pay at the end of my shift",
    "paying today, sorry it took so long",
])
def test_traps_not_distress_not_dispute(text, ch):
    d = _d(text, ch)
    assert d.intent not in (Intent.DISTRESS, Intent.DISPUTE)
    assert "sensitive" not in d.tags

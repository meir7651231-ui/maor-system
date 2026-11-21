"""גבי מנוע 21.11 — בדיקה שיטתית של כוונות מגינות בווריאציות שלא נבדקו (50 ניסוחים, 4 פערים — כולם ל«לא ברור»
בלי השהיה ⇒ התזכורות ממשיכות): מצוקה בכתיב «כח» / מילה באמצע / «לא בא לי לחיות»; תביעה בהווה/סביל באנגלית;
«אין פה X» / «X לא גר פה» באנגלית ובעברית. ניסוחים חדשים, ולצידם כלל-צמצום (לא נבלעים)."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["אין לי כח לחיות יותר", "אין לי כח כבר לחיים", "לא בא לי לחיות עם כל החובות האלה"])
def test_distress_variants(text):
    d = _d(text)
    assert Intent.DISTRESS in d.all_intents and d.escalate == Escalation.URGENT and d.stop == Stop.PAUSE


@pytest.mark.parametrize("text", ["We're suing your company.", "you are going to get sued", "im suing u"])
def test_legal_progressive_passive(text):
    d = _d(text)
    assert Intent.LEGAL in d.all_intents and d.escalate == Escalation.URGENT


@pytest.mark.parametrize("text", ["no Dana here", "There's no dana here.", "this isn't dana's phone",
                                  "Dana does not live here anymore", "nobody by that name here", "דנה כבר לא גרה כאן"])
def test_wrong_person_variants(text):
    assert _d(text).intent == Intent.WRONG_PERSON


# כלל-צמצום: «no X here» של מצב (כסף/קליטה/בעיה) ≠ מספר שגוי (הסרה לצמיתות + מחיקת הטלפון)
@pytest.mark.parametrize("text", ["no cash here", "no signal here", "no problem here", "no rush here", "no luck here",
                                  "I'm not suing anyone, ill pay friday", "אין לי כוח יותר"])
def test_not_overcaught(text):
    d = _d(text)
    assert d.intent != Intent.WRONG_PERSON
    assert Intent.LEGAL not in d.all_intents and Intent.DISTRESS not in d.all_intents

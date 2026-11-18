"""critic סבב 121 · פערים ותיקים: ניסוחים יומיומיים בסיסיים (5 לכל כוונה מגינה, עברית+אנגלית) שלא נתפסו —
«I don't owe you anything» / «i owe you nothing» / «I already cancelled» / «כבר ביטלתי» ⇒ unknown (בלי מחלוקת דחופה);
«אני לא מכיר את החוב הזה» ⇒ מספר שגוי *לצמיתות* (הלקוח נמחק מהגבייה במקום מחלוקת לבעל העסק);
«I'm reporting you to the police» ⇒ unknown (לא משפטי); «I feel hopeless» / «I'm really struggling» ⇒ unknown
(לא מצוקה דחופה); «I'm just a kid» / «I'm in middle school» ⇒ unknown (לא קטין); «payment was made» /
«the payment went through» ⇒ unknown (לא טענת תשלום); «i don't know who that is» ⇒ unknown (לא מספר שגוי).
התזכורות כבר נחסמו (awaiting_owner) — הפער הוא בדחיפות/בסוג הכרטיס ובחסימה לצמיתות."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


CASES = [
    ("I don't owe you anything", Intent.DISPUTE), ("i dont owe you anything", Intent.DISPUTE),
    ("I don't owe you", Intent.DISPUTE), ("i owe you nothing", Intent.DISPUTE),
    ("I already cancelled", Intent.DISPUTE), ("i cancelled", Intent.DISPUTE),
    ("כבר ביטלתי", Intent.DISPUTE), ("ביטלתי את זה", Intent.DISPUTE),
    ("אני לא מכיר את החוב הזה", Intent.DISPUTE), ("אין לי מושג על מה החוב", Intent.DISPUTE),
    ("I'm reporting you to the police", Intent.LEGAL), ("i'll call the police", Intent.LEGAL),
    ("I feel hopeless", Intent.DISTRESS), ("I'm really struggling", Intent.DISTRESS),
    ("im struggling", Intent.DISTRESS),
    ("I'm just a kid", Intent.MINOR), ("im just a kid", Intent.MINOR), ("I'm in middle school", Intent.MINOR),
    ("i'm in 8th grade", Intent.MINOR),
    ("payment was made", Intent.PAID_CLAIM), ("the payment went through", Intent.PAID_CLAIM),
    ("i don't know who that is", Intent.WRONG_PERSON),
]


@pytest.mark.parametrize("text,want", CASES)
def test_everyday_phrasing(text, want):
    d = _d(text)
    assert d.intent == want, (text, d.intent)
    if want in (Intent.DISPUTE, Intent.LEGAL, Intent.DISTRESS, Intent.MINOR):
        assert d.stop == Stop.PAUSE and d.escalate == Escalation.URGENT, (d.stop, d.escalate)


# מלכודות: אסור שהתבניות החדשות יתפסו ניסוחים תמימים
TRAPS = [
    ("I'm struggling to find the payment link", Intent.DISTRESS),
    ("i'm struggling with the app", Intent.DISTRESS),
    ("I cancelled my card, can you send a new link?", Intent.DISPUTE),
    ("did the payment go through?", Intent.PAID_CLAIM),
    ("my kid will pay tomorrow", Intent.MINOR),
    ("אני לא מכיר את דנה", Intent.DISPUTE),
    ("how much do I owe you", Intent.DISPUTE),
]


@pytest.mark.parametrize("text,bad", TRAPS)
def test_traps(text, bad):
    assert _d(text).intent != bad, text


def test_name_still_wrong_person():
    assert _d("לא מכיר את החוב של מישהו אחר, טעות במספר").intent == Intent.WRONG_PERSON

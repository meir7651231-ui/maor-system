"""critic סבב 136 · (1) פער ותיק — חיוב כפול בניסוחים יומיומיים ⇒ unknown (בלי מחלוקת דחופה): «חייבו לי את הכרטיס
פעמיים», «ירד לי פעמיים», «גביתם פעמיים», «רואה שני חיובים», «you took the money twice», «I see two charges»,
«there are 2 charges for the same invoice». (2) באג — הודעת היעדרות בחוג «הילד חולה היום ולא יגיע לשיעור» ⇒
cant_pay+sensitive ⇒ השהיה + מייל דחוף. זו לא בעיית תשלום; בעסק של חוגים — הודעה יומיומית."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("t", [
    "חייבו לי את הכרטיס פעמיים", "ירד לי פעמיים", "ירד לי פעמיים מהכרטיס", "גביתם פעמיים", "רואה שני חיובים",
    "יש לי שני חיובים על אותה חשבונית", "you took the money twice", "I see two charges",
    "there are 2 charges for the same invoice",
])
def test_double_charge_is_dispute(t):
    d = _d(t)
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT, (t, d.intent)


@pytest.mark.parametrize("t,bad", [
    ("אפשר לחייב אותי בשני חיובים?", Intent.DISPUTE), ("can you split it into two charges?", Intent.DISPUTE),
    ("ירדתי פעמיים לבדוק את התיבה ולא מצאתי את החשבונית", Intent.DISPUTE),
])
def test_double_charge_traps(t, bad):
    assert _d(t).intent != bad, (t, _d(t).intent)


@pytest.mark.parametrize("t", ["הילד חולה היום ולא יגיע לשיעור", "הבת שלי חולה ולא תגיע לחוג השבוע",
                               "הוא חולה, לא יבוא היום"])
def test_sick_kid_absence_not_urgent_cant_pay(t):
    d = _d(t)
    assert d.intent != Intent.CANT_PAY and d.escalate != Escalation.URGENT, (t, d.intent, d.escalate)


@pytest.mark.parametrize("t", ["אני חולה ולא יכול לשלם עכשיו", "אני מאושפז, לא אוכל לשלם החודש",
                               "הבן שלי חולה מאוד ואין לי כסף לשלם"])
def test_real_illness_hardship_still_urgent(t):
    d = _d(t)
    assert d.escalate == Escalation.URGENT, (t, d.intent, d.escalate)

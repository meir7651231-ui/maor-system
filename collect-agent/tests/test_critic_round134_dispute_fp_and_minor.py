"""critic סבב 134 · (1) באג שלי מסבב 133 — מחלוקת-שווא דחופה על הודעות שגרתיות (השהיה + מייל דחוף):
«ביקשתי לבטל את הוראת הקבע ואשלם בהעברה», «I asked to cancel my card so send a new link», «they didnt finish yet,
will pay when done», «לא סיימו את השיעור אתמול כי חליתי», «ביטלתי בזמן את הכרטיס הישן», «you quoted me 500 and I will
pay it friday», «the tech didnt come yet but its fine», «עשו רק חצי שיעור… הכל בסדר», «the delivery never arrived?
oh it just came». התיקון: תבניות 133 בבדיקה נפרדת עם וטו (כוונת תשלום / «הכל בסדר» / «הגיע בסוף» / כרטיס,
הוראת קבע, פגישה). מחלוקת אמיתית (בלי וטו) נשארת.
(2) פער ותיק — קטין בסלנג: «im a teen», «im in high school», «im not even 18», «u texted a 14 yo» ⇒ unknown."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("t", [
    "ביקשתי לבטל את הוראת הקבע ואשלם בהעברה", "המוצר לא הגיע עדיין אבל אשלם עכשיו",
    "ביקשתי לבטל את הפגישה של מחר, אפשר לקבוע אחרת?", "I asked to cancel my card so send a new link",
    "they didnt finish yet, will pay when done", "you quoted me 500 and I will pay it friday",
    "לא סיימו את השיעור אתמול כי חליתי", "ביטלתי בזמן את הכרטיס הישן, שלחו קישור",
    "the delivery never arrived? oh it just came, thanks", "the tech didnt come yet but its fine, will pay",
    "עשו רק חצי שיעור כי הילד היה חולה, הכל בסדר", "אמרו לי שזה יעלה 500 וזה בדיוק מה שעלה, תודה",
])
def test_routine_not_urgent_dispute(t):
    d = _d(t)
    assert d.intent != Intent.DISPUTE and Intent.DISPUTE not in d.secondary, (t, d.intent, d.secondary)


@pytest.mark.parametrize("t", [
    "המוצר לא הגיע", "the technician never showed up", "ביקשתי לבטל לפני שבוע", "ביקשתי ביטול ועדיין מחייבים",
    "I asked to cancel a week ago", "we never agreed on this price", "המוצר לא הגיע, תודה",
    "השירות לא סופק ואני לא משלם", "they didnt finish the job",
])
def test_real_disputes_kept(t):
    assert _d(t).intent == Intent.DISPUTE, (t, _d(t).intent)


@pytest.mark.parametrize("t", ["im a teen", "im in high school", "im not even 18", "u texted a 14 yo",
                               "i'm only a teenager", "im 13 years old"])
def test_slang_minor(t):
    d = _d(t)
    assert d.intent == Intent.MINOR and d.escalate == Escalation.URGENT, (t, d.intent)


@pytest.mark.parametrize("t", ["my son is in high school, ill pay friday", "i was a teen when i opened this lol",
                               "my 14 yo daughter took the class, paying now"])
def test_minor_traps(t):
    assert _d(t).intent != Intent.MINOR, (t, _d(t).intent)

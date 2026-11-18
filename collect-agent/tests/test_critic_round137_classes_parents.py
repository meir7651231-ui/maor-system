"""critic סבב 137 · עסק חוגים — הורים.
(1) 🟡 פער ותיק: תלונות אמיתיות של הורים ⇒ unknown (בלי מחלוקת דחופה): «המורה לא הגיעה 3 פעמים», «חייבתם על חודש
שהחוג לא התקיים», «החוג בוטל פעמיים ולא קיבלנו החזר», «השיעורים לא התקיימו בכלל בנובמבר», «אתם גובים על שיעורים שלא
היו», «the teacher didnt show up three times», «you charged for a month with no classes», «classes were cancelled
and no refund», «הבטחתם קבוצה קטנה ויש 25 ילדים», «לא הודעתם שהחוג בוטל».
(2) המשך לסבב 136: «הילדה חולה השבוע, נחזור בשבוע הבא» ⇒ cant_pay דחוף («נחזור» חסר בסימני הנוכחות)."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("t", [
    "המורה לא הגיעה 3 פעמים", "חייבתם על חודש שהחוג לא התקיים", "החוג בוטל פעמיים ולא קיבלנו החזר",
    "השיעורים לא התקיימו בכלל בנובמבר", "אתם גובים על שיעורים שלא היו", "the teacher didnt show up three times",
    "you charged for a month with no classes", "classes were cancelled and no refund",
    "הבטחתם קבוצה קטנה ויש 25 ילדים", "לא הודעתם שהחוג בוטל",
])
def test_parent_complaint_is_dispute(t):
    d = _d(t)
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT, (t, d.intent)


@pytest.mark.parametrize("t", [
    "הילדה חולה השבוע, נחזור בשבוע הבא", "המורה לא הגיעה היום, יש שיעור מחר?", "השיעור לא התקיים היום? לא ראיתי הודעה",
    "החוג בוטל השבוע? מתי השיעור הבא?", "הבטחתם לשלוח קבלה, אשמח לקבל",
    "the teacher didnt show up today, is class tomorrow?",
])
def test_parent_routine_not_dispute_or_urgent(t):
    d = _d(t)
    assert d.intent not in (Intent.DISPUTE, Intent.CANT_PAY), (t, d.intent)
    assert d.escalate != Escalation.URGENT, (t, d.escalate)

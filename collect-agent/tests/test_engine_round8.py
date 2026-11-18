"""סבב 8 — מחלקות מהמדידה המשפטית (legal 15.11) + השער המחמיר ("לא ברור" לא עוצר). טקסטים חדשים."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def d(text):
    return respond(text, build_ctx({}))


@pytest.mark.parametrize("text", ["תמחקו את המידע שלי מהמערכת שלכם", "אבקש להסיר את כל פרטיי מהמאגר",
                                  "די להציק לי", "אני מבקש לא לקבל מכם שום הודעה נוספת"])
def test_opt_out_and_deletion_requests(text):
    r = d(text)
    assert r.intent == Intent.OPT_OUT and r.stop == Stop.PERMANENT


@pytest.mark.parametrize("text", ["לפי חוק הגנת הפרטיות אני רוצה לראות איזה מידע שמור עליי",
                                  "אבקש לעיין במידע שנאסף עליי ולתקן אותו"])
def test_privacy_access_request_is_urgent_legal(text):
    r = d(text)
    assert r.intent == Intent.LEGAL and r.escalate == Escalation.URGENT


@pytest.mark.parametrize("text", ["הבן שלי בכיתה ד׳ קיבל את המסרון", "הילדה שלי בגן ראתה את ההודעה בטלפון"])
def test_child_received_message_is_minor(text):
    assert d(text).intent == Intent.MINOR


@pytest.mark.parametrize("text", ["ההודעה הגיעה אליי בטעות, אני לא מיכל", "קיבלתי בטעות, אני לא הלקוח הזה"])
def test_received_by_mistake_is_wrong_person(text):
    assert d(text).intent == Intent.WRONG_PERSON


@pytest.mark.parametrize("text", ["מצורף צילום של ההעברה", "בעלי אמר שהוא כבר העביר לכם", "אחי טוען ששילם בשבוע שעבר"])
def test_proof_or_third_party_payment_is_paid_claim(text):
    r = d(text)
    assert r.intent == Intent.PAID_CLAIM and r.stop == Stop.PAUSE


@pytest.mark.parametrize("text", ["יש לי תיק איחוד בהוצאה לפועל", "החשבון שלי מעוקל ואני לא יודע מה לעשות"])
def test_enforcement_consolidation_or_seizure_is_urgent_hardship(text):
    r = d(text)
    assert r.escalate == Escalation.URGENT and r.stop == Stop.PAUSE and r.plan == ()

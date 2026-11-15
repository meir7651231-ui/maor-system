"""סבב 3 של המנוע — מחלקות שנחשפו במדידה החיצונית הראשונה (evals/heldout/RESULTS.md, 15.11).
הטקסטים כאן חדשים (לא מהסט החיצוני), כדי שהסט ימשיך למדוד ולא יהפוך לכיוונון."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def d(text, **ctx):
    return respond(text, build_ctx(ctx))


# ── טעויות בטוחות-בעצמן ──
@pytest.mark.parametrize("text", ["אל תסירו אותי, פשוט תזכירו בעוד חודש",
                                  "אין צורך להסיר אותי מהרשימה, אשלם מחר",
                                  "לא ביקשתי להסיר אותי"])
def test_negated_opt_out_is_not_opt_out(text):
    r = d(text)
    assert Intent.OPT_OUT not in r.all_intents and r.stop != Stop.PERMANENT


@pytest.mark.parametrize("text", ["אני עורך דין במקצוע, תשלחו בבקשה חשבונית מס",
                                  "אני עורכת דין, אשלם עד מחר"])
def test_self_described_lawyer_is_not_legal_threat(text):
    assert Intent.LEGAL not in d(text).all_intents


def test_lawyer_threat_still_legal():
    assert d("אני עורך דין ואני אתבע אתכם").intent == Intent.LEGAL


@pytest.mark.parametrize("text", ["קשה לי לדבר בטלפון, תכתבו לי במייל", "קשה לי להבין את הפירוט"])
def test_hard_for_me_without_money_is_not_hardship(text):
    assert Intent.CANT_PAY not in d(text).all_intents


def test_dated_promise_with_family_illness_stays_sensitive_pause():
    """הכרעת המבקר (סבב 18) גוברת על הציפייה xc44 בסט החיצוני: מחלה במשפחה + תאריך ⇒ השהיה רגישה
    שלא משתחררת לבד, ולא הבטחה. בטוח יותר; בעל העסק מחדש ידנית."""
    r = d("הבת שלי מאושפזת, אעביר ביום חמישי")
    assert r.intent == Intent.CANT_PAY and r.stop == Stop.PAUSE and r.pause_until is not None


# ── פספוסים בטוחים לפי מחלקה ──
@pytest.mark.parametrize("text", ["איני מעוניינת לקבל מכם מיילים נוספים", "הנני מבקש להפסיק את משלוח ההודעות"])
def test_formal_opt_out(text):
    assert d(text).intent == Intent.OPT_OUT


@pytest.mark.parametrize("text", ["Не присылайте мне больше сообщения", "أرجو عدم مراسلتي مرة أخرى"])
def test_foreign_opt_out_stops_permanently_and_escalates(text):
    r = d(text)
    assert r.stop == Stop.PERMANENT and r.escalate != Escalation.NONE and r.reply is None


@pytest.mark.parametrize("text", ["הודעה על חוב של אדם אחר הגיעה אליי", "אין לי שום קשר לחברה שלכם",
                                  "מי שאתם מחפשים לא גר כאן כבר"])
def test_wrong_person_variants(text):
    assert d(text).intent == Intent.WRONG_PERSON


@pytest.mark.parametrize("text", ["אין לי כוח לקום מהמיטה", "הכל נופל עליי בבת אחת",
                                  "אני מרגישה שאין טעם לשום דבר"])
def test_indirect_distress_round3(text):
    r = d(text)
    assert r.intent == Intent.DISTRESS and r.escalate == Escalation.URGENT


@pytest.mark.parametrize("text,n", [("אפשר בארבע פעימות?", 4), ("אפשר בהוראת קבע?", 3)])
def test_plan_variants(text, n):
    r = d(text)
    assert r.intent == Intent.PLAN_REQUEST and len(r.plan) == n


def test_promise_spelling_variant():
    assert d("נסדיר את זה עד יום רביעי").intent == Intent.PROMISE


def test_bereavement_word_order_is_urgent():
    r = d("נפטרה לי אמא, אחזור אליכם")
    assert "deceased" in r.tags or r.escalate == Escalation.URGENT

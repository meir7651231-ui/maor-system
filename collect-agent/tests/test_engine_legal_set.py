"""סט משפט מוחזק (external-2026-11-15-legal, 2425167) — הכשלים שנותרו אחרי סבבים 7–12, תוקנו לפי מחלקה
(הניסוחים כאן חדשים, לא טקסט הסט):
  1. שאלה על מקור המידע («מאיפה יש לכם את הטלפון שלי, מי עוד קיבל») ⇒ unknown. עכשיו who_is_this; כשנשאל
     גם למי הועבר המידע ⇒ כרטיס לבעל העסק (data_source), לא תשובה אוטומטית. «מאיפה המספר» לבד = זיהוי (d146).
  2. «הייתי במילואים, מעביר השבוע» ⇒ cant_pay. המילואים = הסבר לעיכוב ⇒ הבטחה עיקרית; reservist + השהיה נשמרים.
  3. «צו פתיחת הליכים בבית המשפט» ⇒ legal. בית המשפט של הליך החדלות ⇒ cant_pay עיקרי, legal משני (דחוף+השהיה).
  4. (נמצא בדרך) «לא מעביר מחר» ⇒ promise! הבטחה-בהווה עקפה את שומר השלילה. ועכשיו «לא מעביר מחר כלום» ⇒ מחלוקת.
"""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t, ch="sms"):
    return respond(t, build_ctx({"channel": ch}))


@pytest.mark.parametrize("text", ["מאיפה השגתם את המספר שלי?", "איך הגעתם לפרטים שלי"])
def test_data_source_question_is_who_is_this(text):
    assert _d(text).intent == Intent.WHO_IS_THIS


@pytest.mark.parametrize("text", ["מאיפה קיבלתם את המייל שלי ומי עוד רואה אותו", "למי עוד נתתם את המספר שלי?"])
def test_data_sharing_question_goes_to_owner(text):
    d = _d(text)
    assert d.intent == Intent.WHO_IS_THIS and "data_source" in d.tags
    assert d.escalate == Escalation.NORMAL and not d.auto_send


@pytest.mark.parametrize("text", ["חזרתי מהמילואים, משלמת עד סוף החודש", "סורי, הייתי במילואים. מעבירה מחר"])
def test_reservist_explanation_with_promise(text):
    d = _d(text)
    assert d.intent == Intent.PROMISE and Intent.CANT_PAY in d.secondary
    assert "reservist" in d.tags and d.stop == Stop.PAUSE and d.escalate == Escalation.NORMAL


@pytest.mark.parametrize("text", ["אני במילואים, אעביר כשאחזור", "הייתי במילואים ואין לי כסף, אעביר בחודש הבא"])
def test_reservist_still_cant_pay(text):
    d = _d(text)
    assert d.intent == Intent.CANT_PAY and "reservist" in d.tags


def test_insolvency_court_order_is_cant_pay_with_legal_kept():
    d = _d("ניתן לי צו פתיחת הליכים מבית המשפט, תפנו לנאמן", "email")
    assert d.intent == Intent.CANT_PAY and Intent.LEGAL in d.secondary
    assert {"legal", "insolvency"} <= set(d.tags) and d.escalate == Escalation.URGENT and d.stop == Stop.PAUSE


def test_real_lawsuit_threat_stays_legal():
    d = _d("נגיש נגדכם תביעה, ואני גם בחדלות פירעון", "email")
    assert d.intent == Intent.LEGAL and d.escalate == Escalation.URGENT


@pytest.mark.parametrize("text", ["לא מעביר מחר", "אני לא משלמת היום"])
def test_negated_present_promise_is_not_promise(text):
    d = _d(text)
    assert d.intent != Intent.PROMISE and d.escalate != Escalation.NONE


@pytest.mark.parametrize("text", ["לא מעביר מחר כלום", "לא משלם בכלל שקל"])
def test_negated_with_nothing_is_dispute(text):
    d = _d(text)
    assert d.intent == Intent.DISPUTE and d.stop == Stop.PAUSE


@pytest.mark.parametrize("text", ["משלמת עד סוף החודש", "מעבירים מחר", "תוך שבוע אני מסדר"])
def test_present_promise_still_promise(text):
    assert _d(text).intent == Intent.PROMISE

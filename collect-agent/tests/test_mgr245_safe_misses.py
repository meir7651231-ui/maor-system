"""מנהל הפעלה 245 · AI — הפספוסים הבטוחים ב-qa2/qa3 (נפלו ל«לא ברור» ⇒ בעל העסק), מתוקנים **לפי מחלקה**.

לא מזיקים (בעל העסק ראה כרטיס), אבל עלו לו בזמן ולא קיבלו תשובה אוטומטית:
1. פריסה בשגיאת כתיב «תשלומיים» ⇒ plan_request.
2. שאלה על **דרך/מקום** תשלום («איך אני משלמת?», «לשלם בסניף הדואר/בבנק») ⇒ how_to_pay.
   הלקח מ-qa3: «משלמת» בזמן הווה **אינו** טענת תשלום.
3. תודה מקוצרת באנגלית («thx», «ty») ⇒ thanks.
4. **חברת ביטוח** משלמת/תכסה ⇒ promise. שלילה («הביטוח לא ישלם») ⇒ לא הבטחה.
5. קושי כלכלי / «נכנסתי למינוס» ⇒ cant_pay (מגן: בלי קישור תשלום דוחק).
6. «פירוט של מה כלול» ⇒ copy_request · «מעדיף לדבר עם מישהו / יש טלפון?» ⇒ callback.
הוכרע **לא** לשנות: «אוקיי»/«בסדר» לבד ⇒ thanks (במכוון ברשימת התודה; לא עוצר ולא מסלים — פער תווית, לא טעות).
הניסוחים כאן שונים מהסט המוחזק בכוונה.
"""
import pytest

from app.conversation import Intent, Stop, detect, respond
from evals.harness import build_ctx


def _d(t, ch="sms"):
    return respond(t, build_ctx({"channel": ch}))


CH = pytest.mark.parametrize("ch", ["sms", "email"])


@CH
@pytest.mark.parametrize("text", ["אפשר לשלם בתשלומיים", "יש אופציה בתשלומיים?", "בתשלומיים זה אפשרי?"])
def test_installments_typo(text, ch):
    assert _d(text, ch).intent == Intent.PLAN_REQUEST


@CH
@pytest.mark.parametrize("text", ["איך אנחנו משלמים את זה?", "רגע, איך אני מעבירה?", "ניתן לשלם בבנק?",
                                  "אפשר להפקיד בסניף?", "can I pay at the post office?"])
def test_payment_method_or_place_is_how_to_pay(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.HOW_TO_PAY, d.intent
    assert d.intent != Intent.PAID_CLAIM


@pytest.mark.parametrize("text", ["איך אני משלמת?", "איך אני משלם"])
def test_present_tense_pay_is_not_paid_claim(text):
    assert Intent.PAID_CLAIM not in detect(text)


@CH
@pytest.mark.parametrize("text", ["thx", "ok thx!", "tnx 🙏", "ty"])
def test_short_english_thanks(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.THANKS and d.stop == Stop.NONE


@pytest.mark.parametrize("text", ["ty for nothing", "thx but I won't pay"])
def test_thanks_traps(text):
    assert _d(text).intent != Intent.THANKS


@CH
@pytest.mark.parametrize("text", ["שלחתי את זה לביטוח, הם יכסו", "חברת הביטוח שלי משלמת את זה",
                                  "הביטוח יעביר לכם ישירות", "ביטוח המשנה מכסה, זה בטיפול"])
def test_insurance_pays_is_promise(text, ch):
    assert _d(text, ch).intent == Intent.PROMISE


@pytest.mark.parametrize("text", ["הביטוח שלי לא ישלם", "הביטוח לא מכסה את זה", "הביטוח אף פעם לא משלם"])
def test_insurance_negation_is_not_promise(text):
    assert Intent.PROMISE not in detect(text)


@CH
@pytest.mark.parametrize("text", ["יש לנו קשיים כספיים בתקופה הזאת", "ירדתי למינוס והחודש לא אוכל",
                                  "נקלענו למינוס, צריך התחשבות"])
def test_financial_hardship_is_cant_pay(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.CANT_PAY, d.intent


@pytest.mark.parametrize("text", ["אפשר פרטים של מה בדיוק נכלל?", "מה כלול בחיוב הזה?"])
def test_whats_included_is_copy_request(text):
    assert _d(text).intent == Intent.COPY_REQUEST


@pytest.mark.parametrize("text", ["רוצה לדבר עם בן אדם", "צריכה לדבר עם נציג", "יש לכם טלפון?"])
def test_talk_to_human_is_callback(text):
    assert _d(text).intent == Intent.CALLBACK


@pytest.mark.parametrize("text", ["אוקיי", "בסדר"])
def test_bare_ack_stays_thanks_no_stop(text):
    d = _d(text)  # הכרעה מתועדת: לא unknown; לא עוצר ולא מסלים
    assert d.intent == Intent.THANKS and d.stop == Stop.NONE

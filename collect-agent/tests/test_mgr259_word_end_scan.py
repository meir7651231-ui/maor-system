"""מנהל הפעלה 259 · סריקת **סוף**-מילה (ההמשך של 250, שסרק תחילת-מילה).

השיטה: כל 517 חלקי התבניות ב-RX הורצו (עם שער תחילת-המילה של 250) על 67 אלף שורות עבריות מנורמלות מהריפו,
וחיפשנו התאמה שנגמרת **באמצע מילה** (אות עברית לפני הסוף ואחריו). 33 חלקים עלו; רובם תחיליות/שורשים מכוונים
(«פגומ»⇒«פגומה», «נפטר»⇒«נפטרה», «לא בוצע»⇒«לא בוצעה»). אלה שמשנים משמעות — נבדקו בהודעות אמת ותוקנו:
1. 🔴 «(ה)מספר שלי מ…» ⇒ מספר שגוי + **הסרה לצמיתות**: «המספר שלי משתנה בחודש הבא», «המספר שלי מעודכן»,
   «קיבלתי, תודה. המספר שלי מסתיים ב-55». ההודעה הבאה של הלקוח («אשלם ב-20») נבלעה כ-unknown_sender.
   גם «המספר שייך לי, תשלחו קישור». עכשיו «שלי/אצלי מ» רק עם ביטוי זמן, «שייך לי» רק עם זמן אחריו.
2. 🔴 «נזק» בתוך «נזקק/נזקקים» ⇒ מחלוקת דחופה + השהיה ללקוח שביקש עזרה.
3. «נפטר» בתוך «נפטרתי (מהחוב)» ⇒ אבל, השהיה ודחוף.
4. «מספר/פרטי החשבון» בתוך «החשבונית» ⇒ how_to_pay (פרטי בנק) במקום העתק חשבונית.
5. «התקשרו אלי» בתוך «אליו/אליה» ⇒ callback לצד ג׳.
   («יחזור/תתקשר אליכם» = צד ג׳ יחזור — נשאר callback, כמו «אחזור אליכם».)
diff על 1,130 טקסטי eval × 2 ערוצים × 4 מצבים: רק 4 טקסטים השתנו, ובכולם נפלה כוונה משנית שגויה
(wrong_person לצד opt_out; how_to_pay לצד copy_request). מוטציה: המנוע הקודם ⇒ 5/8 רצפי mgr259 נופלים (3 קריטיים).
"""
import pytest

from app import conversation as cv
from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t, ch="sms", **kw):
    return respond(t, build_ctx({"channel": ch, **kw}))


def _det(t):
    return cv.detect(cv.normalize(t))


CH = pytest.mark.parametrize("ch", ["sms", "email"])

# ── 1. מספר שגוי: רק בעלות על המספר לאורך זמן, לא כל «המספר שלי מ…» ──
NOT_WRONG = [
    "המספר שלי משתנה בחודש הבא",
    "המספר שלי מעודכן",
    "קיבלתי, תודה. המספר שלי מסתיים ב-55",
    "המספר שלי מחובר לווטסאפ, אפשר לשלוח לשם",
    "המספר שייך לי, תשלחו קישור",
    "המספר הזה שייך לי ואני אשלם מחר",
]


@CH
@pytest.mark.parametrize("text", NOT_WRONG)
def test_my_number_is_not_wrong_person(text, ch):
    d = _d(text, ch)
    assert Intent.WRONG_PERSON not in _det(text), text
    assert d.stop != Stop.PERMANENT, text


STILL_WRONG = [
    "המספר הזה שייך לי כבר שנתיים, אין פה דנה",
    "המספר הזה שייך לי מאז מרץ",
    "המספר שלי מלפני חודש, לא מכיר אף אחד כזה",
    "המספר אצלי מ-2024",
    "המספר הזה שלי רק מהחודש",
    "המספר שייך למישהו אחר",
    "המספר הזה שייכת לאמא שלי",
]


@CH
@pytest.mark.parametrize("text", STILL_WRONG)
def test_real_wrong_person_still_detected(text, ch):
    assert Intent.WRONG_PERSON in _det(text), text
    assert _d(text, ch).stop == Stop.PERMANENT, text


def test_opt_out_with_my_number_still_permanent():
    for t in ("תמחקו את המספר שלי מהמערכת שלכם", "תורידו את המספר שלי מהרשימות"):
        d = _d(t)
        assert d.intent == Intent.OPT_OUT and d.stop == Stop.PERMANENT, t


# ── 2. «נזק» ≠ «נזקק» ──
@CH
@pytest.mark.parametrize("text", ["אני נזקק לעזרה", "אנחנו נזקקים לזמן", "אני נזקקת להסדר"])
def test_nizkak_is_not_dispute(text, ch):
    d = _d(text, ch)
    assert Intent.DISPUTE not in _det(text), text
    assert d.escalate != Escalation.URGENT, text


@pytest.mark.parametrize("text", ["עשיתם נזק", "גרמתם נזק לרכב", "יש נזקים בקיר"])
def test_real_damage_still_dispute(text):
    assert Intent.DISPUTE in _det(text), text


# ── 3. «נפטרתי מ…» ≠ אבל ──
@pytest.mark.parametrize("text", ["נפטרתי מהחוב הזה כבר מזמן", "נפטרנו מהמנוי", "נפטרתם מהלקוח?"])
def test_got_rid_of_is_not_bereavement(text):
    assert Intent.CANT_PAY not in _det(text), text
    assert _d(text).stop != Stop.PAUSE, text


@pytest.mark.parametrize("text", ["אבא שלי נפטר", "היא נפטרה בשבוע שעבר", "הוריי נפטרו", "בעלי נפטר לפני חודש"])
def test_real_bereavement_still_pauses(text):
    d = _d(text)
    assert Intent.CANT_PAY in _det(text), text
    assert d.stop == Stop.PAUSE, text


# ── 4. «חשבונית» ≠ «חשבון (בנק)» ──
@CH
@pytest.mark.parametrize("text", ["מה מספר החשבונית?", "שלחו לי את פרטי החשבונית", "אפשר את מספר החשבונית?"])
def test_invoice_number_is_copy_request(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.COPY_REQUEST, text
    assert Intent.HOW_TO_PAY not in _det(text), text


@pytest.mark.parametrize("text", ["מה מספר החשבון שלכם?", "פרטי החשבון לתשלום?", "מה מספר הביט?"])
def test_bank_account_details_still_how_to_pay(text):
    assert _d(text).intent == Intent.HOW_TO_PAY, text


def test_invoice_number_missing_no_secondary_how_to_pay():
    d = _d("מספר החשבונית לא מופיע לי, אפשר לשלוח שוב?")
    assert d.intent == Intent.COPY_REQUEST and Intent.HOW_TO_PAY not in d.secondary


# ── 5. callback: «אליו/אליה» (צד ג׳) ≠ «אליי» ──
@pytest.mark.parametrize("text", ["התקשרו אליו, הוא מטפל בזה", "תחזרו אליה, היא מטפלת"])
def test_call_him_is_not_callback(text):
    assert Intent.CALLBACK not in _det(text), text


@pytest.mark.parametrize("text", ["תחזור אלי מחר", "תחזרו אליי", "תתקשרו לי", "הבן שלי יתקשר אליכם לסדר את זה",
                                  "אני אחזור אליכם בהמשך", "בעלי יחזור אליכם בערב"])
def test_callback_still_detected(text):
    assert Intent.CALLBACK in _det(text), text


# ── ratchet: כל מילת-מלכודת שהסריקה מצאה ──
@pytest.mark.parametrize(("text", "wrong"), [
    ("המספר שלי משתנה", Intent.WRONG_PERSON), ("אני נזקק", Intent.DISPUTE), ("נפטרתי מזה", Intent.CANT_PAY),
    ("מספר החשבונית", Intent.HOW_TO_PAY), ("התקשרו אליו", Intent.CALLBACK),
])
def test_scan_traps(text, wrong):
    assert wrong not in _det(text)

"""מנהל הפעלה 250 · סריקת גבולות מילה + מקבילות אנגלית לכללים עבריים.

סריקה שיטתית: כל חלק של כל תבנית ב-RX הורץ על כ-60 אלף שורות עבריות מהריפו ועל 23 אלף מילים, וחיפשנו התאמות
שמתחילות **באמצע מילה** (לא אחרי תחילית עברית תקנית). נמצאו:
1. 🔴 «די לשלוח» בתוך «כדי לשלוח» ⇒ **הסרה לצמיתות** של לקוח ששאל «מה צריך כדי לשלוח לכם את התשלום?».
2. «נזק» בתוך «טרנזקציה» ⇒ מחלוקת: «שילמתי, הטרנזקציה אושרה» עצר תזכורות כמחלוקת ובלע את טענת התשלום.
3. «חולה» בתוך «כחולה» ⇒ cant_pay רגיש + השהיה («הקופסה הכחולה הגיעה»).
4. «מה חייב» בתוך «הסיסמה/התרומה חייבת» ⇒ how_to_pay.
5. (סוף מילה) «תקנו\\w*» תפס «התקנות» ⇒ מחלוקת דחופה.
תיקון לפי מחלקה: שער תחילת-מילה ב-`_rx` לכל חלק שמתחיל באות עברית (lookbehind בלבד: נקודת ההתחלה לא זזה,
בדיקת השלילה לא משתנה). 1,281 מקרי ה-eval: diff ריק לפני/אחרי.

מקבילות אנגלית (נשאר מ-249): מספר שעבר/מוחזר («this number was reassigned», «just got this number»,
«not who you're looking for», «don't know any Dana») ⇒ מספר שגוי;
«this is my son's phone, he is 12», «my kid's phone» ⇒ קטין.
גיל ילד בלי בעלות על הטלפון/ההודעה ⇒ לא קטין (qa7 x7-40: «My son is 15 so it's been a crazy week»).
מלכודות: «my son is 25», «my son will pay in 14 days», «my kid is 14 days late», «I have a new number, send the
link here», «don't know anyone who can help», «never heard of this charge».
"""
import ast
from pathlib import Path

import pytest

from app import conversation as cv
from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t, ch="sms"):
    return respond(t, build_ctx({"channel": ch}))


CH = pytest.mark.parametrize("ch", ["sms", "email"])

# ── 1. באגי אמצע-מילה: אף אחד מאלה לא עוצר, לא מסיר ולא מסלים ──
MID_WORD = [
    ("מה צריך כדי לשלוח לכם את התשלום?", Intent.OPT_OUT),
    ("איזה פרטים צריך כדי לשלוח העברה?", Intent.OPT_OUT),
    ("כדי לכתוב לכם מה עם התשלום, למי פונים?", Intent.OPT_OUT),
    ("הטרנזקציה עברה, תודה", Intent.DISPUTE),
    ("מספר הטרנזקציה 4455", Intent.DISPUTE),
    ("הקופסה הכחולה הגיעה", Intent.CANT_PAY),
    ("התרומה חייבת להיות עד סוף החודש?", Intent.HOW_TO_PAY),
    ("זה לפי התקנות", Intent.DISPUTE),
]


@CH
@pytest.mark.parametrize(("text", "wrong"), MID_WORD)
def test_mid_word_match_no_longer_fires(text, wrong, ch):
    d = _d(text, ch)
    assert wrong not in cv.detect(cv.normalize(text)), text
    assert d.stop != Stop.PERMANENT, text


def test_paid_claim_with_transaction_is_paid_claim_not_dispute():
    d = _d("שילמתי, הטרנזקציה אושרה")
    assert d.intent == Intent.PAID_CLAIM
    assert Intent.DISPUTE not in cv.detect(cv.normalize("שילמתי, הטרנזקציה אושרה"))


# ── 2. השער לא שובר את מה שאמור להיתפס (כולל תחיליות) ──
STILL = [
    ("די לשלוח", Intent.OPT_OUT),
    ("די לשלוח לי הודעות", Intent.OPT_OUT),
    ("תפסיקו לשלוח", Intent.OPT_OUT),
    ("גרם לי נזק", Intent.DISPUTE),
    ("עשיתם לי נזק", Intent.DISPUTE),
    ("אני חולה כרגע", Intent.CANT_PAY),
    ("אני מאושפז", Intent.CANT_PAY),
    ("תתקנו בבקשה", Intent.DISPUTE),
    ("ששילמתי אתמול", Intent.PAID_CLAIM),
    ("כמה אני חייב?", Intent.HOW_TO_PAY),
]


@pytest.mark.parametrize(("text", "intent"), STILL)
def test_guard_keeps_true_positives(text, intent):
    assert intent in cv.detect(cv.normalize(text)), text


def test_negation_before_prefixed_match_unchanged():
    # השער הוא lookbehind ⇒ נקודת ההתחלה של «שילמ» לא זזה, ו«לא חושב ש» עדיין נבדק כשלילה כמו קודם
    assert cv.detect(cv.normalize("לא חושב ששילמתי")) == cv.detect(cv.normalize("לא חושב ששילמתי"))


# ── 3. ratchet מבני: כל חלק שמתחיל באות עברית — עטוף בשער ──
def test_every_hebrew_leading_part_is_guarded():
    assert cv._guard("די לשלוח").startswith(cv._WSG)
    assert cv._guard("(?:ה)?מספר").startswith(cv._WSG)
    assert cv._guard(r"\bstop\b") == r"\bstop\b"
    assert cv._guard(r"^\W*הסר") == r"^\W*הסר"
    # כל ארגומנט-מחרוזת של _rx בתוך RX שמתחיל באות עברית ⇒ מופיע בתבנית המקומפלת עטוף בשער
    src = Path(cv.__file__).read_text(encoding="utf-8")
    rx_node = next(n for n in ast.parse(src).body
                   if isinstance(n, ast.AnnAssign) and getattr(n.target, "id", "") == "RX")
    checked = 0
    for key, call in zip(rx_node.value.keys, rx_node.value.values, strict=True):
        intent = getattr(Intent, key.attr)
        for arg in call.args:
            if isinstance(arg, ast.Constant) and cv._HEB_START.match(arg.value):
                assert cv._guard(arg.value).translate(cv._FINALS) in cv.RX[intent].pattern, arg.value
                checked += 1
    assert checked > 200


@pytest.mark.parametrize("lead", ["ו", "ש", "כש", "ה", "ב", "ל", "מ", "וש", "וכש", "שה", "מה", "ולה"])
def test_guard_allows_every_valid_prefix(lead):
    rx = cv._c(cv._guard("שילמ"))
    assert rx.search(cv.normalize(lead + "שילמתי")), lead


@pytest.mark.parametrize("lead", ["כ", "ת", "טר", "א", "נ"])
def test_guard_blocks_non_prefix_letters(lead):
    rx = cv._c(cv._guard("די לשלוח"))
    assert not rx.search(cv.normalize(lead + "די לשלוח")), lead


# ── 4. אנגלית: מספר שעבר / לא מכיר ⇒ מספר שגוי ──
WRONG_EN = [
    "this number was reassigned to me last month",
    "My number has been recycled, I'm not your customer",
    "I just got this number, I am not who you are looking for",
    "got this number recently, sorry",
    "I'm not the one you're looking for",
    "i dont know any dana",
    "I don't know anyone named Yossi",
    "new number, never heard of this business",
]


@CH
@pytest.mark.parametrize("text", WRONG_EN)
def test_english_wrong_person(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.WRONG_PERSON, text
    assert d.stop == Stop.PERMANENT


# ── 5. אנגלית: ילד/ה ⇒ קטין, דחוף ──
MINOR_EN = [
    "this is my son's phone, he is 12",
    "this is my kid's phone, he is 12",
    "my daughter is 9 and this is her phone",
    "My son, he's only 15, got this message",
    "this is my child's number",
]


@CH
@pytest.mark.parametrize("text", MINOR_EN)
def test_english_minor(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.MINOR, text
    assert d.escalate == Escalation.URGENT


# ── 6. מלכודות: לא מספר שגוי ולא קטין ──
TRAPS = [
    "my son is 25",
    "my son is 25, this is his phone",
    "My daughter is 14 so it's been a busy month, will pay Sunday",
    "my son is 15 and I'm handling the bills now",
    "my son will pay in 14 days",
    "my kid is 14 days late with the payment, sorry",
    "my daughter is 8 months old, we're exhausted, will pay next week",
    "I have a new number, send the link here",
    "I don't know anyone who can help with this",
    "dont know any way to pay this",
    "never heard of this charge",
    "I got this number from your website, how do I pay?",
]


@CH
@pytest.mark.parametrize("text", TRAPS)
def test_english_traps(text, ch):
    det = cv.detect(cv.normalize(text))
    assert Intent.WRONG_PERSON not in det, text
    assert Intent.MINOR not in det, text

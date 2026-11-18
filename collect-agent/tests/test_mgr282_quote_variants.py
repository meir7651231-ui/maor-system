"""מנהל 282 · ביקורת: וריאנטי כתיבה של גרשיים/גרש במילות-מפתח (`conversation.normalize`).

רקע: `_QUOTES` מיפה ״ ” “ ׳ ’ ‘ ל-ASCII, אבל לא:
  • „ (U+201E, מרכאות תחתונות — מוצעות בלחיצה-ארוכה במקלדות אנדרואיד), ‟, ″ (double prime, U+2033), ＂ (רוחב-מלא),
    ו-′ ‚ ‛ ＇ בגרש יחיד.
  • ראשי תיבות בגרש **יחיד** במקום גרשיים («עו'ד», «רו'ח», «בבי'ח», «ובכ'ז», «300 ש'ח»).
🔴 תוצאה לפני התיקון: «פניתי לעו„ד בעניין» / «העו″ד שלי יטפל בזה» / «פניתי לעו'ד» ⇒ «לא ברור» (בלי השהיה, בלי דחוף);
«אני בבי'ח» ⇒ לא קושי-דחוף; «ובכ'ז חייבו אותי» ⇒ לא מחלוקת; «אשלם 300 ש″ח לחודש» ⇒ איבד את בקשת הפריסה.

נשאר במכוון: בלי גרשיים כלל («עוד», «רוח») — מילים רגילות («יש לכם עוד?»), לא ראשי תיבות.
גרש יחיד מתורגם רק ברשימה סגורה: תעתיק («ג'ורג'», «צ'יפס», «מסאג'») לא נוגע.
"""
from datetime import date

import pytest

from app import channels
from app import conversation as C

CTX = C.Context(today=date(2026, 11, 18), business="סטודיו", customer_name="דנה כהן",
                invoices=(C.OpenInvoice("1001", 120000, "ILS", date(2026, 11, 1)),))

VARIANTS = ['״', '”', '“', '„', '‟', '″', '＂', "''", '׳׳']
SINGLE = ["'", '׳', '’', '′']

CASES = [
    'שילמתי 500 ש{q}ח אתמול', 'אשלם 300 ש{q}ח לחודש', 'פניתי לעו{q}ד בעניין', 'העו{q}ד שלי יטפל בזה',
    'רו{q}ח שלי ישלם עד יום חמישי', 'אני בבי{q}ח, אחזור אליכם', 'ובכ{q}ז חייבו אותי', 'תסירו את כתובת הדוא{q}ל',
    'אשלם ביום חמישי בע{q}ה', 'אני עו{q}ד בעצמי, אשלם מחר', 'יש לכם עו{q}ד?',
]


def _sig(t):
    d = C.respond(t, CTX)
    return (d.intent, tuple(sorted(i.value for i in d.secondary)), d.escalate, d.stop, d.paid_agorot, d.promise_date)


@pytest.mark.parametrize("q", VARIANTS + SINGLE)
@pytest.mark.parametrize("tmpl", CASES)
def test_variant_same_as_ascii(tmpl, q):
    assert _sig(tmpl.format(q=q)) == _sig(tmpl.format(q='"'))


@pytest.mark.parametrize("t", ["פניתי לעו„ד בעניין", "העו″ד שלי יטפל בזה", "פניתי לעו'ד",
                               "לעוה'ד שלי יש את כל המסמכים"])
def test_legal_detected(t):
    d = C.respond(t, CTX)
    assert d.intent == C.Intent.LEGAL and d.escalate == C.Escalation.URGENT and d.stop == C.Stop.PAUSE


def test_hospital_and_dispute():
    assert C.respond("אני בבי'ח, אחזור אליכם", CTX).escalate == C.Escalation.URGENT
    assert C.respond("ובכ'ז חייבו אותי", CTX).intent == C.Intent.DISPUTE


def test_plan_amount_kept():
    assert C.respond("אשלם 300 ש″ח לחודש", CTX).intent == C.Intent.PLAN_REQUEST


@pytest.mark.parametrize("t", ["ג'ורג'", "צ'יפס", "מסאג'", "ש' 300", "בע'מ", "ד'ה", "עו'", "'ד", "רוני'ח"])
def test_single_quote_only_closed_list(t):
    n = C.normalize(t)
    assert '"' not in n


@pytest.mark.parametrize("t", ["יש לכם עוד?", "אני עוד מעט משלם, אשלם מחר", "רוח טובה, אשלם מחר"])
def test_no_quotes_not_acronym(t):
    assert C.respond(t, CTX).intent != C.Intent.LEGAL


@pytest.mark.parametrize("q", ['„', '″'])
def test_signature_low_and_prime_quotes(q):
    body = f"קיבלתי תודה\n\nדן כהן | עו{q}ד"
    stripped = channels.strip_reply(body)
    assert f"עו{q}ד" not in stripped
    assert C.respond(stripped, CTX).intent != C.Intent.LEGAL

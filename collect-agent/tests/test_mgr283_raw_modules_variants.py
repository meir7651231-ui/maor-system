"""מנהל 283 · ביקורת: וריאנטי גרשיים/גרש ותווים בלתי-נראים במודולים שקוראים טקסט **גולמי** (המשך ל-282).

🔴 יוצא (`compliance` — המעקה שחוסם שליחה):
  • «נעביר להוצל״פ» בגרשיים **עבריים** (הכתיב התקני) לא נחסם — הדפוס הכיר רק `"` ASCII.
  • «נפנה לעו”ד» במרכאות חכמות (פלט נפוץ של LLM), «עו„ד», «עו″ד», «עו׳׳ד», «עו''ד», «עו’ד» — לא נחסמו.
  • ניקוד («הוֹצָאָה לַפֹּועַל»), מקף עברי («עורך־דין»), תו רוחב-אפס בתוך מילה — לא נחסמו. «פאג”י» (מותג בנק) — לא נחסם.
🔴 נכנס (`conversation.normalize`, `_FOREIGN_STOP`):
  • תו רוחב-אפס (ZWSP/ZWJ/BOM — נפוץ בהעתק-הדבק) בתוך «הסר» / «תפסיקו לשלוח» / «STOP» / «перестаньте» ⇒
    «לא ברור»: **בקשת הסרה לא כובדה**. «עו\u200b"ד שלי יטפל» לא legal.
התיקון רק מחמיר: הבדיקה רצה גם על העותק המנורמל, בנוסף למקור.
"""
from datetime import date

import pytest

from app import conversation as C
from app.compliance import Rules, violations

R = Rules(business="סטודיו")
CTX = C.Context(today=date(2026, 11, 18), business="סטודיו", customer_name="דנה כהן",
                invoices=(C.OpenInvoice("1001", 120000, "ILS", date(2026, 11, 1)),))

DQ = ['"', '״', '”', '“', '„', '‟', '″', '＂', "''", '׳׳']
ZW = ["\u200b", "\u200c", "\u200d", "\u2060", "\ufeff", "\u00ad", "\u202b"]


@pytest.mark.parametrize("q", DQ)
@pytest.mark.parametrize("tmpl,code", [
    ("סטודיו: אחרת נעביר להוצל{q}פ", "enforcement"),
    ("סטודיו: הנושא יועבר לעו{q}ד", "lawyer"),
    ("סטודיו: הנושא יועבר לעוה{q}ד", "lawyer"),
    ("סטודיו: ניתן לשלם בפאג{q}י", "brand_bank"),
])
def test_outbound_quote_variants_blocked(tmpl, code, q):
    assert code in violations(tmpl.format(q=q), R)


@pytest.mark.parametrize("q", ["'", "׳", "’", "′"])
def test_outbound_single_geresh_blocked(q):
    assert "lawyer" in violations(f"סטודיו: הנושא יועבר לעו{q}ד", R)
    assert "enforcement" in violations(f"סטודיו: נעביר להוצל{q}פ", R)


@pytest.mark.parametrize("z", ZW)
@pytest.mark.parametrize("word,code", [("הוצאה לפועל", "enforcement"), ('עו"ד', "lawyer"), ("משטרה", "police"),
                                       ("עיקול", "seizure"), ("ריבית", "fees"), ("קופון", "marketing")])
def test_outbound_invisible_inside_word_blocked(word, code, z):
    w = word[:2] + z + word[2:]
    assert code in violations(f"סטודיו: {w}", R)


def test_outbound_nikud_and_maqaf_blocked():
    assert "enforcement" in violations("סטודיו: הוֹצָאָה לַפֹּועַל", R)
    assert "lawyer" in violations("סטודיו: נעביר לעורך־דין", R)


@pytest.mark.parametrize("text", [
    "סטודיו: תזכורת ידידותית לגבי חשבונית 1001. לתשלום: השיבו “הסר” להסרה",
    "סטודיו: יש לנו עוד שאלה קטנה?", "סטודיו: תודה רבה! צוות „סטודיו”", "סטודיו: ‘תודה’ ו–להתראות",
    "סטודיו: בע״מ · ח״פ 512345678",
])
def test_outbound_clean_stays_clean(text):
    assert violations(text, R) == []


@pytest.mark.parametrize("z", ZW)
@pytest.mark.parametrize("word", ["הסר", "הסירו אותי", "תפסיקו לשלוח לי", "STOP"])
def test_inbound_optout_with_invisible(word, z):
    w = word[:2] + z + word[2:]
    d = C.respond(w, CTX)
    assert d.intent == C.Intent.OPT_OUT, (repr(w), d.intent)
    assert d.stop == C.Stop.PERMANENT


@pytest.mark.parametrize("text", ["Пожалуйста, перес\u200bтаньте мне писать", "من فضلك تو\u200bقف عن الرسائل"])
def test_inbound_foreign_stop_with_invisible(text):
    d = C.respond(text, CTX)
    assert d.intent == C.Intent.OPT_OUT and d.stop == C.Stop.PERMANENT


@pytest.mark.parametrize("z", ZW)
def test_inbound_legal_with_invisible(z):
    assert C.respond(f'העו{z}"ד שלי יטפל בזה', CTX).intent == C.Intent.LEGAL


@pytest.mark.parametrize("text", ["שילמתי ❤️", "👨\u200d👩\u200d👧 שילמתי אתמול", "תודה 🙏🏻"])
def test_inbound_emoji_zwj_unchanged(text):
    plain = C.respond(text.replace("\u200d", ""), CTX)
    assert C.respond(text, CTX).intent == plain.intent

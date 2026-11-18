"""מנהל 284 · ביקורת: אותיות מתחפשות (homoglyphs) ותווי רוחב-מלא — המשך ל-283.

🔴 נכנס (`conversation`):
  • «ЅТОР» / «STОP» / «ѕтор» (קירילית שנראית לטינית) ⇒ «לא ברור» + השהיה: **בקשת הסרה לא כובדה**.
  • «ＳＴＯＰ» / «ｕｎｓｕｂｓｃｒｉｂｅ» (רוחב מלא), «𝐒𝐓𝐎𝐏» (מודגש מתמטי), «ˢᵗᵒᵖ» ⇒ «לא ברור» **בלי השהיה**.
🔴 יוצא (`compliance`):
  • «！！», «‼», «﹗﹗» (לחץ) · «ＵＲＧＥＮＴ», «𝐔𝐑𝐆𝐄𝐍𝐓» (צעקה) · «ВDI» (אשראי) · «Ваnk Lеumi» — לא נחסמו.
התיקון (`app/confusables.py`): קיפול רק של תווים שאין להם שימוש בהודעה עברית; רוסית אמיתית לא משתנה; המעקה רק מחמיר.
"""
from datetime import date

import pytest

from app import conversation as C
from app.compliance import Rules, violations
from app.confusables import fold, skeleton

R = Rules(business="סטודיו")
CTX = C.Context(today=date(2026, 11, 18), business="סטודיו", customer_name="דנה כהן",
                invoices=(C.OpenInvoice("1001", 120000, "ILS", date(2026, 11, 1)),))

OPTOUT = ["ЅТОР", "ЅTOP", "STОP", "SΤOP", "ѕтор", "ＳＴＯＰ", "ｓｔｏｐ", "𝐒𝐓𝐎𝐏", "𝓈𝓉𝑜𝓅", "ˢᵗᵒᵖ",
          "ⓈⓉⓄⓅ", "ｕｎｓｕｂｓｃｒｉｂｅ", "unѕubѕcribe", "ЅТОР please", "STОP!!", "стоп", "Стоп пожалуйста"]


@pytest.mark.parametrize("text", OPTOUT)
def test_inbound_homoglyph_optout_honored(text):
    d = C.respond(text, CTX)
    assert d.stop == C.Stop.PERMANENT, (text, d.intent)
    assert d.next_state == C.State.OPTED_OUT


@pytest.mark.parametrize("text", ["ЅТОР", "ＳＴＯＰ", "𝐒𝐓𝐎𝐏"])
def test_detect_sees_optout(text):
    assert C.Intent.OPT_OUT in C.detect(text)


@pytest.mark.parametrize("text", ["перестаньте мне писать", "не пишите мне больше", "توقف"])
def test_real_foreign_stop_unchanged(text):
    assert fold(text) == text
    assert C.respond(text, CTX).stop == C.Stop.PERMANENT


@pytest.mark.parametrize("text", ["привет, я заплачу завтра", "Спасибо", "мама", "סכום 500¹", "שילמתי ₪500 אתמול",
                                  "שלום, אשלם מחר 😊", "OK thanks", "Ελλάδα", "שילמתי ב-ביט"])
def test_fold_leaves_legit_text(text):
    assert fold(text) == text


@pytest.mark.parametrize("text", ["привет, я заплачу завтра", "Спасибо"])
def test_real_russian_not_optout(text):
    assert C.respond(text, CTX).stop != C.Stop.PERMANENT


@pytest.mark.parametrize("text,code", [
    ("סטודיו: נא לשלם ！！", "pressure"), ("סטודיו: נא לשלם ‼", "pressure"), ("סטודיו: נא לשלם ﹗﹗", "pressure"),
    ("סטודיו: נא לשלם ！!", "pressure"), ("סטודיו: שלם ＵＲＧＥＮＴ", "pressure"), ("סטודיו: שלם 𝐔𝐑𝐆𝐄𝐍𝐓", "pressure"),
    ("סטודיו: שלם URGЕNT", "pressure"), ("סטודיו: נדווח ל-ВDI", "credit"), ("סטודיו: נדווח ל-ＢＤＩ", "credit"),
    ("סטודיו: נדווח ל-BDΙ", "credit"), ("סטודיו: ניתן לשלם ב-Ваnk Lеumi", "brand_bank"),
])
def test_outbound_homoglyph_blocked(text, code):
    assert code in violations(text, R)


@pytest.mark.parametrize("text", ["סטודיו: שלום דנה, תזכורת ידידותית לחשבונית 1001 על סך 1,200 ₪. תודה!",
                                  "סטודיו: תודה רבה! נשמח לעזור ⁉"])
def test_outbound_clean_stays_clean(text):
    assert violations(text, R) == []


def test_skeleton_maps_all():
    assert skeleton("СТОР") == "CTOP" and skeleton("ВDI") == "BDI" and skeleton("") == ""

"""מבקר סבב 199 — אחרי 68c2535c (תיקון 198🔴, «_CLAUSE_SPLIT לא חותך נקודה בין ספרות»).

רכיב: `app/conversation.py` → `extract_date_ctx` → `_promise_clause_date` / `extract_date`, וגם `_he_date` בתשובה
ובכרטיס «בדוק ואשר» (`_decide`, ענף promise_over_limit).
  א. 🔴 **רגרסיה של 68c2535c:** תאריך-הפניה עם נקודה *לפני* ההבטחה («לגבי החשבונית מ-1.11 אשלם ב-15») כבר לא נחתך
     למשפט נפרד ⇒ `_promise_clause_date` לא מוצא את «ב-15» כמשפט ההבטחה, ו-`extract_date` מחזיר את 1.11 — שכבר עבר ⇒
     1.11.**2027**. ללקוח: «רשמנו שהתשלום צפוי עד יום שני 1.11»; לבעל העסק: «לאשר את יום שני 1.11?» (358 ימים).
     ב-99c369e0 (לפני התיקון) אותה הודעה ⇒ 15.11 נכון. גם «קיבלתי את ההודעה מה-3.11 אשלם ב-20», «בהמשך לשיחה ב-5.11
     אשלם ב-20», «על החשבונית של 10.10 אשלם ב-25». (עם פסיק/נקודה+רווח אחרי ההפניה — תקין.)
  ב. 🟠 **שנה לא מוצגת:** מועד בשנה אחרת מוצג בלי שנה גם ללקוח וגם בפעולה שבעל העסק מאשר: «אשלם ב-25.11.2027» ⇒
     «לאשר את יום חמישי 25.11» — «(382 ימים)» רק בסיכום. בעל העסק שקורא «25.11» ולוחץ «✓ לאשר את המועד המבוקש» משהה
     תזכורות לשנה. מועד בשנה אחרת מהיום ⇒ השנה צריכה להופיע (בתשובה ובפעולה).
תוקן במנהל 352 (xfail הוסר); בקרות ירוקות."""
from datetime import date

import pytest

from app import conversation as cv

TODAY = date(2026, 11, 8)


def _d(text):
    return cv.respond(text, cv.Context(business="סטודיו", today=TODAY))


def _req(d):
    return getattr(d, "requested_date", None) or d.promise_date


@pytest.mark.parametrize(("text", "want"), [
    ("לגבי החשבונית מ-1.11 אשלם ב-15", date(2026, 11, 15)),
    ("קיבלתי את ההודעה מה-3.11 אשלם ב-20", date(2026, 11, 20)),
    ("בהמשך לשיחה ב-5.11 אשלם ב-20", date(2026, 11, 20)),
    ("על החשבונית של 10.10 אשלם ב-25", date(2026, 11, 25)),
])
def test_reference_date_before_promise_does_not_win(text, want):
    assert _req(_d(text)) == want


def test_other_year_shown_with_year():
    d = _d("אשלם ב-25.11.2027")
    assert _req(d) == date(2027, 11, 25)
    assert any("2027" in a for a in d.owner_actions), d.owner_actions
    assert "2027" in d.reply, d.reply


@pytest.mark.parametrize(("text", "want"), [
    ("אשלם ב-10.12", date(2026, 12, 10)),                 # 198🔴 — תוקן ב-68c2535c
    ("לגבי חשבונית מ-1.11, אשלם ב-15", date(2026, 11, 15)),   # פסיק אחרי ההפניה — תקין
    ("החשבונית מ-1.11. אשלם ב-15", date(2026, 11, 15)),        # נקודה+רווח — תקין
])
def test_control(text, want):
    assert _req(_d(text)) == want

"""מבקר סבב 200 — תאריך-הפניה עם נקודה *אחרי* ההבטחה גובר על יום ההבטחה (המראה של 199א).

רכיב: `app/conversation.py` → `extract_date_ctx` → `_promise_clause_date` / `extract_date`. 8db00581 תיקן את ההפניה
*לפני* ההבטחה («לגבי החשבונית מ-1.11 אשלם ב-15» ⇒ 15.11 ✓). בסדר ההפוך — «אשלם ב-15 לגבי החשבונית מ-1.11» — המשפט
אחד, ו-1.11 (שכבר עבר) ⇒ 1.11.**2027**: ללקוח «רשמנו שהתשלום צפוי עד יום שני 1.11.2027», לבעל העסק «לאשר את 1.11.2027?».
גם «אעביר ב-20 על החשבונית של 3.11», «אשלם ב-15 על ההודעה מ-5.11». עם פסיק לפני ההפניה — תקין (20.11).
קיים כבר ב-99c369e0 (לא רגרסיה). מאז 199ב השנה מוצגת, כך שבעל העסק יכול לזהות — אבל ללקוח נאמר מועד שלא אמר.
xfail(strict=True); בקרות ירוקות."""
from datetime import date

import pytest

from app import conversation as cv

TODAY = date(2026, 11, 8)


def _req(text):
    d = cv.respond(text, cv.Context(business="סטודיו", today=TODAY))
    return getattr(d, "requested_date", None) or d.promise_date


@pytest.mark.xfail(strict=True, reason="200🟠: הפניה «מ-1.11» אחרי «אשלם ב-15» ⇒ 1.11.2027")
@pytest.mark.parametrize(("text", "want"), [
    ("אשלם ב-15 לגבי החשבונית מ-1.11", date(2026, 11, 15)),
    ("אעביר ב-20 על החשבונית של 3.11", date(2026, 11, 20)),
    ("אשלם ב-15 על ההודעה מ-5.11", date(2026, 11, 15)),
])
def test_reference_date_after_promise_does_not_win(text, want):
    assert _req(text) == want


@pytest.mark.parametrize(("text", "want"), [
    ("אשלם ב-20, לגבי החשבונית מ-1.11", date(2026, 11, 20)),
    ("לגבי החשבונית מ-1.11 אשלם ב-15", date(2026, 11, 15)),   # 199א — תוקן ב-8db00581
])
def test_control(text, want):
    assert _req(text) == want

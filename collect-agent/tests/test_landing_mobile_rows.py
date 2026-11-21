"""הפעלה 207 — בדיקת עין של עמוד החייב (/p, `server-p-mobile.png`, פתוח מאז 188).

שני ממצאים בעמוד היחיד שהלקוח-של-הלקוח רואה:
1. בהודעה מאוחדת, שורת החשבונית נשברה באמצע ב-390px: «· לתשלום» ירד לשורה לבד ו-«· 2026-11-20» פתח שורה.
   עכשיו כל חשבונית היא שורה: מקטעים שלא נשברים (`.n`) + כפתור «לתשלום» מסומן, בלי «·» תלוי לפניו.
2. המועד הוצג ב-ISO («2026-11-20»). ללקוח בישראל ⇒ «20.11.2026». התצוגה בלבד: ה-API וה-DB נשארים ISO.
"""
from __future__ import annotations

import re

from app.main import landing_page
from app.templates import fmt_due


def _info(**kw) -> dict:
    b = dict(business="מוסך הדגמה", number="1001", due="2026-11-20", open=True, code="ABCD1234",
             amount="450 ₪", pay_url="https://pay.example/x", opted_out=False, total="900 ₪",
             pay_shared=False,
             invoices=[dict(number=n, amount="450 ₪", due=d, code=c, can_pay=True)
                       for n, d, c in (("1001", "2026-11-20", "AAAA1111"), ("1002", "2026-12-05", "BBBB2222"))])
    b.update(kw)
    return b


def test_fmt_due():
    assert fmt_due("2026-11-20") == "20.11.2026"
    assert fmt_due("2026-01-05") == "05.01.2026"
    assert fmt_due("2026-01-05T00:00:00") == "05.01.2026"
    assert fmt_due("") == "" and fmt_due(None) == ""
    assert fmt_due("לא תאריך") == "לא תאריך"          # לא נופלים על ערך לא צפוי


def test_single_invoice_due_is_israeli_format():
    html = landing_page(_info(invoices=[]))
    assert "מועד 20.11.2026" in html
    assert "2026-11-20" not in html                    # מוטציה: בלי fmt_due ⇒ ISO חוזר


def test_merged_rows_dont_break_and_pay_is_a_button():
    html = landing_page(_info())
    ul = re.search(r'<ul class="m iv" data-testid="landing-invoices">(.*?)</ul>', html, re.S)
    assert ul, "רשימת החשבוניות חסרה או בלי מחלקת השורות"
    rows = re.findall(r"<li>(.*?)</li>", ul.group(1), re.S)
    assert len(rows) == 2
    want = (("1001", "20.11.2026", "AAAA1111"), ("1002", "05.12.2026", "BBBB2222"))
    for row, (num, due, code) in zip(rows, want, strict=True):
        assert f'<span class="n">חשבונית {num}</span>' in row
        assert f'<span class="n">מועד {due}</span>' in row
        assert row.endswith(f'<a class="l" href="/p/{code}/pay">לתשלום</a>')
        assert "· <a" not in row                       # «·» תלוי לפני הכפתור = השבירה שנראתה בצילום
    assert not re.search(r"\d{4}-\d{2}-\d{2}", html)
    # ה-CSS: שורה גמישה, מקטעים בלי שבירה, כפתור עם מסגרת
    assert ".iv li{display:flex;flex-wrap:wrap" in html and ".iv .n{white-space:nowrap}" in html
    assert ".iv .l{border:1px solid var(--brand)" in html


def test_merged_shared_link_rows_have_no_per_invoice_button():
    html = landing_page(_info(pay_shared=True))
    assert 'class="l"' not in html and "לתשלום מאובטח" in html
    assert html.count('<span class="n">מועד ') == 2


def test_landing_api_keeps_iso_due():
    """התצוגה בלבד — מקור הנתונים (`CollectService.landing`) לא נוגע במועד."""
    import inspect

    from app.service import CollectService
    src = inspect.getsource(CollectService.landing) + inspect.getsource(CollectService._landing_items)
    # גבי משפט 21.11: מועד מוערך ⇒ None לחייב (`else inv["due"]`); מועד אמיתי עדיין ISO כמו שהוא, לא מעוצב
    assert "fmt_due" not in src and 'else inv["due"]' in src and 'else r["due"]' in src

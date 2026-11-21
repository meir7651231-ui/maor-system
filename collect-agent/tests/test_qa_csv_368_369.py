"""גבי בדיקות · רגרסיה ל-CSV (מנהל 368–369): בדיקות קופסה-שחורה מול `csv_import.parse`, בווריאנטים שלא בבדיקות המפתח.

368: שורת «סה״כ»/«סיכום»/Total ⇒ שגיאה גלויה, לא חשבונית; לקוח בשם «סיכום בע״מ» עם מספר נקלט.
369: «(500)»/«500-» ⇒ זיכוי לבדיקה; סימן מטבע בתא (ש״ח/₪/$/NIS) ⇒ מטבע; סתירה מול עמודת המטבע ⇒ שגיאה; «(-500)» ⇒ שגיאה.

🟠 ממצא (תוקן, גבי חיבורים; היה xfail): «500.-» — כתיב ישראלי נפוץ לסכום שלם («500.- ש״ח») — מסווג **זיכוי** מאז 369
(הסימן `-` בסוף נקרא כשלילי). לפני 369 = שגיאה גלויה «סכום לא תקין». עכשיו, בזרימה מלאה דרך `import_csv`: חשבונית
חדשה ב-«300.-» לא נקלטת בכלל (imported=0) ובעל העסק מקבל כרטיס «זיכוי שלא הצלחנו לשייך»; ללקוחה קיימת התזכורות נעצרות
עם כרטיס «זיכוי» כוזב. קובץ שכולו בכתיב הזה ⇒ אפס חשבוניות, בשקט. «1,200.-» דווקא נדחה ⇒ גם לא עקבי.
"""
from __future__ import annotations

from datetime import date

import pytest

from app import csv_import

H = "מספר חשבונית,שם לקוח,טלפון,סכום,תאריך לתשלום,מטבע\n"
OK = "9001,דנה כהן,050-1234567,800,2026-10-01,"


def _parse(*rows: str):
    return csv_import.parse((H + "\n".join(rows) + "\n").encode(), today=date(2026, 11, 21))


def _one(amount: str, currency: str = ""):
    return _parse(f"9100,דנה כהן,050-1234567,{amount},2026-10-01,{currency}")


@pytest.mark.parametrize("row", [
    'סה"כ,,050-1234567,800,,', "סה״כ,,050-1234567,800,,", "סהכ,,,800,,", "TOTAL:,,050-1234567,800,,",
    "Grand Total,,,800,,", "סך הכל,,,800,,", ',סה"כ,,800,,',
], ids=["ascii-quote", "gershayim", "no-quote", "TOTAL-colon", "grand-total", "sach-hakol", "client-col"])
def test_summary_row_is_visible_error_not_invoice(row):
    r = _parse(OK, row)
    assert [i.number for i in r.invoices] == ["9001"] and not r.credits
    assert [e["error"] for e in r.errors] == [csv_import.SUMMARY_MSG]


def test_real_client_named_summary_is_imported():
    r = _parse(OK, '9002,"סיכום בע""מ",050-2222222,300,2026-10-01,')
    assert [(i.number, i.amount_agorot) for i in r.invoices] == [("9001", 80000), ("9002", 30000)] and not r.errors


@pytest.mark.parametrize("amount,agorot", [
    ("(500)", 50000), ("500-", 50000), ("-500", 50000), ("\u200f(500)", 50000), ('"(1,200.50)"', 120050),
    ("500 -", 50000), ("- 500", 50000),
    ("\u2212500", 50000), ("\u2013500", 50000),   # מנהל 370 (f44ffbac): מינוס-יוניקוד / מקף מ-Excel ב-Mac ⇒ זיכוי
], ids=["parens", "trailing-minus", "leading-minus", "rlm-parens", "parens-thousands", "space-trailing",
        "space-leading", "unicode-minus", "en-dash"])
def test_negative_forms_become_credit_for_review(amount, agorot):
    r = _one(amount)
    assert not r.invoices and not r.errors
    assert [c.amount_agorot for c in r.credits] == [agorot]


@pytest.mark.parametrize("amount", ["(-500)", "-500-", '"1.200,50"'],
                         ids=["double-neg-parens", "double-neg", "euro-format"])
def test_ambiguous_amount_is_visible_error(amount):
    r = _one(amount)
    assert not r.invoices and not r.credits and len(r.errors) == 1


@pytest.mark.parametrize("amount,currency,want", [
    ('"500 ש""ח"', "", "ILS"), ("500 ש״ח", "", "ILS"), ("₪500", "", "ILS"), ("500₪", "", "ILS"), ("NIS 500", "", "ILS"),
    ("ILS 500", "", "ILS"), ("$500", "", "USD"), ("500 $", "", "USD"), ("$500", "USD", "USD"),
], ids=["shach-ascii", "shach-gershayim", "shekel-sign", "shekel-after", "NIS", "ILS", "dollar", "dollar-after",
        "dollar-usdcol"])
def test_currency_mark_in_amount_cell(amount, currency, want):
    r = _one(amount, currency)
    assert [(i.amount_agorot, i.currency) for i in r.invoices] == [(50000, want)] and not r.errors


@pytest.mark.parametrize("amount,currency", [("₪500", "USD"), ('"500 ש""ח $"', "")],
                         ids=["shekel-vs-usdcol", "two-marks"])
def test_currency_conflict_is_visible_error(amount, currency):
    r = _one(amount, currency)
    assert not r.invoices and not r.credits and len(r.errors) == 1


def test_credit_keeps_currency_column():
    r = _one("(500)", "USD")
    assert [(c.amount_agorot, c.currency) for c in r.credits] == [(50000, "USD")]


# 🟠 גבי בדיקות 21.11: «500.-» (כתיב ישראלי לסכום שלם) סווג זיכוי מאז מנהל 369 ⇒ החשבונית נעלמה מהתזכורות.
# תוקן (גבי חיבורים): «\d[\d,]*.-» = סכום שלם. ה-xfail הוסר.


@pytest.mark.parametrize("amount", ["500.-", '"500.- ש""ח"'], ids=["dot-dash", "dot-dash-shach"])
def test_israeli_whole_amount_dot_dash_is_not_a_credit(amount):
    r = _one(amount)
    assert not r.credits, "«500.-» = 500 ₪ (סכום שלם), לא זיכוי"
    assert [i.amount_agorot for i in r.invoices] == [50000] and not r.errors


@pytest.mark.parametrize("amount,kind,agorot", [
    ('"1,200.-"', "inv", 120000), ("(500.-)", "credit", 50000), ("₪500.-", "inv", 50000),
    ("500.-.-", "err", 0), ("500.5-", "credit", 50050), ("-.-", "err", 0)])
def test_dot_dash_boundaries(amount, kind, agorot):
    """«.-» רק אחרי ספרות = שלם; בתוך סוגריים = זיכוי שלם; «500.5-» נשאר מינוס-בסוף (זיכוי, 369)."""
    r = _one(amount)
    got = ("inv", r.invoices[0].amount_agorot) if r.invoices else \
        ("credit", r.credits[0].amount_agorot) if r.credits else ("err", 0)
    assert got == (kind, agorot), (amount, got, r.errors)

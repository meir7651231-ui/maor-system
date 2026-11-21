"""הפעלה 369 (BACKLOG «גבי חיבורים»): עמודת סכום בפורמט חשבונאי ב-CSV.

הבאג: ייצוא Excel «חשבונאות» / חשבשבת / פריוריטי כותב שלילי כ-«(500)» או «500-», ולפעמים מטבע בתא
(«1,200 ש"ח», «$500»). קודם: כל אלה ⇒ «סכום לא תקין» ⇒ זיכוי של לקוח נעלם מרשימת הבדיקה (ואז חוב אחר
שלו נשלח בתזכורת מלאה), וקובץ שכולו בפורמט הזה נדחה כולו. וגם: «₪500» בשורה שעמודת המטבע בה USD
נקלט בשקט כ-500 דולר. עכשיו: סוגריים / מינוס בסוף = זיכוי (לבדיקה — לעולם לא חוב); סימן כפול ⇒ שגיאה;
סימן מטבע בתא נבדק מול עמודת המטבע.
"""
import pytest

from app.csv_import import parse

HEAD = "מספר מסמך,שם לקוח,טלפון,יתרה לתשלום\n"
HEAD_CUR = "מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,מטבע\n"


def _row(amount: str, cur: str | None = None):
    q = '"' + amount.replace('"', '""') + '"'
    if cur is None:
        return parse((HEAD + f"201,דנה כהן,0501234567,{q}\n").encode())
    return parse((HEAD_CUR + f"201,דנה כהן,0501234567,{q},{cur}\n").encode())


@pytest.mark.parametrize("amount,agorot", [
    ("(500)", 50000), ("( 500 )", 50000), ("(1,200.50)", 120050), ("500-", 50000), ("500 -", 50000),
    ("1,200.00-", 120000), ("(₪500)", 50000), ("₪(500)", 50000), ("(500) ₪", 50000), ("-₪500", 50000),
])
def test_accounting_negative_is_credit_never_debt(amount, agorot):
    r = _row(amount)
    assert r.errors == []
    assert r.invoices == []                      # לעולם לא חוב ⇒ אין תזכורת
    assert [(c.number, c.amount_agorot, c.doc_type) for c in r.credits] == [("201", agorot, 330)]


@pytest.mark.parametrize("amount,agorot,cur", [
    ("1200 ש\"ח", 120000, "ILS"), ("1200 ש״ח", 120000, "ILS"), ("NIS 40", 4000, "ILS"),
    ("₪ 1,200.00", 120000, "ILS"), ("$500", 50000, "USD"), ("500 USD", 50000, "USD"), ("€30", 3000, "EUR"),
])
def test_currency_inside_amount_cell(amount, agorot, cur):
    r = _row(amount)
    assert r.errors == []
    assert [(i.amount_agorot, i.currency) for i in r.invoices] == [(agorot, cur)]


@pytest.mark.parametrize("amount", ["(-500)", "-(500)", "(500-)", "-500-", "()", "( )", "₪", "(500", "500)",
                                    "₪$5"])
def test_ambiguous_sign_or_empty_is_visible_error(amount):
    r = _row(amount)
    assert r.invoices == [] and r.credits == []
    assert len(r.errors) == 1 and r.errors[0]["row"] == 2
    assert "סכום" in r.errors[0]["error"]


def test_cell_currency_contradicts_column_is_error():
    r = _row("₪500", "USD")                      # היה: 500 דולר בשקט
    assert r.invoices == [] and r.credits == []
    assert r.errors[0]["error"].startswith("המטבע בתא הסכום (ILS) שונה מעמודת המטבע (USD)")


@pytest.mark.parametrize("amount,cur,exp", [("₪500", 'ש"ח', "ILS"), ("$500", "USD", "USD"), ("500", "", "ILS"),
                                            ("500", "USD", "USD")])
def test_cell_currency_agrees_with_column(amount, cur, exp):
    r = _row(amount, cur)
    assert r.errors == []
    assert [(i.amount_agorot, i.currency) for i in r.invoices] == [(50000, exp)]


def test_whole_accounting_export_with_mixed_rows():
    raw = (HEAD + "301,א,0501234567,\"1,200.00 ₪\"\n302,ב,0501234568,(300.00)\n"
           "303,ג,0501234569,450.00-\n304,ד,0501234570,0\n305,ה,0501234571,(0)\n").encode()
    r = parse(raw)
    assert r.errors == []
    assert [i.number for i in r.invoices] == ["301"]
    assert [c.number for c in r.credits] == ["302", "303"]

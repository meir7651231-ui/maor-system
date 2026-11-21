"""מנהל 370 (חיבורים, המשך 369): עמודת סכום בייצוא אמיתי.

באגים שנמצאו (נבדקו על הקוד הקודם):
1. מינוס לא-ASCII — «−500» (U+2212, Excel ב-Mac/Numbers), «–500», «500‑» ⇒ «סכום לא תקין» ⇒
   הזיכוי נעלם מרשימת הבדיקה (ואז חוב אחר של אותו לקוח נשלח בלי קיזוז).
2. «סכום 1,200 · שולם 800» בלי עמודת יתרה ⇒ נקלט חוב של 1,200 ⇒ תזכורת דורשת 800 ₪ ששולמו.
3. ייצוא באנגלית עם Amount וגם Balance ⇒ נבחר Amount (ברוטו) כי היה לפני Balance בסדר העדיפות.
4. קובץ חובה/זכות (כרטסת) ⇒ «חסרות עמודות חובה: amount» בלי הסבר.
"""
import pytest

from app.csv_import import _amount_cell, parse

H = "מספר מסמך,לקוח,טלפון,סכום\n"


@pytest.mark.parametrize("cell", ["−500", "‑500", "–500", "‐500", "500−", "500–", "1,200.00−",
                                  "⁨−500⁩", "‏−500‏", "－500", "﹣500", "−1,200.00 ₪"])
def test_unicode_minus_is_negative(cell):
    amount, _ = _amount_cell(cell)
    assert amount < 0


@pytest.mark.parametrize("cell", ["−(500)", "(−500)", "−500−", "—500", "—"])
def test_ambiguous_still_rejected(cell):
    with pytest.raises(ValueError):
        _amount_cell(cell)


def test_unicode_minus_row_goes_to_credits_not_invoices():
    r = parse((H + "1001,דנה,0501234567,−500\n1002,דנה,0501234567,1200\n").encode())
    assert [c.number for c in r.credits] == ["1001"]
    assert [(i.number, i.amount_agorot) for i in r.invoices] == [("1002", 120000)]
    assert r.errors == []


def test_gross_amount_with_paid_rejected_visibly():
    r = parse("מספר מסמך,לקוח,טלפון,סכום,שולם\n1001,דנה,0501234567,1200,800\n".encode())
    assert r.invoices == [] and r.credits == []
    assert r.errors and r.errors[0]["row"] == 2 and "יתרה לתשלום" in r.errors[0]["error"]


@pytest.mark.parametrize("paid", ["", "0", "0.00", "לא", "no", "₪0"])
def test_gross_amount_with_zero_paid_is_balance(paid):
    r = parse(f"מספר מסמך,לקוח,טלפון,סכום,שולם\n1001,דנה,0501234567,1200,{paid}\n".encode())
    assert [(i.number, i.amount_agorot) for i in r.invoices] == [("1001", 120000)], r.errors


@pytest.mark.parametrize("paid", ["כן", "V", "✓", "שולם", "yes"])
def test_paid_flag_yes_not_imported(paid):
    r = parse(f"מספר מסמך,לקוח,טלפון,סכום,שולם\n1001,דנה,0501234567,1200,{paid}\n".encode())
    assert r.invoices == [] and "שולם" in r.errors[0]["error"]


def test_paid_unreadable_rejected():
    r = parse("מספר מסמך,לקוח,טלפון,סכום,שולם\n1001,דנה,0501234567,1200,חלקי\n".encode())
    assert r.invoices == [] and "לא ברור כמה נשאר" in r.errors[0]["error"]


def test_balance_column_wins_paid_ignored():
    r = parse("מספר חשבונית,שם לקוח,נייד,סה\"כ,סכום ששולם,יתרה\n1001,דנה,0501234567,1200,800,400\n".encode())
    assert [(i.number, i.amount_agorot) for i in r.invoices] == [("1001", 40000)]


def test_english_balance_preferred_over_amount():
    r = parse(b"Invoice,Customer,Phone,Amount,Paid,Balance\n1001,Dana,0501234567,1200,800,400\n")
    assert [(i.number, i.amount_agorot) for i in r.invoices] == [("1001", 40000)]
    r = parse(b"Invoice,Customer,Phone,Total,Amount Due\n1001,Dana,0501234567,1200,400\n")
    assert [(i.number, i.amount_agorot) for i in r.invoices] == [("1001", 40000)]


def test_english_gross_with_paid_rejected():
    r = parse(b"Invoice,Customer,Phone,Amount,Amount Paid\n1001,Dana,0501234567,1200,800\n")
    assert r.invoices == [] and r.errors


def test_credit_row_with_paid_column_still_credit():
    r = parse("מספר מסמך,לקוח,טלפון,סכום,שולם\n1001,דנה,0501234567,(300),0\n".encode())
    assert [c.number for c in r.credits] == ["1001"] and r.errors == []


def test_debit_credit_ledger_explains():
    with pytest.raises(ValueError, match="חובה/זכות"):
        parse("מספר מסמך,לקוח,טלפון,חובה,זכות\n1001,דנה,0501234567,1200,800\n".encode())


def test_no_paid_column_unchanged():
    r = parse((H + "1001,דנה,0501234567,1200\n").encode())
    assert [(i.number, i.amount_agorot) for i in r.invoices] == [("1001", 120000)]

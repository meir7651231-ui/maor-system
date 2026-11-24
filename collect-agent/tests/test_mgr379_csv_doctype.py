"""מנהל 379: עמודת «סוג מסמך» לא נקראה ⇒ ייצוא «כל המסמכים» הכניס קבלות, חשבוניות מס-קבלה (כבר שולמו),
זיכויים בסכום חיובי, הצעות מחיר ותעודות משלוח כחוב פתוח ⇒ תזכורת «טרם שולמה» על כסף שכבר התקבל 🔴."""
import pytest

from app import csv_import as c


def _row(doctype: str, amount: str = "100", header: str = "סוג מסמך", amount_col: str = "יתרה לתשלום") -> str:
    return (f"מספר מסמך,שם לקוח,טלפון,{amount_col},תאריך,{header}\n"
            f'1001,דנה,0521234567,"{amount}",01/10/2026,{doctype}\n')


BLOCKED = ["קבלה", "חשבונית מס קבלה", "חשבונית מס / קבלה", "חשבונית מס-קבלה", "Receipt", "Tax Invoice Receipt",
           "Invoice/Receipt", "חשבונית זיכוי", "זיכוי", "Credit Note", "credit", "Refund", "הצעת מחיר", "Quote",
           "Estimate", "טיוטה", "תעודת משלוח", "ת. משלוח", "Delivery Note", "הזמנה", "הזמנת עבודה",
           "Purchase Order", "Order"]
ALLOWED = ["חשבונית", "חשבונית מס", "חשבון עסקה", "Proforma", "Invoice", "Tax Invoice", "עסקי", "פרטי",
           "Ordered", "Credit Card", ""]   # «305» בכותרת מפורשת ⇒ קוד (מנהל 381, test_mgr381)


@pytest.mark.parametrize("amount", ["100", "0"])
@pytest.mark.parametrize("doctype", BLOCKED)
def test_non_debt_doctypes_rejected_visibly_and_never_close(doctype, amount):
    r = c.parse(_row(doctype, amount))
    assert r.invoices == [] and r.closed == [], doctype
    assert len(r.errors) == 1 and "סוג המסמך" in r.errors[0]["error"]


@pytest.mark.parametrize("doctype", ALLOWED)
def test_payment_demands_and_unknown_values_unchanged(doctype):
    r = c.parse(_row(doctype))
    assert r.errors == [] and [i.number for i in r.invoices] == ["1001"], doctype


@pytest.mark.parametrize("amount", ["-50", "(50)", "₪-50", "50-"])
@pytest.mark.parametrize("doctype", ["חשבונית זיכוי", "Credit Note"])
def test_negative_credit_note_keeps_credit_review_flow(doctype, amount):
    r = c.parse(_row(doctype, amount))
    assert r.errors == [] and r.invoices == [] and len(r.credits) == 1


@pytest.mark.parametrize("header", ["סוג מסמך", "סוג המסמך", "סוג", "Document Type", "doc type", "Type"])
def test_header_aliases(header):
    r = c.parse(_row("קבלה", header=header))
    assert r.invoices == [] and len(r.errors) == 1


def test_gross_amount_column_also_checked():
    r = c.parse(_row("קבלה", amount_col="סכום"))
    assert r.invoices == [] and len(r.errors) == 1


def test_mixed_file_only_invoices_become_debts():
    csv = ("מספר מסמך,שם לקוח,טלפון,סכום,תאריך,סוג מסמך\n"
           "1001,דנה,0521234567,100,01/10/2026,חשבונית מס\n"
           "1001A,דנה,0521234567,100,02/10/2026,קבלה\n"
           "2001,יוסי,0527654321,250,01/10/2026,הצעת מחיר\n"
           "1002,יוסי,0527654321,250,03/10/2026,חשבון עסקה\n")
    r = c.parse(csv)
    assert [i.number for i in r.invoices] == ["1001", "1002"]
    assert [e["row"] for e in r.errors] == [3, 4] and r.closed == []


def test_receipt_with_same_number_as_open_invoice_does_not_close_it():
    # לכל סוג מסמך מספור נפרד: קבלה 1001 בסכום 0 לא סוגרת את חשבונית 1001 שכבר במערכת
    r = c.parse(_row("קבלה", "0"))
    assert "1001" not in r.closed


def test_no_doctype_column_unchanged():
    r = c.parse("מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך\n1001,דנה,0521234567,100,01/10/2026\n")
    assert [i.number for i in r.invoices] == ["1001"] and r.errors == []

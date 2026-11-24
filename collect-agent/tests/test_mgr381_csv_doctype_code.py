"""מנהל 381: סוג מסמך כקוד מספרי (morning: 305 חשבונית מס · 320 מס-קבלה · 330 זיכוי · 400 קבלה) נקלט כ«לא מוכר»
⇒ קבלה 400 בסכום חיובי = תזכורת «טרם שולמה» על כסף שכבר התקבל 🔴; בסכום 0 — סגרה חשבונית אחרת באותו מספר.
עכשיו: בכותרת מפורשת («סוג מסמך»/«Document Type») קוד ⇒ שגיאה גלויה בכל סכום. בכותרת סתמית («סוג»/«Type»)
מספר הוא לרוב סוג לקוח ⇒ ללא שינוי."""
import pytest

from app import csv_import as c


def _csv(doctype: str, amount: str = "100", header: str = "סוג מסמך") -> str:
    return (f"מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך,{header}\n"
            f'1001,דנה,0521234567,"{amount}",01/10/2026,{doctype}\n')


CODES = ["400", "320", "330", "305", "300", "10", "1", "400.0", " 400 ", "405"]
EXPLICIT = ["סוג מסמך", "סוג המסמך", "Document Type", "doc type", "doctype"]


@pytest.mark.parametrize("amount", ["100", "0"])
@pytest.mark.parametrize("code", CODES)
def test_numeric_doctype_rejected_and_never_closes(code, amount):
    r = c.parse(_csv(code, amount))
    assert r.invoices == [] and r.closed == [], code
    assert len(r.errors) == 1 and "קוד מספרי" in r.errors[0]["error"]


@pytest.mark.parametrize("header", EXPLICIT)
def test_explicit_headers(header):
    r = c.parse(_csv("400", header=header))
    assert r.invoices == [] and len(r.errors) == 1


@pytest.mark.parametrize("header", ["סוג", "Type", "type"])
@pytest.mark.parametrize("code", ["1", "2", "305"])
def test_generic_header_number_is_not_guessed_as_doctype(header, code):
    r = c.parse(_csv(code, header=header))
    assert r.errors == [] and [i.number for i in r.invoices] == ["1001"]


@pytest.mark.parametrize("v", ["חשבונית מס", "305A", "חשבונית 305", ""])
def test_words_and_mixed_values_unchanged(v):
    r = c.parse(_csv(v))
    assert r.errors == [] and [i.number for i in r.invoices] == ["1001"]


def test_zero_amount_receipt_code_does_not_close_existing_invoice():
    csv = ("מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך,סוג מסמך\n"
           "1001,דנה,0521234567,0,01/10/2026,400\n"
           "1002,יוסי,0527654321,250,03/10/2026,חשבונית מס\n")
    r = c.parse(csv)
    assert r.closed == [] and [i.number for i in r.invoices] == ["1002"] and len(r.errors) == 1


def test_message_is_plain_and_shows_code():
    r = c.parse(_csv("400"))
    msg = r.errors[0]["error"]
    assert "«400»" in msg and "קבלה" in msg


def test_source_guard_check_happens_before_closed_status():
    import inspect
    src = inspect.getsource(c.parse)
    assert src.index("_doctype_code(") < src.index("CLOSED_STATUSES")

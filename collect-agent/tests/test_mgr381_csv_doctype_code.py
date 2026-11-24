"""מנהל 381: סוג מסמך כקוד מספרי (morning: 305 חשבונית מס · 320 מס-קבלה · 330 זיכוי · 400 קבלה) נקלט כ«לא מוכר»
⇒ קבלה 400 בסכום חיובי = תזכורת «טרם שולמה» על כסף שכבר התקבל 🔴; בסכום 0 — סגרה חשבונית אחרת באותו מספר.
381: בכותרת מפורשת כל קוד ⇒ שגיאה. סט #24 (גבי חיבורים): קודי חשבונית ירוקה ממופים (305/300 חוב, השאר לא);
לא מוכר ⇒ שגיאה; בכותרת סתמית רק קודי קבלה/זיכוי חוסמים."""
import pytest

from app import csv_import as c


def _csv(doctype: str, amount: str = "100", header: str = "סוג מסמך") -> str:
    return (f"מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך,{header}\n"
            f'1001,דנה,0521234567,"{amount}",01/10/2026,{doctype}\n')


# סט עיוור #24 (גבי בדיקות, הכרעת מקשר 24.11): 381 דחה **כל** קוד ⇒ ייצוא morning עם 305 נקלט כאפס חשבוניות 🔴.
# עכשיו קודי חשבונית ירוקה ממופים: 305/300 ⇒ חוב · 320/330/400/405 + 10/100/200/210 ⇒ לא חוב (שגיאה עם ההסבר) ·
# קוד לא מוכר ⇒ שגיאה «קוד מספרי». בכותרת סתמית «סוג»: רק 320/330/400/405 חוסמים (1/2 = סוג לקוח).
EXPLICIT = ["סוג מסמך", "סוג המסמך", "Document Type", "doc type", "doctype"]
NOT_DEBT = {"320": "מס-קבלה", "330": "זיכוי", "400": "קבלה", "400.0": "קבלה", " 400 ": "קבלה",
            "405": "תרומה", "10": "הצעת מחיר", "100": "הזמנה", "200": "תעודת משלוח", "210": "תעודת החזרה"}


@pytest.mark.parametrize("header", EXPLICIT)
@pytest.mark.parametrize("code", ["305", "300", "305.0"])
def test_debt_codes_imported(code, header):
    r = c.parse(_csv(code, header=header))
    assert r.errors == [] and [i.number for i in r.invoices] == ["1001"], (code, r.errors)


@pytest.mark.parametrize("amount", ["100", "0"])
@pytest.mark.parametrize("code,word", NOT_DEBT.items())
def test_not_debt_codes_rejected_with_reason_and_never_close(code, word, amount):
    r = c.parse(_csv(code, amount))
    assert r.invoices == [] and r.closed == [] and r.credits == [], code
    assert len(r.errors) == 1 and word in r.errors[0]["error"], r.errors


@pytest.mark.parametrize("amount", ["100", "0"])
@pytest.mark.parametrize("code", ["1", "2", "999", "500", "610"])
def test_unknown_code_in_explicit_header_rejected(code, amount):
    r = c.parse(_csv(code, amount))
    assert r.invoices == [] and r.closed == []
    assert len(r.errors) == 1 and "קוד מספרי" in r.errors[0]["error"] and f"«{code}»" in r.errors[0]["error"]


def test_negative_330_goes_to_credit_review_like_word_zikui():
    r = c.parse(_csv("330", "-250"))
    assert r.errors == [] and r.invoices == [] and [x.amount_agorot for x in r.credits] == [25000]


def test_morning_export_with_codes_imports_only_debts():
    """הבאג של #24: ייצוא morning «כל המסמכים» עם עמודת סוג קודית ⇒ היה imported=0."""
    csv = ("מספר מסמך,סוג מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך\n"
           "5001,305,דנה,0521234567,1200,01/10/2026\n5002,300,יוסי,0527654321,800,02/10/2026\n"
           "5003,320,רון,0541234567,500,03/10/2026\n5004,400,דנה,0521234567,1200,04/10/2026\n"
           "5005,330,יוסי,0527654321,-100,05/10/2026\n")
    r = c.parse(csv)
    assert [i.number for i in r.invoices] == ["5001", "5002"]
    assert [e["row"] for e in r.errors] == [4, 5] and [x.number for x in r.credits] == ["5005"]


@pytest.mark.parametrize("header", EXPLICIT)
def test_explicit_headers(header):
    r = c.parse(_csv("400", header=header))
    assert r.invoices == [] and len(r.errors) == 1


@pytest.mark.parametrize("header", ["סוג", "Type", "type"])
@pytest.mark.parametrize("code", ["1", "2", "305", "300", "10", "999"])
def test_generic_header_number_is_not_guessed_as_doctype(header, code):
    r = c.parse(_csv(code, header=header))
    assert r.errors == [] and [i.number for i in r.invoices] == ["1001"]


@pytest.mark.parametrize("header", ["סוג", "Type", "type"])
@pytest.mark.parametrize("code", ["400", "400.0", "320", "330", "405"])
def test_generic_header_receipt_or_credit_code_blocked(header, code):
    """#24 תצפית q24-18 🟠: בכותרת «סוג» קבלה 400 נקלטה כחוב ⇒ תזכורת למי ששילם."""
    r = c.parse(_csv(code, header=header))
    assert r.invoices == [] and r.closed == [] and len(r.errors) == 1


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
    assert src.index("_doctype_code_block(") < src.index("CLOSED_STATUSES")

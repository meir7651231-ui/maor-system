"""מנהל 372 (BACKLOG חיבורים): עמודת «סטטוס» ליד סכום ברוטו.

באגים שנמצאו (נבדקו על הקוד הקודם):
1. «סכום 1,200 · סטטוס שולם חלקית» (או «Partially Paid») בלי עמודת יתרה ⇒ נקלט חוב של 1,200 ⇒
   התזכורת דורשת גם את מה ששולם 🟠. עכשיו: שגיאה גלויה (לא מחסרים — אין לנו את היתרה).
2. «שולמה» / «סגורה» / «מבוטלת» / «Paid in full» / «Void» ⇒ לא זוהו כסגורים ⇒ תזכורת על חשבונית
   ששולמה 🟠. עכשיו: מדולגות כמו «שולם».
"""
import pytest

from app.csv_import import _status_partial, parse

HE = "מספר מסמך,לקוח,טלפון,{amt},סטטוס\n1001,דנה,0501234567,1200,{st}\n1002,דנה,0501234567,300,פתוח\n"
EN = "number,client,phone,{amt},status\n1001,Dana,0501234567,1200,{st}\n1002,Dana,0501234567,300,open\n"

PARTIAL = ["שולם חלקית", "שולמה חלקית", "חלקי", "תשלום חלקי", "שולם בחלקו? חלקית", "Partially Paid",
           "partial", "PARTIALLY PAID", "Part paid", "part-paid", "Partly paid", "  «שולם חלקית»  "]
CLOSED_NEW = ["שולמה", "סגורה", "נסגרה", "מבוטלת", "בוטל", "בוטלה", "שולם במלואו", "שולמה במלואה",
              "Paid in full", "Fully Paid", "Void", "VOIDED", "Settled", "Paid.", "  שולם  "]
NOT_PARTIAL = ["פתוח", "open", "", "לא שולם", "טרם שולם", "Unpaid", "overdue", "באיחור", "Departed",
               "apartment", "Partner"]


@pytest.mark.parametrize("st", PARTIAL)
@pytest.mark.parametrize("tpl,amt", [(HE, "סכום"), (HE, 'סה"כ'), (EN, "amount"), (EN, "total")])
def test_partial_status_with_gross_amount_is_visible_error(tpl, amt, st):
    r = parse(tpl.format(amt=amt, st=st).encode())
    assert [i.number for i in r.invoices] == ["1002"]          # השורה התקינה לא נפגעת
    assert len(r.errors) == 1 and r.errors[0]["row"] == 2
    assert "יתרה לתשלום" in r.errors[0]["error"]


@pytest.mark.parametrize("st", PARTIAL[:6])
@pytest.mark.parametrize("tpl,amt", [(HE, "יתרה לתשלום"), (HE, "יתרה"), (EN, "balance"), (EN, "amount due")])
def test_partial_status_with_balance_column_is_imported_as_is(tpl, amt, st):
    r = parse(tpl.format(amt=amt, st=st).encode())
    assert [(i.number, i.amount_agorot) for i in r.invoices] == [("1001", 120000), ("1002", 30000)]
    assert r.errors == []


@pytest.mark.parametrize("st", CLOSED_NEW)
@pytest.mark.parametrize("tpl,amt", [(HE, "סכום"), (EN, "amount"), (HE, "יתרה")])
def test_closed_status_variants_are_skipped(tpl, amt, st):
    r = parse(tpl.format(amt=amt, st=st).encode())
    assert [i.number for i in r.invoices] == ["1002"] and r.errors == [] and r.credits == []


@pytest.mark.parametrize("st", NOT_PARTIAL)
def test_open_like_statuses_unchanged(st):
    assert not _status_partial(st)
    r = parse(HE.format(amt="סכום", st=st).encode())
    assert [(i.number, i.amount_agorot) for i in r.invoices] == [("1001", 120000), ("1002", 30000)]


def test_partial_credit_row_still_goes_to_credits():
    """זיכוי (סכום שלילי) עם «חלקי» — לא חוב, ממשיך לבדיקת זיכוי כמו קודם."""
    r = parse(HE.format(amt="סכום", st="חלקי").replace(",1200,", ",-1200,").encode())
    assert [c.number for c in r.credits] == ["1001"] and r.errors == []


def test_partial_with_paid_zero_column_still_rejected():
    """«שולם 0» אבל «שולם חלקית» — סותר ⇒ לא מנחשים, שגיאה גלויה."""
    t = "מספר מסמך,לקוח,טלפון,סכום,שולם,סטטוס\n1001,דנה,0501234567,1200,0,שולם חלקית\n"
    r = parse(t.encode())
    assert r.invoices == [] and "יתרה לתשלום" in r.errors[0]["error"]

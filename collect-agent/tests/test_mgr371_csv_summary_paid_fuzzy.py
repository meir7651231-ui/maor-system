"""מנהל 371 · סגירת מבקר 214🟠 + 215🟠 — שומרים לנתיבים הגמישים שנוספו ב-`app/csv_import.py`.

214: תווית בעמודת המספר שמתחילה (אחרי עיטורים) בסה״כ/סיכום/total ⇒ שגיאה גלויה; מספר מסמך בלי אף ספרה ⇒ שגיאה.
215: שם עמודת «שולם» שלא ברשימה אבל עם מילת תשלום-שהתקבל ⇒ מזוהה (`_paid_like`) — אבל לא שלילה («לא שולם»,
«Unpaid» = יתרה), לא תאריך, לא מספר/כמות תשלומים, לא «שולם על ידי»."""
from datetime import date

import pytest

from app.csv_import import _paid_like, parse

T = date(2026, 11, 8)


def _p(txt):
    return parse(txt.encode(), today=T)


@pytest.mark.parametrize("col", ["סה\"כ שולם", "Total Paid To Date", "Amount Paid (ILS)", "שולם בפועל",
                                 "Received Amount", "Payments Applied", "סכום שהתקבל עד היום"])
def test_unlisted_paid_names_detected(col):
    r = _p(f"מספר מסמך,שם לקוח,טלפון,סכום,{col}\n1001,דנה,0501234567,1200,800\n")
    assert not r.invoices and r.errors, (col, r.invoices)


@pytest.mark.parametrize("col", ["לא שולם", "טרם שולם", "Unpaid", "Amount Unpaid", "תאריך תשלום שהתקבל",
                                 "Date Paid", "מספר תשלומים", "# Payments", "Number of payments",
                                 "Paid By", "Payment Method", "הערות"])
def test_non_paid_columns_not_treated_as_paid(col):
    assert not _paid_like(col.lower())
    r = _p(f"מספר מסמך,שם לקוח,טלפון,סכום,{col}\n1001,דנה,0501234567,1200,800\n")
    assert [i.amount_agorot for i in r.invoices] == [120000] and not r.errors, (col, r.errors)


def test_paid_like_ignored_when_balance_column():
    r = _p("מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,שולם עד כה\n1001,דנה,0501234567,400,800\n")
    assert [i.amount_agorot for i in r.invoices] == [40000] and not r.errors


def test_paid_zero_under_new_name_imports():
    r = _p("מספר מסמך,שם לקוח,טלפון,סכום,התקבל\n1001,דנה,0501234567,1200,0\n")
    assert [i.amount_agorot for i in r.invoices] == [120000]


@pytest.mark.parametrize("label", ["=== Total ===", "- סה\"כ -", "סה\"כ לתשלום (ש\"ח)", "Subtotal:", "SUMMARY",
                                   "סך כל החובות", "Totals for October"])
def test_summary_prefix_in_number_column(label):
    cell = '"' + label.replace('"', '""') + '"'
    r = _p(f"מספר מסמך,שם לקוח,טלפון,סכום\n1001,דנה,0501234567,1200\n{cell},,0501234567,1200\n")
    assert [i.number for i in r.invoices] == ["1001"]
    assert r.errors and "סיכום" in r.errors[0]["error"]


@pytest.mark.parametrize("num", ["ABC", "הערה", "N/A-x", "טיוטה"])
def test_digitless_doc_number_visible_error(num):
    r = _p(f"מספר מסמך,שם לקוח,טלפון,סכום\n{num},דנה,0501234567,1200\n")
    assert not r.invoices and r.errors and r.errors[0]["row"] == 2


@pytest.mark.parametrize("client", ["Total Solutions", "סיכום בע\"מ", "Summit Ltd", "Sumo Foods"])
def test_real_clients_with_summary_like_names_kept(client):
    cell = '"' + client.replace('"', '""') + '"'
    r = _p(f"מספר מסמך,שם לקוח,טלפון,סכום\n1001,{cell},0501234567,1200\n")
    assert [i.client_name for i in r.invoices] == [client]


@pytest.mark.parametrize("num", ["SUMMIT-1001", "Totalnet-55", "1001-Total"])
def test_doc_numbers_starting_with_word_not_summary(num):
    r = _p(f"מספר מסמך,שם לקוח,טלפון,סכום\n{num},דנה,0501234567,1200\n")
    assert [i.number for i in r.invoices] == [num]

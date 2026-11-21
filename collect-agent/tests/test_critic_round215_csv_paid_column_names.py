"""מבקר סבב 215 · 🟠 — המשך f44ffbac (מנהל 370): עמודת «שולם» בשם אחר ⇒ הסכום הברוטו נקלט כחוב מלא.

רכיב: `app/csv_import.py` → `COLUMNS["paid"]` (רשימה סגורה: סכום ששולם, שולם, תקבולים, זכות, paid, amount paid,
paid amount) + `_paid_conflict`. 370 תיקן «סכום 1,200 · שולם 800» ⇒ שגיאה גלויה במקום תזכורת על 1,200 ✓.
אותו קובץ עם שם עמודה נפוץ אחר ⇒ העמודה לא מזוהה ⇒ **חוב של 1,200 ₪, errors=[]** — כלומר דרישה לשלם 800 ₪ ששולמו,
בדיוק הבאג ש-370 סגר: «שולם עד כה», «התקבל», «נתקבל», «סכום שהתקבל», «Amount Received», «Received», «Paid to date»,
«Payments». (בכוונה בלי «תשלום»/«תשלומים» — דו-משמעי, יכול להיות מספר תשלומים.)
xfail(strict=True) פר-שם; בקרות ירוקות + שומרים למספרי מסמך עם אותיות (לקראת תיקון 214)."""
from datetime import date

import pytest

from app.csv_import import parse


def _parse_with_paid(col):
    txt = (f"מספר מסמך,שם לקוח,טלפון,סכום,{col},תאריך,תאריך לתשלום\n"
           "1001,דנה,0501234567,1200,800,01/11/26,15/11/26\n")
    return parse(txt.encode(), today=date(2026, 11, 8))


@pytest.mark.parametrize("col", ["שולם עד כה", "התקבל", "נתקבל", "סכום שהתקבל", "Amount Received", "Received",
                                 "Paid to date", "Payments"])
def test_paid_column_variant_blocks_gross_debt(col):
    r = _parse_with_paid(col)
    assert not [i for i in r.invoices if i.amount_agorot == 120000], [(i.number, i.amount_agorot) for i in r.invoices]


@pytest.mark.parametrize("col", ["שולם", "סכום ששולם", "תקבולים", "זכות"])
def test_control_listed_paid_columns(col):
    r = _parse_with_paid(col)
    assert not r.invoices and r.errors


# שומרים לקראת תיקון 214 (נוסחי «סה״כ» / «מספר מסמך בלי ספרה»): מספרי מסמך עם אותיות נשארים חשבוניות.
@pytest.mark.parametrize("num", ["INV-1001", "א-1001", "2024/1001", "חש-55", "A1001", "1001א", "SO-2024-001",
                                 "F 1001"])
def test_control_doc_numbers_with_letters_still_imported(num):
    r = parse(("מספר מסמך,שם לקוח,טלפון,סכום,תאריך,תאריך לתשלום\n"
               f'"{num}",דנה,0501234567,1200,01/11/26,15/11/26\n').encode(), today=date(2026, 11, 8))
    assert [i.number for i in r.invoices] == [num]

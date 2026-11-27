"""מבקר סבב 267 (🟡, גבי מנוע): תקרת 5,000 השורות סופרת גם שורות ריקות.

`csv_import.parse` בודק `len(rows) - 1 > MAX_ROWS` על **כל** השורות שהקורא החזיר — כולל שורות ריקות
ו-«,,,,,,,» (Excel מייצא אותן כשעיצוב נמרח מתחת לטבלה). שורות כאלה מדולגות ממילא בעיבוד, אבל נספרות
לתקרה ⇒ קובץ של 300 חשבוניות + 5,000 שורות ריקות (64KB, הרבה מתחת ל-2MB) נדחה כולו: «יותר מדי שורות
(מקס׳ 5000)». בעל העסק רואה 300 שורות ב-Excel ולא מבין מה לתקן. מצופה: התקרה סופרת שורות עם תוכן.
רכיב: app/csv_import.py → parse (בדיקת MAX_ROWS).
"""
from __future__ import annotations

import pytest

from app import csv_import

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
REAL = "".join(f"{9000 + i},לקוח {i},050-{1000000 + i:07d},,1200,פתוח,01/10/26,15/10/26\n" for i in range(300))


def test_few_ghost_rows_are_ignored_control():
    r = csv_import.parse((H + REAL + ",,,,,,,\r\n" * 100).encode())
    assert len(r.invoices) == 300 and not r.errors


def test_real_rows_over_cap_still_rejected_control():
    many = "".join(f"{20000 + i},לקוח {i},050-{2000000 + i:07d},,1200,פתוח,01/10/26,15/10/26\n"
                   for i in range(csv_import.MAX_ROWS + 1))
    with pytest.raises(ValueError, match="יותר מדי שורות"):
        csv_import.parse((H + many).encode())


@pytest.mark.parametrize("ghost", [",,,,,,,\r\n", "\r\n"])
def test_excel_ghost_rows_do_not_count_toward_cap(ghost):
    raw = (H + REAL + ghost * csv_import.MAX_ROWS).encode()
    assert len(raw) < csv_import.MAX_BYTES
    r = csv_import.parse(raw)
    assert len(r.invoices) == 300

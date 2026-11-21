"""מבקר סבב 216 · 🟡 — הכללת-יתר בתיקון 214 (4f8d93ff, מנהל 371): מספר מסמך שמתחיל במילת סיכום נדחה כ«שורת סיכום».

רכיב: `app/csv_import.py` → `_is_summary` (התחילית סה״כ/סיכום/total/sum… ⇒ סיכום, עכשיו בלי עיגון $). 214 סגר
את 12 נוסחי הסיכום ✓, ושומרי 215 למספרים עם אותיות (INV-1001, א-1001, 2024/1001…) ירוקים ✓. אבל מספר מסמך
שהתחילית שלו היא מילת סיכום ואחריה מספר — «SUM-1001», «Sum1001», «TOTAL-1001», «Total2024-5», «סהכ-1001»,
«סיכום-1001» — נדחה: «שורת סיכום (סה״כ) — לא חשבונית, לא נקלטה». השגיאה גלויה, אבל חשבונית אמיתית יוצאת
מהייבוא עם הסבר שגוי (בעל העסק יחפש שורת סיכום שאין). הצעה: תחילית סיכום + מקף/צמוד + רצף ספרות (≥3) = מספר מסמך;
או: סיכום רק אם אין בתא רצף ספרות של מספר מסמך. xfail(strict=True); בקרות ירוקות."""
from datetime import date

import pytest

from app.csv_import import parse

H = "מספר מסמך,שם לקוח,טלפון,סכום,תאריך,תאריך לתשלום\n"


def _nums(num):
    r = parse((H + f'"{num}",דנה,0501234567,1200,01/11/26,15/11/26\n').encode(), today=date(2026, 11, 8))
    return [i.number for i in r.invoices]


@pytest.mark.xfail(strict=True, reason="216🟡: מספר מסמך «SUM-1001» / «סיכום-1001» נדחה כשורת סיכום")
@pytest.mark.parametrize("num", ["SUM-1001", "Sum1001", "TOTAL-1001", "Total2024-5", "סהכ-1001", "סיכום-1001"])
def test_doc_number_with_summary_prefix_imported(num):
    assert _nums(num) == [num]


@pytest.mark.parametrize("num", ["SUB-77", "SUMMIT-1", "TOT-55", "סכ-1001"])
def test_control_other_prefixes_imported(num):
    assert _nums(num) == [num]

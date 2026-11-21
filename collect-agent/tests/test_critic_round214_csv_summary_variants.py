"""מבקר סבב 214 · 🟠 — המשך 0df8b196 (מנהל 368): שורת סיכום בנוסח אחר נקלטת בשקט כחשבונית.

רכיב: `app/csv_import.py` → `_SUMMARY` (רשימה סגורה: «סה״כ» + סיומת מתוך {לתשלום, כללי, כולל, חובות, יתרות, יתרה,
פתוחות, amount, due, balance, open}, מעוגן ב-$) + `parse` (מספר מסמך שאין בו ספרה — מתקבל).
368 תיקן «סה״כ» / «Total» / «Grand Total» / «Totals:» ✓. אבל נוסחים נפוצים אחרים בעמודת המספר, בשורה שיש בה טלפון
(כמו בבאג המקורי — תא ממוזג / טלפון העסק) ⇒ **חשבונית של 2,000 ₪ על הטלפון של דנה, בלי שגיאה**:
«סה"כ לגבייה», «סה"כ חוב», «סה"כ חשבוניות», «סה"כ (2 חשבוניות)», «סה"כ ₪», «סה"כ פתוח», «סה"כ 2 מסמכים»,
«*** סה"כ ***», «סכום כולל», «סיכום ביניים», «Sub-total», «Total (ILS)».
הצעה: תווית שמתחילה (אחרי סימני עיטור) ב-סה״כ / סך / סיכום / סכום כולל / total / subtotal / sub-total / sum ⇒ סיכום;
ובנוסף מספר מסמך בלי אף ספרה ⇒ שגיאה גלויה. xfail(strict=True) פר-נוסח; בקרות ירוקות."""
from datetime import date

import pytest

from app.csv_import import parse

H = "מספר מסמך,שם לקוח,טלפון,סכום,תאריך,תאריך לתשלום\n"
R = "1001,דנה,0501234567,1200,01/11/26,15/11/26\n1002,יוסי,0527654321,800,01/11/26,15/11/26\n"


def _numbers(label):
    cell = '"' + label.replace('"', '""') + '"'
    r = parse((H + R + f"{cell},,0501234567,2000,,\n").encode(), today=date(2026, 11, 8))
    return [i.number for i in r.invoices]


@pytest.mark.xfail(strict=True, reason="214🟠: נוסח סיכום שלא ברשימה ⇒ חשבונית של 2,000 ₪ בלי שגיאה")
@pytest.mark.parametrize("label", ['סה"כ לגבייה', 'סה"כ חוב', 'סה"כ חשבוניות', 'סה"כ (2 חשבוניות)', 'סה"כ ₪',
                                   'סה"כ פתוח', 'סה"כ 2 מסמכים', '*** סה"כ ***', 'סכום כולל', 'סיכום ביניים',
                                   'Sub-total', 'Total (ILS)'])
def test_summary_variant_not_imported(label):
    assert _numbers(label) == ["1001", "1002"]


@pytest.mark.parametrize("label", ['סה"כ', 'סה״כ:', 'Total', 'TOTAL:', 'Grand Total', 'Totals:', 'Total open'])
def test_control_listed_summaries_rejected(label):
    assert _numbers(label) == ["1001", "1002"]

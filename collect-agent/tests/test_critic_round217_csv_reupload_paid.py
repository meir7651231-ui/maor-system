"""מבקר סבב 217 · 🟠 — עסק CSV מעלה קובץ עדכני שבו החשבונית שולמה: החשבונית נשארת פתוחה והבאנר לא יורד.

רכיבים: `app/service.py` → `import_csv` (ייבוא חלקי: שורת «סטטוס=שולם» / סכום 0 מדולגת ב-`csv_import.parse` ⇒ לא
נוגעת בחשבונית הקיימת) + `app/morning.py` → `_csv_freshness` (טריות = MAX(synced_at) של חשבוניות csv — קובץ בלי
שורה פתוחה לא מעדכן אותו). באנר `CsvFreshBanner` (1b2eefec/19229688) ⇒ «העלו קובץ CSV עדכני».
נבדק (source_system=csv): 7001 (500 ₪) יובאה ב-8.11 ⇒ יומיים ⇒ upload_needed ✓ ⇒ בעל העסק מעלה את הקובץ של היום, שבו
7001 «שולם» (או יתרה 0) ⇒ imported=0, errors=[] ⇒ **7001 נשארת status=open** (בדשבורד כחוב) ו-**upload_needed=True**
עם last_import=2026-11-08 — הבאנר ממשיך לבקש קובץ עדכני אחרי שהועלה, ולעולם לא יורד כל עוד אין שורה פתוחה בקובץ.
(תזכורות לא יוצאות — ר-4, ההגנה עובדת; הבעיה היא התמונה של בעל העסק.) הצעה: שורת «שולם»/0 על מספר מסמך קיים ⇒
סגירה (כמו סנכרון API); וכל ייבוא מוצלח מעדכן את חותמת הטריות. xfail(strict=True); בקרה ירוקה."""
from dataclasses import replace
from datetime import timedelta

import pytest

H = "מספר מסמך,שם לקוח,טלפון,סכום,סטטוס,תאריך,תאריך לתשלום\n"
OPEN = "7001,רוני,0541112222,500,פתוח,01/11/26,15/11/26\n"


def _csv_business(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    assert svc.import_csv((H + OPEN).encode())["imported"] == 1
    clock.now += timedelta(days=2)
    assert svc._csv_freshness()["upload_needed"] is True


@pytest.mark.xfail(strict=True, reason="217🟠: קובץ עדכני עם «שולם»/0 ⇒ החשבונית נשארת פתוחה")
@pytest.mark.parametrize("row", ["7001,רוני,0541112222,500,שולם,01/11/26,15/11/26\n",
                                 "7001,רוני,0541112222,0,פתוח,01/11/26,15/11/26\n"])
def test_reupload_marks_paid_invoice_closed(svc, clock, row):
    _csv_business(svc, clock)
    svc.import_csv((H + row).encode())
    assert svc.db.one("SELECT status FROM invoices WHERE number='7001'")["status"] != "open"


@pytest.mark.xfail(strict=True, reason="217🟠: קובץ עדכני בלי שורה פתוחה ⇒ באנר «העלו קובץ עדכני» לא יורד")
def test_successful_upload_refreshes_banner(svc, clock):
    _csv_business(svc, clock)
    svc.import_csv((H + "7001,רוני,0541112222,500,שולם,01/11/26,15/11/26\n").encode())
    assert svc._csv_freshness()["upload_needed"] is False


def test_control_open_reupload_refreshes(svc, clock):
    _csv_business(svc, clock)
    svc.import_csv((H + OPEN).encode())
    assert svc._csv_freshness()["upload_needed"] is False

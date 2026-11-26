"""מבקר סבב 255 · 🟠 — התממה (ר-10, 90 יום מסגירת החוב) מוחקת שם/טלפון/מייל, אבל `customers.external_id` של לקוח בלי
מזהה GI נשאר `phone:972500000111` / `email:david@x.example.com` — הטלפון והמייל נשמרים בלי הגבלת זמן.

רכיבים: `app/service.py` → `_purge_rows` (`UPDATE customers SET name=NULL, phone=NULL, email=NULL, blocked_phone=NULL,
blocked_email=NULL, purged_at=?` — בלי `external_id`) · `customer_key` (בלי מזהה GI ⇒ `email:<מייל>` / `phone:<מנורמל>`,
ובפיצול 383 גם `|name:<שם>`). נוגע לכל לקוח CSV ולכל לקוח API בלי `client.id`.
תרחיש: קובץ — 7001 דויד כהן (050-0000111 + david@x.example.com), 7002 שרה לוי (אותו טלפון, בלי מייל), 8001 אבי מור (רק
avi@y.example.com) ⇒ «שולם» ⇒ 100 יום ⇒ `purge_closed` ⇒ שלושתם `purged_at`, name/phone/email NULL — וסריקה של כל
הטבלאות מוצאת את 0000111 / david@x / avi@y ב-`customers.external_id` בלבד.
✓ 254 (מנהל 423) תוקן: «טופל» של עובד/ת על inherited_optout ⇒ 403; בדפדפן (390px, build טרי) — כרטיס inherited_optout
ו-api_mass_vanish נעולים לעובד/ת עם «🔒 בעל העסק בלבד». ✓ ℹ️ 243 טופל (ui.mjs — המתנה לתנאי). ℹ️ כרטיס inherited_optout
פתוח שהלקוח שלו הותמם נשאר `needs_owner=1` עם גוף ריק לתמיד (עובד/ת לא יכול/ה לסגור — 403).
הצעה: בהתממה — `external_id` ⇒ גיבוב (כמו `addr_hash` ב-suppressions), כך שהתאמה בייבוא עתידי עדיין אפשרית בלי לשמור את
הערך הגלוי. xfail(strict=True)."""
from dataclasses import replace
from datetime import timedelta

import pytest

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
ROWS = ("7001,דויד כהן,050-0000111,david@x.example.com,1200,{s},01/10/26,15/10/26\n"
        "7002,שרה לוי,050-0000111,,450,{s},01/10/26,15/10/26\n"
        "8001,אבי מור,,avi@y.example.com,300,{s},01/10/26,15/10/26\n")


@pytest.mark.xfail(strict=True, reason="255🟠: אחרי התממה external_id שומר phone:/email: גלויים")
def test_purge_scrubs_contact_in_external_id(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + ROWS.format(s="פתוח")).encode())
    clock.now += timedelta(days=1)
    svc.import_csv((H + ROWS.format(s="שולם")).encode())
    clock.now += timedelta(days=100)
    svc.purge_closed()
    rows = svc.db.q("SELECT external_id, purged_at FROM customers")
    assert rows and all(r["purged_at"] for r in rows)
    leaked = [r["external_id"] for r in rows
              if any(s in (r["external_id"] or "") for s in ("0000111", "david@x", "avi@y", "שרה"))]
    assert not leaked, leaked

"""מבקר סבב 256 · 🟡 — מפתח הלקוח אחרי התממה (מנהל 424) הוא `purged:sha256("phone:9725…")` בלי מלח/מפתח: מרחב הניידים
בישראל (~10⁸) נסרק בדקות, ולכן הטלפון ניתן לשחזור מהמפתח — התממה למראית עין.

רכיבים: `app/service.py` → `_purged_customer_key` (SHA-256 דטרמיניסטי על `phone:<מנורמל>` / `email:<מייל>`). לפי
התיעוד שלו המפתח **לא משמש להתאמה** («ייבוא עתידי של אותו אדם יוצר לקוח חדש»), כך שאין צורך שיהיה דטרמיניסטי.
תרחיש: 7001 דויד 050-0000111 ⇒ «הסר אותי» ⇒ «שולם» ⇒ 100 יום ⇒ `purge_closed` ⇒ `external_id='purged:3685…'`. סריקה של
`phone:9725XXXXXXXX` מוצאת `phone:972500000111` מיד (הבדיקה סורקת 1,000,000 מועמדים בבלוק).
✓ 255 תוקן (אין `phone:`/`email:` גלוי). ✓ לקוח מותמם שחוזר בקובץ (אותו טלפון) ⇒ לקוח חדש, opted_out=0 — אבל רשימת ההסרה
לפי כתובת נאכפת: התזכורת שנבנתה מבוטלת `opted_out` לפני שליחה. ✓ סריקת כל הטבלאות אחרי התממה (סבב 255) — אין שם/טלפון/
מייל מחוץ ל-external_id. ℹ️ גם `addr_hash` של רשימת ההסרה הוא SHA-256 בלי מפתח (קיים מקודם; נשמר בכוונה לאכיפת §30א) —
אותה הפיכות; שווה הכרעה של גבי משפט אם HMAC עם סוד השרת.
הצעה: `purged:<uuid4>` (לא דטרמיניסטי — אין התאמה ממילא), או HMAC עם סוד השרת. xfail(strict=True)."""
import hashlib
from dataclasses import replace
from datetime import timedelta

import pytest

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


@pytest.mark.xfail(strict=True, reason="256🟡: purged:<sha256> בלי מלח — הטלפון משוחזר בסריקה של מרחב הניידים")
def test_purged_key_not_reversible_by_enumeration(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + "7001,דויד כהן,050-0000111,,1200,פתוח,01/10/26,15/10/26\n").encode())
    clock.now += timedelta(days=1)
    svc.import_csv((H + "7001,דויד כהן,050-0000111,,1200,שולם,01/10/26,15/10/26\n").encode())
    clock.now += timedelta(days=100)
    svc.purge_closed()
    ext = svc.db.one("SELECT external_id FROM customers")["external_id"]
    assert ext.startswith("purged:")
    found = next((n for n in range(1_000_000)
                  if "purged:" + hashlib.sha256(f"phone:9725{n:08d}".encode()).hexdigest() == ext), None)
    assert found is None, f"שוחזר: 05{found:08d}"

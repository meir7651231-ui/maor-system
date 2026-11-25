"""מבקר סבב 244 · 🟠 — מקור שמשנה את מטבע החשבונית (USD ⇒ ILS) נקלט כסכום חדש **במטבע הישן**: התזכורת מבקשת
«$1,100» כשהקובץ אומר ₪1,100.

רכיבים: `app/service.py` → `_ingest_rows` (upsert `ON CONFLICT(external_id) DO UPDATE SET amount_agorot=…` — בלי
`currency`; אותו מסלול גם לסנכרון API) · `_note_plan_raises` / `plan_progress` (השוואות באגורות בלי מטבע).
תרחיש: קובץ: 9001 דנה 1,200 USD ⇒ קובץ למחרת: 9001 1,100 ILS ⇒ `imported:1`, בלי שגיאה ובלי כרטיס; ב-DB
`amount_agorot=110000, currency='USD'` ⇒ התזכורת «שלום דנה, חשבונית 9001 ע"ס $1,100» (פי ~3.7 מהחוב בשקלים).
בהסדר דולרי (3×$400) אותו קובץ נספר «שולם $100» (1,200−1,100) — סכומים במטבעות שונים מושווים כמספרים.
✓ נבדק בלי ממצא (מטבע עקבי): USD לאורך כל הדרך — תזכורת, הצעת פריסה, «מאשר», כרטיס «הסכום עלה» ($1,200⇒$1,500,
תוספת $300), תשלום חלקי — כולם בדולר ועקביים.
הצעה: מטבע שהשתנה במקור ⇒ לא לעדכן בשקט: כרטיס לבעל העסק + השהיית התזכורות על החשבונית (או עדכון המטבע + בנייה
מחדש של תזכורות ממתינות, בלי השוואת «עלה/ירד/שולם» בין מטבעות). xfail(strict=True)."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,מטבע,סטטוס,תאריך,תאריך לתשלום\n"


def _row(amount, currency):
    return (H + f"9001,דנה כהן,050-1234567,,{amount},{currency},פתוח,01/10/26,15/10/26\n").encode()


def test_currency_change_in_source_not_silently_kept(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv(_row(1200, "USD"))
    clock.now += timedelta(days=1)
    svc.import_csv(_row(1100, "ILS"))
    rids = svc.plan()
    bodies = [svc.db.one("SELECT body FROM reminders WHERE id=?", (r,))["body"] for r in rids]
    assert not any("$1,100" in b for b in bodies), bodies

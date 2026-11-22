"""מבקר סבב 219 — עסק CSV לאורך זמן.

א. 🟠 **טלפון/מייל של לקוח השתנו בין ייבואים ⇒ התזכורת יוצאת לטלפון ולמייל הישנים.**
   רכיב: `app/service.py` → `ingest` — מפתח הלקוח ב-CSV (`_customer_key_db`) נגזר מהטלפון ⇒ טלפון חדש = לקוח **חדש**
   («רוני» #2), אבל ה-upsert של החשבונית (`ON CONFLICT(external_id) DO UPDATE`) לא מעדכן `customer_id` ⇒ 7001 נשארת
   על «רוני» #1 עם 0541112222 / r@x.example. נבדק: ייבוא 7001 ⇒ ייבוא עם 0529998888 / new@x.example ⇒ plan ⇒ אישור
   ⇒ dispatch ⇒ SMS + מייל ל**לקוח 1** (הישנים). מספר ישן שעבר לאדם אחר ⇒ פרטי חוב לזר. (ב-API — client.id יציב,
   הלקוח מתעדכן; ב-CSV אין מזהה.)
ב. 🟡 **חשבונית שנסגרה לפי קובץ («שולם», 217) נפתחת מחדש בשקט כשהיא מופיעה שוב כ«פתוח»** (קובץ ישן שהועלה בטעות /
   ייצוא לא מעודכן) — `ingest`: `status=CASE WHEN owner_paid_at … ELSE 'open'` ⇒ אין כרטיס, אין audit מיוחד.
   הצעה: פתיחה מחדש של חשבונית CSV שנסגרה ⇒ כרטיס «7001 חזרה כפתוחה — לבדוק» (התזכורות ממתינות לאישורו).
xfail(strict=True); בקרות ירוקות."""
from dataclasses import replace
from datetime import timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def _row(phone="0541112222", email="r@x.example", status="פתוח"):
    return f"7001,רוני,{phone},{email},500,{status},01/10/26,15/10/26\n"


def _csv(svc):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")



def test_reminder_goes_to_current_contact(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    clock.now += timedelta(hours=1)
    svc.import_csv((H + _row(phone="0529998888", email="new@x.example")).encode())
    svc.plan()
    rid = svc.db.one("SELECT r.id FROM reminders r JOIN invoices i ON i.id=r.invoice_id WHERE i.number='7001' "
                     "ORDER BY r.id DESC")["id"]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post(f"/reminders/{rid}/approve", json={"confirm_open": True, "confirm_amount": True})
    svc.dispatch()
    old = svc.db.q("SELECT 1 FROM messages m JOIN customers c ON c.id=m.customer_id WHERE m.direction='out' "
                   "AND (c.phone='0541112222' OR c.email='r@x.example')")
    assert not old, "תזכורת יצאה לטלפון/מייל הישנים"



def test_reopen_after_file_close_is_visible(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    clock.now += timedelta(days=1)
    svc.import_csv((H + _row(status="שולם")).encode())
    assert svc.db.one("SELECT status FROM invoices WHERE number='7001'")["status"] == "closed"
    clock.now += timedelta(days=1)
    svc.import_csv((H + _row()).encode())
    reopened = svc.db.one("SELECT status FROM invoices WHERE number='7001'")["status"] == "open"
    carded = svc.db.one("SELECT 1 FROM messages WHERE needs_owner=1 AND body LIKE '%7001%'")
    assert not reopened or carded


def test_control_same_contact_twice_same_day(svc):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    svc.import_csv((H + _row()).encode())
    assert svc.db.one("SELECT COUNT(*) AS n FROM invoices")["n"] == 1
    assert svc.db.one("SELECT COUNT(*) AS n FROM customers WHERE name='רוני'")["n"] == 1

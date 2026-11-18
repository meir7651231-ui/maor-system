"""critic סבב 157 · 🔴 לתיקון בונה — רכיב: `app/service.py`, ארבעה מסלולי סגירה שלא רושמים `closed_at`:
  1. `CollectService.mark_paid_outside` («✓ שולם מחוץ למערכת»)
  2. `CollectService.confirm_open_list` (רשימת הפתוחות ⇒ «שולמה»)
  3. `CollectService._refresh_invoice` (רענון לפני שליחה מגלה שהמסמך נסגר ⇒ `refresh_closed`)
  4. `CollectService.refresh_customer` (רענון לפני קישור תשלום בשיחה)
רק הסנכרון המלא (`sync`) רושם `closed_at`. אבל `_purge_rows` (ר-10, שמירה 90 יום) בוחר רק
`closed_at IS NOT NULL AND closed_at<=cutoff` ⇒ חשבונית שנסגרה באחד מארבעת המסלולים **לא נמחקת לעולם**:
גוף התזכורות, קישור התשלום והקוד הקצר (/p/) חיים לנצח, והלקוח לא מותמם (`left>0`). הסנכרון הבא לא מתקן —
הוא עובר רק על `status='open'`. בנוסף גרף «גבייה לפי שבוע» ו-beta_metrics לא סופרים את הסגירות האלה.
הצעה: `closed_at=?` (עכשיו) בכל ארבעת ה-UPDATE (ומיגרציה: `closed_at=COALESCE(closed_at, owner_paid_at,
synced_at, ...)` לחשבוניות סגורות קיימות בלי closed_at).
הבדיקות `xfail(strict=True)`: מוכיחות בלי להפיל CI; אחרי התיקון strict ייכשל ⇒ להסיר את xfail."""
from datetime import timedelta

import pytest

DANA = 1          # 0501234567 = doc1 = לקוח 1 ב-conftest
XF = pytest.mark.xfail(strict=True, reason="critic 157: closed_at חסר ⇒ אין מחיקה אחרי 90 יום (לתיקון בונה)")


def _inv(svc):
    return svc.db.one("SELECT id FROM invoices WHERE customer_id=?", (DANA,))["id"]


def _purged_after_retention(svc, clock) -> bool:
    clock.now += timedelta(days=91)
    svc.purge_closed()
    inv = svc.db.one("SELECT purged_at, payment_url, short_code, closed_at FROM invoices WHERE customer_id=?",
                     (DANA,))
    cust = svc.db.one("SELECT name, purged_at FROM customers WHERE id=?", (DANA,))
    return bool(inv["purged_at"] and inv["closed_at"] and cust["purged_at"] and cust["name"] is None)


def test_control_sync_close_is_purged(svc, clock, fake_gi):
    svc.sync()
    fake_gi.docs[:] = [d for d in fake_gi.docs if d["id"] != "doc1"]
    svc.sync()
    assert _purged_after_retention(svc, clock)


@XF
def test_mark_paid_outside_is_purged(svc, clock):
    svc.sync()
    svc.mark_paid_outside(_inv(svc))
    assert _purged_after_retention(svc, clock)


@XF
def test_open_list_paid_is_purged(svc, clock):
    svc.sync()
    svc.confirm_open_list([], [_inv(svc)])
    assert _purged_after_retention(svc, clock)


@XF
def test_refresh_customer_closed_is_purged(svc, clock, fake_gi):
    svc.sync()
    fake_gi.docs[0]["status"] = 1            # שולם בחשבונית ירוקה; הסנכרון המלא עוד לא רץ
    assert svc.refresh_customer(DANA) is not None
    assert svc.db.one("SELECT status FROM invoices WHERE id=?", (_inv(svc),))["status"] == "closed"
    assert _purged_after_retention(svc, clock)


@XF
def test_refresh_before_send_closed_is_purged(svc, clock, fake_gi):
    svc.sync()
    iid = _inv(svc)
    fake_gi.docs[0]["status"] = 1            # נסגר במקור בין התכנון לשליחה
    assert svc._refresh_invoice(None, svc._invoice(iid)) == "closed"
    assert svc.db.one("SELECT status FROM invoices WHERE id=?", (iid,))["status"] == "closed"
    assert _purged_after_retention(svc, clock)

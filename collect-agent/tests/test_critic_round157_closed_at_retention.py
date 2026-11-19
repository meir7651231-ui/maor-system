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

DANA = 1          # 0501234567 = doc1 = לקוח 1 ב-conftest


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


def test_mark_paid_outside_is_purged(svc, clock):
    svc.sync()
    svc.mark_paid_outside(_inv(svc))
    assert _purged_after_retention(svc, clock)


def test_open_list_paid_is_purged(svc, clock):
    svc.sync()
    svc.confirm_open_list([], [_inv(svc)])
    assert _purged_after_retention(svc, clock)


def test_refresh_customer_closed_is_purged(svc, clock, fake_gi):
    svc.sync()
    fake_gi.docs[0]["status"] = 1            # שולם בחשבונית ירוקה; הסנכרון המלא עוד לא רץ
    assert svc.refresh_customer(DANA) is not None
    assert svc.db.one("SELECT status FROM invoices WHERE id=?", (_inv(svc),))["status"] == "closed"
    assert _purged_after_retention(svc, clock)


def test_refresh_before_send_closed_is_purged(svc, clock, fake_gi):
    svc.sync()
    iid = _inv(svc)
    fake_gi.docs[0]["status"] = 1            # נסגר במקור בין התכנון לשליחה
    assert svc._refresh_invoice(None, svc._invoice(iid)) == "closed"
    assert svc.db.one("SELECT status FROM invoices WHERE id=?", (iid,))["status"] == "closed"
    assert _purged_after_retention(svc, clock)


# --- מנהל 302: תיקון 157 — ריפוי שורות קיימות (סגורות בלי closed_at) ---

def _legacy_close(svc, owner_paid: str | None):
    iid = _inv(svc)
    svc.db.x("UPDATE invoices SET status='closed', closed_at=NULL, owner_paid_at=? WHERE id=?", (owner_paid, iid))
    return iid


def test_heal_owner_paid_uses_exact_time(svc, clock):
    svc.sync()
    _legacy_close(svc, (clock.now - timedelta(days=100)).isoformat(timespec="seconds"))
    svc.purge_closed()   # בלי לקדם שעון: owner_paid_at לפני 100 יום ⇒ נמחק כבר עכשיו
    assert svc.db.one("SELECT purged_at FROM invoices WHERE customer_id=?", (DANA,))["purged_at"]


def test_heal_without_owner_paid_never_purges_early(svc, clock):
    svc.sync()
    iid = _legacy_close(svc, None)
    svc.purge_closed()   # הריפוי מציב «עכשיו» ⇒ אין מחיקה מיידית
    row = svc.db.one("SELECT purged_at, closed_at FROM invoices WHERE id=?", (iid,))
    assert row["closed_at"] and not row["purged_at"]
    clock.now += timedelta(days=89)
    svc.purge_closed()
    assert not svc.db.one("SELECT purged_at FROM invoices WHERE id=?", (iid,))["purged_at"]
    clock.now += timedelta(days=2)
    svc.purge_closed()
    assert svc.db.one("SELECT purged_at FROM invoices WHERE id=?", (iid,))["purged_at"]


def test_heal_skips_open_and_legal_hold_stays(svc, clock):
    svc.sync()
    before = svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open' AND closed_at IS NULL")["n"]
    svc.purge_closed()
    assert svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open' AND closed_at IS NOT NULL")["n"] == 0
    assert before > 0


def test_source_no_close_without_closed_at():
    """מגן-מקור: כל UPDATE שסוגר חשבונית רושם גם closed_at."""
    import re
    from pathlib import Path
    src = (Path(__file__).resolve().parents[1] / "app" / "service.py").read_text(encoding="utf-8")
    stmts = [src[m.start():src.index("WHERE", m.start())]
             for m in re.finditer(r"UPDATE invoices SET status='closed'", src)]
    assert len(stmts) >= 5
    for st in stmts:
        assert "closed_at" in st, st

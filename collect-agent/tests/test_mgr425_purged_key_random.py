"""מנהל 425 (מבקר 256🟡): מפתח הלקוח אחרי התממה היה `purged:sha256("phone:…")` בלי מלח — הטלפון משוחזר בסריקה של
מרחב הניידים. עכשיו `purged:<אקראי 128 ביט>`: לא דטרמיניסטי (אין התאמה ממילא), ייחודי, ומפתחות 424 מגובבים מרופאים."""
import hashlib
from dataclasses import replace
from datetime import timedelta

from app.service import _is_hashed_purged_key

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def test_same_input_gives_different_keys(svc):
    svc.db.x("INSERT INTO customers(external_id) VALUES('phone:972500000111')")
    cid = svc.db.one("SELECT id FROM customers")["id"]
    a, b = svc._purged_customer_key(cid), svc._purged_customer_key(cid)
    assert a != b and a.startswith("purged:") and not _is_hashed_purged_key(a)
    assert hashlib.sha256(b"phone:972500000111").hexdigest() not in (a, b)


def test_heals_424_hashed_keys_and_is_stable_after(svc):
    old = "purged:" + hashlib.sha256(b"phone:972500000222").hexdigest()
    svc.db.x("INSERT INTO customers(external_id, purged_at) VALUES(?, '2026-01-01T00:00:00')", (old,))
    svc.purge_closed()
    new = svc.db.one("SELECT external_id FROM customers")["external_id"]
    assert new != old and new.startswith("purged:") and not _is_hashed_purged_key(new)
    svc.purge_closed()   # ריצה נוספת לא מחליפה שוב מפתח אקראי
    assert svc.db.one("SELECT external_id FROM customers")["external_id"] == new


def test_hashed_key_on_live_customer_untouched_by_heal(svc):
    """רשומה עם מפתח מגובב שחזרה וקיבלה פרט קשר (חיה) — הריפוי לא נוגע."""
    old = "purged:" + hashlib.sha256(b"email:x@x.example.com").hexdigest()
    svc.db.x("INSERT INTO customers(external_id, purged_at, email) VALUES(?, '2026-01-01T00:00:00', 'x@x.example.com')",
             (old,))
    svc.purge_closed()
    assert svc.db.one("SELECT external_id FROM customers")["external_id"] == old


def test_full_flow_key_random(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + "7001,דויד כהן,050-0000111,,1200,פתוח,01/10/26,15/10/26\n").encode())
    clock.now += timedelta(days=1)
    svc.import_csv((H + "7001,דויד כהן,050-0000111,,1200,שולם,01/10/26,15/10/26\n").encode())
    clock.now += timedelta(days=100)
    svc.purge_closed()
    ext = svc.db.one("SELECT external_id FROM customers")["external_id"]
    assert ext.startswith("purged:") and len(ext) == 39
    assert ext != "purged:" + hashlib.sha256(b"phone:972500000111").hexdigest()

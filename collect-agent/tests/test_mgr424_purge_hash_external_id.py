"""מנהל 424 (מבקר 255🟠): התממה (ר-10) השאירה טלפון/מייל גלויים ב-`customers.external_id` (`phone:`/`email:`, ובפיצול
גם `|name:`). עכשיו ⇒ `purged:<sha256>`. מזהה GI / `doc:` אינם פרטי קשר ונשארים. לקוח שחוזר אחרי התממה נקלט כלקוח
חדש ונקי, והסרה (suppressions, גיבוב הכתובת) ממשיכה לחול עליו."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
ROWS = ("7001,דויד כהן,050-0000111,david@x.example.com,1200,{s},01/10/26,15/10/26\n"
        "7002,שרה לוי,050-0000111,,450,{s},01/10/26,15/10/26\n"
        "8001,אבי מור,,avi@y.example.com,300,{s},01/10/26,15/10/26\n")


def _purge_all(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + ROWS.format(s="פתוח")).encode())
    clock.now += timedelta(days=1)
    svc.import_csv((H + ROWS.format(s="שולם")).encode())
    clock.now += timedelta(days=100)
    return svc.purge_closed()


def test_keys_hashed_unique_and_split_too(svc, clock):
    _purge_all(svc, clock)
    rows = svc.db.q("SELECT external_id FROM customers")
    exts = [r["external_id"] for r in rows]
    assert len(exts) == 3 and len(set(exts)) == 3
    assert all(e.startswith("purged:") and len(e) == len("purged:") + 32 for e in exts), exts   # 425: אקראי, לא גיבוב
    assert svc._purged_customer_key(-1) == ""   # שורה חסרה ⇒ לא קורס


def test_gi_and_doc_keys_untouched(svc):
    svc.db.x("INSERT INTO customers(external_id) VALUES('gi-123'), ('doc:csv:9')")
    a = svc.db.one("SELECT id FROM customers WHERE external_id='gi-123'")["id"]
    b = svc.db.one("SELECT id FROM customers WHERE external_id='doc:csv:9'")["id"]
    assert svc._purged_customer_key(a) == "gi-123"
    assert svc._purged_customer_key(b) == "doc:csv:9"


def test_returning_customer_is_fresh_and_optout_still_applies(svc, clock):
    _purge_all(svc, clock)
    svc.suppress("sms", "050-0000111", "optout")
    clock.now += timedelta(days=1)
    svc.import_csv((H + "9001,דויד כהן,050-0000111,david@x.example.com,500,פתוח,01/02/27,15/02/27\n").encode())
    new = svc.db.one("SELECT c.external_id, c.purged_at, c.phone FROM customers c JOIN invoices i "
                     "ON i.customer_id=c.id WHERE i.external_id LIKE '%9001%'")
    assert new["external_id"] == "email:david@x.example.com" and new["purged_at"] is None
    assert svc.suppressed("sms", new["phone"])
    assert svc.db.one("SELECT COUNT(*) n FROM customers WHERE external_id LIKE 'purged:%'")["n"] == 3


def test_heals_rows_purged_before_424(svc, clock):
    svc.db.x("INSERT INTO customers(external_id, purged_at) VALUES('phone:972500000222', '2026-01-01T00:00:00'),"
             " ('email:live@x.example.com', '2026-01-01T00:00:00')")
    live = svc.db.one("SELECT id FROM customers WHERE external_id='email:live@x.example.com'")["id"]
    svc.db.x("UPDATE customers SET email='live@x.example.com' WHERE id=?", (live,))   # חזר ונקלט מחדש (לפני 424)
    svc.purge_closed()
    exts = {r["external_id"] for r in svc.db.q("SELECT external_id FROM customers")}
    assert "phone:972500000222" not in exts and any(e.startswith("purged:") for e in exts)
    assert "email:live@x.example.com" in exts     # רשומה חיה (יש פרט קשר) — לא נוגעים

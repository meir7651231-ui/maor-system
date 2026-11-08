"""אחסון SQLite (stdlib).

שלב 1 = עסק יחיד; בשלב 2 מוסיפים business_id לכל טבלה (ראו MVP-SPEC §3).
"""
from __future__ import annotations

import hashlib
import os
import sqlite3
import threading
from collections.abc import Mapping

from . import dbcrypt

SCHEMA = """
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  external_id TEXT UNIQUE,
  name TEXT, phone TEXT, email TEXT,
  opted_out INTEGER NOT NULL DEFAULT 0,
  disputed INTEGER NOT NULL DEFAULT 0,
  approved_first INTEGER NOT NULL DEFAULT 0,
  last_sent_at TEXT,
  unsub_token TEXT UNIQUE,
  paused_reason TEXT
);
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY,
  external_id TEXT UNIQUE,
  number TEXT, doc_type INTEGER,
  amount_agorot INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ILS',
  issued TEXT, due TEXT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'open',
  payment_url TEXT,
  synced_at TEXT
);
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  step INTEGER NOT NULL,
  template_key TEXT NOT NULL,
  scheduled_for TEXT NOT NULL,
  status TEXT NOT NULL,
  requires_approval INTEGER NOT NULL,
  body TEXT NOT NULL,
  payload TEXT NOT NULL,           -- JSON: רשימת Message (sms/email)
  decided_at TEXT, sent_at TEXT, message_id TEXT, block_reason TEXT,
  UNIQUE(invoice_id, step)
);
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  installments TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  direction TEXT NOT NULL,
  channel TEXT,
  body TEXT NOT NULL,
  intent TEXT,
  needs_owner INTEGER NOT NULL DEFAULT 0,
  message_id TEXT,
  payload TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY,
  at TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, detail TEXT
);
-- ר-3: רשימת הסרה מגובבת (sha256 של טלפון מנורמל / מייל קטן) — חוסמת גם לקוח אחר עם אותו מספר
CREATE TABLE IF NOT EXISTS suppressions (
  hash TEXT PRIMARY KEY, channel TEXT NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL
);
-- הגדרות עסק (API מאומת). סודות לא נשמרים כאן — רק בסביבה/בכספת
CREATE TABLE IF NOT EXISTS business_settings (
  key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL
);
-- תקנות אבטחת מידע: תיעוד גישה (צפייה) למידע אישי. הוספה בלבד, בלי תוכן — רק מי, מתי, איזה מסך
CREATE TABLE IF NOT EXISTS access_log (
  id INTEGER PRIMARY KEY,
  at TEXT NOT NULL, actor TEXT NOT NULL, method TEXT NOT NULL, route TEXT NOT NULL,
  path TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS access_log_no_update BEFORE UPDATE ON access_log
  BEGIN SELECT RAISE(ABORT, 'access_log is append-only'); END;
CREATE TRIGGER IF NOT EXISTS access_log_no_delete BEFORE DELETE ON access_log
  BEGIN SELECT RAISE(ABORT, 'access_log is append-only'); END;
-- יומן ביקורת = ראיה (מחלוקת/עו"ד) ⇒ הוספה בלבד, אין עדכון ואין מחיקה
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit
  BEGIN SELECT RAISE(ABORT, 'audit is append-only'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit
  BEGIN SELECT RAISE(ABORT, 'audit is append-only'); END;
"""


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class DB:
    def __init__(self, path: str = ":memory:", *, env: Mapping[str, str] | None = None) -> None:
        # שער 5 (ADR שלב 2): DB_ENCRYPTION=sqlcipher ⇒ SQLCipher עם מפתח נגזר מ-COLLECT_MASTER_KEYS.
        # נכשל סגור לפני כל נגיעה בקובץ: דגל לא מוכר / מודול חסר ⇒ שגיאה, לא plaintext.
        enc = dbcrypt.mode(env) == dbcrypt.SQLCIPHER
        on_disk = path != ":memory:" and not path.startswith("file:")
        if enc:
            dbcrypt.load_module()
            if on_disk:
                dbcrypt.candidate_keys(env)   # COLLECT_MASTER_KEYS חסר ⇒ שגיאה לפני יצירת קובץ
        if on_disk:
            # ה-DB מכיל PII (שמות/טלפונים/סכומים) ⇒ קריאה/כתיבה לבעלים בלבד (0600)
            os.close(os.open(path, os.O_CREAT | os.O_RDWR, 0o600))
            os.chmod(path, 0o600)
        opened = dbcrypt.open_db(path, env=env, check_same_thread=False)
        self.conn = opened.conn
        self.key_id = opened.kid          # None = לא מוצפן
        self.encrypted = opened.kid is not None
        self.needs_rekey = opened.kid is not None and opened.kid != opened.active_kid
        # חריגי המנוע בפועל (sqlcipher3 לא יורש מ-sqlite3): ``except db.OperationalError``
        self.OperationalError = opened.module.OperationalError
        self.IntegrityError = opened.module.IntegrityError
        self.conn.row_factory = opened.module.Row
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.conn.executescript(SCHEMA)
        cols = {r[1] for r in self.conn.execute("PRAGMA table_info(customers)")}
        if "paused_reason" not in cols:  # DB קיים מלפני העמודה
            self.conn.execute("ALTER TABLE customers ADD COLUMN paused_reason TEXT")
            self.conn.commit()
        # ר-3: מספר/כתובת שגויים לא חוזרים בסנכרון. SQL קבוע (בלי f-string — שער האבטחה)
        for col, ddl in (("blocked_phone", "ALTER TABLE customers ADD COLUMN blocked_phone TEXT"),
                         ("blocked_email", "ALTER TABLE customers ADD COLUMN blocked_email TEXT")):
            if col not in cols:
                self.conn.execute(ddl)
        self.conn.commit()
        icols = {r[1] for r in self.conn.execute("PRAGMA table_info(invoices)")}
        if "closed_at" not in icols:  # מתי החשבונית נסגרה (שולמה) — לגרף הגבייה בדשבורד
            self.conn.execute("ALTER TABLE invoices ADD COLUMN closed_at TEXT")
        if "short_code" not in icols:  # קישור קצר ל-SMS (≤2 חלקים)
            self.conn.execute("ALTER TABLE invoices ADD COLUMN short_code TEXT")
            self.conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_inv_short ON invoices(short_code)")
            self.conn.commit()
        if "source" not in icols:  # api | csv — ר-4: CSV לא ניתן לרענון ⇒ תוקף 24 שעות מהייבוא
            self.conn.execute("ALTER TABLE invoices ADD COLUMN source TEXT NOT NULL DEFAULT 'api'")
            self.conn.commit()
        if "credit_agorot" not in icols:  # ממצא 2.16: זיכוי שקוזז (amount_agorot = נטו) — לרענון
            self.conn.execute("ALTER TABLE invoices ADD COLUMN credit_agorot INTEGER NOT NULL DEFAULT 0")
            self.conn.commit()
        pcols = {r[1] for r in self.conn.execute("PRAGMA table_info(plans)")}
        if "invoice_ids" not in pcols:  # מבקר §4.6: ההסדר על **כל** החוב — אילו חשבוניות נכללו
            self.conn.execute("ALTER TABLE plans ADD COLUMN invoice_ids TEXT")
            self.conn.commit()
        # ר-10: legal hold מתועד + חותמות מחיקה/התממה. SQL קבוע (שער האבטחה)
        for have, col, ddl in (
                (cols, "legal_hold", "ALTER TABLE customers ADD COLUMN legal_hold TEXT"),
                (cols, "purged_at", "ALTER TABLE customers ADD COLUMN purged_at TEXT"),
                (icols, "purged_at", "ALTER TABLE invoices ADD COLUMN purged_at TEXT")):
            if col not in have:
                self.conn.execute(ddl)
        self.conn.commit()
        # ר-12: גרסת הנוסח וגיבוב הגוף שאושרו. כל שינוי ⇒ האישור בטל
        rcols = {r[1] for r in self.conn.execute("PRAGMA table_info(reminders)")}
        for col, ddl in (
                ("template_version", "ALTER TABLE reminders ADD COLUMN template_version TEXT"),
                ("body_hash", "ALTER TABLE reminders ADD COLUMN body_hash TEXT"),
                ("approved_hash", "ALTER TABLE reminders ADD COLUMN approved_hash TEXT"),
                ("approved_version", "ALTER TABLE reminders ADD COLUMN approved_version TEXT"),
                ("approved_by", "ALTER TABLE reminders ADD COLUMN approved_by TEXT"),
                # ר-4 (מבקר סבב 3): הסכום שבהודעה עצמה — הרענון משווה אליו, לא ל-invoices
                ("amount_agorot", "ALTER TABLE reminders ADD COLUMN amount_agorot INTEGER")):
            if col not in rcols:
                self.conn.execute(ddl)
        self.conn.commit()
        # DLR (דוחות מסירה): לאיזה ספק יצאה ההודעה, מזהה ההודעה אצלו, ומה עלה בגורלה
        mcols = {r[1] for r in self.conn.execute("PRAGMA table_info(messages)")}
        for col, ddl in (
                ("provider", "ALTER TABLE messages ADD COLUMN provider TEXT"),
                ("provider_id", "ALTER TABLE messages ADD COLUMN provider_id TEXT"),
                ("delivery_status", "ALTER TABLE messages ADD COLUMN delivery_status TEXT"),
                ("delivery_at", "ALTER TABLE messages ADD COLUMN delivery_at TEXT")):
            if col not in mcols:
                self.conn.execute(ddl)
        self.conn.commit()
        # critic 15.1/2.12 (הכרעת מאיר 7.11): תזכורת מאוחדת ללקוח — אילו חשבוניות כל תזכורת כוללת.
        # reminders.invoice_id נשאר «עוגן» (החשבונית הוותיקה); תזכורות ישנות = החשבונית שלהן בלבד.
        self.conn.executescript(
            "CREATE TABLE IF NOT EXISTS reminder_invoices (reminder_id INTEGER NOT NULL "
            "REFERENCES reminders(id), invoice_id INTEGER NOT NULL REFERENCES invoices(id), "
            "PRIMARY KEY(reminder_id, invoice_id));"
            "CREATE INDEX IF NOT EXISTS ix_ri_inv ON reminder_invoices(invoice_id);"
            "INSERT OR IGNORE INTO reminder_invoices(reminder_id, invoice_id) "
            "SELECT r.id, r.invoice_id FROM reminders r WHERE NOT EXISTS "
            "(SELECT 1 FROM reminder_invoices x WHERE x.reminder_id=r.id);")
        if "episode_since" not in cols:   # תחילת «אפיזודת החוב» הנוכחית של הלקוח (סולם 3 התזכורות)
            self.conn.execute("ALTER TABLE customers ADD COLUMN episode_since TEXT")
        self.conn.commit()
        # טוקני הסרה: נשמר רק sha256 (דליפת DB ⇒ אין קישורי הסרה פעילים בידי תוקף)
        self.conn.executescript(
            "CREATE TABLE IF NOT EXISTS link_tokens (token_hash TEXT PRIMARY KEY, "
            "customer_id INTEGER NOT NULL REFERENCES customers(id), kind TEXT NOT NULL, "
            "created_at TEXT NOT NULL);")
        # מיגרציה: טוקנים ישנים (plaintext ב-customers.unsub_token) ⇒ hash, והעמודה מתרוקנת
        for cid, tok in self.conn.execute(
                "SELECT id, unsub_token FROM customers WHERE unsub_token IS NOT NULL").fetchall():
            self.conn.execute("INSERT OR IGNORE INTO link_tokens VALUES(?,?, 'unsub', '')",
                              (token_hash(tok), cid))
        self.conn.execute("UPDATE customers SET unsub_token=NULL WHERE unsub_token IS NOT NULL")
        self.conn.commit()
        if enc and on_disk:   # אימות אמיתי: הקובץ שנכתב אינו SQLite גלוי
            dbcrypt.assert_encrypted_file(path)
        self.lock = threading.RLock()

    def q(self, sql: str, args: tuple = ()) -> list[sqlite3.Row]:
        with self.lock:
            return self.conn.execute(sql, args).fetchall()

    def one(self, sql: str, args: tuple = ()) -> sqlite3.Row | None:
        rows = self.q(sql, args)
        return rows[0] if rows else None

    def x(self, sql: str, args: tuple = ()) -> int:
        with self.lock:
            cur = self.conn.execute(sql, args)
            self.conn.commit()
            return cur.lastrowid or 0

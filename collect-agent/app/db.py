"""אחסון SQLite (stdlib).

שלב 1 = עסק יחיד; בשלב 2 מוסיפים business_id לכל טבלה (ראו MVP-SPEC §3).
"""
from __future__ import annotations

import os
import sqlite3
import threading

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
-- יומן ביקורת = ראיה (מחלוקת/עו"ד) ⇒ הוספה בלבד, אין עדכון ואין מחיקה
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit
  BEGIN SELECT RAISE(ABORT, 'audit is append-only'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit
  BEGIN SELECT RAISE(ABORT, 'audit is append-only'); END;
"""


class DB:
    def __init__(self, path: str = ":memory:") -> None:
        if path != ":memory:" and not path.startswith("file:"):
            # ה-DB מכיל PII (שמות/טלפונים/סכומים) ⇒ קריאה/כתיבה לבעלים בלבד (0600)
            os.close(os.open(path, os.O_CREAT | os.O_RDWR, 0o600))
            os.chmod(path, 0o600)
        self.conn = sqlite3.connect(path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
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
        if "short_code" not in icols:  # קישור קצר ל-SMS (≤2 חלקים)
            self.conn.execute("ALTER TABLE invoices ADD COLUMN short_code TEXT")
            self.conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_inv_short ON invoices(short_code)")
            self.conn.commit()
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

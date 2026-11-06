"""משתמש לכל עובד + 2FA + סשנים (שער 6). אין טוקן משותף לעובדים.

סיסמה: scrypt עם מלח. סוד ה-TOTP מוצפן ב-SecretBox כשיש מפתח (אחרת נשמר כמו שהוא — דמו).
סשן: טוקן אקראי, נשמר רק sha256, תוקף קצר. נעילה אחרי 5 כשלונות ל-15 דקות."""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta

from . import totp
from .db import DB, token_hash

SESSION_HOURS = 12
MAX_FAILS = 5
LOCK_MIN = 15
MIN_PW = 10

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  pw_hash TEXT NOT NULL, totp_secret TEXT NOT NULL, totp_last INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1, fails INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL);
"""


def hash_pw(pw: str, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    h = hashlib.scrypt(pw.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return f"s1${salt.hex()}${h.hex()}"


def check_pw(pw: str, stored: str) -> bool:
    try:
        _, salt, h = stored.split("$")
        got = hashlib.scrypt(pw.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1, dklen=32)
        return hmac.compare_digest(got.hex(), h)
    except ValueError:
        return False


class Users:
    def __init__(self, db: DB, clock):
        self.db, self.clock = db, clock
        with db.lock:
            db.conn.executescript(SCHEMA)
            db.conn.commit()

    def _now(self) -> datetime:
        return self.clock()

    def count(self) -> int:
        return self.db.one("SELECT COUNT(*) c FROM users")["c"]

    def create(self, email: str, name: str, password: str) -> dict:
        """מחזיר את סוד ה-TOTP וה-URI פעם אחת (להקמה באפליקציית אימות)."""
        email = email.strip().lower()
        if "@" not in email or len(password) < MIN_PW:
            raise ValueError(f"מייל תקין וסיסמה של {MIN_PW}+ תווים")
        sec = totp.new_secret()
        try:
            self.db.x("INSERT INTO users(email,name,pw_hash,totp_secret,created_at) VALUES(?,?,?,?,?)",
                      (email, name.strip()[:80], hash_pw(password), sec, self._now().isoformat()))
        except Exception as e:  # UNIQUE
            raise ValueError("משתמש כבר קיים") from e
        return {"email": email, "totp_secret": sec, "otpauth": totp.otpauth_uri(sec, email)}

    def login(self, email: str, password: str, code: str) -> str | None:
        """טוקן סשן, או None. הודעת כשל אחת לכל סיבה (בלי חשיפת קיום משתמש)."""
        u = self.db.one("SELECT * FROM users WHERE email=?", (email.strip().lower(),))
        now = self._now()
        if u is None:
            hash_pw(password)  # תזמון דומה
            return None
        if u["locked_until"] and datetime.fromisoformat(u["locked_until"]) > now:
            return None
        ok = u["active"] and check_pw(password, u["pw_hash"])
        counter = totp.verify(u["totp_secret"], code, now.timestamp(),
                              last_counter=u["totp_last"]) if ok else None
        if counter is None:
            fails = u["fails"] + 1
            lock = (now + timedelta(minutes=LOCK_MIN)).isoformat() if fails >= MAX_FAILS else None
            self.db.x("UPDATE users SET fails=?, locked_until=? WHERE id=?",
                      (0 if lock else fails, lock, u["id"]))
            return None
        tok = secrets.token_urlsafe(32)
        self.db.x("UPDATE users SET fails=0, locked_until=NULL, totp_last=? WHERE id=?",
                  (counter, u["id"]))
        self.db.x("INSERT INTO sessions VALUES(?,?,?)",
                  (token_hash(tok), u["id"], (now + timedelta(hours=SESSION_HOURS)).isoformat()))
        return tok

    def actor(self, token: str) -> str | None:
        r = self.db.one("SELECT u.email, u.active, s.expires_at FROM sessions s "
                        "JOIN users u ON u.id=s.user_id WHERE s.token_hash=?", (token_hash(token),))
        if r is None or not r["active"] or datetime.fromisoformat(r["expires_at"]) <= self._now():
            return None
        return r["email"]

    def logout(self, token: str) -> None:
        self.db.x("DELETE FROM sessions WHERE token_hash=?", (token_hash(token),))

    def deactivate(self, email: str) -> None:
        self.db.x("UPDATE users SET active=0 WHERE email=?", (email.strip().lower(),))
        self.db.x("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email=?)",
                  (email.strip().lower(),))


if __name__ == "__main__":  # python -m app.users <email> <name>  (סיסמה מ-USER_PASSWORD) ⇒ מדפיס סוד TOTP פעם אחת
    import sys
    from datetime import datetime

    from .config import load_settings
    from .policy import TZ

    _s = load_settings()
    _u = Users(DB(_s.db_path), lambda: datetime.now(TZ))
    print(_u.create(sys.argv[1], sys.argv[2], os.environ["USER_PASSWORD"]))

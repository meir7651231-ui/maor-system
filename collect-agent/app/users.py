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
from .secretbox import ENV_VAR, VERSION, SecretBox

SESSION_HOURS = 12
MAX_FAILS = 5            # לכל (חשבון, IP)
MAX_FAILS_GLOBAL = 50    # לחשבון מכל המקורות יחד (התקפה מבוזרת)
LOCK_MIN = 15
MIN_PW = 10

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  pw_hash TEXT NOT NULL, totp_secret TEXT NOT NULL, totp_last INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1, fails INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS login_locks (
  email TEXT NOT NULL, ip TEXT NOT NULL, fails INTEGER NOT NULL DEFAULT 0, locked_until TEXT,
  PRIMARY KEY (email, ip));
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


def _lock_key(email: str) -> str:
    """מפתח טבלת הנעילות: גיבוב של המייל, לא המייל עצמו — הטבלה נספרת גם למיילים שאינם קיימים
    (כדי שהנעילה לא תגלה קיום חשבון), ולכן לא שומרים בה מיילים שהוקלדו בטעות או ע״י תוקף."""
    return "h:" + hashlib.sha256(email.strip().lower().encode()).hexdigest()[:32]


def _totp_ctx(email: str) -> str:
    return f"user:{email}:totp"


class Users:
    def __init__(self, db: DB, clock, box: SecretBox | None = None):
        self.db, self.clock = db, clock
        # critic סבב 7: ההערה הבטיחה «מוצפן ב-SecretBox כשיש מפתח», אבל הסוד נשמר גלוי תמיד.
        # דליפת DB = הגורם השני של כל העובדים. עכשיו: יש מפתח ⇒ AES-GCM עם הקשר פר-משתמש.
        self.box = box if box is not None else (
            SecretBox.from_env() if os.environ.get(ENV_VAR) else None)
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
        if self.box is None and os.environ.get("REQUIRE_USER_LOGIN") == "1":
            raise ValueError(f"בטא אמיתית: אין יצירת משתמש בלי מפתח הצפנה ({ENV_VAR})")
        sec = totp.new_secret()
        stored = self.box.encrypt(sec, context=_totp_ctx(email)) if self.box else sec
        try:
            self.db.x("INSERT INTO users(email,name,pw_hash,totp_secret,created_at) VALUES(?,?,?,?,?)",
                      (email, name.strip()[:80], hash_pw(password), stored, self._now().isoformat()))
        except Exception as e:  # UNIQUE
            raise ValueError("משתמש כבר קיים") from e
        return {"email": email, "totp_secret": sec, "otpauth": totp.otpauth_uri(sec, email)}

    def login(self, email: str, password: str, code: str, ip: str = "") -> str | None:
        """טוקן סשן, או None. הודעת כשל אחת לכל סיבה (בלי חשיפת קיום משתמש).
        critic סבב 16 (פתוח מסבב 7): הנעילה הייתה לכל החשבון, ולכן 5 ניסיונות של תוקף מכל מקום
        נעלו את העובדת (DoS). עכשיו: נעילה לפי (חשבון, IP) אחרי 5, ולחשבון כולו רק אחרי 50."""
        email = email.strip().lower()
        u = self.db.one("SELECT * FROM users WHERE email=?", (email,))
        now = self._now()
        # שער 6 (מסך התחברות): הנעילה לפי (מייל, IP) נבדקת ונספרת **לפני** בדיקת קיום המשתמש, גם
        # למייל שאינו קיים. כך הממשק יכול לומר «ננעל זמנית» (429) בלי שהנעילה תגלה אם החשבון קיים.
        lk = _lock_key(email)
        ll = self.db.one("SELECT * FROM login_locks WHERE email=? AND ip=?", (lk, ip))
        if ll and ll["locked_until"] and datetime.fromisoformat(ll["locked_until"]) > now:
            return None
        if u is None:
            hash_pw(password)  # תזמון דומה
            self._fail_ip(lk, ip, ll, now)
            return None
        if u["locked_until"] and datetime.fromisoformat(u["locked_until"]) > now:
            return None
        ok = u["active"] and check_pw(password, u["pw_hash"])
        counter = totp.verify(self._secret(u), code, now.timestamp(),
                              last_counter=u["totp_last"]) if ok else None
        if counter is None:
            until = (now + timedelta(minutes=LOCK_MIN)).isoformat()
            fails = u["fails"] + 1
            glock = until if fails >= MAX_FAILS_GLOBAL else None
            self.db.x("UPDATE users SET fails=?, locked_until=? WHERE id=?",
                      (0 if glock else fails, glock, u["id"]))
            self._fail_ip(lk, ip, ll, now)
            return None
        tok = secrets.token_urlsafe(32)
        self.db.x("UPDATE users SET fails=0, locked_until=NULL, totp_last=? WHERE id=?",
                  (counter, u["id"]))
        self.db.x("DELETE FROM login_locks WHERE email=? AND ip=?", (lk, ip))
        self.db.x("INSERT INTO sessions VALUES(?,?,?)",
                  (token_hash(tok), u["id"], (now + timedelta(hours=SESSION_HOURS)).isoformat()))
        return tok

    def _fail_ip(self, lk: str, ip: str, ll, now: datetime) -> None:
        lf = (ll["fails"] if ll else 0) + 1
        lock = (now + timedelta(minutes=LOCK_MIN)).isoformat() if lf >= MAX_FAILS else None
        self.db.x("INSERT INTO login_locks(email,ip,fails,locked_until) VALUES(?,?,?,?) "
                  "ON CONFLICT(email,ip) DO UPDATE SET fails=excluded.fails, "
                  "locked_until=excluded.locked_until", (lk, ip, 0 if lock else lf, lock))

    def ip_locked_for(self, email: str, ip: str) -> int:
        """שניות עד שחרור נעילת (מייל, IP), או 0. לא מגלה קיום חשבון: נספר גם למייל שאינו קיים.
        הנעילה הגלובלית (MAX_FAILS_GLOBAL, רק לחשבון קיים) לא נחשפת כאן — היא נשארת 401 כללי."""
        ll = self.db.one("SELECT locked_until FROM login_locks WHERE email=? AND ip=?",
                         (_lock_key(email), ip))
        if not ll or not ll["locked_until"]:
            return 0
        left = (datetime.fromisoformat(ll["locked_until"]) - self._now()).total_seconds()
        return max(0, int(left) + 1) if left > 0 else 0

    def whoami(self, token: str) -> dict | None:
        """לממשק בלבד (לא ליומנים): השחקן + שם התצוגה של העובד המחובר."""
        actor = self.actor(token)
        if actor is None:
            return None
        r = self.db.one("SELECT u.name FROM sessions s JOIN users u ON u.id=s.user_id "
                        "WHERE s.token_hash=?", (token_hash(token),))
        return {"actor": actor, "kind": "user", "name": r["name"] if r else ""}

    def _secret(self, u) -> str:
        stored = u["totp_secret"]
        if stored.startswith(VERSION + "."):
            if self.box is None:
                raise ValueError("סוד TOTP מוצפן אבל אין מפתח — נכשל סגור")
            return self.box.decrypt(stored, context=_totp_ctx(u["email"])).reveal()
        return stored   # דמו/מורשת בלי מפתח

    def actor(self, token: str) -> str | None:
        """שם השחקן ביומנים: «user:<id>» ולא המייל. critic סבב 10: audit ו-access_log הם הוספה-בלבד,
        ולכן מייל של עובד שנכתב בהם נשאר לנצח, גם אחרי מחיקת העסק (app.wipe). המיפוי id ⇒ מייל
        קיים רק בטבלת users, שנמחקת. אחרי מחיקה היומן נשאר ראיה, אבל בלי זהות."""
        r = self.db.one("SELECT u.id, u.email, u.active, s.expires_at FROM sessions s "
                        "JOIN users u ON u.id=s.user_id WHERE s.token_hash=?", (token_hash(token),))
        if r is None or not r["active"] or datetime.fromisoformat(r["expires_at"]) <= self._now():
            return None
        return f"user:{r['id']}"

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

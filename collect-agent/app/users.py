"""משתמש לכל עובד + 2FA + סשנים (שער 6). אין טוקן משותף לעובדים.

סיסמה: scrypt עם מלח. סוד ה-TOTP מוצפן ב-SecretBox כשיש מפתח (אחרת נשמר כמו שהוא — דמו).
סשן: טוקן אקראי, נשמר רק sha256, תוקף קצר. נעילה אחרי 5 כשלונות ל-15 דקות."""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
from datetime import datetime, timedelta

from . import totp
from .db import DB, token_hash
from .policy import TZ
from .secretbox import ENV_VAR, VERSION, SecretBox

SESSION_HOURS = 12
MAX_FAILS = 5            # לכל (חשבון, IP)
MAX_FAILS_GLOBAL = 50    # לחשבון מכל המקורות יחד (התקפה מבוזרת)
LOCK_MIN = 15
MIN_PW = 10
ROLES = ("owner", "staff")

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
            # critic סבב 179: תפקיד בעלים לעובד מחובר. בבטא (REQUIRE_USER_LOGIN=1) הטוקן המשותף סגור, ולכן
            # פעולות «בעל העסק בלבד» (שחרור עצירת שחזור) חייבות תפקיד ולא את המחרוזת "owner".
            cols = {r[1] for r in db.conn.execute("PRAGMA table_info(users)")}
            migrated = "role" not in cols
            if migrated:
                db.conn.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'staff'")
            db.conn.commit()
        # critic סבב 180: הבוטסטרפ רץ בכל עלייה ⇒ השבתת הבעלים ⇒ העובד הוותיק קודם לבעלים **בשקט** בעלייה הבאה.
        # עכשיו רק במיגרציה עצמה (העמודה נוספה עכשיו), ומתועד ביומן.
        if migrated:
            self._bootstrap_owner()

    def _bootstrap_owner(self) -> None:
        """DB קיים בלי בעלים פעיל (נוצר לפני 179) ⇒ העובד הוותיק הפעיל (id נמוך) הוא בעל העסק — אותו כלל
        כמו ב-create: מי שהקים את המערכת ראשון. שינוי: `python -m app.users role <email> owner|staff`."""
        if self.db.one("SELECT 1 FROM users WHERE role='owner' AND active=1") is None:
            first = self.db.one("SELECT id FROM users WHERE active=1 ORDER BY id LIMIT 1")
            if first is not None:
                self.db.x("UPDATE users SET role='owner' WHERE id=?", (first["id"],))
                self._audit("system", "owner_bootstrap", {"user": first["id"]})

    def _audit(self, actor: str, action: str, detail: dict) -> None:
        """יומן ה-audit של השירות (אותו DB). פסאודונים בלבד — user:<id>, לא מייל (critic סבב 10).
        DB בלי טבלת audit (כלי CLI על קובץ ריק) ⇒ מדלגים, לא נכשלים."""
        if self.db.one("SELECT 1 FROM sqlite_master WHERE type='table' AND name='audit'") is None:
            return
        self.db.x("INSERT INTO audit(at,actor,action,detail) VALUES(?,?,?,?)",
                  (self._now().astimezone(TZ).isoformat(timespec="seconds"), actor, action,
                   json.dumps(detail, ensure_ascii=False)))

    def _now(self) -> datetime:
        return self.clock()

    def count(self) -> int:
        return self.db.one("SELECT COUNT(*) c FROM users")["c"]

    def create(self, email: str, name: str, password: str, role: str | None = None) -> dict:
        """מחזיר את סוד ה-TOTP וה-URI פעם אחת (להקמה באפליקציית אימות).
        role: 'owner'/'staff'; None ⇒ המשתמש הראשון (כשאין בעלים פעיל) הוא בעל העסק, כל השאר עובדים."""
        email = email.strip().lower()
        if role is not None and role not in ROLES:
            raise ValueError(f"תפקיד: {' / '.join(ROLES)}")
        if "@" not in email or len(password) < MIN_PW:
            raise ValueError(f"מייל תקין וסיסמה של {MIN_PW}+ תווים")
        if self.box is None and os.environ.get("REQUIRE_USER_LOGIN") == "1":
            raise ValueError(f"בטא אמיתית: אין יצירת משתמש בלי מפתח הצפנה ({ENV_VAR})")
        sec = totp.new_secret()
        stored = self.box.encrypt(sec, context=_totp_ctx(email)) if self.box else sec
        if role is None:
            role = "staff" if self.db.one("SELECT 1 FROM users WHERE role='owner' AND active=1") else "owner"
        try:
            self.db.x("INSERT INTO users(email,name,pw_hash,totp_secret,created_at,role) VALUES(?,?,?,?,?,?)",
                      (email, name.strip()[:80], hash_pw(password), stored, self._now().isoformat(), role))
        except Exception as e:  # UNIQUE
            raise ValueError("משתמש כבר קיים") from e
        return {"email": email, "role": role, "totp_secret": sec, "otpauth": totp.otpauth_uri(sec, email)}

    def set_role(self, email: str, role: str, actor: str = "cli") -> None:
        if role not in ROLES:
            raise ValueError(f"תפקיד: {' / '.join(ROLES)}")
        email = email.strip().lower()
        u = self.db.one("SELECT id, role, active FROM users WHERE email=?", (email,))
        if u is None:
            raise KeyError(email)
        if role == "staff" and u["role"] == "owner" and self.db.one(
                "SELECT COUNT(*) c FROM users WHERE role='owner' AND active=1 AND id<>?", (u["id"],))["c"] == 0:
            # בלי בעלים פעיל אף אחד לא משחרר עצירת שחזור (critic 179) — לא מורידים את האחרון
            raise ValueError("זה בעל העסק הפעיל היחיד — קודם מנו בעלים אחר")
        self.db.x("UPDATE users SET role=? WHERE id=?", (role, u["id"]))
        if u["role"] != role:   # critic 180: audit לכל שינוי תפקיד, גם מ-CLI
            self._audit(actor, "team_role_changed", {"user": u["id"], "from": u["role"], "to": role})

    # ---------- מסך «צוות ותפקידים» (מנהל 328): בעל העסק מנהל תפקידים בלי CLI ----------
    def listing(self) -> list[dict]:
        """כל העובדים למסך הצוות (בעל העסק בלבד — נאכף ב-/team). בלי סיסמה/TOTP/נעילות."""
        rows = self.db.conn.execute(
            "SELECT id, name, email, role, active, created_at FROM users "
            "ORDER BY active DESC, role='owner' DESC, id").fetchall()
        return [{"id": r["id"], "name": r["name"], "email": r["email"], "role": r["role"],
                 "active": bool(r["active"]), "created_at": r["created_at"]} for r in rows]

    def _by_id(self, uid: int):
        u = self.db.one("SELECT id, email, name, role, active FROM users WHERE id=?", (uid,))
        if u is None:
            raise KeyError(uid)
        return u

    def _last_active_owner(self, u) -> bool:
        return u["role"] == "owner" and bool(u["active"]) and self.db.one(
            "SELECT COUNT(*) c FROM users WHERE role='owner' AND active=1 AND id<>?", (u["id"],))["c"] == 0

    def set_role_id(self, uid: int, role: str, actor: str = "cli") -> dict:
        """מחזיר {name, from, to}. עובד מושבת לא מקודם (בעלים מושבת לא משחרר כלום)."""
        u = self._by_id(uid)
        if role == "owner" and not u["active"]:
            raise ValueError("עובד מושבת לא יכול להיות בעל העסק — קודם הפעילו אותו מחדש")
        self.set_role(u["email"], role, actor=actor)
        return {"name": u["name"], "from": u["role"], "to": role}

    def deactivate_id(self, uid: int, actor: str | None = None) -> dict:
        """השבתה מהמסך: לא את עצמכם (נעילה עצמית), ולא את בעל העסק הפעיל האחרון (אף אחד לא ישחרר עצירה)."""
        u = self._by_id(uid)
        if actor == f"user:{u['id']}":
            raise ValueError("לא משביתים את עצמכם — בקשו מבעלים אחר")
        self.deactivate(u["email"], actor=actor or "cli")
        return {"name": u["name"], "was_active": bool(u["active"])}

    def reactivate_id(self, uid: int, actor: str = "cli") -> dict:
        """מנהל 329 (פתוח מ-328): הפעלה-מחדש של עובד מושבת מהמסך, לא רק CLI. חוזר **תמיד כעובד** — גם מי שהיה
        בעל העסק לפני ההשבתה (קידום = פעולה נפרדת ומתועדת, לא תופעת-לוואי). נעילות-כניסה **לא** מתאפסות
        (אמצעי-אבטחה נפרד); הסיסמה וה-TOTP נשמרים (אותו אדם). audit בפסאודונים."""
        u = self._by_id(uid)
        if u["active"]:
            return {"name": u["name"], "was_active": True}
        self.db.x("UPDATE users SET active=1, role='staff' WHERE id=?", (u["id"],))
        self._audit(actor, "team_reactivated", {"user": u["id"], "role": "staff"})
        return {"name": u["name"], "was_active": False}

    def is_owner(self, token: str) -> bool:
        """סשן תקף של עובד פעיל בתפקיד בעלים."""
        if self.actor(token) is None:
            return False
        r = self.db.one("SELECT u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?",
                        (token_hash(token),))
        return r is not None and r["role"] == "owner"

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
        r = self.db.one("SELECT u.name, u.role FROM sessions s JOIN users u ON u.id=s.user_id "
                        "WHERE s.token_hash=?", (token_hash(token),))
        return {"actor": actor, "kind": "user", "name": r["name"] if r else "",
                "owner": bool(r and r["role"] == "owner")}

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

    def deactivate(self, email: str, actor: str = "cli") -> None:
        """critic סבב 180: לא משביתים את בעל העסק הפעיל האחרון (כמו set_role) — אחרת אף אחד לא משחרר עצירת שחזור."""
        u = self.db.one("SELECT id, role, active FROM users WHERE email=?", (email.strip().lower(),))
        if u is not None and self._last_active_owner(u):
            raise ValueError("זה בעל העסק הפעיל היחיד — קודם מנו בעלים אחר")
        if u is not None and u["active"]:
            self._audit(actor, "team_deactivated", {"user": u["id"]})
        self.db.x("UPDATE users SET active=0 WHERE email=?", (email.strip().lower(),))
        self.db.x("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email=?)",
                  (email.strip().lower(),))


if __name__ == "__main__":
    # python -m app.users <email> <name> [owner|staff]  (סיסמה מ-USER_PASSWORD) ⇒ מדפיס סוד TOTP פעם אחת
    # python -m app.users role <email> owner|staff       ⇒ שינוי תפקיד (critic 179)
    # python -m app.users reactivate <email>             ⇒ הפעלה-מחדש כעובד (מנהל 329)
    import sys
    from datetime import datetime

    from .config import load_settings
    from .policy import TZ

    _s = load_settings()
    _u = Users(DB(_s.db_path), lambda: datetime.now(TZ))
    if sys.argv[1] == "role":
        _u.set_role(sys.argv[2], sys.argv[3])
        print({"email": sys.argv[2].strip().lower(), "role": sys.argv[3]})
    elif sys.argv[1] == "reactivate":
        _row = _u.db.one("SELECT id FROM users WHERE email=?", (sys.argv[2].strip().lower(),))
        if _row is None:
            raise SystemExit("אין משתמש כזה")
        print(_u.reactivate_id(_row["id"]))
    else:
        print(_u.create(sys.argv[1], sys.argv[2], os.environ["USER_PASSWORD"],
                        sys.argv[3] if len(sys.argv) > 3 else None))

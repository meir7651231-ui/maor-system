"""זכאות מאורביט (Orbit → גבי) — הכרעת מאיר 8.11.2026: **עסקים משלמים על גבי דרך אורביט.**

אורביט מחייב; גבי לא מנהל חיוב משלו. כשהעסק מקושר לארגון-אורביט (``orbit_links``), מצב
המנוי/הניסיון של גבי נלקח מ**הזכאות האחרונה המאומתת** שאורביט שלח. עסק לא-מקושר — בדיוק
כמו היום (``Settings.trial_start``).

החוזה (מקור: knowledge/BUILD-ORDER-GABI-STORE-2026-11-07.md §7, functions/gabiHandoff.js):

    claims  = {v:1, iss:"orbit", aud:"gabi", typ:"entitlement", org, plan, status,
               trial_start, paid_until, billing_url, iat, exp}          (סדר קנוני)
    payload = b64url(JSON(claims))
    sig     = b64url(HMAC-SHA256(KEY, "gabi-entitlement-v1." + payload))
    token   = payload + "." + sig        ← נמסר ב-fragment של המסירה: #h={handoff}&e={token}

**המפתח — לא סוד-המסירה הפר-ארגוני.** סוד-המסירה מודבק ע״י בעל העסק עצמו באורביט, כלומר
הלקוח המשלם מחזיק אותו ⇒ אילו נחתמה בו הזכאות, הוא היה יכול לחתום לעצמו «active לנצח».
לכן הזכאות נחתמת במפתח-פלטפורמה שקיים **רק בשני השרתים** (``GABI_ENTITLEMENT_KEY`` ב-Functions
של אורביט ≡ ``ORBIT_ENTITLEMENT_KEY`` בפריסת גבי). אין מפתח ⇒ הזכאות נדחית (``no_key``) והעסק
נשאר בהתנהגות של היום — נכשל סגור לכיוון «אין שינוי».

כללי ההערכה (שמרני, מתועד ב-docs/PRICING.md):
  * ``trial``      — 14 יום (``Settings.trial_days``) מ-``trial_start`` של אורביט; אחר-כך עצירה.
  * ``active``     — פעיל עד ``paid_until`` כולל. אחריו ``GRACE_DAYS`` ימי חסד (אורביט אולי פשוט
                     לא רענן), ואז עצירה.
  * ``past_due``   — תשלום לא התקבל: חסד של ``GRACE_DAYS`` מ-``paid_until`` (התראה לבעל העסק), ואז עצירה.
  * ``cancelled``  — עצירה מיידית (בלי חסד).
  «עצירה» = לא מתכננים ולא שולחים תזכורות חדשות; הנתונים נשמרים; לבעל העסק הודעה בעברית עם
  קישור לחיוב באורביט.

אבטחה: חד-פעמיות אינה נדרשת (אין כאן סשן/גישה), אבל **מונוטוניות** כן — זכאות נשמרת רק אם
``iat`` שלה חדש מהשמורה, כך שהשמעה-חוזרת של טוקן ישן (גם בתוך 300 השניות) לא מחזירה מצב קודם.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
from collections.abc import Callable
from datetime import date, timedelta
from urllib.parse import urlsplit

VERSION = 1
SIG_CONTEXT = "gabi-entitlement-v1."
TYP = "entitlement"
MAX_TTL = 300          # שניות — אותה תקרה כמו המסירה
CLOCK_SKEW = 60
MIN_KEY_LEN = 32
MAX_TOKEN_LEN = 2048
KEY_ENV = "ORBIT_ENTITLEMENT_KEY"
GRACE_DAYS = 7         # חסד אחרי paid_until (active שלא רוענן / past_due). שמרני, מתועד
WARN_DAYS = 3          # כמו TERMS §8: התראה 3 ימים לפני סוף הניסיון
BUSINESS_ID = 1        # שלב 1 = עסק יחיד (כמו orbit_connect)

PLANS = ("monthly", "yearly")
STATUSES = ("trial", "active", "past_due", "cancelled")
_CLAIM_KEYS = ("v", "iss", "aud", "typ", "org", "plan", "status", "trial_start", "paid_until",
               "billing_url", "iat", "exp")
_B64URL = re.compile(r"^[A-Za-z0-9_-]+$")
_SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,62}$")
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

SCHEMA = """
CREATE TABLE IF NOT EXISTS orbit_entitlements (
  business_id INTEGER PRIMARY KEY,
  org TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  trial_start TEXT NOT NULL,
  paid_until TEXT NOT NULL,
  billing_url TEXT NOT NULL,
  iat INTEGER NOT NULL,
  received_at TEXT NOT NULL
);
"""


class EntitlementRejected(Exception):
    def __init__(self, reason: str) -> None:
        super().__init__(reason)
        self.reason = reason


def ensure_schema(db) -> None:
    with db.lock:
        db.conn.executescript(SCHEMA)
        db.conn.commit()


def _b64e(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def _b64d(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def canonical_payload(c: dict) -> str:
    """אותה מחרוזת בדיוק כמו ``entitlementJson`` של אורביט (JSON.stringify, סדר קבוע)."""
    obj = {k: c[k] for k in _CLAIM_KEYS}
    return _b64e(json.dumps(obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))


def sign(payload_b64: str, key: str) -> str:
    return _b64e(hmac.new(key.encode("utf-8"), (SIG_CONTEXT + payload_b64).encode("ascii"),
                          hashlib.sha256).digest())


def make_token(key: str, **claims) -> str:
    """לבדיקות בלבד (בפרודקשן רק אורביט חותם)."""
    c = {"v": VERSION, "iss": "orbit", "aud": "gabi", "typ": TYP, "trial_start": "",
         "paid_until": "", "billing_url": "", **claims}
    p = canonical_payload(c)
    return p + "." + sign(p, key)


def _is_int(v) -> bool:
    return type(v) is int


def _valid_date(s: str) -> bool:
    if s == "":
        return True
    if not _DATE_RE.match(s):
        return False
    try:
        date.fromisoformat(s)
    except ValueError:
        return False
    return True


def safe_billing_url(s: str) -> bool:
    """'' או https בלי פרטי-משתמש/רווחים, ≤512. (הכתובת מוצגת לבעל העסק כקישור.)"""
    if s == "":
        return True
    if len(s) > 512 or re.search(r"[\s\x00-\x1f\x7f<>\"']", s):
        return False
    try:
        u = urlsplit(s)
    except ValueError:
        return False
    return u.scheme == "https" and bool(u.hostname) and not u.username and not u.password


def parse_claims(payload_b64: str) -> dict:
    """פענוח + סכמה סגורה. **לא** מאמת חתימה."""
    try:
        c = json.loads(_b64d(payload_b64).decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        raise EntitlementRejected("format") from None
    if not isinstance(c, dict) or set(c) != set(_CLAIM_KEYS):
        raise EntitlementRejected("claims")
    if not (_is_int(c["v"]) and _is_int(c["iat"]) and _is_int(c["exp"])):
        raise EntitlementRejected("claims")
    for k in ("iss", "aud", "typ", "org", "plan", "status", "trial_start", "paid_until",
              "billing_url"):
        if not isinstance(c[k], str):
            raise EntitlementRejected("claims")
    if not _SLUG_RE.match(c["org"]) or c["plan"] not in PLANS or c["status"] not in STATUSES:
        raise EntitlementRejected("claims")
    if not (_valid_date(c["trial_start"]) and _valid_date(c["paid_until"])):
        raise EntitlementRejected("claims")
    if c["status"] == "trial" and not c["trial_start"]:
        raise EntitlementRejected("claims")
    if c["status"] in ("active", "past_due") and not c["paid_until"]:
        raise EntitlementRejected("claims")
    if not safe_billing_url(c["billing_url"]):
        raise EntitlementRejected("claims")
    return c


def verify(token: str, key: str | None, now: int, *, org: str) -> dict:
    """אימות מלא. ``org`` = הארגון המקושר (זכאות לארגון אחר נדחית)."""
    if not key or len(key) < MIN_KEY_LEN:
        raise EntitlementRejected("no_key")
    if not isinstance(token, str) or len(token) > MAX_TOKEN_LEN:
        raise EntitlementRejected("format")
    parts = token.split(".")
    if len(parts) != 2 or not all(_B64URL.match(p) for p in parts):
        raise EntitlementRejected("format")
    payload, sig = parts
    c = parse_claims(payload)
    if not hmac.compare_digest(sign(payload, key).encode("ascii"), sig.encode("ascii")):
        raise EntitlementRejected("signature")
    if c["v"] != VERSION or c["iss"] != "orbit" or c["aud"] != "gabi" or c["typ"] != TYP:
        raise EntitlementRejected("claims")
    if c["org"] != org:
        raise EntitlementRejected("org")
    if c["exp"] <= c["iat"] or c["exp"] - c["iat"] > MAX_TTL:
        raise EntitlementRejected("ttl")
    if now >= c["exp"] or now < c["iat"] - CLOCK_SKEW:
        raise EntitlementRejected("expired")
    return c


class OrbitEntitlements:
    """אחסון הזכאות האחרונה המאומתת. ``key_getter`` מוזרק בבדיקות (ברירת-מחדל: משתנה-סביבה)."""

    def __init__(self, db, key_getter: Callable[[], str | None] | None = None) -> None:
        self.db = db
        self._key = key_getter or (lambda: os.environ.get(KEY_ENV))
        ensure_schema(db)

    def ingest(self, token: str, now: int, *, org: str, at: str) -> dict:
        """אימות + שמירה מונוטונית. זורק ``EntitlementRejected`` (כולל ``stale``)."""
        c = verify(token, self._key(), now, org=org)
        with self.db.lock:
            cur = self.db.conn.execute("SELECT iat FROM orbit_entitlements WHERE business_id=?",
                                       (BUSINESS_ID,)).fetchone()
            if cur is not None and c["iat"] <= cur[0]:
                raise EntitlementRejected("stale")
            self.db.conn.execute(
                "INSERT INTO orbit_entitlements(business_id,org,plan,status,trial_start,paid_until,"
                "billing_url,iat,received_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(business_id) "
                "DO UPDATE SET org=excluded.org, plan=excluded.plan, status=excluded.status, "
                "trial_start=excluded.trial_start, paid_until=excluded.paid_until, "
                "billing_url=excluded.billing_url, iat=excluded.iat, received_at=excluded.received_at",
                (BUSINESS_ID, c["org"], c["plan"], c["status"], c["trial_start"], c["paid_until"],
                 c["billing_url"], c["iat"], at))
            self.db.conn.commit()
        return current(self.db) or {}

    def delete(self) -> None:
        self.db.x("DELETE FROM orbit_entitlements WHERE business_id=?", (BUSINESS_ID,))


def current(db) -> dict | None:
    """הזכאות השמורה — **רק** אם העסק עדיין מקושר לאותו ארגון. אחרת None (התנהגות של היום)."""
    try:
        r = db.one("SELECT e.* FROM orbit_entitlements e JOIN orbit_links l "
                   "ON l.business_id=e.business_id AND l.org=e.org WHERE e.business_id=?",
                   (BUSINESS_ID,))
    except Exception:   # sqlite3.OperationalError — הטבלאות טרם נוצרו (אין קישור מעולם)
        return None
    return dict(r) if r else None


def evaluate(ent: dict, today: date, *, trial_days: int, price_ils_month: int) -> dict:
    """מצב-שליחה מהזכאות (טהור). אותם מפתחות כמו ``CollectService.trial()`` + פרטי-אורביט."""
    base = {"price_ils_month": price_ils_month, "trial_days": trial_days, "source": "orbit",
            "plan": ent["plan"], "status": ent["status"], "paid_until": ent["paid_until"] or None,
            "trial_start": ent["trial_start"] or None, "billing_url": ent["billing_url"] or None,
            "received_at": ent.get("received_at"), "on_trial": False, "ending_soon": False,
            "days_left": None, "grace_until": None}
    st = ent["status"]
    if st == "trial":
        start = date.fromisoformat(ent["trial_start"])
        ends = start + timedelta(days=trial_days)
        left = (ends - today).days
        active = left > 0
        return {**base, "on_trial": True, "active": active, "days_left": max(left, 0),
                "ending_soon": 0 < left <= WARN_DAYS, "ends": ends.isoformat(),
                "state": "trial" if active else "trial_expired"}
    if st == "cancelled":
        return {**base, "active": False, "state": "cancelled",
                "ends": ent["paid_until"] or None}
    paid = date.fromisoformat(ent["paid_until"])
    grace = paid + timedelta(days=GRACE_DAYS)
    if st == "active" and today <= paid:
        return {**base, "active": True, "state": "active", "ends": paid.isoformat(),
                "days_left": (paid - today).days}
    # past_due, או active שלא רוענן אחרי paid_until ⇒ חסד ואז עצירה
    if today <= grace:
        return {**base, "active": True, "state": "grace", "ends": paid.isoformat(),
                "grace_until": grace.isoformat(), "days_left": (grace - today).days}
    return {**base, "active": False, "state": "expired", "ends": paid.isoformat(),
            "grace_until": grace.isoformat()}


def notice(t: dict) -> tuple[str, str] | None:
    """(מפתח-חד-פעמי, טקסט עברי) להודעת-מערכת לבעל העסק, או None כשאין מה להודיע."""
    url = t.get("billing_url")
    link = f" להסדרת המנוי באורביט: {url}" if url else " להסדרת המנוי: הגדרות ← גבי באורביט."
    st = t.get("state")
    if st == "grace":
        return (f"orbit_billing:grace:{t['ends']}",
                "התשלום על המנוי לגבי באורביט טרם התקבל. התזכורות ממשיכות עד "
                f"{t['grace_until']}, ולאחר מכן ייעצרו (הנתונים נשמרים)." + link)
    if st in ("expired", "cancelled", "trial_expired"):
        what = {"expired": "המנוי לגבי דרך אורביט הסתיים",
                "cancelled": "המנוי לגבי דרך אורביט בוטל",
                "trial_expired": "תקופת הניסיון של גבי הסתיימה"}[st]
        return (f"orbit_billing:{st}:{t.get('ends') or ''}",
                f"{what}. תזכורות חדשות לא מתוכננות ולא נשלחות (הנתונים נשמרים)." + link)
    return None

"""כניסה מאורביט (Orbit → גבי) — צד-גבי של חוזה-המסירה v1.

החוזה (מקור: knowledge/BUILD-ORDER-GABI-STORE-2026-11-07.md, src/lib/gabi.ts באורביט):

    claims  = {v:1, iss:"orbit", aud:"gabi", org, email, iat, exp, nonce}   (סדר קנוני)
    payload = b64url(JSON(claims))
    sig     = b64url(HMAC-SHA256(secret, "gabi-handoff-v1." + payload))
    token   = payload + "." + sig
    URL     = {base}/connect/orbit#h={token}       ← fragment: לא מגיע לשרת/לוגים/Referer

מה המודול עושה:
  * סוד-מסירה **פר-ארגון** נשמר רק דרך ``BusinessSecrets`` (SecretBox, AES-GCM, הקשר
    ``biz:{id}:orbit_handoff_secret``). מוחזר פעם אחת בהנפקה/רוטציה — לעולם לא בקריאה.
  * אימות: פורמט ⇒ claims קשיחים (סכמה סגורה, טיפוסים מדויקים) ⇒ ארגון מקושר ⇒ HMAC בזמן-קבוע
    ⇒ v/iss/aud ⇒ תוחלת ≤ 300 ⇒ זמן (סבילות-שעון 60 שנ' לאחור בלבד) ⇒ nonce חד-פעמי.
  * nonce: טבלת replay (גיבוב בלבד) עם ``exp``; ניקוי רשומות שפג תוקפן בכל אימות.
    ה-INSERT על מפתח ראשי = בדיקה אטומית (שתי בקשות במקביל ⇒ רק אחת עוברת).
  * ``default``/``demo`` נדחים תמיד (אתר-השורש והדמו של אורביט לא מתחברים).

**מה המודול לא עושה (הכרעת-תכנון):** טוקן תקין **אינו** פותח סשן. הוא מזהה את הארגון והמייל
בלבד, והדף ממשיך לכניסת-העובדים הרגילה (מייל ממולא מראש + סיסמה + קוד TOTP — שער 6). כך דליפת
סוד-המסירה או טוקן (גם בתוך 300 השניות) לא נותנת גישה לנתוני חייבים, ו-``REQUIRE_USER_LOGIN=1``
לא נעקף. אין יצירת משתמש אוטומטית: עובד/ת חדש/ה נוצר/ת ע״י בעל העסק כמו היום.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import re
import secrets
from dataclasses import dataclass

from .business_secrets import BusinessSecrets
from .db import DB
from .secretbox import SecretBox

VERSION = 1
SIG_CONTEXT = "gabi-handoff-v1."
MAX_TTL = 300          # שניות — תקרה קשיחה (exp − iat)
CLOCK_SKEW = 60        # שניות — מותר ש-iat יהיה מעט «בעתיד» (שעון אורביט מקדים)
MIN_SECRET_LEN = 32
MAX_TOKEN_LEN = 2048
SECRET_FIELD = "orbit_handoff_secret"  # noqa: S105  # nosec B105 — שם שדה בכספת, לא ערך סוד
BUSINESS_ID = 1        # שלב 1 = עסק יחיד בפריסה (app/db.py); שלב 2 ⇒ business_id אמיתי
FORBIDDEN_ORGS = frozenset({"default", "demo"})

_CLAIM_KEYS = ("v", "iss", "aud", "org", "email", "iat", "exp", "nonce")
_B64URL = re.compile(r"^[A-Za-z0-9_-]+$")
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,62}$")
_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_NONCE_RE = re.compile(r"^[A-Za-z0-9_-]{16,64}$")

SCHEMA = """
CREATE TABLE IF NOT EXISTS orbit_links (
  business_id INTEGER PRIMARY KEY,
  org TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  rotated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS orbit_nonces (
  nonce_hash TEXT PRIMARY KEY,
  org TEXT NOT NULL,
  exp INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_orbit_nonces_exp ON orbit_nonces(exp);
"""


class HandoffRejected(Exception):
    """טוקן נדחה. ``reason`` פנימי (ל-audit/בדיקות); למשתמש תמיד הודעה אחת כללית."""

    def __init__(self, reason: str) -> None:
        super().__init__(reason)
        self.reason = reason


@dataclass(frozen=True)
class HandoffClaims:
    org: str
    email: str
    iat: int
    exp: int
    nonce: str


def _b64d(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _b64e(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def canonical_payload(org: str, email: str, iat: int, exp: int, nonce: str) -> str:
    """אותה מחרוזת בדיוק כמו ``canonicalJson`` של אורביט (JSON.stringify, בלי רווחים, סדר קבוע)."""
    obj = {"v": VERSION, "iss": "orbit", "aud": "gabi", "org": org, "email": email,
           "iat": iat, "exp": exp, "nonce": nonce}
    return _b64e(json.dumps(obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))


def sign(payload_b64: str, secret: str) -> str:
    mac = hmac.new(secret.encode("utf-8"), (SIG_CONTEXT + payload_b64).encode("ascii"),
                   hashlib.sha256)
    return _b64e(mac.digest())


def make_token(secret: str, *, org: str, email: str, iat: int, exp: int, nonce: str) -> str:
    """לבדיקות ולכלי-אבחון בלבד (בפרודקשן אורביט חותם, לא גבי)."""
    p = canonical_payload(org, email, iat, exp, nonce)
    return p + "." + sign(p, secret)


def _is_int(v) -> bool:
    return type(v) is int   # bool הוא int בפייתון — True לא עובר כ-v=1


def parse_claims(payload_b64: str) -> dict:
    """פענוח + סכמה סגורה (בלי שדות עודפים, טיפוסים מדויקים). **לא** מאמת חתימה."""
    try:
        raw = _b64d(payload_b64)
        c = json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        raise HandoffRejected("format") from None
    if not isinstance(c, dict) or set(c) != set(_CLAIM_KEYS):
        raise HandoffRejected("claims")
    if not (_is_int(c["v"]) and _is_int(c["iat"]) and _is_int(c["exp"])):
        raise HandoffRejected("claims")
    for k in ("iss", "aud", "org", "email", "nonce"):
        if not isinstance(c[k], str):
            raise HandoffRejected("claims")
    if not SLUG_RE.match(c["org"]) or not _NONCE_RE.match(c["nonce"]):
        raise HandoffRejected("claims")
    if c["email"] != c["email"].strip().lower() or not _EMAIL_RE.match(c["email"]) \
            or len(c["email"]) > 254:
        raise HandoffRejected("claims")
    return c


class OrbitConnect:
    """קישור ארגון-אורביט ⇄ עסק-גבי + אימות טוקני-מסירה. ``box`` = SecretBox (חובה לסוד)."""

    def __init__(self, db: DB, box_factory=SecretBox.from_env) -> None:
        self.db = db
        self._box_factory = box_factory
        with db.lock:
            db.conn.executescript(SCHEMA)
            db.conn.commit()

    def _secrets(self) -> BusinessSecrets:
        # בלי COLLECT_MASTER_KEYS ⇒ SecretError (נכשל סגור — אין סוד בטקסט גלוי)
        return BusinessSecrets(self.db, self._box_factory())

    # ---------- צד-הבעלים: הנפקה/רוטציה/ביטול ----------
    def link(self) -> dict | None:
        r = self.db.one("SELECT org, created_at, rotated_at FROM orbit_links WHERE business_id=?",
                        (BUSINESS_ID,))
        return dict(r) if r else None

    def issue_secret(self, org: str, *, at: str) -> str:
        """סוד חדש לארגון (הנפקה ראשונה או רוטציה — הישן מפסיק לעבוד מיד). מוחזר פעם אחת."""
        org = (org or "").strip().lower()
        if not SLUG_RE.match(org) or org in FORBIDDEN_ORGS:
            raise ValueError("מזהה ארגון לא תקין (default/demo אינם מתחברים)")
        cur = self.link()
        if cur and cur["org"] != org:
            raise ValueError("העסק כבר מקושר לארגון אחר — יש לבטל את הקישור קודם")
        secret = secrets.token_urlsafe(32)      # 43 תווים ≥ MIN_SECRET_LEN
        self._secrets().put(BUSINESS_ID, SECRET_FIELD, secret, at=at)
        if cur:
            self.db.x("UPDATE orbit_links SET rotated_at=? WHERE business_id=?", (at, BUSINESS_ID))
        else:
            self.db.x("INSERT INTO orbit_links(business_id, org, created_at, rotated_at) "
                      "VALUES(?,?,?,?)", (BUSINESS_ID, org, at, at))
            # critic סבב 68: סימון קבוע «היה מקושר» — ניתוק לא מחזיר ל«פעיל לתמיד» (service.trial)
            if re.match(r"\d{4}-\d{2}-\d{2}", str(at)):   # בלי תאריך תקין ⇒ service.trial ירשום לפי הקישור
                self.db.x("INSERT OR IGNORE INTO business_settings(key,value,updated_at) VALUES(?,?,?)",
                          ("orbit_first_linked_at", json.dumps(str(at)[:10]), str(at)))
        return secret

    def unlink(self) -> bool:
        cur = self.link()
        if not cur:
            return False
        self._secrets().delete(BUSINESS_ID, SECRET_FIELD)
        self.db.x("DELETE FROM orbit_links WHERE business_id=?", (BUSINESS_ID,))
        return True

    # ---------- צד-הכניסה: אימות ----------
    def verify(self, token: str, now: int) -> HandoffClaims:
        if not isinstance(token, str) or len(token) > MAX_TOKEN_LEN:
            raise HandoffRejected("format")
        parts = token.split(".")
        if len(parts) != 2 or not all(_B64URL.match(p) for p in parts):
            raise HandoffRejected("format")
        payload, sig = parts
        c = parse_claims(payload)
        org = c["org"]
        if org in FORBIDDEN_ORGS:
            raise HandoffRejected("org")
        link = self.db.one("SELECT business_id FROM orbit_links WHERE org=?", (org,))
        stored = self._secrets().get(link["business_id"], SECRET_FIELD) if link else None
        # ארגון לא-מקושר ⇒ מחשבים HMAC בכל זאת (תזמון דומה) ונכשלים כ«חתימה»
        secret = stored.reveal() if stored else secrets.token_urlsafe(32)
        ok = hmac.compare_digest(sign(payload, secret).encode("ascii"), sig.encode("ascii"))
        if not ok or not stored or len(secret) < MIN_SECRET_LEN:
            raise HandoffRejected("signature")
        if c["v"] != VERSION or c["iss"] != "orbit" or c["aud"] != "gabi":
            raise HandoffRejected("claims")
        if c["exp"] <= c["iat"] or c["exp"] - c["iat"] > MAX_TTL:
            raise HandoffRejected("ttl")
        if now >= c["exp"] or now < c["iat"] - CLOCK_SKEW:
            raise HandoffRejected("expired")
        self._consume_nonce(org, c["nonce"], c["exp"], now)
        return HandoffClaims(org=org, email=c["email"], iat=c["iat"], exp=c["exp"],
                             nonce=c["nonce"])

    def _consume_nonce(self, org: str, nonce: str, exp: int, now: int) -> None:
        h = hashlib.sha256((org + ":" + nonce).encode("utf-8")).hexdigest()
        with self.db.lock:
            self.db.conn.execute("DELETE FROM orbit_nonces WHERE exp < ?", (now - CLOCK_SKEW,))
            try:
                self.db.conn.execute("INSERT INTO orbit_nonces(nonce_hash, org, exp) VALUES(?,?,?)",
                                     (h, org, exp))
            except Exception:   # sqlite3.IntegrityError — כבר נראה
                self.db.conn.commit()
                raise HandoffRejected("replay") from None
            self.db.conn.commit()


# ---------- הדף (fragment ⇒ POST; אחר-כך כניסת-עובדים רגילה) ----------
CONNECT_PAGE = """<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer"><title>כניסה מאורביט · גבי</title>
<style>:root{--bg:#f6f7f9;--card:#fff;--ink:#111827;--muted:#6b7280;--line:#e5e7eb;--brand:#0f766e;
--brand-ink:#fff}@media (prefers-color-scheme:dark){:root{--bg:#0b1220;--card:#121a2b;--ink:#e5e7eb;
--muted:#9aa4b2;--line:#243049;--brand:#2dd4bf;--brand-ink:#04211d}}*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,Arial,sans-serif;padding:16px}
.c{max-width:420px;margin:24px auto;background:var(--card);border:1px solid var(--line);border-radius:16px;
padding:22px}h1{font-size:20px;margin:0 0 8px}.m{color:var(--muted);font-size:14px}
label{display:block;margin-top:12px;font-size:14px}input{width:100%;font:inherit;padding:10px;
border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);min-height:44px}
button{width:100%;margin-top:16px;padding:12px;border-radius:12px;border:0;background:var(--brand);
color:var(--brand-ink);font:inherit;font-weight:700;min-height:48px;cursor:pointer}[hidden]{display:none}
</style></head><body><main class="c">
<h1>כניסה לגבי מאורביט</h1>
<p id="st" class="m" role="status">בודקים את קישור-ההתחברות…</p>
<form id="f" hidden>
<p class="m">הארגון זוהה: <b id="org" dir="ltr"></b>. להשלמת הכניסה — סיסמה וקוד האימות של גבי.
אין לך עדיין משתמש בגבי? בעל/ת העסק מוסיף/ה אותך.</p>
<label>מייל<input id="em" type="email" dir="ltr" readonly autocomplete="username"></label>
<label>סיסמה<input id="pw" type="password" dir="ltr" required autocomplete="current-password"></label>
<label>קוד אימות<input id="cd" inputmode="numeric" dir="ltr" required autocomplete="one-time-code"
maxlength="12"></label>
<button type="submit">כניסה</button></form>
</main><script>
(function(){
  var st=document.getElementById('st'), f=document.getElementById('f');
  var m=/(?:^#|&)h=([A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+)/.exec(location.hash||'');
  try{history.replaceState(null,'',location.pathname);}catch(e){}   // הטוקן יוצא משורת-הכתובת מיד
  var e=/(?:^#|&)e=([A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+)/.exec(location.hash||'');   // זכאות (חיוב דרך אורביט)
  if(!m){st.textContent='הקישור אינו תקף או שפג תוקפו. חזרו לאורביט ונסו שוב.';return;}
  var body={token:m[1]};if(e){body.ent=e[1];}
  fetch('/api/connect/orbit',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body),credentials:'omit',referrerPolicy:'no-referrer'})
  .then(function(r){return r.ok?r.json():Promise.reject(r.status);})
  .then(function(d){
    document.getElementById('org').textContent=d.org;
    document.getElementById('em').value=d.email;
    st.textContent='';f.hidden=false;document.getElementById('pw').focus();
  },function(s){st.textContent=s===429?'יותר מדי ניסיונות. נסו שוב בעוד רגע.':
    'הקישור אינו תקף או שפג תוקפו. חזרו לאורביט ונסו שוב.';});
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    fetch('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',
      body:JSON.stringify({email:document.getElementById('em').value,
        password:document.getElementById('pw').value,code:document.getElementById('cd').value})})
    .then(function(r){return r.ok?r.json():Promise.reject(r.status);})
    .then(function(d){try{sessionStorage.setItem('gabi_owner_token',d.token);}catch(e){}
      location.replace('__NEXT__');},
    function(s){st.textContent=s===429?'הכניסה ננעלה זמנית. נסו שוב מאוחר יותר.':
      'פרטי ההתחברות או קוד האימות שגויים';});
  });
})();
</script></body></html>"""

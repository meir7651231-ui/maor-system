"""כלי אבטחה טהורים: אימות בעלים, אימות webhook, חיטוי קלט ליציאה, הסוואת PII בלוגים.

אין כאן רשת ואין DB — הכול נבדק ביחידה (tests/test_security.py).
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import re
import time
from urllib.parse import urlsplit

# ---------- אימות בעל העסק (API) ----------


def token_ok(presented: str | None, expected: str | None) -> bool:
    """השוואה בזמן קבוע. expected ריק ⇒ תמיד False (נכשל סגור)."""
    if not expected or not presented:
        return False
    return hmac.compare_digest(presented.encode("utf-8"), expected.encode("utf-8"))


def bearer(header: str | None) -> str | None:
    if not header:
        return None
    scheme, _, value = header.partition(" ")
    return value.strip() if scheme.lower() == "bearer" and value.strip() else None


MIN_TOKEN_LEN = 32


def strong_token(tok: str) -> bool:
    return len(tok) >= MIN_TOKEN_LEN and len(set(tok)) >= 10


# ---------- webhook נכנס (תשובות לקוחות מספק SMS/מייל) ----------
# חוזה גנרי שלנו (לספק שתומך ב-HMAC מותאם, או לשכבת proxy שלנו):
#   X-Collect-Timestamp: <unix seconds>
#   X-Collect-Signature: sha256=<hex HMAC-SHA256(secret, f"{ts}.{raw_body}")>
REPLAY_WINDOW_S = 300


def sign_webhook(secret: str, ts: int, body: bytes) -> str:
    mac = hmac.new(secret.encode("utf-8"), f"{ts}.".encode() + body, hashlib.sha256)
    return "sha256=" + mac.hexdigest()


def verify_webhook(secret: str | None, ts_header: str | None, sig_header: str | None,
                   body: bytes, *, now: float | None = None,
                   window: int = REPLAY_WINDOW_S) -> bool:
    if not secret or not ts_header or not sig_header:
        return False
    try:
        ts = int(ts_header)
    except ValueError:
        return False
    now = time.time() if now is None else now
    if abs(now - ts) > window:
        return False  # הגנת replay
    return hmac.compare_digest(sign_webhook(secret, ts, body), sig_header.strip())


def twilio_signature(auth_token: str, url: str, params: dict[str, str]) -> str:
    """חתימת Twilio (X-Twilio-Signature): base64(HMAC-SHA1(token, url + k1v1k2v2...))."""
    data = url + "".join(k + params[k] for k in sorted(params))
    mac = hmac.new(auth_token.encode("utf-8"), data.encode("utf-8"), hashlib.sha1)
    return base64.b64encode(mac.digest()).decode("ascii")


def verify_twilio(auth_token: str | None, url: str, params: dict[str, str],
                  sig_header: str | None) -> bool:
    if not auth_token or not sig_header:
        return False
    return hmac.compare_digest(twilio_signature(auth_token, url, params), sig_header.strip())


# ---------- חיטוי ליציאה ----------

def safe_https_url(url: str | None) -> str | None:
    """קישור תשלום: https בלבד, עם host, בלי user:pass@, בלי רווחים/תווי בקרה.
    לא תקין ⇒ None (המתקשר מחליט: לסרב בטעינה או להשמיט)."""
    if not url:
        return None
    if any(c.isspace() or ord(c) < 32 or ord(c) == 127 for c in url):
        return None
    try:
        p = urlsplit(url)
    except ValueError:
        return None
    if p.scheme != "https" or not p.hostname or p.username or p.password:
        return None
    return url


_CTRL = re.compile(r"[\x00-\x1f\x7f  ]")
# תווי כיווניות (Trojan-Source/RLO) — מאפשרים להסוות קישור או סכום בתוך SMS/מייל
_BIDI = re.compile("[\u202a-\u202e\u2066-\u2069\u200e\u200f\u061c]")


def sanitize_header_value(v: str, max_len: int = 200) -> str:
    """ערך לכותרת מייל (Subject/From-name): בלי CR/LF ⇒ אין header-injection."""
    return _BIDI.sub("", _CTRL.sub(" ", v or "")).strip()[:max_len]


def sanitize_field(v: str, max_len: int = 80) -> str:
    """שדה שמגיע מחשבונית ירוקה (שם לקוח, מספר חשבונית) ונשתל בגוף SMS/מייל:
    שורה אחת, בלי תווי בקרה/כיווניות, אורך מוגבל (אין 'הזרקת' פסקאות/קישורים ארוכים)."""
    return sanitize_header_value(v, max_len)


# הפעלה 115 — שם לקוח מקלט חיצוני (CSV/GI/iCount/EZcount/רווחית) לפני SMS/מייל ולפני מפתח הלקוח.
_ZERO_WIDTH = re.compile("[\u200b\u200c\u200d\u2060\ufeff\u00ad]")
_URLISH = re.compile(r"(?i)(?:https?://|www\.)\S*|\b[\w-]+(?:\.[\w-]+)*\.(?:co\.il|org\.il|com|net|org|info|io|me|ly|il|co)\b\S*")
_PLACEHOLDER_NAMES = frozenset({"none", "null", "nan", "nil", "undefined", "n/a", "na", "-",
                                "לא ידוע", "ללא", "ללא שם", "אין", "אין שם", "לקוח", "לקוח כללי"})


def clean_client_name(v: object, max_len: int = 80) -> str:
    """שם לקוח שמוצג לחייב: שורה אחת, בלי תווי כיווניות/רוחב-אפס, רווחים מאוחדים, בלי קישורים.
    ערך-ממלא-מקום ("None"/"null"/"-"/"לא ידוע") או שם בלי אף אות (טלפון, ת״ז) ⇒ "" ⇒ פנייה כללית.
    באג שנמצא: «שלום None,» / «שלום 0501234567,» ב-SMS לחייב; קישור בשם נכנס לגוף המייל."""
    s = _ZERO_WIDTH.sub("", sanitize_field("" if v is None else str(v), 400))
    s = _URLISH.sub(" ", s)
    s = " ".join(s.split())
    if s.lower().strip(" .,;:-_*\"'") in _PLACEHOLDER_NAMES or s.lower() in _PLACEHOLDER_NAMES:
        return ""
    if not any(c.isalpha() for c in s):
        return ""
    if len(s) > max_len:
        cut = s[:max_len]
        s = cut.rsplit(" ", 1)[0] if " " in cut else cut
    return s.strip(" ,;:-")


# הפעלה 116 — מספר חשבונית מקלט חיצוני (CSV/GI/iCount/EZcount/רווחית) לפני SMS/מייל ולפני מפתח המסמך.
_EXCEL_FLOAT = re.compile(r"^(\d+)\.0+$")
_PLACEHOLDER_NUMS = frozenset({"none", "null", "nan", "nil", "undefined", "n/a", "na", "-", "--", "0",
                               "לא ידוע", "ללא", "אין"})
DOC_NUMBER_MAX = 64


def clean_doc_number(v: object) -> str:
    """מספר מסמך שמוצג לחייב ומשמש מפתח (`csv:{מספר}`, איחוד CSV↔API): שורה אחת, בלי כיווניות/רוחב-אפס,
    רווחים מאוחדים. ממלא-מקום ("None"/"null"/"-") או מספר שמכיל קישור ⇒ "" (לא מוצג לחייב).
    Excel ⇒ "1234.0" חוזר ל-"1234". באג שנמצא: «חשבונית None», «חשבונית http://…» ב-SMS לחייב,
    ו-"1234.0" מ-Excel מול "1234" מה-API ⇒ שתי חשבוניות ⇒ שתי תזכורות על אותו חוב."""
    if v is None or isinstance(v, bool):
        return ""
    s = _ZERO_WIDTH.sub("", sanitize_field(str(v), 400))
    s = " ".join(s.split())
    s = s.strip(" ,;:")
    m = _EXCEL_FLOAT.match(s)
    if m:
        s = m.group(1)
    if s.lower() in _PLACEHOLDER_NUMS or not any(c.isalnum() for c in s):
        return ""
    if _URLISH.search(s) or "@" in s:
        return ""
    return s


def html_escape(v: str) -> str:
    return (v.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;").replace("'", "&#x27;"))


# ---------- הסוואת PII ללוגים ----------
_PHONE = re.compile(r"(?<!\d)(?:\+?972|0)[\d\- ]{7,12}\d")
_EMAIL = re.compile(r"([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})")
_BEARER = re.compile(r"(?i)(bearer\s+)[A-Za-z0-9._~+/=-]+")
_SECRETISH = re.compile(r"(?i)((?:secret|password|token|api[_-]?key)\"?\s*[:=]\s*\"?)[^\s\",}]+")


def redact(text: str) -> str:
    """לפני כתיבה ללוג: טלפון ⇒ ***4567, מייל ⇒ d***@domain, טוקנים ⇒ ***."""
    def _ph(m: re.Match) -> str:
        d = re.sub(r"\D", "", m.group(0))
        return "***" + d[-4:]

    t = _BEARER.sub(r"\1***", text or "")
    t = _SECRETISH.sub(r"\1***", t)
    t = _EMAIL.sub(r"\1***@\2", t)
    return _PHONE.sub(_ph, t)

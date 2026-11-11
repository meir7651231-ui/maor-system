"""טיפוסים ומעקות משותפים לכל ה-adapters. טהור, בלי רשת."""
from __future__ import annotations

import base64
import json
import re
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any
from urllib.parse import parse_qsl
from zoneinfo import ZoneInfo

import httpx

from ..config import SafetyError

SECRET_HEADERS = {"authorization", "x-api-key", "api-key", "x-auth-token"}
SECRET_KEYS = re.compile(r"^(sid|pass)$|secret|token|password|api_?key", re.IGNORECASE)
REDACTED = "***"


def jstr(v: Any, *, strip: bool = False) -> str:
    """ערך מ-JSON/CSV חיצוני ⇒ מחרוזת, כש-null ⇒ "" (לא "None").
    הפעלות 107/108: `str(None)` יצר מפתחות משותפים ("None", "rivhit:None:1:None") ⇒ מיזוג לקוחות
    ומסמכים. נאכף ב-tests/test_no_bare_str_get.py: אסור `str(x.get(...))` חשוף."""
    if v is None:
        return ""
    s = str(v)
    return s.strip() if strip else s


_THOUSANDS = re.compile(r"^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$")
_INVISIBLE = ("\u20aa", " ", "\u00a0", "\u202f", "\u200f", "\u200e")


def parse_amount_agorot(v: Any, *, max_agorot: int = 10_000_000_000) -> int:
    """סכום מקלט חיצוני (JSON של מערכת החשבוניות / תא CSV) ⇒ אגורות, עיגול חצי-למעלה, בלי float.
    מקור יחיד לשני הנתיבים (הפעלה 111). פסיק מותר **רק** כמפריד אלפים תקין ("1,200" / "12,345.67");
    פסיק כנקודה עשרונית ("1200,50", "12,5"), פורמט אירופאי ("1.200,50"), קבוצות שגויות ("1,2,3"),
    NaN/Infinity, טקסט, או מעל התקרה ⇒ ValueError. לא מנחשים: סכום שגוי בתזכורת גרוע מדילוג."""
    from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

    if isinstance(v, bool):
        raise ValueError(f"סכום לא תקין: {v!r}")
    t = str(v if v is not None else 0)
    for ch in _INVISIBLE:
        t = t.replace(ch, "")
    t = t.strip()
    if "," in t:
        if not _THOUSANDS.match(t):
            raise ValueError(f"סכום לא תקין: {v!r}")
        t = t.replace(",", "")
    t = t or "0"
    try:
        d = Decimal(t)
    except InvalidOperation:
        raise ValueError(f"סכום לא תקין: {v!r}") from None
    if not d.is_finite():
        raise ValueError(f"סכום לא תקין: {v!r}")
    out = int((d * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    if abs(out) > max_agorot:
        raise ValueError(f"סכום לא סביר: {v!r}")
    return out


_CURRENCY_ALIASES = {
    "ILS": "ILS", "NIS": "ILS", "₪": "ILS", "ש\"ח": "ILS", "ש״ח": "ILS", "שח": "ILS", "שקל": "ILS",
    "שקלים": "ILS", "ש'ח": "ILS", "ש׳ח": "ILS",
    "USD": "USD", "$": "USD", "US$": "USD", "דולר": "USD", "דולרים": "USD",
    "EUR": "EUR", "€": "EUR", "אירו": "EUR", "יורו": "EUR",
    "GBP": "GBP", "£": "GBP", "ליש\"ט": "GBP",
}
_ISO_CODE = re.compile(r"^[A-Z]{3}$")


def parse_currency(v: Any) -> str:
    """מטבע מקלט חיצוני (JSON / תא CSV) ⇒ קוד ISO אחד. ריק/null ⇒ ILS (ברירת המחדל של כל המקורות).
    הפעלה 113: ה-CSV שמר את התא כמו שהוא (`.upper()`), ו-GI/iCount בלי נרמול בכלל. לכן
    'ש"ח'/'NIS'/'ils'/'₪' נשמרו כמטבעות **שונים** מ-ILS: התזכורת הציגה 'ש"ח 1,200' / 'NIS 1,200'
    במקום '1,200 ₪', ושתי חשבוניות של אותו לקוח (ILS + 'ש"ח') נחשבו «מטבעות מעורבים» ⇒ אין תזכורת
    מאוחדת. וגם: טקסט חופשי (קישור, שורה חדשה) נכנס כמו שהוא לגוף ה-SMS. עכשיו: כינוי מוכר ⇒ קוד,
    קוד ISO של 3 אותיות ⇒ כמו שהוא, וכל השאר ⇒ ValueError (CSV: שורה נדחית · API: מסמך פגום)."""
    if v is None:
        return "ILS"
    if not isinstance(v, str):
        raise ValueError(f"מטבע לא תקין: {v!r}")
    t = v
    for ch in (" ", "\u00a0", "\u202f", "\u200f", "\u200e"):
        t = t.replace(ch, "")
    if not t:
        return "ILS"
    code = _CURRENCY_ALIASES.get(t) or _CURRENCY_ALIASES.get(t.upper())
    if code:
        return code
    if _ISO_CODE.match(t.upper()) and t.isascii():
        return t.upper()
    raise ValueError(f"מטבע לא מוכר: {v!r}")


# הפעלה 118 — תאריך מקלט חיצוני (GI/iCount/EZcount/רווחית) לפני חישוב מועד התזכורת.
# באג שנמצא: מועד תשלום אמיתי בפורמט שלא זוהה ("15-10-2026", epoch, RLM מוביל, "2026/10/15", "1/10/26")
# נפל ל-None בשקט ⇒ מועד "מוערך" = הנפקה+30 ⇒ «טרם שולמה» לפני המועד האמיתי (או אחרי, באיחור).
_DATE_JUNK = re.compile("[\x00-\x1f\x7f\u00a0\u00ad\u061c\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]")
_D_ISO = re.compile(r"^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[ T])")
_D_YMD = re.compile(r"^(\d{4})[/.](\d{1,2})[/.](\d{1,2})(?:$|[ T])")
_D_DMY = re.compile(r"^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})(?:$|[ T])")
_D_COMPACT = re.compile(r"^(\d{4})(\d{2})(\d{2})$")
_D_EPOCH = re.compile(r"^(\d{9,10}|\d{12,13})(?:\.0+)?$")
_D_DOTNET = re.compile(r"^/Date\((\d{12,13})(?:[+-]\d{4})?\)/$")
_D_TZ_TAIL = re.compile(r"(?:Z|[+-]\d{2}(?::?\d{2})?)$")
DATE_MIN_YEAR, DATE_MAX_YEAR = 2000, 2099


_IL_TZ = ZoneInfo("Asia/Jerusalem")


def _il_date_of_epoch(sec: float) -> date:
    return datetime.fromtimestamp(sec, _IL_TZ).date()


def parse_ext_date(v: Any) -> date | None:
    """תאריך ממערכת הנהלת חשבונות ⇒ `date` לפי שעון ישראל, או None (לא ידוע ⇒ הקורא מעריך הנפקה+30).
    נתמך: ISO (גם עם שעה; עם אזור-זמן ⇒ מומר לשעון ישראל) · YYYY/MM/DD · DD/MM/YYYY ו-DD.MM.YYYY
    ו-DD-MM-YYYY (גם שנה בשתי ספרות ⇒ 20YY, גם עם שעה) · YYYYMMDD · epoch בשניות/מילישניות
    (מספר או מחרוזת) · /Date(ms)/. תווי כיווניות/רוחב-אפס/רווחים מוסרים. ממלא-מקום ("0000-00-00",
    "None", "-", 0), תאריך לא קיים (31/02), או שנה מחוץ ל-2000–2099 ⇒ None."""
    if v is None or isinstance(v, bool):
        return None
    if isinstance(v, datetime):
        d = v.date() if v.tzinfo is None else _il_date_of_epoch(v.timestamp())
        return d if DATE_MIN_YEAR <= d.year <= DATE_MAX_YEAR else None
    if isinstance(v, date):
        return v if DATE_MIN_YEAR <= v.year <= DATE_MAX_YEAR else None
    if isinstance(v, float):
        if v != v or v in (float("inf"), float("-inf")) or not v.is_integer():
            return None
        v = int(v)
    s = _DATE_JUNK.sub("", str(v)).strip()
    if not s:
        return None
    try:
        d: date | None = None
        m = _D_EPOCH.match(s) or _D_DOTNET.match(s)
        if m:
            n = int(m.group(1))
            d = _il_date_of_epoch(n / 1000 if len(m.group(1)) >= 12 else n)
        elif m := _D_COMPACT.match(s):
            d = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        elif m := _D_ISO.match(s):
            rest = s[m.end():].strip() if s[m.end() - 1:m.end()] in (" ", "T") else ""
            if rest and _D_TZ_TAIL.search(rest):
                dt = datetime.fromisoformat(s.replace(" ", "T", 1).replace("Z", "+00:00"))
                d = _il_date_of_epoch(dt.timestamp())
            else:
                d = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        elif m := _D_YMD.match(s):
            d = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        elif m := _D_DMY.match(s):
            y = int(m.group(3)) + (2000 if len(m.group(3)) == 2 else 0)
            d = date(y, int(m.group(2)), int(m.group(1)))
    except (ValueError, OverflowError, OSError):
        return None
    if d is None:
        return None
    return d if DATE_MIN_YEAR <= d.year <= DATE_MAX_YEAR else None


def safe_map(owner: Any, fn: Any, *args: Any) -> Any:
    """critic סבב 44: מיפוי מסמך אחד שנכשל (סכום/תאריך לא תקין) לא מפיל את כל הסנכרון. ⇒ None, ונספר
    ב-`owner.malformed`. השירות לא סוגר חשבוניות בסנכרון שבו היה מסמך פגום (אולי זה הוא), ומתריע."""
    try:
        return fn(*args)
    except (ValueError, ArithmeticError, TypeError, KeyError):
        owner.__dict__["malformed"] = owner.__dict__.get("malformed", 0) + 1
        return None


class IntegrationError(RuntimeError):
    """תקלה בקונפיגורציה או בקלט (לא תלויה בספק)."""


class ProviderError(IntegrationError):
    """הספק החזיר שגיאה. retryable=True ⇒ שווה לנסות שוב / לעבור לספק גיבוי."""

    def __init__(self, provider: str, message: str, *, status: int | None = None,
                 retryable: bool = False) -> None:
        super().__init__(f"{provider}: {message}")
        self.provider = provider
        self.status = status
        self.retryable = retryable


@dataclass(frozen=True)
class SmsMessage:
    to: str                 # כל פורמט ישראלי — מנורמל ב-adapter
    text: str
    idempotency_key: str = ""   # למשל reminder:123 — מונע שליחה כפולה


@dataclass(frozen=True)
class EmailMessageOut:
    to: str
    subject: str
    text: str
    html: str = ""
    reply_to: str = ""
    idempotency_key: str = ""
    unsubscribe_url: str = ""   # ⇒ List-Unsubscribe


@dataclass
class SendResult:
    ok: bool
    provider: str
    channel: str                       # sms / email
    dry_run: bool
    message_id: str = ""
    error: str = ""
    retryable: bool = False
    duplicate: bool = False
    preview: dict[str, Any] = field(default_factory=dict)  # הבקשה המדויקת, מצונזרת


# ---------------------------------------------------------------- מעקות רשת
def guard_transport(transport: httpx.BaseTransport | None) -> httpx.BaseTransport | None:
    """שלב 1: None (dry-run) או MockTransport בלבד. כל דבר אחר = רשת אמיתית ⇒ סירוב."""
    if transport is None or isinstance(transport, httpx.MockTransport):
        return transport
    raise SafetyError("שלב 1: שליחה אמיתית חסומה — רק dry-run או httpx.MockTransport")


def redact_headers(headers: httpx.Headers | dict[str, str]) -> dict[str, str]:
    return {k: (REDACTED if k.lower() in SECRET_HEADERS else v) for k, v in dict(headers).items()}


def _redact_obj(o: Any) -> Any:
    if isinstance(o, dict):
        return {k: (REDACTED if isinstance(k, str) and SECRET_KEYS.search(k)
                    and not isinstance(v, (dict, list)) else _redact_obj(v))
                for k, v in o.items()}
    if isinstance(o, list):
        return [_redact_obj(x) for x in o]
    return o


def request_preview(req: httpx.Request, *, secrets: tuple[str, ...] = ()) -> dict[str, Any]:
    """תצוגת הבקשה כפי שהייתה נשלחת — בלי סודות (גם לא בתוך ה-URL או הגוף)."""
    ctype = req.headers.get("content-type", "")
    raw = req.content.decode("utf-8") if req.content else ""
    body: Any = raw
    if "json" in ctype and raw:
        body = _redact_obj(json.loads(raw))
    elif "x-www-form-urlencoded" in ctype and raw:
        body = _redact_obj(dict(parse_qsl(raw)))
    url = str(req.url)
    for s in secrets:
        if s:
            url = url.replace(s, REDACTED)
            if isinstance(body, str):
                body = body.replace(s, REDACTED)
    return {"method": req.method, "url": url, "headers": redact_headers(req.headers),
            "body": body}


def basic_auth(user: str, password: str) -> str:
    return "Basic " + base64.b64encode(f"{user}:{password}".encode()).decode()


def classify_status(provider: str, r: httpx.Response) -> ProviderError:
    retry = r.status_code == 429 or r.status_code >= 500
    return ProviderError(provider, f"HTTP {r.status_code}", status=r.status_code, retryable=retry)


def require_https(url: str, what: str) -> str:
    if not url.lower().startswith("https://"):
        raise IntegrationError(f"{what}: מותר רק https")
    return url

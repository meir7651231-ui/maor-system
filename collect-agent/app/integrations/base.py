"""טיפוסים ומעקות משותפים לכל ה-adapters. טהור, בלי רשת."""
from __future__ import annotations

import base64
import json
import re
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import parse_qsl

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

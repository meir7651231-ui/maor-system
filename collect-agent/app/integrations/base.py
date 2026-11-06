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

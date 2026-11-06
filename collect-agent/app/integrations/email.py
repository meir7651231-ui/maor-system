"""adapters למייל: SMTP (smtplib) · Resend (HTTP API).

מייל תזכורת = הודעה עסקית על חוב קיים, לא "דבר פרסומת" (חוק התקשורת §30א) — ובכל זאת
מצרפים List-Unsubscribe ושורת הסרה, כי הבעלים מתחייב לעצור על "הסר".
"""
from __future__ import annotations

import re
import smtplib
import ssl
from collections.abc import Callable
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from typing import Any, Protocol

import httpx

from ..config import SafetyError
from .base import EmailMessageOut, IntegrationError, ProviderError, SendResult
from .http import HttpAdapter

EMAIL_RE = re.compile(r"^[^@\s<>\"']+@[^@\s<>\"']+\.[A-Za-z]{2,}$")


def valid_email(addr: str) -> str:
    a = (addr or "").strip()
    if not EMAIL_RE.match(a) or "\n" in a or "\r" in a:
        raise IntegrationError(f"כתובת מייל לא תקינה: {addr!r}")
    return a


def _no_crlf(s: str, what: str) -> str:
    if "\r" in s or "\n" in s:
        raise IntegrationError(f"{what}: אסור מעבר שורה (header injection)")
    return s


def _check(msg: EmailMessageOut) -> None:
    valid_email(msg.to)
    _no_crlf(msg.subject, "subject")
    if msg.reply_to:
        valid_email(msg.reply_to)
    if not msg.subject.strip() or not msg.text.strip():
        raise IntegrationError("מייל חייב נושא וגוף טקסט")


def unsubscribe_headers(msg: EmailMessageOut) -> dict[str, str]:
    if not msg.unsubscribe_url:
        return {}
    from ..greeninvoice import is_loopback_url  # http מותר רק לשרת מקומי (הדגמה/פיתוח)

    if not (msg.unsubscribe_url.startswith("https://") or is_loopback_url(msg.unsubscribe_url)):
        raise IntegrationError("unsubscribe_url חייב https")
    return {"List-Unsubscribe": f"<{msg.unsubscribe_url}>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"}


# ------------------------------------------------------------------ SMTP
class SmtpConn(Protocol):
    def login(self, user: str, password: str) -> Any: ...
    def send_message(self, msg: EmailMessage) -> Any: ...
    def quit(self) -> Any: ...


class SmtpEmail:
    """SMTP דרך smtplib. בלי factory ⇒ dry-run (נבנית הודעת MIME מלאה, לא נשלחת).
    עם factory ⇒ חייב is_mock=True בשלב 1 (בדיקות בלבד)."""

    provider = "smtp"
    channel = "email"

    def __init__(self, host: str, port: int, username: str, password: str, from_addr: str,
                 *, from_name: str = "", starttls: bool = True,
                 factory: Callable[..., SmtpConn] | None = None) -> None:
        if factory is not None and not getattr(factory, "is_mock", False):
            raise SafetyError("שלב 1: SMTP אמיתי חסום — רק dry-run או factory מדומה")
        if not host:
            raise IntegrationError("SMTP: חסר SMTP_HOST")
        if username and not starttls and int(port) != 465:
            # login בלי TLS = סיסמה בטקסט גלוי ברשת (465 = SMTPS, מוצפן מההתחלה)
            raise IntegrationError("SMTP: התחברות עם סיסמה דורשת STARTTLS או פורט 465")
        self.host, self.port, self.user, self.password = host, int(port), username, password
        self.from_addr, self.from_name = valid_email(from_addr), _no_crlf(from_name, "from_name")
        self.starttls, self.factory = starttls, factory
        self._seen: dict[str, SendResult] = {}
        self.outbox: list[dict[str, Any]] = []

    @property
    def dry_run(self) -> bool:
        return self.factory is None

    def build_message(self, msg: EmailMessageOut) -> EmailMessage:
        _check(msg)
        m = EmailMessage()
        m["From"] = formataddr((self.from_name, self.from_addr)) if self.from_name \
            else self.from_addr
        m["To"] = msg.to
        m["Subject"] = msg.subject
        m["Message-ID"] = make_msgid(domain=self.from_addr.split("@", 1)[1])
        if msg.reply_to:
            m["Reply-To"] = msg.reply_to
        for k, v in unsubscribe_headers(msg).items():
            m[k] = v
        m.set_content(msg.text)
        if msg.html:
            m.add_alternative(msg.html, subtype="html")
        return m

    def send(self, msg: EmailMessageOut) -> SendResult:
        key = msg.idempotency_key
        if key and key in self._seen:
            p = self._seen[key]
            return SendResult(ok=p.ok, provider=self.provider, channel="email",
                              dry_run=p.dry_run, message_id=p.message_id, duplicate=True,
                              preview=p.preview)
        m = self.build_message(msg)
        preview = {"smtp": f"{self.host}:{self.port}", "starttls": self.starttls,
                   "user": self.user, "password": "***",  # nosec B105 — הסוואה, לא סיסמה
                   "headers": {k: str(v) for k, v in m.items()}, "text": msg.text}
        self.outbox.append(preview)
        mid = str(m["Message-ID"])
        if self.factory is not None:
            try:
                conn = self.factory(self.host, self.port, timeout=15)
                try:
                    if self.starttls:
                        conn.starttls(context=ssl.create_default_context())
                    if self.user:
                        conn.login(self.user, self.password)
                    refused = conn.send_message(m)
                    if refused:
                        raise ProviderError(self.provider, f"נדחה: {refused}")
                finally:
                    conn.quit()
            except ProviderError as e:
                return SendResult(ok=False, provider=self.provider, channel="email",
                                  dry_run=False, error=str(e), preview=preview)
            except (smtplib.SMTPException, OSError) as e:
                code = getattr(e, "smtp_code", 0) or 0
                retry = code == 0 or 400 <= code < 500   # 4xx = זמני, רשת = זמני
                return SendResult(ok=False, provider=self.provider, channel="email",
                                  dry_run=False, error=f"{type(e).__name__}: {e}",
                                  retryable=retry, preview=preview)
        res = SendResult(ok=True, provider=self.provider, channel="email",
                         dry_run=self.factory is None, message_id=mid, preview=preview)
        if key:
            self._seen[key] = res
        return res


# ------------------------------------------------------------------ Resend
class ResendEmail(HttpAdapter):
    """Resend: POST https://api.resend.com/emails, Bearer re_…, תשובה {"id": …}.
    תומך Idempotency-Key (מונע כפילות גם אחרי timeout)."""

    provider = "resend"
    channel = "email"
    URL = "https://api.resend.com/emails"

    def __init__(self, api_key: str, from_addr: str, *, from_name: str = "", **kw) -> None:
        super().__init__(**kw)
        if not api_key:
            raise IntegrationError("Resend: חסר RESEND_API_KEY")
        self.key = api_key
        self.from_addr = valid_email(from_addr)
        self.from_name = _no_crlf(from_name, "from_name")

    def _secrets(self):
        return (self.key,)

    def build_request(self, msg: EmailMessageOut) -> httpx.Request:
        _check(msg)
        frm = f"{self.from_name} <{self.from_addr}>" if self.from_name else self.from_addr
        body: dict[str, Any] = {"from": frm, "to": [msg.to], "subject": msg.subject,
                                "text": msg.text}
        if msg.html:
            body["html"] = msg.html
        if msg.reply_to:
            body["reply_to"] = msg.reply_to
        hdrs = unsubscribe_headers(msg)
        if hdrs:
            body["headers"] = hdrs
        headers = {"Authorization": f"Bearer {self.key}"}
        if msg.idempotency_key:
            headers["Idempotency-Key"] = msg.idempotency_key
        return httpx.Request("POST", self.URL, json=body, headers=headers)

    def parse(self, r: httpx.Response) -> str:
        mid = r.json().get("id")
        if not mid:
            raise ProviderError(self.provider, "אין id בתשובה")
        return str(mid)

    def send(self, msg: EmailMessageOut) -> SendResult:
        return self._execute(self.build_request(msg), msg.idempotency_key, self.parse)

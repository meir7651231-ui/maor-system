"""ערוצי שליחה: SMS (adapter ניתן-להחלפה) + מייל.

**אין וואטסאפ** — מדיניות Meta אוסרת debt collection.

כל adapter יודע *לבנות* את בקשת ה-HTTP/המייל המדויקת (`build_request`) — כך ה-dry-run מציג
בדיוק מה היה יוצא. בשלב 1 אין מימוש `send` אמיתי לאף ספק; השליחה היחידה = DryRunSender.
פורמטי הספקים לפי התיעוד הציבורי — לאמת מול חשבון-בדיקה לפני שלב 2 (docs/CHANNELS-RESEARCH.md).
"""
from __future__ import annotations

import base64
import json
import re
import uuid
from dataclasses import dataclass, field
from email.message import EmailMessage
from typing import Any, Protocol

# bandit B406 = false positive: רק בונים XML (escape לפלט), לא מפרסרים קלט
from xml.sax.saxutils import escape  # nosec B406

# ---------- טלפונים ----------


def normalize_il_phone(raw: str) -> str | None:
    """'050-1234567' / '+972 50 1234567' ⇒ '972501234567'. לא-תקין ⇒ None."""
    d = re.sub(r"\D", "", raw or "")
    if d.startswith("00"):
        d = d[2:]
    if d.startswith("0") and len(d) in (9, 10):
        d = "972" + d[1:]
    if not d.startswith("972") or len(d) not in (11, 12):
        return None
    return d


def is_il_mobile(norm: str | None) -> bool:
    """SMS רק לנייד ישראלי (9725XXXXXXXX). קווי ⇒ מייל בלבד."""
    return bool(norm) and len(norm) == 12 and norm.startswith("9725")


def local_phone(norm: str) -> str:
    return "0" + norm[3:]


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def valid_email(e: str) -> bool:
    return bool(EMAIL_RE.match(e or ""))


# ---------- אורך SMS ----------
GSM7 = set("@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?"
           "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà")


def sms_segments(text: str) -> dict[str, Any]:
    """עברית ⇒ UCS-2: 70 תווים להודעה בודדת, 67 לכל חלק בהודעה משורשרת."""
    ucs2 = any(ch not in GSM7 for ch in text)
    single, multi = (70, 67) if ucs2 else (160, 153)
    n = len(text)
    parts = 1 if n <= single else -(-n // multi)
    return {"chars": n, "encoding": "UCS-2" if ucs2 else "GSM-7", "segments": parts}


# ---------- הודעה ----------
@dataclass(frozen=True)
class Message:
    channel: str            # 'sms' | 'email'
    to: str                 # 972XXXXXXXXX / כתובת מייל
    body: str               # טקסט (SMS / גוף מייל טקסטואלי)
    subject: str = ""
    html: str = ""
    unsubscribe_url: str = ""


class Adapter(Protocol):
    name: str
    channel: str

    def build_request(self, msg: Message) -> dict[str, Any]: ...


@dataclass(frozen=True)
class InforUSms:
    """InforU — REST v2 (Basic auth username:token, JSON). לאמת endpoint/שדות."""

    username: str = ""
    token: str = ""
    sender: str = ""
    name: str = "inforu"
    channel: str = "sms"

    def build_request(self, msg: Message) -> dict[str, Any]:
        auth = base64.b64encode(f"{self.username}:{self.token}".encode()).decode()
        return {"method": "POST", "url": "https://capi.inforu.co.il/api/v2/SMS/SendSms",
                "headers": {"Authorization": f"Basic {_mask(auth)}",
                            "Content-Type": "application/json"},
                "json": {"Data": {"Message": msg.body,
                                  "Recipients": [{"Phone": local_phone(msg.to)}],
                                  "Settings": {"Sender": self.sender}}}}


@dataclass(frozen=True)
class Sms019:
    """019 SMS — ברירת המחדל (התיעוד הציבורי הברור ביותר). XML מעל HTTPS, Bearer token.

    `test_endpoint=True` ⇒ ‎/api/test של 019 (לא שולח בפועל) — לשלב בדיקת-אינטגרציה.
    """

    username: str = ""
    token: str = ""
    sender: str = ""
    test_endpoint: bool = True
    name: str = "019"
    channel: str = "sms"

    def build_request(self, msg: Message) -> dict[str, Any]:
        xml = ("<?xml version=\"1.0\" encoding=\"UTF-8\"?><sms>"
               f"<user><username>{escape(self.username)}</username></user>"
               f"<source>{escape(self.sender)}</source>"
               f"<destinations><phone>{local_phone(msg.to)}</phone></destinations>"
               f"<message>{escape(msg.body)}</message></sms>")
        url = "https://019sms.co.il/api" + ("/test" if self.test_endpoint else "")
        return {"method": "POST", "url": url,
                "headers": {"Authorization": f"Bearer {_mask(self.token)}",
                            "Content-Type": "application/xml; charset=utf-8"},
                "body": xml}


@dataclass(frozen=True)
class TwilioSms:
    """Twilio — Messages API (form-encoded, Basic auth SID:token)."""

    account_sid: str = "ACxxxxxxxx"
    token: str = ""
    sender: str = ""
    name: str = "twilio"
    channel: str = "sms"

    def build_request(self, msg: Message) -> dict[str, Any]:
        return {"method": "POST",
                "url": f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}"
                       "/Messages.json",
                "headers": {"Authorization": f"Basic {_mask(self.token)}"},
                "form": {"To": "+" + msg.to, "From": self.sender, "Body": msg.body}}


@dataclass(frozen=True)
class SmtpEmail:
    """מייל דרך SMTP/ספק (SES/Postmark/…). כולל List-Unsubscribe One-Click (דרישת Gmail/Yahoo)."""

    sender: str = "no-reply@example.com"
    reply_to: str = ""
    name: str = "smtp"
    channel: str = "email"

    def build_message(self, msg: Message) -> EmailMessage:
        m = EmailMessage()
        m["From"] = self.sender
        m["To"] = msg.to
        m["Subject"] = msg.subject
        if self.reply_to:
            m["Reply-To"] = self.reply_to
        if msg.unsubscribe_url:
            m["List-Unsubscribe"] = f"<{msg.unsubscribe_url}>"
            m["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
        m.set_content(msg.body)
        if msg.html:
            m.add_alternative(msg.html, subtype="html")
        return m

    def build_request(self, msg: Message) -> dict[str, Any]:
        m = self.build_message(msg)
        return {"method": "SMTP", "headers": {k: str(v) for k, v in m.items()},
                "text": msg.body, "html": msg.html}


SMS_ADAPTERS = {"inforu": InforUSms, "019": Sms019, "twilio": TwilioSms}


def _mask(secret: str) -> str:
    """בתצוגה מקדימה/לוג לעולם לא מציגים סוד מלא."""
    return (secret[:4] + "…") if secret else "<missing>"


@dataclass
class DryRunSender:
    """"שולחת" = רושמת את הבקשה המדויקת שהייתה יוצאת. לא נוגעת ברשת."""

    sms: Any
    email: Any
    sent: list[dict[str, Any]] = field(default_factory=list)
    mode: str = "dry_run"

    def preview(self, msg: Message) -> dict[str, Any]:
        adapter = self.sms if msg.channel == "sms" else self.email
        out = {"channel": msg.channel, "provider": adapter.name, "to": msg.to,
               "body": msg.body, "request": adapter.build_request(msg)}
        if msg.channel == "sms":
            out["length"] = sms_segments(msg.body)
        else:
            out["subject"] = msg.subject
            out["html"] = msg.html
        return out

    def send(self, msg: Message) -> str:
        msg_id = f"dryrun.{uuid.uuid4().hex[:12]}"
        self.sent.append({"id": msg_id, **self.preview(msg)})
        return msg_id


def message_to_json(m: Message) -> str:
    return json.dumps(m.__dict__, ensure_ascii=False)


def message_from_json(s: str) -> Message:
    return Message(**json.loads(s))

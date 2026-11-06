"""שכבת הערוצים של השירות: מודל ההודעה + שליחת dry-run, מעל `app/integrations/`.

**שכבה אחת לספקים:** כל בניית בקשה לספק (019 ראשי / InforU גיבוי / SMTP / Resend), צנזור סודות,
מניעת כפילויות וגיבוי בין ספקים — ב-`app/integrations/`. כאן נשאר רק מה שהשירות צריך:
`Message` (מה נשמר בתור), `DryRunSender` (מה *היה* יוצא, דרך ה-adapter האמיתי ב-dry-run),
עזרי פרטי קשר (`app/contact.py`) ופענוח מייל נכנס.

**אין וואטסאפ** — מדיניות Meta אוסרת debt collection.
"""
from __future__ import annotations

import json
import re
import uuid
from dataclasses import dataclass, field
from typing import Any

from .contact import EMAIL_RE, is_il_mobile, local_phone, normalize_il_phone, valid_email
from .integrations.base import EmailMessageOut, IntegrationError, SmsMessage, request_preview
from .integrations.email import SmtpEmail
from .integrations.notifier import Notification, Notifier
from .integrations.sms import SMS_PROVIDERS, Sms019
from .integrations.sms import sms_segments as _segments

__all__ = ["EMAIL_RE", "SMS_ADAPTERS", "DryRunSender", "Message", "SmtpEmail", "build_adapters",
           "is_il_mobile", "local_phone", "message_from_json", "message_to_json",
           "normalize_il_phone", "parse_address", "sms_segments", "strip_reply", "valid_email"]

SMS_ADAPTERS = SMS_PROVIDERS   # 019 · inforu (Twilio יצא — לא נדרש ל-MVP)
UNSET = "UNSET"   # מפתח חסר בשלב 1 — ה-adapter נבנה לתצוגה בלבד; הסוד מצונזר בכל מקרה


def sms_segments(text: str) -> dict[str, Any]:
    """עברית ⇒ UCS-2: 70 תווים להודעה בודדת, 67 לכל חלק בהודעה משורשרת (מימוש יחיד: integrations)."""
    enc, parts = _segments(text)
    return {"chars": len(text), "encoding": enc, "segments": parts}


# ---------- הודעה ----------
@dataclass(frozen=True)
class Message:
    channel: str            # 'sms' | 'email'
    to: str                 # 972XXXXXXXXX / כתובת מייל
    body: str               # טקסט (SMS / גוף מייל טקסטואלי)
    subject: str = ""
    html: str = ""
    unsubscribe_url: str = ""


def build_adapters(*, provider: str = "019", username: str = "", token: str = "", sender: str = "",
                   backup_username: str = "", backup_token: str = "",
                   email_from: str = "no-reply@example.com", smtp_host: str = "smtp.example",
                   test_endpoint: bool = True):
    """adapters של integrations במצב dry-run (בלי transport). מפתחות חסרים ⇒ UNSET (תצוגה בלבד).
    ⇒ (שרשרת SMS לפי סדר: הראשי ואחריו הגיבוי, מייל). 019 ראשי ⇒ InforU גיבוי, ולהפך."""
    sender = sender or "Gabi"
    backup = "inforu" if provider == "019" else "019"

    def mk(name: str, user: str, tok: str):
        if name == "019":
            return Sms019(user or UNSET, tok or UNSET, sender, test_endpoint=test_endpoint)
        return SMS_ADAPTERS[name](user or UNSET, tok or UNSET, sender)
    chain = [mk(provider, username, token), mk(backup, backup_username, backup_token)]
    return chain, SmtpEmail(smtp_host, 587, "", "", email_from)


@dataclass
class DryRunSender:
    """"שולחת" = בונה דרך ה-adapter של integrations את הבקשה המדויקת שהייתה יוצאת, ורושמת.
    לא נוגעת ברשת: ה-adapters נבנים בלי transport/factory (נאכף ב-integrations.base)."""

    sms: Any
    email: Any
    reply_to: str = ""
    sent: list[dict[str, Any]] = field(default_factory=list)
    mode: str = "dry_run"

    allow_mock_transport: bool = False   # בדיקות failover בלבד: adapters מול httpx.MockTransport
    provider_ids: dict[str, tuple[str, str]] = field(default_factory=dict)   # dryrun.* ⇒ (ספק, מזהה)

    def __post_init__(self) -> None:
        self.chain = list(self.sms) if isinstance(self.sms, (list, tuple)) else [self.sms]
        self.sms = self.chain[0] if self.chain else None   # הראשי — לתצוגה
        for a in (*self.chain, self.email):
            if a is not None and not getattr(a, "dry_run", False) and not self.allow_mock_transport:
                raise IntegrationError("DryRunSender: adapter שאינו dry-run")

    def _request(self, msg: Message) -> dict[str, Any]:
        if msg.channel == "sms":
            req = self.sms.build_request(SmsMessage(msg.to, msg.body))
            return request_preview(req, secrets=self.sms._secrets())
        m = self.email.build_message(EmailMessageOut(
            to=msg.to, subject=msg.subject, text=msg.body, html=msg.html,
            reply_to=self.reply_to, unsubscribe_url=msg.unsubscribe_url))
        return {"method": "SMTP", "headers": {k: str(v) for k, v in m.items()},
                "text": msg.body, "html": msg.html}

    def preview(self, msg: Message) -> dict[str, Any]:
        adapter = self.sms if msg.channel == "sms" else self.email
        out: dict[str, Any] = {"channel": msg.channel, "provider": adapter.provider, "to": msg.to,
                               "body": msg.body}
        try:
            out["request"] = self._request(msg)
        except IntegrationError as e:   # הודעה ארוכה/כתובת פסולה — מוצג, לא קורס
            out["request"], out["error"] = {}, str(e)
        if msg.channel == "sms":
            out["length"] = sms_segments(msg.body)
        else:
            out["subject"] = msg.subject
            out["html"] = msg.html
        return out

    def send(self, msg: Message) -> str:
        """דרך ה-adapter עצמו (Notifier): SMS ⇒ 019, ובכשל זמני ⇒ InforU. כשל בכל הספקים ⇒
        IntegrationError, והשירות לא מסמן "נשלח". המזהה הפנימי תמיד "dryrun.*"."""
        msg_id = f"dryrun.{uuid.uuid4().hex[:12]}"
        if msg.channel == "sms":
            rep = Notifier(self.chain).send(Notification(key=msg_id, phone=msg.to,
                                                         sms_text=msg.body))
        else:
            rep = Notifier([], self.email).send(Notification(
                key=msg_id, email=msg.to, email_subject=msg.subject, email_text=msg.body,
                email_html=msg.html, unsubscribe_url=msg.unsubscribe_url))
        rec = {"id": msg_id, **self.preview(msg), "delivery": rep.as_dict(),
               "provider_message_id": rep.final.message_id if rep.final else ""}
        if rep.final is not None:
            rec["provider"] = rep.final.provider
        if not rep.delivered:
            raise IntegrationError(f"שליחה נכשלה בכל הספקים: {rep.as_dict()['attempts']}")
        self.sent.append(rec)
        # לקישור דוח מסירה (DLR) שיגיע מהספק אל ההודעה שלנו
        self.provider_ids[msg_id] = (rec["provider"], rec["provider_message_id"])
        return msg_id


def message_to_json(m: Message) -> str:
    return json.dumps(m.__dict__, ensure_ascii=False)


def message_from_json(s: str) -> Message:
    return Message(**json.loads(s))


# ---------- מייל נכנס ----------
_ADDR = re.compile(r"<([^<>@\s]+@[^<>\s]+)>|([^\s<>\"]+@[^\s<>\"]+)")
_QUOTE_HDR = re.compile(r"^(on .+ wrote:|ב?תאריך .+(כתב|נכתב).*:|-{2,}\s*original message|"
                        r"-{2,}\s*הודעה מקורית|from:\s|מאת:\s)", re.I)


def parse_address(raw: str) -> str:
    """'דנה <Dana@Example.com>' ⇒ 'dana@example.com'."""
    m = _ADDR.search(raw or "")
    return (m.group(1) or m.group(2)).strip().lower() if m else ""


def strip_reply(text: str) -> str:
    """רק מה שהלקוח כתב: בלי הציטוט של ההודעה שלנו ובלי חתימת '-- '."""
    out = []
    for line in (text or "").replace("\r\n", "\n").split("\n"):
        s = line.strip()
        if s.startswith(">") or _QUOTE_HDR.match(s) or s == "--":
            break
        out.append(line)
    return "\n".join(out).strip()

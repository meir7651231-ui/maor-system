"""adapters ל-SMS: InforU · 019 SMS · Twilio.

⚠️ שמות שדות/כתובות לפי התיעוד הציבורי — **לאמת מול חשבון אמיתי** (team/integrations.md §4).
SMS בעברית = UCS-2 ⇒ 70 תווים להודעה בודדת, 67 לכל חלק בהודעה מרובת-חלקים.
"""
from __future__ import annotations

import json
import re
from urllib.parse import urlencode

import httpx

from ..whatsapp import normalize_il_phone
from .base import IntegrationError, ProviderError, SendResult, SmsMessage, basic_auth
from .http import HttpAdapter

GSM7 = set("@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡"
           "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà")
GSM7_EXT = set("^{}\\[~]|€")
MAX_SEGMENTS = 4   # תקרת עלות: תזכורת לא אמורה לעלות יותר מ-4 חלקים


def sms_segments(text: str) -> tuple[str, int]:
    """(קידוד, מספר חלקים)."""
    if all(c in GSM7 or c in GSM7_EXT for c in text):
        units = sum(2 if c in GSM7_EXT else 1 for c in text)
        return "GSM-7", 1 if units <= 160 else -(-units // 153)
    units = sum(2 if ord(c) > 0xFFFF else 1 for c in text)   # אימוג'י = 2 יחידות UTF-16
    return "UCS-2", 1 if units <= 70 else -(-units // 67)


def il_mobile_intl(raw: str) -> str:
    """⇒ '9725XXXXXXXX'. נייח/לא-תקין ⇒ IntegrationError (SMS לנייח לא מגיע)."""
    n = normalize_il_phone(raw)
    if not n or not re.fullmatch(r"9725\d{8}", n):
        raise IntegrationError(f"מספר נייד ישראלי לא תקין: {raw!r}")
    return n


def il_mobile_local(raw: str) -> str:
    return "0" + il_mobile_intl(raw)[3:]


def validate_sender(sender: str) -> str:
    """שם-שולח אלפאנומרי: עד 11 תווים לטיניים/ספרות, לפחות אות אחת — או מספר טלפון.
    בישראל שמות-שולח אלפאנומריים דורשים רישום אצל הספק (לאמת)."""
    if re.fullmatch(r"\+?\d{9,15}", sender or ""):
        return sender
    if not re.fullmatch(r"(?=.*[A-Za-z])[A-Za-z0-9 ]{1,11}", sender or ""):
        raise IntegrationError(f"שם-שולח לא תקין (עד 11 תווים לטיניים): {sender!r}")
    return sender


class SmsAdapter(HttpAdapter):
    channel = "sms"

    def _check(self, msg: SmsMessage) -> None:
        if not msg.text.strip():
            raise IntegrationError("הודעה ריקה")
        _, segs = sms_segments(msg.text)
        if segs > MAX_SEGMENTS:
            raise IntegrationError(f"הודעה ארוכה מדי: {segs} חלקים (מקס׳ {MAX_SEGMENTS})")

    def build_request(self, msg: SmsMessage) -> httpx.Request:  # pragma: no cover
        raise NotImplementedError

    def send(self, msg: SmsMessage) -> SendResult:
        self._check(msg)
        return self._execute(self.build_request(msg), msg.idempotency_key, self.parse)

    def parse(self, r: httpx.Response) -> str:  # pragma: no cover
        raise NotImplementedError


# ------------------------------------------------------------------ InforU
class InforUSms(SmsAdapter):
    """InforU API v2 (JSON). POST capi.inforu.co.il/api/v2/SMS/SendSms, Basic user:token.
    הצלחה: StatusId == 1."""

    provider = "inforu"
    URL = "https://capi.inforu.co.il/api/v2/SMS/SendSms"

    def __init__(self, username: str, api_token: str, sender: str, **kw) -> None:
        super().__init__(**kw)
        if not username or not api_token:
            raise IntegrationError("InforU: חסרים INFORU_USERNAME/INFORU_TOKEN")
        self.username, self.token, self.sender = username, api_token, validate_sender(sender)

    def _secrets(self):
        return (self.token,)

    def build_request(self, msg: SmsMessage) -> httpx.Request:
        body = {"Data": {"Message": msg.text,
                         "Recipients": [{"Phone": il_mobile_local(msg.to)}],
                         "Settings": {"Sender": self.sender}}}
        if msg.idempotency_key:  # שדה-מזהה של הלקוח — לאמת את השם המדויק מול InforU
            body["Data"]["Settings"]["CustomerMessageId"] = msg.idempotency_key
        return httpx.Request("POST", self.URL, json=body, headers={
            "Authorization": basic_auth(self.username, self.token)})

    def parse(self, r: httpx.Response) -> str:
        b = r.json()
        if b.get("StatusId") != 1:
            # StatusId שלילי = שגיאת קלט/הרשאה — לא חוזרים
            raise ProviderError(self.provider, f"StatusId={b.get('StatusId')} "
                                f"{b.get('StatusDescription', '')}".strip())
        data = b.get("Data") or {}
        return str(data.get("MessageId") or data.get("RequestId") or b.get("RequestId") or "")


# ------------------------------------------------------------------ 019
class Sms019(SmsAdapter):
    """019 SMS API (JSON). POST 019sms.co.il/api, Bearer token. הצלחה: status == 0."""

    provider = "019"
    URL = "https://019sms.co.il/api"

    def __init__(self, username: str, api_token: str, sender: str, **kw) -> None:
        super().__init__(**kw)
        if not username or not api_token:
            raise IntegrationError("019: חסרים SMS019_USERNAME/SMS019_TOKEN")
        self.username, self.token, self.sender = username, api_token, validate_sender(sender)

    def _secrets(self):
        return (self.token,)

    def build_request(self, msg: SmsMessage) -> httpx.Request:
        sms = {"user": {"username": self.username}, "source": self.sender,
               "destinations": {"phone": [il_mobile_local(msg.to)]},
               "message": msg.text}
        return httpx.Request("POST", self.URL, json={"sms": sms}, headers={
            "Authorization": f"Bearer {self.token}"})

    def parse(self, r: httpx.Response) -> str:
        b = r.json()
        if str(b.get("status")) != "0":
            raise ProviderError(self.provider, f"status={b.get('status')} {b.get('message', '')}")
        return str(b.get("shipment_id") or b.get("id") or "")


# ------------------------------------------------------------------ Twilio
class TwilioSms(SmsAdapter):
    """Twilio Programmable Messaging. POST /2010-04-01/Accounts/{SID}/Messages.json
    (form-encoded), Basic SID:AuthToken. תשובה 201 עם sid."""

    provider = "twilio"

    def __init__(self, account_sid: str, auth_token: str, *, from_: str = "",
                 messaging_service_sid: str = "", **kw) -> None:
        super().__init__(**kw)
        if not account_sid or not auth_token:
            raise IntegrationError("Twilio: חסרים TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN")
        if not (from_ or messaging_service_sid):
            raise IntegrationError("Twilio: נדרש From או MessagingServiceSid")
        self.sid, self.token = account_sid, auth_token
        self.from_ = validate_sender(from_) if from_ else ""
        self.mss = messaging_service_sid

    def _secrets(self):
        return (self.token,)

    def build_request(self, msg: SmsMessage) -> httpx.Request:
        form = {"To": "+" + il_mobile_intl(msg.to), "Body": msg.text}
        if self.mss:
            form["MessagingServiceSid"] = self.mss
        else:
            form["From"] = self.from_
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.sid}/Messages.json"
        return httpx.Request("POST", url, content=urlencode(form).encode(), headers={
            "Authorization": basic_auth(self.sid, self.token),
            "Content-Type": "application/x-www-form-urlencoded"})

    def parse(self, r: httpx.Response) -> str:
        b = r.json()
        if b.get("error_code"):
            raise ProviderError(self.provider, f"error_code={b['error_code']} "
                                f"{b.get('error_message', '')}")
        sid = b.get("sid")
        if not sid:
            raise ProviderError(self.provider, "אין sid בתשובה: " + json.dumps(b)[:120])
        return str(sid)

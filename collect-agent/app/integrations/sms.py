"""SMS — מימוש יחיד במערכת: **019 ראשי · InforU גיבוי** (הכרעת מאיר). Twilio יצא (לא נדרש ל-MVP).

⚠️ **חוזה 019 לא מאומת** (`CONTRACT_VERIFIED_019 = False`): אין מסמך רשמי, ובתיעוד הציבורי יש גם XML
וגם JSON. נשמר זמנית ה-**XML** של המימוש הקיים (לפני האיחוד) כ-fixture תאימות, ונשלח ל-endpoint
הבדיקה `/api/test`. כל שליחה אמיתית חסומה: guard_transport (רק MockTransport) + `_live_guard`.
החלפת הדגל = מסמך רשמי + חשבון בדיקה + שינוי קוד מכוון. גם InforU לא מאומת.
SMS בעברית = UCS-2 ⇒ 70 תווים להודעה בודדת, 67 לכל חלק בהודעה מרובת-חלקים.
"""
from __future__ import annotations

import json
import re

# B405: ראו parse() — DOCTYPE/ENTITY נדחים לפני הפרסור
import xml.etree.ElementTree as ET  # noqa: S405  # nosec B405
from typing import Any
from xml.sax.saxutils import escape  # nosec B406

import httpx

from ..config import SafetyError
from ..contact import normalize_il_phone
from .base import IntegrationError, ProviderError, SendResult, SmsMessage, basic_auth, jstr
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


CONTRACT_VERIFIED_019 = False
CONTRACT_VERIFIED_INFORU = False


def _live_guard(provider: str, verified: bool, transport) -> None:
    """חוזה לא מאומת ⇒ אין שליחה אמיתית בשום מצב (רק dry-run או MockTransport)."""
    if not verified and transport is not None and not isinstance(transport, httpx.MockTransport):
        raise SafetyError(f"{provider}: חוזה ה-API לא אומת — שליחה אמיתית חסומה")




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
    contract_verified = CONTRACT_VERIFIED_INFORU
    URL = "https://capi.inforu.co.il/api/v2/SMS/SendSms"

    def __init__(self, username: str, api_token: str, sender: str, *, dlr_url: str = "", **kw) -> None:
        _live_guard(self.provider, self.contract_verified, kw.get("transport"))
        # התיעוד (inforu.co.il «ממשקי API»): ה-DLR נשלח ב-POST לכתובת שבשדה DeliveryNotificationUrl
        # של בקשת השליחה. בלעדיה InforU לא שולח דוח מסירה בכלל.
        self.dlr_url = dlr_url
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
        if self.dlr_url:
            body["Data"]["Settings"]["DeliveryNotificationUrl"] = self.dlr_url
        if msg.idempotency_key:  # שדה-מזהה של הלקוח — לאמת את השם המדויק מול InforU
            body["Data"]["Settings"]["CustomerMessageId"] = msg.idempotency_key
        return httpx.Request("POST", self.URL, json=body, headers={
            "Authorization": basic_auth(self.username, self.token)})

    def parse(self, r: httpx.Response) -> str:
        b = r.json()
        if b.get("StatusId") != 1:
            # StatusId שלילי = שגיאת קלט/הרשאה — לא חוזרים
            raise ProviderError(self.provider, f"StatusId={jstr(b.get('StatusId')) or '?'} "
                                f"{jstr(b.get('StatusDescription'))}".strip())
        data = b.get("Data") or {}
        return str(data.get("MessageId") or data.get("RequestId") or b.get("RequestId") or "")


# ------------------------------------------------------------------ 019 (ראשי)
class Sms019(SmsAdapter):
    """019 SMS. XML מעל HTTPS, Bearer token (fixture תאימות — חוזה לא מאומת).
    הצלחה לפי התיעוד הציבורי: status == 0. `test_endpoint=True` ⇒ /api/test (לא שולח)."""

    provider = "019"
    contract_verified = CONTRACT_VERIFIED_019
    URL = "https://019sms.co.il/api"

    def __init__(self, username: str, api_token: str, sender: str, *, test_endpoint: bool = True,
                 **kw) -> None:
        _live_guard(self.provider, self.contract_verified, kw.get("transport"))
        super().__init__(**kw)
        if not username or not api_token:
            raise IntegrationError("019: חסרים SMS019_USERNAME/SMS019_TOKEN")
        self.url = self.URL + ("/test" if test_endpoint else "")
        self.username, self.token, self.sender = username, api_token, validate_sender(sender)

    def _secrets(self):
        return (self.token,)

    def build_request(self, msg: SmsMessage) -> httpx.Request:
        xml = ("<?xml version=\"1.0\" encoding=\"UTF-8\"?><sms>"
               f"<user><username>{escape(self.username)}</username></user>"
               f"<source>{escape(self.sender)}</source>"
               f"<destinations><phone>{il_mobile_local(msg.to)}</phone></destinations>"
               f"<message>{escape(msg.text)}</message></sms>")
        return httpx.Request("POST", self.url, content=xml.encode("utf-8"), headers={
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/xml; charset=utf-8"})

    def parse(self, r: httpx.Response) -> str:
        """סובלני: XML (<status>/<message>/<shipment_id>) או JSON — עד שהחוזה יאומת."""
        text = r.text.strip()
        if text.startswith("<"):
            # QA: תשובה מהספק = קלט חיצוני. בלי DOCTYPE/ENTITY (XXE, billion laughs) ועם תקרת גודל,
            # כך ש-ElementTree מפרסר רק XML פשוט — בלי תלות נוספת (defusedxml) בשלב 1
            if len(text) > 64_000 or re.search(r"<!(DOCTYPE|ENTITY)", text, re.I):
                raise ValueError("XML חשוד מהספק (DOCTYPE/ENTITY/גודל) — נדחה")
            try:
                root = ET.fromstring(text)  # noqa: S314  # nosec B314
            except ET.ParseError as e:
                raise ValueError(f"XML לא תקין: {e}") from e
            st, msg, sid = ((root.findtext(k) or "").strip()
                            for k in ("status", "message", "shipment_id"))
        else:
            b = json.loads(text)
            st, msg = str(b.get("status") if b.get("status") is not None else ""), str(b.get("message") or "")
            sid = str(b.get("shipment_id") or b.get("id") or "")
        if st != "0":
            raise ProviderError(self.provider, f"status={st} {msg}".strip())
        return sid


SMS_PROVIDERS = {"019": Sms019, "inforu": InforUSms}

# מצבי DLR של SMPP 3.4 (תקן; DELIVRD/EXPIRED/DELETED/UNDELIV/ACCEPTD/UNKNOWN/REJECTD/ENROUTE) +
# מילים נפוצות. שימוש 019 בתקן לא מאומת. UNKNOWN נשאר unknown ⇒ בלי פעולה.
_DLR_DELIVERED = {"delivered", "delivrd", "success"}
_DLR_FAILED = {"failed", "undeliv", "undelivered", "rejected", "rejectd", "expired", "blocked",
               "error", "deleted"}
_DLR_PENDING = {"pending", "sent", "enroute", "accepted", "acceptd"}


# טבלת «DLR statuses» של 019 (https://docs.019sms.co.il/sms/errors-and-status.html, נקרא 20.11.2026)
# ⇒ (מצב, קטגוריה). recipient = הבעיה אצל הנמען (מספר/מכשיר) · account = אצלנו/בחשבון הספק (יתרה,
# הרשאה, הודעה לא חוקית) — לא «מספר שגוי» · blocked = הנמען חסם · transient = זמני, בלי התראה.
DLR_019_CODES: dict[str, tuple[str, str | None]] = {
    "-1": ("unknown", None),          # נשלח - ללא אישור מסירה
    "0": ("delivered", None), "102": ("delivered", None),
    "2": ("unknown", None),           # Timeout
    **{c: ("failed", "recipient") for c in ("1", "3", "4", "5", "6")},     # נכשל / נכשל סלולר
    "7": ("failed", "account"),       # אין יתרה
    "14": ("failed", "recipient"),    # store&forward נכשל סלולר
    "15": ("failed", "recipient"),    # מספר כשר
    "16": ("failed", "account"),      # אין הרשאת שעת שליחה
    "17": ("failed", "blocked"),      # חסום להודעות פירסומיות
    "18": ("failed", "account"),      # הודעה לא חוקית
    **{str(c): ("failed", "recipient") for c in (101, 103, 104, 105, 106, 107, 108, *range(109, 133))},
    "201": ("failed", "blocked"),     # נחסם לפי בקשה
    "747": ("failed", "transient"),   # מנוי נמצא מחוץ לכיסוי רשת מקומית
    "998": ("failed", "account"),     # אין הרשאה
    "999": ("failed", "account"),     # שגיאה לא ידועה (אצל הספק)
}


def dlr_019_category(fields: dict[str, str]) -> str | None:
    return DLR_019_CODES.get(jstr(fields.get("status")).strip(), (None, None))[1]


def parse_019_dlr(fields: dict[str, str]) -> tuple[str, str]:
    """דוח מסירה של 019 ⇒ (מזהה ההודעה אצל הספק, delivered|failed|pending|unknown).

    שדות וקודים לפי התיעוד הציבורי של 019 (push-api + errors-and-status, 20.11.2026): shipment_id +
    status מספרי ⇒ DLR_019_CODES. עדיין לא נבדק מול חשבון (CONTRACT_VERIFIED_019=False). סובלני גם
    למילות סטטוס (SMPP). קוד שלא בטבלה ⇒ 'unknown' — **לא** פועלים עליו."""
    pid = (fields.get("shipment_id") or fields.get("msg_id") or fields.get("message_id")
           or fields.get("id") or "").strip()
    raw = (fields.get("status_text") or fields.get("dlr_status") or fields.get("status")
           or "").strip().lower()
    code = jstr(fields.get("status")).strip()
    if code in DLR_019_CODES:                       # הקוד המספרי המתועד גובר על מילים
        return pid, DLR_019_CODES[code][0]
    if raw in _DLR_DELIVERED:
        st = "delivered"
    elif raw in _DLR_FAILED:
        st = "failed"
    elif raw in _DLR_PENDING:
        st = "pending"
    else:
        st = "unknown"
    return pid, st


def parse_inforu_dlr(fields: dict[str, Any]) -> tuple[str, str, str]:
    """דוח מסירה של InforU (גיבוי) ⇒ (מזהה אצל InforU, המזהה שלנו מ-CustomerMessageId, מצב).

    ⚠️ חוזה לא מאומת: סובלני לשמות (MessageId/RequestId · CustomerMessageId) ולמילות סטטוס כמו 019.
    קוד מספרי ⇒ 'unknown' (בלי פעולה) עד שיהיה מסמך רשמי של InforU."""
    def pick(*names: str) -> str:
        for n in names:
            for k, v in fields.items():
                if k.lower() == n.lower() and v not in (None, ""):
                    return str(v).strip()
        return ""
    pid = pick("MessageId", "MessageID", "RequestId", "Id")
    ours = pick("CustomerMessageId", "CustomerMessageID", "CustomerParameter")
    raw = pick("StatusText", "StatusDescription", "Status", "DeliveryStatus").lower()
    if raw in _DLR_DELIVERED:
        st = "delivered"
    elif raw in _DLR_FAILED:
        st = "failed"
    elif raw in _DLR_PENDING:
        st = "pending"
    else:
        st = "unknown"
    return pid, ours, st

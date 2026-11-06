"""הגדרות. שלב 1: שליחה אמיתית חסומה בקוד — לא רק בקונפיג.

כל ניסיון להגדיר SEND_MODE שאינו dry_run, או GREENINVOICE_ENV=production,
נכשל כבר בטעינה. הסרת החסימה = החלטה מפורשת של מאיר + שינוי קוד מבוקר.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field

GREENINVOICE_URLS = {
    # לאמת מול התיעוד הרשמי לפני חיבור אמיתי (ראו docs/MVP-SPEC.md §6)
    "sandbox": "https://sandbox.d.greeninvoice.co.il/api/v1",
    "production": "https://api.greeninvoice.co.il/api/v1",
}

ALLOWED_SEND_MODES = {"dry_run"}
ALLOWED_GI_ENVS = {"sandbox"}


class SafetyError(RuntimeError):
    """הפרת מעקה-בטיחות של שלב 1."""


@dataclass(frozen=True)
class Settings:
    greeninvoice_env: str = "sandbox"
    greeninvoice_api_id: str = ""
    greeninvoice_api_secret: str = ""
    send_mode: str = "dry_run"
    db_path: str = "collect_agent.sqlite3"
    business_name: str = "העסק שלי"
    payment_link: str = ""
    timezone: str = "Asia/Jerusalem"
    holidays: tuple[str, ...] = field(default_factory=tuple)  # תאריכי ISO שבהם אין שליחה
    # ערוצים — אין וואטסאפ (מדיניות Meta אוסרת debt collection)
    channels: tuple[str, ...] = ("sms", "email")
    sms_provider: str = "019"             # 019 (ברירת מחדל) | inforu | twilio
    sms_sender_id: str = ""               # שם שולח אלפאנומרי, עד 11 תווים לטיניים/ספרות
    sms_username: str = ""
    sms_token: str = ""
    email_from: str = "no-reply@example.com"
    email_reply_to: str = ""
    public_base_url: str = "https://gabi.example"   # לקישורי הסרה
    sms_webhook_key: str = ""   # סוד ב-URL של ה-webhook (?k=...) — חסר ⇒ ה-webhook סגור
    payment_link_mode: str = "greeninvoice_form"    # greeninvoice_form | static
    payment_domains: tuple[str, ...] = ("greeninvoice.co.il", "morning.co")

    def __post_init__(self) -> None:
        if self.send_mode not in ALLOWED_SEND_MODES:
            raise SafetyError(
                f"SEND_MODE={self.send_mode!r} אסור בשלב 1 — רק dry_run. "
                "שליחה אמיתית דורשת אישור מפורש של מאיר."
            )
        if self.greeninvoice_env not in ALLOWED_GI_ENVS:
            raise SafetyError(
                f"GREENINVOICE_ENV={self.greeninvoice_env!r} אסור בשלב 1 — רק sandbox."
            )
        bad = set(self.channels) - {"sms", "email"}
        if bad:
            raise SafetyError(f"ערוץ לא נתמך: {sorted(bad)} (וואטסאפ הוסר בהחלטת מוצר)")
        if self.sms_provider not in {"inforu", "019", "twilio"}:
            raise ValueError(f"SMS_PROVIDER לא מוכר: {self.sms_provider}")
        import re as _re
        if self.sms_sender_id and not _re.fullmatch(r"[A-Za-z0-9]{1,11}", self.sms_sender_id):
            raise ValueError("SMS_SENDER_ID: עד 11 אותיות לטיניות/ספרות")
        if self.payment_link_mode not in {"greeninvoice_form", "static"}:
            raise ValueError(f"PAYMENT_LINK_MODE לא מוכר: {self.payment_link_mode}")

    @property
    def greeninvoice_base_url(self) -> str:
        return GREENINVOICE_URLS[self.greeninvoice_env]

    @property
    def dry_run(self) -> bool:
        return True  # אינווריאנט שלב 1


def load_settings(env: dict[str, str] | None = None) -> Settings:
    e = os.environ if env is None else env
    hol = tuple(x.strip() for x in e.get("HOLIDAYS", "").split(",") if x.strip())
    return Settings(
        greeninvoice_env=e.get("GREENINVOICE_ENV", "sandbox"),
        greeninvoice_api_id=e.get("GREENINVOICE_API_ID", ""),
        greeninvoice_api_secret=e.get("GREENINVOICE_API_SECRET", ""),
        send_mode=e.get("SEND_MODE", "dry_run"),
        db_path=e.get("DB_PATH", "collect_agent.sqlite3"),
        business_name=e.get("BUSINESS_NAME", "העסק שלי"),
        payment_link=e.get("PAYMENT_LINK", ""),
        holidays=hol,
        channels=_csv(e.get("CHANNELS", "sms,email")),
        sms_provider=e.get("SMS_PROVIDER", "019"),
        sms_sender_id=e.get("SMS_SENDER_ID", ""),
        sms_username=e.get("SMS_USERNAME", ""),
        sms_token=e.get("SMS_TOKEN", ""),
        sms_webhook_key=e.get("SMS_WEBHOOK_KEY", ""),
        email_from=e.get("EMAIL_FROM", "no-reply@example.com"),
        email_reply_to=e.get("EMAIL_REPLY_TO", ""),
        public_base_url=e.get("PUBLIC_BASE_URL", "https://gabi.example").rstrip("/"),
        payment_link_mode=e.get("PAYMENT_LINK_MODE", "greeninvoice_form"),
        payment_domains=_csv(e.get("PAYMENT_DOMAINS", "greeninvoice.co.il,morning.co")),
    )


def _csv(v: str) -> tuple[str, ...]:
    return tuple(x.strip().lower() for x in v.split(",") if x.strip())

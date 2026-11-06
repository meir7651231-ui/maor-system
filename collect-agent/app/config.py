"""הגדרות. שלב 1: שליחה אמיתית חסומה בקוד — לא רק בקונפיג.

כל ניסיון להגדיר SEND_MODE שאינו dry_run, או GREENINVOICE_ENV=production,
נכשל כבר בטעינה. הסרת החסימה = החלטה מפורשת של מאיר + שינוי קוד מבוקר.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field

from .security import safe_https_url

GREENINVOICE_URLS = {
    # לאמת מול התיעוד הרשמי לפני חיבור אמיתי (ראו docs/MVP-SPEC.md §6)
    "sandbox": "https://sandbox.d.greeninvoice.co.il/api/v1",
    "production": "https://api.greeninvoice.co.il/api/v1",
}

ALLOWED_SEND_MODES = {"dry_run"}

# ספקי עמוד תשלום (של העסק עצמו). הדומיינים האמיתיים — לאמת מול כל ספק לפני שלב 2.
PAYMENT_PROVIDERS: dict[str, dict] = {
    "greeninvoice": {"label": "חשבונית ירוקה (morning)", "mock": "https://greeninvoice.example/pay/demo",
                     "domains": ("greeninvoice.co.il", "morning.co", "greeninvoice.example")},
    "meshulam": {"label": "משולם", "mock": "https://meshulam.example/pay/demo",
                 "domains": ("meshulam.co.il", "meshulam.example")},
    "bit": {"label": "ביט לעסקים", "mock": "https://bit.example/pay/demo",
            "domains": ("bitpay.co.il", "bit.example")},
}
ALLOWED_GI_ENVS = {"sandbox", "mock"}   # mock = app/gi_mock.py על 127.0.0.1 בלבד


class SafetyError(RuntimeError):
    """הפרת מעקה-בטיחות של שלב 1."""


@dataclass(frozen=True)
class Settings:
    greeninvoice_env: str = "sandbox"
    greeninvoice_api_id: str = ""
    greeninvoice_api_secret: str = field(default="", repr=False)  # לא לדלוף ל-repr/לוג
    greeninvoice_mock_url: str = ""   # רק כש-GREENINVOICE_ENV=mock (app/gi_mock.py)
    gi_webhook_key: str = field(default="", repr=False)   # סוד ב-/webhooks/greeninvoice?k=... ; חסר ⇒ סגור
    send_mode: str = "dry_run"
    db_path: str = "collect_agent.sqlite3"
    business_name: str = "העסק שלי"
    payment_link: str = ""
    timezone: str = "Asia/Jerusalem"
    holidays: tuple[str, ...] = field(default_factory=tuple)  # תאריכי ISO שבהם אין שליחה
    # אימות: טוקן בעל העסק ל-API, וסוד חתימה ל-/inbound (ראו app/security.py)
    owner_api_token: str = field(default="", repr=False)
    inbound_webhook_secret: str = field(default="", repr=False)
    # ערוצים — אין וואטסאפ (מדיניות Meta אוסרת debt collection)
    channels: tuple[str, ...] = ("sms", "email")
    sms_provider: str = "019"             # ראשי: 019 (ברירת מחדל) | inforu. השני = גיבוי אוטומטי
    sms_sender_id: str = ""               # שם שולח אלפאנומרי, עד 11 תווים לטיניים/ספרות
    sms_username: str = ""
    sms_token: str = field(default="", repr=False)
    sms_backup_username: str = ""          # פרטי ספק הגיבוי (InforU כשהראשי 019, ולהפך)
    sms_backup_token: str = field(default="", repr=False)
    email_from: str = "no-reply@example.com"
    email_reply_to: str = ""
    public_base_url: str = "https://gabi.example"   # לקישורי הסרה
    trial_start: str = ""        # ISO; ריק ⇒ אין מגבלת ניסיון (מנוי פעיל / הדגמה)
    trial_days: int = 14
    price_ils_month: int = 119    # הכרעת מאיר 6.11: ₪119/חודש או ₪1,190/שנה, כולל מע״מ ככל שחל
    price_ils_year: int = 1190
    sms_two_way: bool = False   # True רק כשיש מספר וירטואלי שמקבל תשובות (אחרת: "להפסקה: בקישור")
    sms_webhook_key: str = field(default="", repr=False)     # סוד ב-URL של ה-webhook (?k=...) — חסר ⇒ ה-webhook סגור
    email_webhook_key: str = field(default="", repr=False)   # סוד ל-/webhooks/email?k=... — חסר ⇒ סגור
    # תשלום = קישור לעמוד התשלום של העסק אצל הספק שלו (הכרעת מאיר 6.11). אנחנו לא מחזיקים כסף,
    # ולא יוצרים מסמכים/דפי תשלום בחשבונית ירוקה (ממצא מבקר 2.0.5). בשלב 1 — קישור מוק.
    payment_link_mode: str = "static"
    payment_provider: str = "greeninvoice"          # greeninvoice | meshulam | bit
    payment_domains: tuple[str, ...] = ()           # ריק ⇒ ברירת המחדל של הספק (PAYMENT_PROVIDERS)

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
        if self.greeninvoice_env == "mock":
            from .greeninvoice import is_loopback_url
            if not is_loopback_url(self.greeninvoice_mock_url):
                raise SafetyError("GREENINVOICE_MOCK_URL חייב להיות http://127.0.0.1/localhost")
        if self.payment_link and safe_https_url(self.payment_link) is None:
            # קישור תשלום נשתל בכל הודעה ⇒ https בלבד, בלי user:pass@ ובלי תווי בקרה
            raise SafetyError("PAYMENT_LINK חייב להיות כתובת https תקינה")
        bad = set(self.channels) - {"sms", "email"}
        if bad:
            raise SafetyError(f"ערוץ לא נתמך: {sorted(bad)} (וואטסאפ הוסר בהחלטת מוצר)")
        if self.sms_provider not in {"inforu", "019"}:  # Twilio יצא (לא נדרש ל-MVP)
            raise ValueError(f"SMS_PROVIDER לא מוכר: {self.sms_provider}")
        import re as _re
        if self.sms_sender_id and not _re.fullmatch(r"[A-Za-z0-9]{1,11}", self.sms_sender_id):
            raise ValueError("SMS_SENDER_ID: עד 11 אותיות לטיניות/ספרות")
        if self.payment_link_mode == "greeninvoice_form":
            raise SafetyError("PAYMENT_LINK_MODE=greeninvoice_form אסור: יוצר דף תשלום שמנפיק קבלה "
                              "בשם העסק. גבי לא יוצר קבלות ולא כותב לחשבונית ירוקה — רק "
                              "PAYMENT_LINK לעמוד של העסק (הכרעת מאיר 6.11, review חור 3)")
        if self.payment_link_mode != "static":
            raise ValueError(f"PAYMENT_LINK_MODE לא מוכר: {self.payment_link_mode}")
        if self.payment_provider not in PAYMENT_PROVIDERS:
            raise ValueError(f"PAYMENT_PROVIDER לא מוכר: {self.payment_provider}")

    @property
    def payment_page(self) -> str:
        """הקישור לעמוד התשלום של העסק; בלי הגדרה ⇒ עמוד מוק של הספק (example, לא קיים)."""
        return self.payment_link or PAYMENT_PROVIDERS[self.payment_provider]["mock"]

    @property
    def allowed_payment_domains(self) -> tuple[str, ...]:
        return self.payment_domains or PAYMENT_PROVIDERS[self.payment_provider]["domains"]

    @property
    def greeninvoice_base_url(self) -> str:
        if self.greeninvoice_env == "mock":
            return self.greeninvoice_mock_url.rstrip("/")
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
        greeninvoice_mock_url=e.get("GREENINVOICE_MOCK_URL", ""),
        gi_webhook_key=e.get("GI_WEBHOOK_KEY", ""),
        send_mode=e.get("SEND_MODE", "dry_run"),
        db_path=e.get("DB_PATH", "collect_agent.sqlite3"),
        business_name=e.get("BUSINESS_NAME", "העסק שלי"),
        payment_link=e.get("PAYMENT_LINK", ""),
        holidays=hol,
        owner_api_token=e.get("OWNER_API_TOKEN", ""),
        inbound_webhook_secret=e.get("INBOUND_WEBHOOK_SECRET", ""),
        channels=_csv(e.get("CHANNELS", "sms,email")),
        sms_provider=e.get("SMS_PROVIDER", "019"),
        sms_sender_id=e.get("SMS_SENDER_ID", ""),
        sms_username=e.get("SMS_USERNAME", ""),
        sms_token=e.get("SMS_TOKEN", ""),
        sms_backup_username=e.get("SMS_BACKUP_USERNAME", ""),
        sms_backup_token=e.get("SMS_BACKUP_TOKEN", ""),
        sms_webhook_key=e.get("SMS_WEBHOOK_KEY", ""),
        email_webhook_key=e.get("EMAIL_WEBHOOK_KEY", ""),
        trial_start=e.get("TRIAL_START", ""),
        trial_days=int(e.get("TRIAL_DAYS", "14")),
        sms_two_way=e.get("SMS_TWO_WAY", "0").strip().lower() in ("1", "true", "yes"),
        email_from=e.get("EMAIL_FROM", "no-reply@example.com"),
        email_reply_to=e.get("EMAIL_REPLY_TO", ""),
        public_base_url=e.get("PUBLIC_BASE_URL", "https://gabi.example").rstrip("/"),
        payment_link_mode=e.get("PAYMENT_LINK_MODE", "static"),
        payment_provider=e.get("PAYMENT_PROVIDER", "greeninvoice"),
        payment_domains=_csv(e.get("PAYMENT_DOMAINS", "")),
    )


def _csv(v: str) -> tuple[str, ...]:
    return tuple(x.strip().lower() for x in v.split(",") if x.strip())

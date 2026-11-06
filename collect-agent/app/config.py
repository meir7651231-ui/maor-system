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
    )

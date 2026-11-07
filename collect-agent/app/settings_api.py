"""הגדרות עסק דרך API מאומת (טוקן בעלים) — בתיאום עם העיצוב (web/ מסך הגדרות).

עקרונות:
  • **סודות לא עוברים כאן לעולם** — לא בקריאה ולא בכתיבה. התשובה מחזירה רק *האם* הוגדר
    (`"set"`/`"missing"`). ניסיון לשלוח שדה שנראה כסוד ⇒ 422 עם הסבר (נשמרים בסביבה/בכספת בלבד).
  • רשימת שדות סגורה (extra=forbid). כל ערך עובר את אותה ולידציה של `Settings.__post_init__`
    (dataclasses.replace) + בדיקות כאן (שם עסק עובר את מסנן הניסוח, כי הוא פותח כל SMS).
  • כללי שליחה (שעות, 3 תזכורות, אישור פרטני) ותמחור הם **קריאה בלבד** — הכרעת מאיר.
  • כל שינוי נרשם ב-audit (אילו שדות, לא ערכים של פרטי קשר).
"""
from __future__ import annotations

import dataclasses
import json
import re
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from . import compliance, paylinks
from .config import PAYMENT_PROVIDERS, Settings
from .integrations.sources import SOURCE_SYSTEMS, public_systems
from .policy import MAX_REMINDERS_PER_INVOICE, MIN_GAP, WINDOWS

SECRET_HINT = re.compile(r"(token|secret|password|passwd|api_?key|key$|auth)", re.I)
EDITABLE = ("business_name", "sms_sender_id", "payment_provider", "payment_link",
            "email_reply_to", "extra_holidays", "sms_two_way", "owner_name", "vat_id",
            "source_system")
PROFILE = ("owner_name", "vat_id")        # נשמרים ב-business_settings, לא ב-Settings


class SettingsIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    business_name: str | None = Field(None, min_length=2, max_length=40)
    sms_sender_id: str | None = Field(None, pattern=r"^[A-Za-z0-9]{1,11}$")
    payment_provider: Literal["greeninvoice", "meshulam", "bit"] | None = None
    payment_link: str | None = Field(None, max_length=300)
    email_reply_to: str | None = Field(None, max_length=120)
    extra_holidays: list[str] | None = Field(None, max_length=60)
    sms_two_way: bool | None = None
    # מקור החשבוניות (בחירה בלבד — הסודות לא עוברים כאן). DESIGN.md §3ב: source.system
    source_system: Literal["greeninvoice", "icount", "rivhit", "ezcount", "csv"] | None = None
    # פרופיל העסק (לא סודות; לחשבונית/לעמוד ההסרה) — חוזה העיצוב DESIGN.md §3ב
    owner_name: str | None = Field(None, min_length=2, max_length=60)
    vat_id: str | None = Field(None, pattern=r"^\d{9}$")

    @field_validator("vat_id")
    @classmethod
    def _vat(cls, v: str | None) -> str | None:
        if v is None:
            return v
        tot = sum(sum(divmod(int(c) * (1 if i % 2 == 0 else 2), 10)) for i, c in enumerate(v))
        if tot % 10:
            raise ValueError("מספר עוסק/ח.פ. לא תקין (ספרת ביקורת)")
        return v

    @field_validator("owner_name")
    @classmethod
    def _owner(cls, v: str | None) -> str | None:
        if v is not None and re.search(r"[<>{}\\]|https?://", v):
            raise ValueError("שם לא תקין")
        return v

    @field_validator("business_name")
    @classmethod
    def _name(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = " ".join(v.split())
        if re.search(r"[<>{}\\]|https?://", v):
            raise ValueError("שם העסק לא יכול לכלול קישור או תווים מיוחדים")
        # שם העסק פותח כל SMS ⇒ חייב לעבור את מסנן הניסוח (ר-1)
        bad = compliance.violations(f"{v}: שלום", compliance.Rules(business=v))
        # critic 3.6.5: השם המדויק פטור ממסנן המותגים בהודעות — לכן צירוף בנק/רשות נחסם כאן
        bad += compliance.business_name_violations(v)
        if bad:
            raise ValueError(f"שם העסק נחסם במסנן הניסוח: {', '.join(bad)}")
        return v

    @field_validator("sms_sender_id")
    @classmethod
    def _sender(cls, v: str | None) -> str | None:
        # critic 3.6.5: שם שולח "BankLeumi"/"PayBox" = התחזות לבנק/אפליקציית תשלום
        if v and compliance.sender_id_violations(v):
            raise ValueError("שם השולח לא יכול לכלול שם של בנק, אפליקציית תשלום או רשות")
        return v

    @field_validator("email_reply_to")
    @classmethod
    def _email(cls, v: str | None) -> str | None:
        if v and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", v):
            raise ValueError("כתובת מייל לא תקינה")
        return v

    @field_validator("extra_holidays")
    @classmethod
    def _dates(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        out = []
        for d in v:
            try:
                out.append(date.fromisoformat(d).isoformat())
            except ValueError:
                raise ValueError(f"תאריך לא תקין: {d}") from None
        return sorted(set(out))


def reject_secret_fields(raw: dict) -> list[str]:
    return [k for k in raw if SECRET_HINT.search(k)]


def public_view(s: Settings) -> dict:
    """מה שהממשק רואה. אין כאן אף ערך סודי — רק סטטוס."""
    def st(v: str) -> str:
        return "set" if v else "missing"

    return {
        "business": {"name": s.business_name, "sms_sender_id": s.sms_sender_id,
                     "email_reply_to": s.email_reply_to, "extra_holidays": list(s.holidays)},
        "payment": {"provider": s.payment_provider,
                    "provider_label": PAYMENT_PROVIDERS[s.payment_provider]["label"],
                    "link": s.payment_page, "is_mock": not s.payment_link,
                    "allowed_domains": list(s.allowed_payment_domains),
                    "providers": {k: v["label"] for k, v in PAYMENT_PROVIDERS.items()},
                    "we_hold_money": False},
        "channels": {"enabled": list(s.channels), "sms_provider": s.sms_provider,
                     "sms_backup_provider": "inforu" if s.sms_provider == "019" else "019",
                     "sms_two_way": s.sms_two_way,
                     "whatsapp": False},
        "sending_rules": {   # הכרעת מאיר — קריאה בלבד
            "hours": {"sun_thu": f"{WINDOWS[6][0]:%H:%M}–{WINDOWS[6][1]:%H:%M}",
                      "fri_and_holiday_eve": f"{WINDOWS[4][0]:%H:%M}–{WINDOWS[4][1]:%H:%M}",
                      "shabbat_and_holidays": "אין שליחה"},
            "max_reminders_per_invoice": MAX_REMINDERS_PER_INVOICE,
            "min_gap_hours": int(MIN_GAP.total_seconds() // 3600),
            "approval": "every_message", "editable": False},
        "pricing": {"month_ils": s.price_ils_month, "year_ils": s.price_ils_year,
                    "vat_included": True, "trial_days": s.trial_days, "card_required": False,
                    "editable": False},
        "secrets": {"greeninvoice_api": st(s.greeninvoice_api_id and s.greeninvoice_api_secret),
                    "sms_token": st(s.sms_token), "sms_backup_token": st(s.sms_backup_token),
                    "sms_webhook_key": st(s.sms_webhook_key),
                    "email_webhook_key": st(s.email_webhook_key),
                    "note": "סודות מוגדרים בסביבה/בכספת בלבד — לא דרך ה-API"},
        "mode": {"dry_run": s.dry_run, "greeninvoice_env": s.greeninvoice_env},
        "source": {"system": s.source_system, "label": SOURCE_SYSTEMS[s.source_system].label,
                   "systems": public_systems()},
    }


def apply(s: Settings, data: SettingsIn) -> tuple[Settings, list[str]]:
    patch = {k: v for k, v in data.model_dump(exclude_none=True).items() if k not in PROFILE}
    changes: dict = {}
    if "extra_holidays" in patch:
        changes["holidays"] = tuple(patch.pop("extra_holidays"))
    if "payment_link" in patch:
        link = patch.pop("payment_link").strip()
        provider = patch.get("payment_provider", s.payment_provider)
        allowed = s.payment_domains or PAYMENT_PROVIDERS[provider]["domains"]
        if link and not paylinks.domain_allowed(link, allowed):
            raise ValueError(f"קישור התשלום חייב להיות https בדומיין של {provider}: "
                             f"{', '.join(allowed)}")
        changes["payment_link"] = link
    changes.update(patch)
    new = dataclasses.replace(s, **changes)      # אותה ולידציה כמו בטעינה
    return new, sorted(changes)


def load_overrides(db) -> dict:
    rows = db.q("SELECT key, value FROM business_settings")
    return {r["key"]: json.loads(r["value"]) for r in rows}


def save_overrides(db, s: Settings, keys: list[str], now_iso: str) -> None:
    for k in keys:
        v = getattr(s, k)
        db.x("INSERT INTO business_settings(key,value,updated_at) VALUES(?,?,?) "
             "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
             (k, json.dumps(list(v) if isinstance(v, tuple) else v, ensure_ascii=False), now_iso))


def overlay(s: Settings, overrides: dict) -> Settings:
    ok = {k: (tuple(v) if k == "holidays" else v) for k, v in overrides.items()
          if k in {"business_name", "sms_sender_id", "payment_provider", "payment_link",
                   "email_reply_to", "holidays", "sms_two_way", "source_system"}
          and not (k == "source_system" and v not in SOURCE_SYSTEMS)}
    return dataclasses.replace(s, **ok) if ok else s


def profile(db) -> dict:
    ov = load_overrides(db)
    return {k: ov.get(k, "") for k in PROFILE}


def save_profile(db, data: SettingsIn, now_iso: str) -> list[str]:
    keys = []
    for k in PROFILE:
        v = getattr(data, k)
        if v is not None:
            db.x("INSERT INTO business_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) "
                 "DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
                 (k, json.dumps(v, ensure_ascii=False), now_iso))
            keys.append(k)
    return keys


# ---------- חוזה העיצוב (DESIGN.md §3ב): GET/PUT /settings ----------
def source_secrets_status(s: Settings, system: str, stored: frozenset[str] = frozenset()) -> dict:
    """רק set/missing לכל סוד שהמקור צריך — לעולם לא ערך. חשבונית ירוקה: גם מהסביבה (כמו היום)."""
    env = {"gi_api_id": s.greeninvoice_api_id, "gi_api_secret": s.greeninvoice_api_secret}
    return {f: "set" if (f in stored or env.get(f)) else "missing"
            for f in SOURCE_SYSTEMS[system].secret_fields}


def design_view(s: Settings, db, *, api_connected: bool, has_csv: bool,
                stored_secrets: frozenset[str] = frozenset()) -> dict:
    p = profile(db)
    sysdef = SOURCE_SYSTEMS[s.source_system]
    return {
        "business_name": s.business_name, "owner_name": p["owner_name"], "vat_id": p["vat_id"],
        "reply_email": s.email_reply_to,
        "sms": {"primary": s.sms_provider, "backup": "inforu" if s.sms_provider == "019" else "019",
                "sender": s.sms_sender_id},
        "pay": {"provider": s.payment_provider, "page_url": s.payment_page,
                "is_mock": not s.payment_link},
        "source": {"type": "csv" if sysdef.kind == "csv" else
                   ("api" if api_connected or not has_csv else "csv"),
                   "api_connected": api_connected,
                   "system": s.source_system, "system_label": sysdef.label,
                   "docs_verified": sysdef.docs_verified, "webhook": sysdef.webhook,
                   "secrets": source_secrets_status(s, s.source_system, stored_secrets),
                   # שלב 1: POST /settings/source/key ⇒ 501. מפתח לא נקלט ולא נשמר.
                   "key_intake": "not_available_stage1",
                   "systems": public_systems()},
        "cadence_days": [1, 7, 14],
        "rules": {"max_reminders": MAX_REMINDERS_PER_INVOICE, "window": "08:00-20:00",
                  "friday_and_holiday_eve": "08:00-12:00", "approval": "every_message"},
        "pricing": {"month_ils": s.price_ils_month, "year_ils": s.price_ils_year,
                    "trial_days": s.trial_days, "card_required": False},
    }


READ_ONLY_DESIGN_KEYS = {"cadence_days", "rules", "pricing"}


def from_design(body: dict) -> dict:
    """גוף חלקי בצורת העיצוב ⇒ שדות SettingsIn. מפתח לא מוכר/קריאה-בלבד ⇒ ValueError."""
    if not isinstance(body, dict):
        raise ValueError("גוף הבקשה חייב להיות אובייקט JSON")
    ro = READ_ONLY_DESIGN_KEYS & set(body)
    if ro:
        raise ValueError(f"שדות קבועים (הכרעת מאיר), לא ניתנים לשינוי: {', '.join(sorted(ro))}")
    out: dict = {}
    for k in ("business_name", "owner_name", "vat_id"):
        if k in body:
            out[k] = body[k]
    if "reply_email" in body:
        out["email_reply_to"] = body["reply_email"]
    sms = body.get("sms") or {}
    if not isinstance(sms, dict) or set(sms) - {"sender", "primary", "backup"}:
        raise ValueError("sms: רק sender ניתן לשינוי")
    if sms.get("primary", "019") != "019" or sms.get("backup", "inforu") != "inforu":
        raise ValueError("ספק SMS קבוע: 019 ראשי, InforU גיבוי (הכרעת מאיר)")
    if "sender" in sms:
        out["sms_sender_id"] = sms["sender"]
    pay = body.get("pay") or {}
    if not isinstance(pay, dict) or set(pay) - {"provider", "page_url"}:
        raise ValueError("pay: provider/page_url בלבד")
    if "provider" in pay:
        out["payment_provider"] = pay["provider"]
    if "page_url" in pay:
        out["payment_link"] = pay["page_url"]
    if "source" in body:
        src = body["source"]
        # רק הבחירה ניתנת לשינוי. type/api_connected/secrets — מחושבים בשרת; מפתחות — לא דרך כאן.
        if not isinstance(src, dict) or set(src) != {"system"}:
            raise ValueError("source: רק system ניתן לשינוי (סודות — לא דרך ה-API)")
        out["source_system"] = src["system"]
    unknown = set(body) - {"business_name", "owner_name", "vat_id", "reply_email", "sms", "pay",
                           "source"}
    if unknown:
        raise ValueError(f"שדות לא מוכרים: {', '.join(sorted(unknown))}")
    return out

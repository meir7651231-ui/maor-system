"""ממשק «מקור חשבוניות» — מה ש-CollectService צריך מכל מערכת חשבוניות. קריאה בלבד.

החוזה (שלושה דברים, לא יותר):
  • `iter_open_invoices()`  — כל החשבוניות הפתוחות (יתרה > 0) כ-`Invoice` אחיד: מספר מסמך, סכום
                               פתוח באגורות, מועד תשלום, לקוח עם טלפון/מייל.
  • `get_document(ext_id)`  — רענון מסמך יחיד לפני שליחה (ר-4). `KeyError` ⇒ המסמך לא קיים;
                               `status != 0` או סכום 0 ⇒ נסגר/שולם. כל חריגה אחרת ⇒ השירות חוסם שליחה
                               (refresh_failed) — אף פעם לא «מניח שעדיין פתוח».
  • `provider`              — מזהה המערכת. ה-external_id של כל ספק שאינו חשבונית ירוקה מקבל קידומת
                               (`icount:`, `rivhit:`, `ezcount:`), כך שמעבר ספק לא מתנגש ולא סוגר
                               חשבוניות של ספק אחר (`provider_of`).
webhook — אופציונלי: מערכת שתומכת ב-webhook רק *מעירה* סנכרון; התוכן לא נחשב אמת.

מימושים: `GreenInvoiceClient` (קיים, בלי שינוי התנהגות) · `ICountClient` · `RivhitClient` ·
`EZcountClient`. CSV הוא מקור בלי API (ייבוא קובץ, `app/csv_import.py`).

**אף adapter לא יוצר/משנה/מבטל מסמך.** אין כאן נקודת כתיבה; נאכף בבדיקות (`tests/test_invoice_sources.py`).
שלב 1: בלי `httpx.MockTransport` אין שום קריאת רשת (`guard_transport` ⇒ SafetyError).
"""
from __future__ import annotations

from collections.abc import Callable, Iterator
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Protocol, runtime_checkable

import httpx

from ..greeninvoice import DEFAULT_TERMS_DAYS, GreenInvoiceClient, Invoice


@runtime_checkable
class InvoiceSource(Protocol):
    provider: str

    def iter_open_invoices(self) -> Iterator[Invoice]: ...

    def get_document(self, external_id: str) -> Invoice: ...


class GreenInvoiceSource:
    """עטיפה דקה ל-GreenInvoiceClient (גודל עמוד קבוע). GreenInvoiceClient עצמו כבר מממש את הממשק."""

    provider = "greeninvoice"

    def __init__(self, client: GreenInvoiceClient, page_size: int = 50) -> None:
        self.client, self.page_size = client, page_size

    def iter_open_invoices(self) -> Iterator[Invoice]:
        yield from self.client.iter_open_invoices(page_size=self.page_size)

    def get_document(self, external_id: str) -> Invoice:
        return self.client.get_document(external_id)


# ------------------------------------------------------------------ רישום מערכות
@dataclass(frozen=True)
class SourceSystem:
    key: str
    label: str                       # לתצוגה (עברית)
    kind: str                        # api | csv
    secret_fields: tuple[str, ...]   # שמות ב-business_secrets.FIELDS (לעולם לא ערכים)
    webhook: str                     # trigger (מעיר סנכרון) | none
    docs: tuple[str, ...]            # התיעוד הציבורי שעליו נבנה ה-adapter
    docs_verified: str               # partial = לפי תיעוד, לא נבדק מול חשבון · read_api_undocumented
    id_prefix: str = ""


SOURCE_SYSTEMS: dict[str, SourceSystem] = {
    "greeninvoice": SourceSystem(
        "greeninvoice", "חשבונית ירוקה (morning)", "api", ("gi_api_id", "gi_api_secret"), "trigger",
        ("https://www.greeninvoice.co.il/api-docs",), "partial"),
    "icount": SourceSystem(
        "icount", "iCount", "api", ("icount_api_token",), "trigger",
        ("https://apiv3.icount.co.il/",), "partial", "icount:"),
    "rivhit": SourceSystem(
        "rivhit", "רווחית", "api", ("rivhit_api_token",), "none",
        ("https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/help",), "partial", "rivhit:"),
    "ezcount": SourceSystem(
        "ezcount", "EZcount", "api", ("ezcount_api_key",), "none",
        ("https://documenter.getpostman.com/view/16363118/TzkyNLWB",), "read_api_undocumented",
        "ezcount:"),
    "csv": SourceSystem("csv", "קובץ CSV", "csv", (), "none", (), "n/a", "csv:"),
}
SOURCE_KEYS = tuple(SOURCE_SYSTEMS)
API_SOURCES = tuple(k for k, v in SOURCE_SYSTEMS.items() if v.kind == "api")


def provider_of(external_id: str) -> str:
    """לאיזה מקור שייכת חשבונית לפי ה-external_id. בלי קידומת מוכרת ⇒ חשבונית ירוקה (היסטורי)."""
    for k, v in SOURCE_SYSTEMS.items():
        if v.id_prefix and external_id.startswith(v.id_prefix):
            return k
    return "greeninvoice"


def source_provider(src: object) -> str:
    return str(getattr(src, "provider", "greeninvoice"))


def public_systems() -> list[dict]:
    """לממשק: אילו מערכות אפשר לבחור, ומה ידוע על התיעוד שלהן. בלי סודות."""
    return [{"key": s.key, "label": s.label, "kind": s.kind, "webhook": s.webhook,
             "docs_verified": s.docs_verified, "needs": list(s.secret_fields)}
            for s in SOURCE_SYSTEMS.values()]


# ------------------------------------------------------------------ עזרים משותפים לכל ה-adapters
def due_or_estimate(due: date | None, issued: date | None) -> tuple[date | None, bool]:
    """כמו map_document של חשבונית ירוקה (ממצא מבקר 2.9): בלי מועד תשלום ⇒ הנפקה + 30 (שמרני)."""
    if due is None and issued is not None:
        return issued + timedelta(days=DEFAULT_TERMS_DAYS), True
    return due, False


def parse_il_date(v: object) -> date | None:
    """ISO (2026-10-20…) או DD/MM/YYYY (רווחית/EZcount). כל דבר אחר ⇒ None."""
    if not v:
        return None
    s = str(v).strip()
    try:
        if len(s) >= 10 and s[4] == "-":
            return date.fromisoformat(s[:10])
        if len(s) >= 10 and s[2] == "/" and s[5] == "/":
            return date(int(s[6:10]), int(s[3:5]), int(s[0:2]))
    except ValueError:
        return None
    return None


def build_source(system: str, secret: Callable[[str], str | None], *,
                 transport: httpx.BaseTransport | None = None) -> InvoiceSource | None:
    """בונה adapter מסודות העסק (business_secrets). חסר סוד ⇒ None (לא מחובר).
    שלב 1: transport חייב להיות MockTransport או None (ואז כל קריאה ⇒ SafetyError)."""
    from .ezcount import EZcountClient
    from .icount import ICountClient
    from .rivhit import RivhitClient

    def need(*names: str) -> list[str] | None:
        vals = [secret(n) or "" for n in names]
        return vals if all(vals) else None

    if system == "icount":
        v = need("icount_api_token")
        return ICountClient(api_token=v[0], transport=transport) if v else None
    if system == "rivhit":
        v = need("rivhit_api_token")
        return RivhitClient(api_token=v[0], transport=transport) if v else None
    if system == "ezcount":
        v = need("ezcount_api_key")
        dev = secret("ezcount_developer_email") or ""
        return EZcountClient(api_key=v[0], developer_email=dev, transport=transport) \
            if v and dev else None
    return None

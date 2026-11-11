"""ממשק «מקור חשבוניות» — מה ש-CollectService צריך מכל מערכת חשבוניות. קריאה בלבד.

החוזה (שלושה דברים, לא יותר):
  • `iter_open_invoices()`  — כל החשבוניות הפתוחות (יתרה > 0) כ-`Invoice` אחיד: מספר מסמך, סכום
                               פתוח באגורות, מועד תשלום, לקוח עם טלפון/מייל.
  • `get_document(ext_id)`  — רענון מסמך יחיד לפני שליחה (ר-4). `KeyError` ⇒ המסמך לא קיים;
                               `status != 0` או סכום 0 ⇒ נסגר/שולם. כל חריגה אחרת ⇒ השירות חוסם שליחה
                               (refresh_failed) — אף פעם לא «מניח שעדיין פתוח».
  • `credits_for(ext_id, since=None, doc=None)` — סך הזיכויים שמשויכים **רק** למסמך הזה, ברגע
                               שלפני שליחה (critic סבב 20: זיכוי שהונפק אחרי הסנכרון). זיכוי שנוגע
                               במסמך יחד עם אחרים, או זיכוי בלי קישור של אותו לקוח ⇒ `CreditAmbiguous`
                               (השירות משהה לבדיקת בעל העסק — לא מנחשים). מקור בלי `credits_for` ⇒
                               השירות **חוסם שליחה** (credits_unverifiable), לא מניח «אין זיכויים».
  • `open_debts()`          — החוב הפתוח **אחרי** קיזוז (`Netting`): מה שהסנכרון קולט.
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

import re
from collections.abc import Callable, Iterable, Iterator
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Protocol, runtime_checkable

import httpx

from ..contact import normalize_il_phone, valid_email
from ..greeninvoice import DEFAULT_TERMS_DAYS, GreenInvoiceClient, Invoice, Netting


@runtime_checkable
class InvoiceSource(Protocol):
    provider: str

    def iter_open_invoices(self) -> Iterator[Invoice]: ...

    def get_document(self, external_id: str) -> Invoice: ...

    def credits_for(self, external_id: str, since=None, doc: Invoice | None = None) -> int: ...

    def open_debts(self) -> Netting: ...


class CreditAmbiguous(Exception):  # noqa: N818 — מצב עסקי, לא באג
    """זיכוי שלא ניתן לשייך בוודאות למסמך שעומדים להזכיר עליו ⇒ לא שולחים, בדיקת בעל העסק.
    `items` = [(מסמך הזיכוי, סיבה)] — אותה צורה כמו `Netting.review`."""

    def __init__(self, items: list[tuple[Invoice, str]], certain: int = 0) -> None:
        super().__init__(", ".join(sorted({why for _, why in items})))
        self.items = items
        self.certain = certain     # סך הזיכויים שכן משויכים בוודאות למסמך


def same_client(a: Invoice, b: Invoice) -> bool:
    """אותו לקוח לפי מזהה המקור, ובלעדיו לפי מייל או טלפון מנורמל. ספק ⇒ לא (False)."""
    if a.client_external_id and b.client_external_id:
        return a.client_external_id == b.client_external_id
    ea, eb = a.client_email.strip().lower(), b.client_email.strip().lower()
    if valid_email(ea) and ea == eb:
        return True
    pa, pb = normalize_il_phone(a.client_phone), normalize_il_phone(b.client_phone)
    return bool(pa) and pa == pb


def credits_on_doc(credits: Iterable[Invoice], doc: Invoice | str) -> int:
    """טהור — הכלל השמרני של `net_credits`, למסמך אחד ברגע הרענון:
    זיכוי שמקושר **רק** למסמך ⇒ נספר. מקושר אליו ולעוד מסמכים ⇒ CreditAmbiguous (credit_multi_invoice).
    בלי קישור, של אותו לקוח (כשהמסמך המלא ידוע) ⇒ CreditAmbiguous (credit_unlinked)."""
    doc_id = doc if isinstance(doc, str) else doc.external_id
    total, unsure = 0, []
    for c in credits:
        if c.amount_agorot <= 0:
            continue
        links = tuple(dict.fromkeys(c.linked_ids))
        if links == (doc_id,):
            total += c.amount_agorot
        elif doc_id in links:
            unsure.append((c, "credit_multi_invoice"))
        elif not links and not isinstance(doc, str) and same_client(c, doc):
            unsure.append((c, "credit_unlinked"))
    if unsure:
        raise CreditAmbiguous(unsure, total)
    return total


class GreenInvoiceSource:
    """עטיפה דקה ל-GreenInvoiceClient (גודל עמוד קבוע). GreenInvoiceClient עצמו כבר מממש את הממשק."""

    provider = "greeninvoice"

    def __init__(self, client: GreenInvoiceClient, page_size: int = 50) -> None:
        self.client, self.page_size = client, page_size

    def iter_open_invoices(self) -> Iterator[Invoice]:
        yield from self.client.iter_open_invoices(page_size=self.page_size)

    def get_document(self, external_id: str) -> Invoice:
        return self.client.get_document(external_id)

    def credits_for(self, external_id: str, since=None, doc: Invoice | None = None) -> int:
        return self.client.credits_for(external_id, since=since, doc=doc)

    def open_debts(self) -> Netting:
        return self.client.open_debts(page_size=self.page_size)


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


_IL_DMY = re.compile(r"^(\d{1,2})[/.](\d{1,2})[/.](\d{4})(?:[ T].*)?$")


def parse_il_date(v: object) -> date | None:
    """ISO (2026-10-20…) או DD/MM/YYYY (רווחית/EZcount). כל דבר אחר ⇒ None.
    הפעלה 112: גם בלי אפס מוביל ("5/3/2026") ובנקודות ("05.03.2026") — קודם נפלו ל-None ⇒
    מועד "מוערך" הנפקה+30 בשקט במקום המועד האמיתי. שנה מחוץ ל-2000–2099 ⇒ None (לא חוב בן 1,800 שנה)."""
    if not v or isinstance(v, bool):
        return None
    s = str(v).strip()
    try:
        if len(s) >= 10 and s[4] == "-":
            d = date.fromisoformat(s[:10])
        else:
            m = _IL_DMY.match(s)
            if not m:
                return None
            d = date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
    except ValueError:
        return None
    return d if 2000 <= d.year <= 2099 else None


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

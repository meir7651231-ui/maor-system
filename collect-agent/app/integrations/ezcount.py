"""EZcount — מקור חשבוניות, קריאה בלבד. **תיעוד הקריאה של EZcount לא פומבי** ⇒ adapter שמרני.

תיעוד ציבורי שנקרא (7.11.2026, בלי חשבון ובלי קריאה מאומתת):
  • https://documenter.getpostman.com/view/16363118/TzkyNLWB  — «EZcount documents API» v1.4.5
    (תיעוד *יצירת* מסמכים: createDoc + רשות המסים). ממנו נלקחו:
      - דומיינים: demo.ezcount.co.il (בדיקות) · api.ezcount.co.il (ייצור; מפתח שונה לכל דומיין)
      - אימות: `api_key` + `developer_email` בגוף ה-JSON, Content-Type application/json, SSL בלבד
      - קודי סוג: 300 חשבון עסקה · 305 חשבונית מס · 320 חשבונית מס קבלה · 330 זיכוי · 400 קבלה …
      - שמות שדות המסמך: doc_uuid, doc_number, type, date (DD/MM/YYYY), pay_until (DD/MM/YYYY),
        customer_name, customer_email, customer_phone, main_currency_iso, price_total; הצלחה = success:true
      - מגבלת קצב: 250 בקשות ל-10 שניות; 100 שגיאות לשעה
  • https://developers.hyp.co.il/documents-and-invoicing/overview — Hyp (חברת האם) מזכירה
    `inquireInvoice` לחשבוניות של עסקאות אשראי בלבד; לא כללי ⇒ לא בשימוש.

«לאמת» — כל צד הקריאה:
  • **נקודת החיפוש** (`SEARCH_PATH`) והפרמטרים שלה לא מופיעים בתיעוד הציבורי. השם כאן הוא
    placeholder שנבדק רק מול ה-mock. לפני חיבור אמיתי — לקבל מ-EZcount את החוזה ולעדכן את ה-mock.
  • שם שדה היתרה הפתוחה (balance / remaining). **בלי שדה יתרה ⇒ סכום 0 ⇒ לא מזכירים** (שמרני:
    לא מניחים ש-price_total עדיין פתוח).
  • סימון ביטול/סגירה (is_cancelled / cancelled / status). כל סימון אמת ⇒ לא חוב.
  • אין webhook מתועד לקריאה ⇒ סנכרון לפי סבב בלבד.
רק סוגים 300/305 נחשבים חוב (320 = חשבונית מס קבלה, שולמה מעצם הגדרתה).
"""
from __future__ import annotations

from collections.abc import Iterator
from typing import Any

import httpx

from ..config import SafetyError
from ..greeninvoice import Invoice, _to_agorot
from .base import IntegrationError, ProviderError, classify_status, guard_transport
from .sources import due_or_estimate, parse_il_date

EZCOUNT_DEMO_BASE = "https://demo.ezcount.co.il"
SEARCH_PATH = "/api/searchDocs"      # לאמת — לא מתועד בפומבי (placeholder, נבדק רק מול ה-mock)
DEBT_TYPES = (300, 305)
PREFIX = "ezcount:"
READ_API_DOCUMENTED = False


def _flag(d: dict[str, Any], *keys: str) -> bool:
    return any(d.get(k) in (True, 1, "1", "true") for k in keys)


def map_ezcount_doc(d: dict[str, Any]) -> Invoice:
    dtype = int(d.get("type") or 0)
    bal = next((d[k] for k in ("balance", "remaining", "amount_due") if d.get(k) not in (None, "")),
               None)
    closed = _flag(d, "is_cancelled", "cancelled", "is_closed", "closed") or \
        str(d.get("status", "")).lower() in ("closed", "cancelled", "paid")
    issued = parse_il_date(d.get("date"))
    due, estimated = due_or_estimate(parse_il_date(d.get("pay_until")), issued)
    return Invoice(
        external_id=f"{PREFIX}{d.get('doc_uuid', '')}",
        number=str(d.get("doc_number") or ""),
        doc_type=dtype,
        amount_agorot=_to_agorot(bal) if bal is not None and dtype in DEBT_TYPES else 0,
        currency=str(d.get("main_currency_iso") or "ILS").upper(),
        issued=issued,
        due=due,
        client_external_id="",       # אין מזהה לקוח בשדות המתועדים ⇒ השירות מזהה לפי מייל/טלפון
        client_name=str(d.get("customer_name") or ""),
        client_phone=str(d.get("customer_phone") or ""),
        client_email=str(d.get("customer_email") or ""),
        status=1 if closed else 0,
        due_estimated=estimated,
    )


class EZcountClient:
    """שלב 1: demo.ezcount.co.il בלבד, וחיבור רק דרך httpx.MockTransport (אחרת SafetyError)."""

    provider = "ezcount"

    def __init__(self, *, api_key: str, developer_email: str,
                 transport: httpx.BaseTransport | None = None, page_size: int = 100,
                 max_pages: int = 100) -> None:
        if not api_key or not developer_email:
            raise IntegrationError("EZcount: נדרשים api_key ו-developer_email")
        self._key, self._dev = api_key, developer_email
        self._transport = guard_transport(transport)
        self._http = httpx.Client(base_url=EZCOUNT_DEMO_BASE, transport=self._transport,
                                  timeout=35) if self._transport else None   # התיעוד: timeout > 30s
        self.page_size, self.max_pages = page_size, max_pages

    def _call(self, payload: dict[str, Any]) -> dict[str, Any]:
        if self._http is None:
            raise SafetyError("שלב 1: חיבור אמיתי ל-EZcount חסום (אין sandbox) — רק MockTransport")
        r = self._http.post(SEARCH_PATH, json={"api_key": self._key,
                                               "developer_email": self._dev, **payload})
        if r.status_code >= 400:
            raise classify_status(self.provider, r)
        b = r.json()
        if b.get("success") is not True:
            raise ProviderError(self.provider, str(b.get("errMsg") or b.get("error") or "success=false"))
        return b

    def iter_open_invoices(self) -> Iterator[Invoice]:
        for page in range(1, self.max_pages + 1):
            b = self._call({"types": list(DEBT_TYPES), "open_only": True,
                            "page": page, "page_size": self.page_size})
            rows = [r for r in (b.get("docs") or []) if isinstance(r, dict)]
            for d in rows:
                inv = map_ezcount_doc(d)
                if inv.amount_agorot > 0 and inv.status == 0 and d.get("doc_uuid"):
                    yield inv
            if len(rows) < self.page_size:
                return

    def get_document(self, external_id: str) -> Invoice:
        if not external_id.startswith(PREFIX):
            raise IntegrationError(f"EZcount: מזהה של מקור אחר ({external_id[:20]})")
        uuid = external_id[len(PREFIX):]
        rows = [r for r in (self._call({"doc_uuid": uuid}).get("docs") or [])
                if isinstance(r, dict) and r.get("doc_uuid") == uuid]
        if not rows:
            raise KeyError(external_id)
        return map_ezcount_doc(rows[0])

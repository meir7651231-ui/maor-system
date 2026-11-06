"""מקורות חשבוניות פתוחות: חשבונית ירוקה (morning) · iCount. קריאה בלבד.

שני המקורות מחזירים את אותו טיפוס `Invoice` (app.greeninvoice) ⇒ CollectService.ingest
לא יודע מאיזה ספק הגיעו הנתונים. external_id מקבל קידומת ספק ב-iCount ("icount:")
כדי שלא תהיה התנגשות אם עסק יעבור ספק.
"""
from __future__ import annotations

from collections.abc import Iterator
from typing import Any, Protocol

import httpx

from ..config import SafetyError
from ..greeninvoice import GreenInvoiceClient, Invoice, _parse_date, _to_agorot
from .base import IntegrationError, ProviderError, classify_status, guard_transport


class InvoiceSource(Protocol):
    provider: str

    def iter_open_invoices(self) -> Iterator[Invoice]: ...


class GreenInvoiceSource:
    provider = "greeninvoice"

    def __init__(self, client: GreenInvoiceClient, page_size: int = 50) -> None:
        self.client, self.page_size = client, page_size

    def iter_open_invoices(self) -> Iterator[Invoice]:
        yield from self.client.iter_open_invoices(page_size=self.page_size)


# ------------------------------------------------------------------ iCount
ICOUNT_BASE = "https://api.icount.co.il/api/v3.php"
ICOUNT_DEBT_DOCTYPES = ("invoice", "deal")   # חשבונית מס · חשבון עסקה (לאמת)


def map_icount_doc(d: dict[str, Any]) -> Invoice:
    """מיפוי סובלני — שמות השדות לפי התיעוד הציבורי של iCount v3, לאמת מול חשבון אמיתי."""
    amount = d.get("balance", d.get("total_due", d.get("totalwithvat", d.get("total", 0))))
    email = d.get("client_email") or d.get("email") or ""
    if isinstance(email, list):
        email = email[0] if email else ""
    phone = d.get("client_mobile") or d.get("client_phone") or d.get("mobile") \
        or d.get("phone") or ""
    doctype = str(d.get("doctype") or "")
    docnum = str(d.get("docnum") or d.get("doc_number") or "")
    ext = d.get("doc_id") or d.get("id") or (f"{doctype}-{docnum}" if docnum else "")
    return Invoice(
        external_id=f"icount:{ext}",
        number=docnum,
        doc_type={"invoice": 305, "deal": 300}.get(doctype, 0),
        amount_agorot=_to_agorot(amount),
        currency=str(d.get("currency_code") or d.get("currency") or "ILS"),
        issued=_parse_date(d.get("dateissued") or d.get("doc_date")),
        due=_parse_date(d.get("duedate") or d.get("due_date"))
        or _parse_date(d.get("dateissued") or d.get("doc_date")),
        client_external_id=f"icount:{d['client_id']}" if d.get("client_id") else "",
        client_name=str(d.get("client_name") or ""),
        client_phone=str(phone),
        client_email=str(email),
    )


class ICountClient:
    """iCount API v3. אימות: api_token (Bearer) — או cid+user+pass ⇒ auth/login ⇒ sid.
    תשובות iCount: HTTP 200 גם בשגיאה; הצלחה = {"status": true}.

    שלב 1: אין sandbox ל-iCount ⇒ חיבור רק דרך httpx.MockTransport. בלי transport ⇒
    SafetyError בכל קריאה (אפשר רק לבנות בקשה לתצוגה).
    """

    provider = "icount"

    def __init__(self, *, api_token: str = "", cid: str = "", user: str = "",
                 password: str = "", transport: httpx.BaseTransport | None = None,
                 page_size: int = 100, max_pages: int = 100) -> None:
        if not api_token and not (cid and user and password):
            raise IntegrationError("iCount: נדרש ICOUNT_API_TOKEN או ICOUNT_CID+USER+PASS")
        self.token, self.cid, self.user, self.password = api_token, cid, user, password
        self._transport = guard_transport(transport)
        self._http = httpx.Client(base_url=ICOUNT_BASE, transport=self._transport,
                                  timeout=20) if self._transport else None
        self._sid: str | None = None
        self.page_size, self.max_pages = page_size, max_pages

    def _call(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        if self._http is None:
            raise SafetyError("שלב 1: חיבור אמיתי ל-iCount חסום (אין sandbox) — רק MockTransport")
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        r = self._http.post(path, json=payload, headers=headers)
        if r.status_code >= 400:
            raise classify_status(self.provider, r)
        b = r.json()
        if b.get("status") is not True:
            reason = b.get("reason") or b.get("error_description") or "status=false"
            raise ProviderError(self.provider, f"{path}: {reason}",
                                retryable=False)
        return b

    def _auth_payload(self) -> dict[str, Any]:
        if self.token:
            return {}
        if not self._sid:
            b = self._call("/auth/login", {"cid": self.cid, "user": self.user,
                                           "pass": self.password})
            self._sid = str(b["sid"])
        return {"sid": self._sid}

    def search_page(self, doctype: str, offset: int) -> dict[str, Any]:
        payload = {**self._auth_payload(), "doctype": doctype, "status": 0,  # 0 = פתוח (לאמת)
                   "limit": self.page_size, "offset": offset, "detail_level": 1}
        try:
            return self._call("/doc/search", payload)
        except ProviderError as e:
            if self._sid and "sid" in str(e).lower():   # sid פג ⇒ login מחדש פעם אחת
                self._sid = None
                return self._call("/doc/search", {**payload, **self._auth_payload()})
            raise

    def iter_open_invoices(self) -> Iterator[Invoice]:
        for doctype in ICOUNT_DEBT_DOCTYPES:
            offset = 0
            for _ in range(self.max_pages):
                b = self.search_page(doctype, offset)
                rows = b.get("results_list") or b.get("docs") or []
                if isinstance(rows, dict):
                    rows = list(rows.values())
                for d in rows:
                    inv = map_icount_doc(d)
                    if inv.amount_agorot > 0:
                        yield inv
                if len(rows) < self.page_size:
                    break
                offset += self.page_size

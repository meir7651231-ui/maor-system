"""לקוח Green Invoice (morning) — קריאה בלבד.

שלב 1 משתמש רק ב:
  POST /account/token     {id, secret, grant_type} -> {token, expires}
                           (grant_type="client_credentials" נדרש מ-2026 לפי הודעת morning
                            "עדכונים חשובים בתשתית ממשק ה-API"; לאמת ב-sandbox)
  POST /documents/search  פילטר סטטוס/סוג + עימוד

שמות שדות לפי התיעוד הציבורי; יש לאמת מול sandbox אמיתי לפני שימוש
(ראו docs/MVP-SPEC.md §6). המיפוי סובלני לשדות חסרים.
"""
from __future__ import annotations

import time
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import date
from typing import Any

import httpx

# סוגי מסמכים שמייצגים חוב פתוח (לאמת): 300 חשבון עסקה, 305 חשבונית מס
OPEN_DEBT_TYPES = (300, 305)
STATUS_OPEN = 0


def token_body(api_id: str, api_secret: str) -> dict[str, str]:
    """גוף בקשת הטוקן. מ-2026 morning דורשת גם grant_type (ראו team/market.md §1.4)."""
    return {"id": api_id, "secret": api_secret, "grant_type": "client_credentials"}


class GreenInvoiceError(RuntimeError):
    pass


@dataclass(frozen=True)
class Invoice:
    external_id: str
    number: str
    doc_type: int
    amount_agorot: int
    currency: str
    issued: date | None
    due: date | None
    client_external_id: str
    client_name: str
    client_phone: str
    client_email: str
    payment_url: str = ""   # אם המסמך כבר מחזיר קישור תשלום (לאמת שם-שדה ב-sandbox)


def _parse_date(v: Any) -> date | None:
    if not v:
        return None
    try:
        return date.fromisoformat(str(v)[:10])
    except ValueError:
        return None


def _to_agorot(v: Any) -> int:
    # עיגול חצי-למעלה על מחרוזת עשרונית — בלי שגיאות float
    from decimal import ROUND_HALF_UP, Decimal

    return int((Decimal(str(v or 0)) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def map_document(doc: dict[str, Any]) -> Invoice:
    client = doc.get("client") or {}
    emails = client.get("emails") or []
    return Invoice(
        external_id=str(doc.get("id", "")),
        number=str(doc.get("number", "")),
        doc_type=int(doc.get("type", 0) or 0),
        amount_agorot=_to_agorot(doc.get("amountDueVat", doc.get("amount", 0))),
        currency=str(doc.get("currency") or "ILS"),
        issued=_parse_date(doc.get("documentDate")),
        due=_parse_date(doc.get("dueDate")) or _parse_date(doc.get("documentDate")),
        client_external_id=str(client.get("id", "")),
        client_name=str(client.get("name", "")),
        client_phone=str(client.get("phone") or client.get("mobile") or ""),
        client_email=str(emails[0]) if emails else "",
        payment_url=str(doc.get("paymentUrl") or doc.get("paymentLink") or ""),
    )


class GreenInvoiceClient:
    def __init__(
        self,
        base_url: str,
        api_id: str,
        api_secret: str,
        *,
        transport: httpx.BaseTransport | None = None,
        clock=time.time,
    ) -> None:
        if "sandbox" not in base_url:
            # מעקה כפול מעבר ל-config: שלב 1 = sandbox בלבד
            raise GreenInvoiceError("שלב 1: רק כתובת sandbox מותרת")
        self._http = httpx.Client(base_url=base_url, transport=transport, timeout=20)
        self._id = api_id
        self._secret = api_secret
        self._token: str | None = None
        self._token_exp = 0.0
        self._clock = clock

    def close(self) -> None:
        self._http.close()

    def _auth(self) -> str:
        if self._token and self._clock() < self._token_exp - 60:
            return self._token
        if not self._id or not self._secret:
            raise GreenInvoiceError("חסרים GREENINVOICE_API_ID/SECRET")
        r = self._http.post("/account/token", json=token_body(self._id, self._secret))
        if r.status_code != 200:
            raise GreenInvoiceError(f"token נכשל: {r.status_code}")
        body = r.json()
        self._token = body["token"]
        exp = body.get("expires")
        self._token_exp = float(exp) if exp else self._clock() + 3600
        return self._token

    def post(self, path: str, payload: dict[str, Any], *, what: str = "") -> dict[str, Any]:
        """POST מאומת עם חידוש-טוקן חד-פעמי על 401."""
        what = what or path
        for attempt in range(2):
            r = self._http.post(path, json=payload,
                                headers={"Authorization": f"Bearer {self._auth()}"})
            if r.status_code == 401 and attempt == 0:
                self._token = None  # טוקן פג — לחדש פעם אחת
                continue
            if r.status_code != 200:
                raise GreenInvoiceError(f"{what} נכשל: {r.status_code}")
            return r.json()
        raise GreenInvoiceError(f"{what} נכשל: 401 חוזר")

    def search_documents(self, *, page: int = 1, page_size: int = 50,
                         statuses=(STATUS_OPEN,), types=OPEN_DEBT_TYPES) -> dict[str, Any]:
        payload = {"page": page, "pageSize": page_size,
                   "status": list(statuses), "type": list(types)}
        return self.post("/documents/search", payload, what="search")

    def create_payment_form(self, inv: Invoice, *, notify_url: str = "") -> str:
        """דף תשלום של חשבונית ירוקה (POST /payments/form) — sandbox בלבד בשלב 1.

        שדות לפי התיעוד הציבורי; לאמת. הסכום בשקלים (לא אגורות).
        """
        payload = {
            "description": f"תשלום חשבונית {inv.number}",
            "type": 400,              # קבלה על התשלום (לאמת מול סוג המסמך המקורי)
            "lang": "he",
            "currency": inv.currency,
            "vatType": 0,
            "amount": inv.amount_agorot / 100,
            "maxPayments": 1,
            "client": {"id": inv.client_external_id, "name": inv.client_name},
            "custom": inv.external_id,
        }
        if notify_url:
            payload["notifyUrl"] = notify_url
        r = self._http.post("/payments/form", json=payload,
                            headers={"Authorization": f"Bearer {self._auth()}"})
        if r.status_code != 200:
            raise GreenInvoiceError(f"payments/form נכשל: {r.status_code}")
        url = r.json().get("url", "")
        if not url:
            raise GreenInvoiceError("payments/form: אין url בתשובה")
        return str(url)

    def iter_open_invoices(self, page_size: int = 50, max_pages: int = 200) -> Iterator[Invoice]:
        page = 1
        while page <= max_pages:
            body = self.search_documents(page=page, page_size=page_size)
            for doc in body.get("items", []):
                inv = map_document(doc)
                if inv.amount_agorot > 0:
                    yield inv
            pages = int(body.get("pages") or 1)
            if page >= pages:
                return
            page += 1

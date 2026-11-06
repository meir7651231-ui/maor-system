"""קישורי תשלום לתזכורת.

שלושה מצבים (PAYMENT_LINK_MODE):
  static    — קישור קבוע של העסק (Bit / PayBox / עמוד סליקה). ברירת המחדל.
  template  — תבנית עם {amount} {amount_agorot} {invoice} {currency} {ref} — מקודדים ל-URL.
  greeninvoice — טופס תשלום של חשבונית ירוקה (POST /payments/form). ⚠️ זו פעולת כתיבה
                 בחשבונית ירוקה (בעת תשלום נוצרת קבלה) ודורשת תוסף סליקה ⇒ **הכרעת מאיר**.
אף מצב לא מחשב ריבית/הצמדה — רק יתרת החשבונית כפי שהיא.
"""
from __future__ import annotations

import string
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any
from urllib.parse import quote

from ..greeninvoice import GreenInvoiceClient, GreenInvoiceError
from .base import IntegrationError, require_https

ALLOWED_FIELDS = {"amount", "amount_agorot", "invoice", "currency", "ref"}


@dataclass(frozen=True)
class PaymentRequest:
    invoice_external_id: str
    invoice_number: str
    amount_agorot: int
    currency: str = "ILS"
    client_name: str = ""
    client_email: str = ""
    description: str = ""


@dataclass
class PaymentLink:
    url: str
    provider: str
    dry_run: bool = False
    preview: dict[str, Any] = field(default_factory=dict)


def agorot_to_decimal(a: int) -> str:
    if a < 0:
        raise IntegrationError("סכום שלילי")
    return str((Decimal(a) / 100).quantize(Decimal("0.01")))


class StaticPaymentLink:
    provider = "static"

    def __init__(self, url: str) -> None:
        self.url = require_https(url, "PAYMENT_LINK")

    def link_for(self, req: PaymentRequest) -> PaymentLink:
        return PaymentLink(self.url, self.provider)


class TemplatePaymentLink:
    provider = "template"

    def __init__(self, template: str) -> None:
        require_https(template, "PAYMENT_LINK_TEMPLATE")
        names = {f for _, f, _, _ in string.Formatter().parse(template) if f}
        bad = names - ALLOWED_FIELDS
        if bad:
            raise IntegrationError(f"שדות לא מוכרים בתבנית: {sorted(bad)}")
        self.template = template

    def link_for(self, req: PaymentRequest) -> PaymentLink:
        vals = {"amount": agorot_to_decimal(req.amount_agorot),
                "amount_agorot": str(req.amount_agorot), "invoice": req.invoice_number,
                "currency": req.currency, "ref": req.invoice_external_id}
        url = self.template.format(**{k: quote(v, safe="") for k, v in vals.items()})
        return PaymentLink(url, self.provider)


class GreenInvoicePaymentForm:
    """טופס תשלום חשבונית ירוקה. בלי allow_write ⇒ dry-run: נבנה ה-payload, לא נשלח,
    ומוחזר fallback (קישור קבוע) אם הוגדר. מטמון פר-חשבונית: לא יוצרים שני טפסים."""

    provider = "greeninvoice"
    DOC_TYPE_RECEIPT = 400   # סוג המסמך שייווצר בעת תשלום (לאמת: 400 קבלה / 320 חשבונית-קבלה)

    def __init__(self, client: GreenInvoiceClient | None, *, plugin_id: str = "",
                 success_url: str = "", fallback: StaticPaymentLink | None = None,
                 allow_write: bool = False, max_payments: int = 1) -> None:
        if allow_write and client is None:
            raise IntegrationError("GreenInvoicePaymentForm: allow_write דורש client")
        self.client, self.plugin_id, self.fallback = client, plugin_id, fallback
        self.success_url = require_https(success_url, "successUrl") if success_url else ""
        self.allow_write, self.max_payments = allow_write, max(1, int(max_payments))
        self._cache: dict[str, PaymentLink] = {}

    def build_payload(self, req: PaymentRequest) -> dict[str, Any]:
        p: dict[str, Any] = {
            "description": req.description or f"תשלום חשבונית {req.invoice_number}",
            "type": self.DOC_TYPE_RECEIPT, "lang": "he", "currency": req.currency,
            "vatType": 0, "amount": float(agorot_to_decimal(req.amount_agorot)),
            "maxPayments": self.max_payments,
            "client": {"name": req.client_name, "emails": [req.client_email]
                       if req.client_email else [], "add": False},
            "remarks": f"חשבונית {req.invoice_number}",
            "custom": req.invoice_external_id,
        }
        if self.plugin_id:
            p["pluginId"] = self.plugin_id
        if self.success_url:
            p["successUrl"] = self.success_url
        return p

    def link_for(self, req: PaymentRequest) -> PaymentLink:
        if req.amount_agorot <= 0:
            raise IntegrationError("אין יתרה לתשלום")
        if req.invoice_external_id in self._cache:
            return self._cache[req.invoice_external_id]
        payload = self.build_payload(req)
        preview = {"method": "POST", "path": "/payments/form", "body": payload}
        if not self.allow_write:
            fb = self.fallback.url if self.fallback else ""
            return PaymentLink(fb, self.provider, dry_run=True, preview=preview)
        if self.client is None:  # לא assert: python -O מסיר asserts
            raise IntegrationError("payments: אין לקוח Green Invoice")
        try:
            body = self.client.post("/payments/form", payload, what="payments/form")
        except GreenInvoiceError as e:
            if self.fallback:
                return PaymentLink(self.fallback.url, "static", preview={**preview,
                                                                         "error": str(e)})
            raise
        url = body.get("url") or ""
        if body.get("errorCode") not in (None, 0) or not url:
            raise IntegrationError(f"payments/form: {body.get('errorMessage') or body}")
        link = PaymentLink(require_https(url, "payments/form url"), self.provider,
                           preview=preview)
        self._cache[req.invoice_external_id] = link
        return link

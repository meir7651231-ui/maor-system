"""בניית adapters ממשתני סביבה. סודות רק מ-env/כספת — לעולם לא מהריפו.

SMS_PROVIDER=inforu,019,twilio   (רשימה ⇒ סדר גיבוי)  · EMAIL_PROVIDER=smtp|resend
ACCOUNTING_PROVIDER=greeninvoice|icount · PAYMENT_LINK_MODE=static|template|greeninvoice

שלב 1: כל מה שנבנה כאן הוא dry-run (אין transport, אין SMTP factory, allow_write=False).
transport/factory מוזרקים רק מבדיקות.
"""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import httpx

from ..greeninvoice import GreenInvoiceClient
from .accounting import GreenInvoiceSource, ICountClient
from .base import IntegrationError
from .email import ResendEmail, SmtpEmail
from .notifier import Notifier
from .payments import GreenInvoicePaymentForm, StaticPaymentLink, TemplatePaymentLink
from .sms import InforUSms, Sms019, TwilioSms


def _req(e: Mapping[str, str], k: str) -> str:
    v = e.get(k, "")
    if not v:
        raise IntegrationError(f"חסר משתנה סביבה {k}")
    return v


def build_sms(name: str, e: Mapping[str, str], transport: httpx.BaseTransport | None = None):
    name = name.strip().lower()
    sender = e.get("SMS_SENDER", "")
    if name == "inforu":
        return InforUSms(_req(e, "INFORU_USERNAME"), _req(e, "INFORU_TOKEN"),
                         sender, transport=transport)
    if name == "019":
        return Sms019(_req(e, "SMS019_USERNAME"), _req(e, "SMS019_TOKEN"),
                      sender, transport=transport)
    if name == "twilio":
        return TwilioSms(_req(e, "TWILIO_ACCOUNT_SID"), _req(e, "TWILIO_AUTH_TOKEN"),
                         from_=e.get("TWILIO_FROM", ""),
                         messaging_service_sid=e.get("TWILIO_MESSAGING_SERVICE_SID", ""),
                         transport=transport)
    raise IntegrationError(f"SMS_PROVIDER לא מוכר: {name!r}")


def build_email(e: Mapping[str, str], transport: httpx.BaseTransport | None = None,
                smtp_factory: Any = None):
    name = e.get("EMAIL_PROVIDER", "").strip().lower()
    if not name:
        return None
    if name == "smtp":
        return SmtpEmail(_req(e, "SMTP_HOST"), int(e.get("SMTP_PORT", "587")),
                         e.get("SMTP_USER", ""), e.get("SMTP_PASSWORD", ""),
                         _req(e, "MAIL_FROM"), from_name=e.get("MAIL_FROM_NAME", ""),
                         starttls=e.get("SMTP_STARTTLS", "1") != "0", factory=smtp_factory)
    if name == "resend":
        return ResendEmail(_req(e, "RESEND_API_KEY"), _req(e, "MAIL_FROM"),
                           from_name=e.get("MAIL_FROM_NAME", ""), transport=transport)
    raise IntegrationError(f"EMAIL_PROVIDER לא מוכר: {name!r}")


def build_notifier(e: Mapping[str, str], *, transports: Mapping[str, Any] | None = None,
                   smtp_factory: Any = None) -> Notifier:
    t = dict(transports or {})
    sms = [build_sms(n, e, t.get(n.strip().lower()))
           for n in e.get("SMS_PROVIDER", "").split(",") if n.strip()]
    return Notifier(sms, build_email(e, t.get("email"), smtp_factory))


def build_accounting(e: Mapping[str, str], *, gi_client: GreenInvoiceClient | None = None,
                     transport: httpx.BaseTransport | None = None):
    name = e.get("ACCOUNTING_PROVIDER", "greeninvoice").strip().lower()
    if name == "greeninvoice":
        if gi_client is None:
            raise IntegrationError("greeninvoice: נדרש GreenInvoiceClient (sandbox)")
        return GreenInvoiceSource(gi_client)
    if name == "icount":
        return ICountClient(api_token=e.get("ICOUNT_API_TOKEN", ""), cid=e.get("ICOUNT_CID", ""),
                            user=e.get("ICOUNT_USER", ""), password=e.get("ICOUNT_PASS", ""),
                            transport=transport)
    raise IntegrationError(f"ACCOUNTING_PROVIDER לא מוכר: {name!r}")


def build_payment_links(e: Mapping[str, str], *, gi_client: GreenInvoiceClient | None = None):
    mode = e.get("PAYMENT_LINK_MODE", "static").strip().lower()
    static = StaticPaymentLink(e["PAYMENT_LINK"]) if e.get("PAYMENT_LINK") else None
    if mode == "static":
        if static is None:
            raise IntegrationError("PAYMENT_LINK_MODE=static דורש PAYMENT_LINK")
        return static
    if mode == "template":
        return TemplatePaymentLink(_req(e, "PAYMENT_LINK_TEMPLATE"))
    if mode == "greeninvoice":
        # allow_write=False תמיד בשלב 1 — יצירת טופס = כתיבה בחשבונית ירוקה (הכרעת מאיר)
        return GreenInvoicePaymentForm(gi_client, plugin_id=e.get("GI_PAYMENT_PLUGIN_ID", ""),
                                       success_url=e.get("GI_PAYMENT_SUCCESS_URL", ""),
                                       fallback=static, allow_write=False)
    raise IntegrationError(f"PAYMENT_LINK_MODE לא מוכר: {mode!r}")

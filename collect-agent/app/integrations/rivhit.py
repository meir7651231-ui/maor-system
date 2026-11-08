"""רווחית (Rivhit Online API) — מקור חשבוניות, קריאה בלבד.

תיעוד ציבורי (נקרא 7.11.2026, בלי חשבון ובלי קריאה מאומתת):
  • https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/help  — רשימת הפעולות. ולכל פעולה:
    https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/help/operations/GetCustomerOpenDocuments
    https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/help/operations/GetCustomerDetails
    https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/help/operations/DocumentDetails
    https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/help/operations/GetDocumentList

מה שמתועד ומשמש כאן (כל הפעולות POST, JSON, ה-api_token בגוף):
  POST …/Customer.OpenDocuments {api_token, customer_id?, document_type?, from_date?, until_date?}
       ⇒ {error_code, client_message, debug_message, data{open_documents[{balance, currency_id,
          customer_id, customer_name, document_number, document_type, due_date, issue_date,
          paid_amount, total_amount, …}]}}
  POST …/Customer.Get {api_token, customer_id} ⇒ data{first_name, last_name, phone, phone2, email, …}
  (Document.Details/Document.List מתועדים; לא נחוצים כאן — היתרה הפתוחה מגיעה מ-OpenDocuments.)
  אין webhook מתועד ⇒ סנכרון לפי סבב בלבד.

«לאמת» (לא נבדק מול חשבון אמיתי):
  • error_code == 0 = הצלחה (כך בדוגמאות; המשמעות לא מתועדת).
  • Customer.OpenDocuments בלי customer_id מחזיר את כל הלקוחות (customer_id «optional» בסכמה).
  • פורמט התאריכים (מקבלים ISO או DD/MM/YYYY).
  • currency_id: 0/1 = ש״ח. כל מטבע אחר ⇒ **מדלגים** (לא מזכירים על סכום שאיננו יודעים לתייג).
  • מספרי סוג מסמך מוגדרים לכל חשבון (Document.TypeList) ⇒ לא ממפים לקודי חשבונית ירוקה (doc_type=0).
  • אין עימוד מתועד לדוח היתרות.
  • **זיכויים (critic 2.16 / סבב 20):** סוג מסמך הזיכוי מוגדר לכל חשבון (Document.TypeList), ואין
    בדוח היתרות שדה קישור לחשבונית המקורית ⇒ **לעולם לא מקזזים**. שורה עם יתרה שלילית (balance<0)
    בדוח היתרות של הלקוח = זיכוי פתוח (לאמת) ⇒ הלקוח מושהה לבדיקת בעל העסק (`credit_review`), כמו
    זיכוי בלי קישור ב-`greeninvoice.net_credits`. פעם קודם השורה הזו נבלעה בשקט (סכום שלילי ⇒ דילוג)
    והלקוח קיבל תזכורת על הסכום המלא.
"""
from __future__ import annotations

from collections.abc import Iterator
from dataclasses import replace
from typing import Any

import httpx

from ..config import SafetyError
from ..greeninvoice import TYPE_CREDIT, Invoice, Netting, _to_agorot, net_credits
from .base import IntegrationError, ProviderError, classify_status, guard_transport
from .sources import CreditAmbiguous, due_or_estimate, parse_il_date

RIVHIT_BASE = "https://api.rivhit.co.il/online/RivhitOnlineAPI.svc"
PREFIX = "rivhit:"
ILS_CURRENCY_IDS = {0, 1}   # לאמת


def _int(v: Any) -> int | None:
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def rivhit_external_id(customer_id: Any, document_type: Any, document_number: Any) -> str:
    return f"{PREFIX}{customer_id}:{document_type}:{document_number}"


def map_rivhit_open_doc(d: dict[str, Any], customer: dict[str, Any] | None = None) -> Invoice:
    """שורה מ-Customer.OpenDocuments (+ פרטי הלקוח מ-Customer.Get) ⇒ Invoice."""
    c = customer or {}
    cur = _int(d.get("currency_id"))
    ils = cur is None or cur in ILS_CURRENCY_IDS
    issued = parse_il_date(d.get("issue_date"))
    due, estimated = due_or_estimate(parse_il_date(d.get("due_date")), issued)
    name = str(d.get("customer_name") or " ".join(
        x for x in (c.get("first_name"), c.get("last_name")) if x) or "")
    cid = d.get("customer_id")
    return Invoice(
        external_id=rivhit_external_id(cid, d.get("document_type"), d.get("document_number")),
        number=str(d.get("document_number") or ""),
        doc_type=0,
        # שמרני: רק היתרה (balance) היא חוב. אין balance ⇒ 0 (לא מזכירים). מטבע לא ידוע ⇒ 0.
        amount_agorot=_to_agorot(d.get("balance") or 0) if ils else 0,
        currency="ILS",
        issued=issued,
        due=due,
        client_external_id=f"{PREFIX}{cid}" if cid not in (None, "", 0) else "",
        client_name=name,
        client_phone=str(c.get("phone") or c.get("phone2") or ""),
        client_email=str(c.get("email") or ""),
        status=0,
        due_estimated=estimated,
    )


def _num(v: Any) -> float:
    try:
        return float(v or 0)
    except (TypeError, ValueError):
        return 0.0


def is_rivhit_credit(d: dict[str, Any]) -> bool:
    """יתרה שלילית בדוח היתרות = זיכוי/החזר שעוד לא נוצל (לאמת)."""
    return _num(d.get("balance")) < 0


def map_rivhit_credit(d: dict[str, Any], customer: dict[str, Any] | None = None) -> Invoice:
    """זיכוי — בלי קישור (אין שדה מתועד) ⇒ net_credits שולח ל-review, לא מקזז. גם במטבע זר."""
    inv = map_rivhit_open_doc({**d, "balance": abs(_num(d.get("balance"))), "currency_id": None},
                              customer)
    return replace(inv, doc_type=TYPE_CREDIT, linked_ids=())


class RivhitClient:
    """שלב 1: חיבור רק דרך httpx.MockTransport. בלי transport ⇒ SafetyError בכל קריאה."""

    provider = "rivhit"

    def __init__(self, *, api_token: str, transport: httpx.BaseTransport | None = None) -> None:
        if not api_token:
            raise IntegrationError("רווחית: נדרש api_token")
        self._token = api_token
        self._transport = guard_transport(transport)
        self._http = httpx.Client(base_url=RIVHIT_BASE, transport=self._transport,
                                  timeout=20) if self._transport else None
        self._customers: dict[str, dict[str, Any]] = {}

    def _call(self, op: str, payload: dict[str, Any]) -> dict[str, Any]:
        if self._http is None:
            raise SafetyError("שלב 1: חיבור אמיתי לרווחית חסום (אין sandbox) — רק MockTransport")
        r = self._http.post(f"/{op}", json={"api_token": self._token, **payload})
        if r.status_code >= 400:
            raise classify_status(self.provider, r)
        b = r.json()
        if b.get("error_code") != 0:
            raise ProviderError(self.provider, f"{op}: {b.get('client_message') or b.get('error_code')}")
        return b.get("data") or {}

    def _customer(self, customer_id: Any) -> dict[str, Any]:
        key = str(customer_id)
        if key not in self._customers:
            try:
                self._customers[key] = self._call("Customer.Get", {"customer_id": int(customer_id)})
            except (ProviderError, ValueError, TypeError):
                self._customers[key] = {}
        return self._customers[key]

    def _open_docs(self, **flt: Any) -> list[dict[str, Any]]:
        rows = self._call("Customer.OpenDocuments", flt).get("open_documents") or []
        return [r for r in rows if isinstance(r, dict)]

    def iter_open_invoices(self) -> Iterator[Invoice]:
        """גולמי — **לפני** בדיקת זיכויים. הסנכרון משתמש ב-open_debts()."""
        self._customers = {}
        for d in self._open_docs():
            cid = d.get("customer_id")
            inv = map_rivhit_open_doc(d, self._customer(cid) if cid not in (None, "", 0) else None)
            if inv.amount_agorot > 0:
                yield inv

    def open_debts(self) -> Netting:
        """אותו מעבר על דוח היתרות: חובות + זיכויים פתוחים (יתרה שלילית) ⇒ net_credits.
        הזיכויים בלי קישור ⇒ review ללקוח, אף פעם לא קיזוז לפי ניחוש."""
        self._customers = {}
        debts, credits = [], []
        for d in self._open_docs():
            cid = d.get("customer_id")
            c = self._customer(cid) if cid not in (None, "", 0) else None
            if is_rivhit_credit(d):
                credits.append(map_rivhit_credit(d, c))
                continue
            inv = map_rivhit_open_doc(d, c)
            if inv.amount_agorot > 0:
                debts.append(inv)
        return net_credits(debts, credits) if debts else Netting([])

    def credits_for(self, external_id: str, since=None, doc: Invoice | None = None) -> int:
        """רענון לפני שליחה: זיכוי פתוח ללקוח (יתרה שלילית בדוח שלו) ⇒ CreditAmbiguous — אי אפשר
        לשייך אותו למסמך (אין קישור מתועד). אין זיכויים ⇒ 0. כשל ⇒ חריגה (השירות חוסם שליחה)."""
        cid, _, _ = self._parse(external_id)
        credits = [map_rivhit_credit(d, self._customer(cid))
                   for d in self._open_docs(customer_id=cid) if is_rivhit_credit(d)]
        if credits:
            raise CreditAmbiguous([(c, "credit_unlinked") for c in credits])
        return 0

    @staticmethod
    def _parse(external_id: str) -> tuple[int, int, int]:
        if not external_id.startswith(PREFIX):
            raise IntegrationError(f"רווחית: מזהה של מקור אחר ({external_id[:20]})")
        parts = external_id[len(PREFIX):].split(":")
        if len(parts) != 3 or not all(p.lstrip("-").isdigit() for p in parts):
            raise IntegrationError("רווחית: מזהה מסמך לא תקין")
        cid, dtype, dnum = (int(p) for p in parts)
        return cid, dtype, dnum

    def get_document(self, external_id: str) -> Invoice:
        """ר-4: דוח היתרות הפתוחות של הלקוח, מסונן לסוג המסמך. המסמך כבר לא שם ⇒ סגור (status=1).
        כל כשל אחר ⇒ חריגה (השירות חוסם שליחה)."""
        cid, dtype, dnum = self._parse(external_id)
        for d in self._open_docs(customer_id=cid, document_type=dtype):
            if _int(d.get("document_number")) == dnum and \
                    _int(d.get("document_type")) in (dtype, None) and not is_rivhit_credit(d):
                return map_rivhit_open_doc(d, self._customer(cid))
        return Invoice(external_id=external_id, number=str(dnum), doc_type=0, amount_agorot=0,
                       currency="ILS", issued=None, due=None,
                       client_external_id=f"{PREFIX}{cid}", client_name="", client_phone="",
                       client_email="", status=1)

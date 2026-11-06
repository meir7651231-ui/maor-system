"""נתוני דמו ו-sandbox מדומה של חשבונית ירוקה — בתוך התהליך, בלי רשת.

כל השמות, הטלפונים והמיילים בדויים (example.com · 050-000xxxx). אין כאן אדם אמיתי.
משמש את `scripts/demo.py` ואת `DEMO=1 uvicorn app.main:_lazy_app --factory`.
"""
from __future__ import annotations

import json

import httpx

from .greeninvoice import GreenInvoiceClient

SANDBOX = "https://sandbox.d.greeninvoice.co.il/api/v1"
DEMO_ID, DEMO_SECRET = "demo-id", "demo-secret"


def _doc(i: int, name: str, phone: str, email: str, amount: str, due: str) -> dict:
    return {"id": f"demo{i}", "number": str(2000 + i), "type": 305, "status": 0,
            "amount": amount, "currency": "ILS", "documentDate": "2026-09-01", "dueDate": due,
            "client": {"id": f"dcl{i}", "name": name, "phone": phone,
                       "emails": [email] if email else []}}


def demo_docs() -> list[dict]:
    """6 לקוחות בדויים, כל אחד מדגים מסלול אחר בזרימה."""
    return [
        _doc(1, "דנה לוי (דמו)", "050-0000001", "dana@example.com", "1200.00", "2026-10-01"),
        _doc(2, "יוסי כהן (דמו)", "052-0000002", "yossi@example.com", "3450.50", "2026-10-10"),
        _doc(3, "קליניקה ירוקה (דמו)", "03-0000003", "clinic@example.com", "780.00",
             "2026-10-15"),                                         # קווי ⇒ מייל בלבד
        _doc(4, "רון אברהם (דמו)", "054-0000004", "", "450.00", "2026-10-20"),  # SMS בלבד
        _doc(5, "מיכל דוד (דמו)", "050-0000005", "michal@example.com", "2100.00",
             "2026-10-05"),                                         # תשלם ⇒ תיסגר בסנכרון
        _doc(6, "לקוח בלי פרטים (דמו)", "123", "", "300.00", "2026-10-01"),  # אין ערוץ
    ]


class FakeGreenInvoice:
    """sandbox מדומה: /account/token + /documents/search עם עימוד, מאמת Bearer."""

    def __init__(self, docs: list[dict]):
        self.docs = docs

    def handler(self, req: httpx.Request) -> httpx.Response:
        if req.url.path.endswith("/account/token"):
            if json.loads(req.content) != {"id": DEMO_ID, "secret": DEMO_SECRET}:
                return httpx.Response(401, json={"errorMessage": "bad credentials"})
            return httpx.Response(200, json={"token": "demo-token", "expires": 2_000_000_000})
        if req.url.path.endswith("/documents/search"):
            if req.headers.get("authorization") != "Bearer demo-token":
                return httpx.Response(401)
            body = json.loads(req.content)
            page, ps = body["page"], body["pageSize"]
            pages = max(1, -(-len(self.docs) // ps))
            return httpx.Response(200, json={"items": self.docs[(page - 1) * ps: page * ps],
                                             "page": page, "pages": pages,
                                             "total": len(self.docs), "pageSize": ps})
        return httpx.Response(404)


def demo_client(fake: FakeGreenInvoice | None = None) -> tuple[GreenInvoiceClient,
                                                                FakeGreenInvoice]:
    fake = fake or FakeGreenInvoice(demo_docs())
    return (GreenInvoiceClient(SANDBOX, DEMO_ID, DEMO_SECRET,
                               transport=httpx.MockTransport(fake.handler)), fake)

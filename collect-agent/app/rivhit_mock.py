"""mock בתוך התהליך של רווחית (Rivhit Online API, צד הקריאה), לבדיקות contract ולהדגמה. בלי רשת.

החוזה לפי התיעוד הציבורי (ראו docstring של app/integrations/rivhit.py):
  POST /online/RivhitOnlineAPI.svc/Customer.OpenDocuments {api_token, customer_id?, document_type?}
       ⇒ {error_code:0, client_message, debug_message, data{open_documents[…]}}
  POST …/Customer.Get {api_token, customer_id} ⇒ {error_code:0, data{first_name, last_name, phone, email…}}
  POST …/Document.Details {api_token, document_type, document_number} ⇒ data{…, is_closed, is_cancelled}
  שגיאה: error_code ≠ 0 + client_message (HTTP 200). טוקן שגוי ⇒ error_code ≠ 0 (לאמת: הקוד המדויק).
פעולות כתיבה מתועדות (Document.New/Cancel/Close/Reopen/Send, Customer.New/Update/Delete …) נרשמות
ב-`write_attempts` ונדחות.
"""
from __future__ import annotations

import json
from typing import Any

import httpx

SVC = "/online/RivhitOnlineAPI.svc/"
WRITE_OPS = {"Document.New", "Document.NewExtended", "Document.NewStream", "Document.Page",
             "Document.Cancel", "Document.Close", "Document.Reopen", "Document.Send",
             "Document.InvoiceApproval", "Customer.New", "Customer.Update", "Customer.Delete"}
ERR_TOKEN, ERR_NOT_FOUND, ERR_BAD = 100, 200, 300   # לאמת: הקודים האמיתיים לא מתועדים


def demo_docs() -> list[dict]:
    return [
        {"customer_id": 21, "document_type": 1, "document_number": 7001, "customer_name": "שירה גל (דמו)",
         "issue_date": "01/09/2026", "due_date": "01/10/2026", "total_amount": 2200.0,
         "paid_amount": 0.0, "balance": 2200.0, "currency_id": 1},
        {"customer_id": 22, "document_type": 1, "document_number": 7002, "customer_name": "עומר טל (דמו)",
         "issue_date": "15/09/2026", "due_date": "", "total_amount": 640.0,
         "paid_amount": 140.0, "balance": 500.0, "currency_id": 1},
    ]


def demo_customers() -> dict[int, dict]:
    return {21: {"customer_id": 21, "first_name": "שירה", "last_name": "גל", "phone": "054-0000021",
                 "email": "shira@example.com"},
            22: {"customer_id": 22, "first_name": "עומר", "last_name": "טל", "phone": "",
                 "phone2": "050-0000022", "email": ""}}


class RivhitMock:
    def __init__(self, *, api_token: str = "demo-rivhit-token", docs: list[dict] | None = None,  # noqa: S107 — mock
                 customers: dict[int, dict] | None = None) -> None:
        self.api_token = api_token
        self.docs = {(int(d["customer_id"]), int(d["document_type"]), int(d["document_number"])): dict(d)
                     for d in (docs or [])}
        self.closed: dict[tuple[int, int, int], dict] = {}
        self.customers = dict(customers or {})
        self.requests: list[tuple[str, dict]] = []
        self.write_attempts: list[str] = []

    def pay(self, customer_id: int, document_type: int, document_number: int) -> None:
        key = (customer_id, document_type, document_number)
        self.closed[key] = self.docs.pop(key)

    def partial(self, customer_id: int, document_type: int, document_number: int, paid: float) -> None:
        d = self.docs[(customer_id, document_type, document_number)]
        d["paid_amount"] = round(float(d["paid_amount"]) + paid, 2)
        d["balance"] = round(float(d["total_amount"]) - d["paid_amount"], 2)

    @staticmethod
    def _ok(data: dict) -> dict:
        return {"error_code": 0, "client_message": "", "debug_message": "", "data": data}

    @staticmethod
    def _err(code: int, msg: str) -> dict:
        return {"error_code": code, "client_message": msg, "debug_message": "", "data": None}

    def route(self, method: str, path: str, body: Any) -> tuple[int, dict]:
        if method != "POST" or not path.startswith(SVC):
            return 404, self._err(ERR_BAD, "not found")
        op = path[len(SVC):]
        if not isinstance(body, dict):
            return 400, self._err(ERR_BAD, "bad request")
        self.requests.append((op, body))
        if op in WRITE_OPS:
            self.write_attempts.append(op)
            return 200, self._err(ERR_BAD, "not allowed in mock")
        if body.get("api_token") != self.api_token:
            return 200, self._err(ERR_TOKEN, "api_token לא תקין")
        if op == "Customer.OpenDocuments":
            rows = [d for d in self.docs.values()
                    if (not body.get("customer_id") or d["customer_id"] == int(body["customer_id"]))
                    and (not body.get("document_type") or d["document_type"] == int(body["document_type"]))
                    and float(d["balance"]) != 0]
            return 200, self._ok({"open_documents": [dict(d) for d in rows]})
        if op == "Customer.Get":
            c = self.customers.get(_int(body.get("customer_id")) or -1)
            return 200, (self._ok(dict(c)) if c else self._err(ERR_NOT_FOUND, "לקוח לא נמצא"))
        if op == "Document.Details":
            for (cid, t, n), d in {**self.docs, **self.closed}.items():
                if t == _int(body.get("document_type")) and n == _int(body.get("document_number")):
                    return 200, self._ok({**d, "customer_id": cid, "document_total": d["total_amount"],
                                          "is_closed": (cid, t, n) in self.closed, "is_cancelled": False})
            return 200, self._err(ERR_NOT_FOUND, "מסמך לא נמצא")
        return 404, self._err(ERR_BAD, f"unknown operation {op}")

    def handler(self, req: httpx.Request) -> httpx.Response:
        try:
            body = json.loads(req.content) if req.content else {}
        except ValueError:
            body = None
        status, out = self.route(req.method, req.url.path, body)
        return httpx.Response(status, json=out)


def _int(v: Any) -> int | None:
    try:
        return int(v)
    except (TypeError, ValueError):
        return None

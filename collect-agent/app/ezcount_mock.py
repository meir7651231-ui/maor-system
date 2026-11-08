"""mock בתוך התהליך של EZcount, לבדיקות contract ולהדגמה. בלי רשת.

⚠️ צד הקריאה של EZcount **לא מתועד בפומבי** (ראו app/integrations/ezcount.py). מה שמתועד ונאכף כאן:
  • api_key + developer_email בגוף JSON, Content-Type application/json; הצלחה = success:true
  • שדות המסמך בשמות של createDoc: doc_uuid, doc_number, type, date/pay_until (DD/MM/YYYY),
    customer_name/email/phone, main_currency_iso, price_total
  • createDoc (כתיבה) — נרשם ב-`write_attempts` ונדחה.
מה שלא מתועד (נקודת החיפוש `SEARCH_PATH`, שם שדה היתרה `balance`, סימון `is_cancelled`) — «לאמת»;
ה-mock משקף את ההנחה של ה-adapter כדי שהבדיקות יתפסו סטייה בין השניים, לא כדי להוכיח את החוזה.
"""
from __future__ import annotations

import json
from typing import Any

import httpx

from .integrations.ezcount import SEARCH_PATH

WRITE_PATHS = ("/api/createDoc", "/v2/api/taxMinistry/", "/api/documents/getTaxMinistryAllocationNumber")


def demo_docs() -> list[dict]:
    return [
        {"doc_uuid": "ez-0001", "doc_number": "40001", "type": 305, "date": "01/09/2026",
         "pay_until": "01/10/2026", "customer_name": "ליאת רום (דמו)", "customer_email": "liat@example.com",
         "customer_phone": "053-0000031", "main_currency_iso": "ILS", "price_total": 1800.0,
         "balance": 1800.0},
        {"doc_uuid": "ez-0002", "doc_number": "40002", "type": 320, "date": "05/09/2026",
         "pay_until": "", "customer_name": "שולם במקום (דמו)", "customer_email": "paid@example.com",
         "customer_phone": "", "main_currency_iso": "ILS", "price_total": 300.0, "balance": 0},
    ]


class EZcountMock:
    def __init__(self, *, api_key: str = "demo-ezcount-key", developer_email: str = "dev@example.com",
                 docs: list[dict] | None = None) -> None:
        self.api_key, self.developer_email = api_key, developer_email
        self.docs = {d["doc_uuid"]: dict(d) for d in (docs or [])}
        self.requests: list[dict] = []
        self.write_attempts: list[str] = []

    def pay(self, uuid: str) -> None:
        self.docs[uuid]["balance"] = 0

    def cancel(self, uuid: str) -> None:
        self.docs[uuid]["is_cancelled"] = True

    def credit(self, uuid: str, amount: float, *, link: bool = True,
               links: list[str] | None = None) -> str:
        """זיכוי (330) לאותו לקוח. הקישור ב-`parent_uuid` / `linked_docs` — «לאמת» (לא מתועד)."""
        src = self.docs[uuid]
        cu = f"ez-c{sum(1 for d in self.docs.values() if d['type'] == 330) + 1:03d}"
        refs = links if links is not None else ([uuid] if link else [])
        self.docs[cu] = {"doc_uuid": cu, "doc_number": f"9{len(self.docs):04d}", "type": 330,
                         "date": "05/10/2026", "pay_until": "", "customer_name": src["customer_name"],
                         "customer_email": src["customer_email"], "customer_phone": src["customer_phone"],
                         "main_currency_iso": src["main_currency_iso"], "price_total": float(amount),
                         **({"linked_docs": list(refs)} if refs else {})}
        return cu

    def route(self, method: str, path: str, headers: dict[str, str], body: Any) -> tuple[int, dict]:
        if any(path.startswith(p) for p in WRITE_PATHS):
            self.write_attempts.append(path)
            return 403, {"success": False, "errMsg": "not allowed in mock"}
        if method != "POST" or path != SEARCH_PATH:
            return 404, {"success": False, "errMsg": "not found"}
        if "application/json" not in headers.get("content-type", ""):
            return 400, {"success": False, "errMsg": "JSON request must be sent with application/json"}
        if not isinstance(body, dict):
            return 400, {"success": False, "errMsg": "bad json"}
        self.requests.append(body)
        if body.get("api_key") != self.api_key or not body.get("developer_email"):
            return 200, {"success": False, "errMsg": "api_key / developer_email"}
        rows = list(self.docs.values())
        if body.get("doc_uuid"):
            rows = [d for d in rows if d["doc_uuid"] == body["doc_uuid"]]
        else:
            types = set(body.get("types") or [])
            rows = [d for d in rows if not types or d["type"] in types]
            if body.get("open_only"):
                rows = [d for d in rows if float(d.get("balance") or 0) > 0 and not d.get("is_cancelled")]
            size, page = int(body.get("page_size", 100)), int(body.get("page", 1))
            rows = rows[(page - 1) * size: page * size]
        return 200, {"success": True, "docs": [dict(d) for d in rows]}

    def handler(self, req: httpx.Request) -> httpx.Response:
        try:
            body = json.loads(req.content) if req.content else {}
        except ValueError:
            body = None
        status, out = self.route(req.method, req.url.path, {k.lower(): v for k, v in req.headers.items()}, body)
        return httpx.Response(status, json=out)

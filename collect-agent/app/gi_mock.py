"""שרת mock מלא של Green Invoice (morning) API v1, לפיתוח, לבדיקות contract ולהדגמה.

החוזה לפי התיעוד הציבורי (greeninvoice.co.il/api-docs, שחסום לקריאה אוטומטית — 403)
ולפי מקורות משניים שמצטטים אותו. כל מה שמסומן «לאמת» לא נבדק מול sandbox אמיתי:

  POST   /account/token        {id, secret, grant_type="client_credentials"} ⇒ {token, expires}
                               (expires = epoch שניות; תוקף שעה — לאמת)
  GET    /users/me             בדיקת טוקן
  POST   /documents/search     {page, pageSize, type[], status[], fromDate, toDate, sort}
                               ⇒ {total, page, pageSize, pages, items[]}
  GET    /documents/{id}
  POST   /clients              {name, emails[], phone, taxId, ...} ⇒ הלקוח עם id
  GET|PUT|DELETE /clients/{id}
  POST   /clients/search       {name, active, page, pageSize} ⇒ {total, page, pageSize, pages, items[]}
  POST   /payments/form        ⇒ {url}  (דף תשלום; שדות לאמת)
  webhooks                     מוגדרים בממשק של morning (הגדרות ← כלי מפתחים), לא ב-API.
                               אירוע: יצירת מסמך. payload: id, type, number, currency, date, total,
                               recipient{name, emails}, items[{description, quantity, price}],
                               files{signed, downloadLinks{he, en}}. חתימה — לא מתועדת (לאמת);
                               לכן אצלנו ה-URL נושא סוד (?k=...) כמו ה-webhook של 019.

קודי סוג מסמך: 10 הצעת מחיר · 100 הזמנה · 200 תעודת משלוח · 300 חשבון עסקה · 305 חשבונית מס ·
320 חשבונית מס/קבלה · 330 זיכוי · 400 קבלה · 405 קבלה על תרומה.
קודי סטטוס: 0 פתוח · 1 סגור · 2 נסגר ידנית · 3 מבטל מסמך אחר · 4 מבוטל.

שימוש:
  - בבדיקות:   httpx.MockTransport(GreenInvoiceMock(...).handler)   — בלי רשת
  - כשרת:      python3 -m app.gi_mock --port 8090 --seed demo --webhook URL
               (127.0.0.1 בלבד). נקודות ניהול תחת /_mock/* לבדיקות ולהדגמה בלבד.
"""
from __future__ import annotations

import argparse
import json
import secrets
import threading
import time
from collections.abc import Callable
from typing import Any

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

TOKEN_TTL = 3600
DOC_TYPES = {10, 100, 200, 210, 300, 305, 320, 330, 400, 405, 500, 600, 610}
DOC_STATUSES = {0, 1, 2, 3, 4}
MAX_PAGE_SIZE = 100   # לאמת: תקרת pageSize אצל morning
API_PREFIX = "/api/v1"
CLIENT_FIELDS = {"name", "emails", "phone", "mobile", "taxId", "country", "city", "address",
                 "paymentTerms", "labels", "active", "contactPerson", "remarks"}


class MockError(Exception):
    def __init__(self, status: int, code: int, message: str):
        self.status, self.code, self.message = status, code, message


class GreenInvoiceMock:
    """מצב בזיכרון + ניתוב. לא תלוי ב-FastAPI — אותו מימוש לבדיקות ולשרת."""

    def __init__(self, *, api_id: str = "demo-id", api_secret: str = "demo-secret",  # noqa: S107 — mock
                 docs: list[dict] | None = None, clock: Callable[[], float] = time.time,
                 deliver: Callable[[str, dict], None] | None = None) -> None:
        self.api_id, self.api_secret = api_id, api_secret
        self.clock = clock
        self.tokens: dict[str, float] = {}
        self.docs: dict[str, dict] = {}
        self.clients: dict[str, dict] = {}
        self.webhooks: list[str] = []
        self.deliveries: list[dict] = []        # כל אירוע webhook שנשלח (או נכשל)
        self.requests: list[tuple[str, str]] = []
        self.deliver = deliver or _http_deliver
        self._seq = 1000
        self.lock = threading.RLock()
        for d in docs or []:
            self._add_doc(dict(d), fire=False)

    # ---------- עזר ----------
    def _next(self, prefix: str) -> str:
        self._seq += 1
        return f"{prefix}{self._seq}"

    def _add_doc(self, d: dict, *, fire: bool) -> dict:
        d.setdefault("id", self._next("doc"))
        d.setdefault("number", str(self._seq))
        d.setdefault("status", 0)
        d.setdefault("currency", "ILS")
        d.setdefault("documentDate", time.strftime("%Y-%m-%d"))
        cl = d.get("client") or {}
        if cl:
            cl.setdefault("id", self._next("cl"))
            self.clients.setdefault(cl["id"], {"active": True, **cl})
            d["client"] = cl
        self.docs[d["id"]] = d
        if fire:
            self.fire("document.created", d)
        return d

    def _auth(self, headers: dict[str, str]) -> None:
        h = headers.get("authorization", "")
        if not h.startswith("Bearer "):
            raise MockError(401, 401, "Unauthorized")
        exp = self.tokens.get(h[7:])
        if exp is None or self.clock() >= exp:
            raise MockError(401, 401, "Token expired or invalid")

    @staticmethod
    def _page(items: list[dict], body: dict) -> dict:
        page = body.get("page", 1)
        size = body.get("pageSize", 25)
        if not isinstance(page, int) or page < 1 or not isinstance(size, int) or not 1 <= size <= MAX_PAGE_SIZE:
            raise MockError(400, 1001, "Invalid page/pageSize")
        pages = max(1, -(-len(items) // size))
        return {"total": len(items), "page": page, "pageSize": size, "pages": pages,
                "items": items[(page - 1) * size: page * size]}

    # ---------- webhooks ----------
    def webhook_payload(self, d: dict) -> dict:
        cl = d.get("client") or {}
        total = d.get("amount", 0)
        return {"id": d["id"], "type": d.get("type"), "number": d.get("number"),
                "currency": d.get("currency", "ILS"), "date": d.get("documentDate"),
                "total": total,
                "recipient": {"name": cl.get("name", ""), "emails": cl.get("emails", [])},
                "items": d.get("income") or [{"description": f"מסמך {d.get('number')}",
                                              "quantity": 1, "price": total}],
                "files": {"signed": True,
                          "downloadLinks": {"he": f"https://files.example/{d['id']}/he.pdf",
                                            "en": f"https://files.example/{d['id']}/en.pdf"}}}

    def fire(self, event: str, d: dict) -> None:
        payload = self.webhook_payload(d)
        for url in list(self.webhooks):
            rec = {"event": event, "url": url, "payload": payload, "ok": None}
            self.deliveries.append(rec)
            if self.deliver is _http_deliver:   # שרת אמיתי: ברקע, עם ניסיונות חוזרים
                threading.Thread(target=_http_deliver, args=(url, payload, rec), daemon=True).start()
            else:                               # בדיקות: מסירה סינכרונית לפונקציה
                self.deliver(url, payload)
                rec["ok"] = True

    # ---------- ניתוב ----------
    def route(self, method: str, path: str, headers: dict[str, str], body: Any) -> tuple[int, Any]:
        with self.lock:
            if path.startswith(API_PREFIX):
                path = path[len(API_PREFIX):]
            self.requests.append((method, path))
            try:
                return 200, self._route(method, path.rstrip("/") or "/", headers, body)
            except MockError as e:
                return e.status, {"errorCode": e.code, "errorMessage": e.message}

    def _route(self, m: str, p: str, h: dict[str, str], b: Any) -> Any:
        parts = p.strip("/").split("/")
        if p.startswith("/_mock/"):
            return self._admin(m, parts[1:], b)
        if (m, p) == ("POST", "/account/token"):
            if not isinstance(b, dict) or not {"id", "secret"} <= b.keys():
                raise MockError(400, 1002, "id and secret are required")
            if b.get("grant_type") != "client_credentials":   # morning 2026 (לאמת)
                raise MockError(400, 1003, "grant_type must be client_credentials")
            if (b["id"], b["secret"]) != (self.api_id, self.api_secret):
                raise MockError(401, 2002, "Invalid credentials")
            tok = "mock." + secrets.token_urlsafe(24)
            exp = self.clock() + TOKEN_TTL
            self.tokens[tok] = exp
            return {"token": tok, "expires": int(exp)}
        self._auth(h)
        if (m, p) == ("GET", "/users/me"):
            return {"id": "user-mock", "email": "owner@example.com", "businessName": "עסק דמו"}
        if (m, p) == ("POST", "/documents/search"):
            return self._search_docs(b if isinstance(b, dict) else {})
        if m == "GET" and len(parts) == 2 and parts[0] == "documents":
            if parts[1] not in self.docs:
                raise MockError(404, 404, "Document not found")
            return self.docs[parts[1]]
        if (m, p) == ("POST", "/clients"):
            return self._create_client(b)
        if (m, p) == ("POST", "/clients/search"):
            b = b if isinstance(b, dict) else {}
            name = str(b.get("name") or "").strip()
            items = [c for c in self.clients.values()
                     if (not name or name in c.get("name", ""))
                     and ("active" not in b or bool(c.get("active", True)) == bool(b["active"]))]
            return self._page(items, b)
        if len(parts) == 2 and parts[0] == "clients":
            c = self.clients.get(parts[1])
            if c is None:
                raise MockError(404, 404, "Client not found")
            if m == "GET":
                return c
            if m == "PUT":
                if not isinstance(b, dict):
                    raise MockError(400, 1004, "Invalid body")
                c.update({k: v for k, v in b.items() if k in CLIENT_FIELDS})
                return c
            if m == "DELETE":
                if any((d.get("client") or {}).get("id") == c["id"] and d.get("status") == 0
                       for d in self.docs.values()):
                    raise MockError(409, 3001, "Client has open documents")
                del self.clients[c["id"]]
                return {}
        if (m, p) == ("POST", "/payments/form"):
            if not isinstance(b, dict) or not b.get("amount") or float(b["amount"]) <= 0:
                raise MockError(400, 1005, "amount is required")
            return {"errorCode": 0, "url": f"https://pay.example/gi/{secrets.token_urlsafe(8)}"}
        raise MockError(404, 404, f"No route {m} {p}")

    def _search_docs(self, b: dict) -> dict:
        types, statuses = b.get("type"), b.get("status")
        for name, val, allowed in (("type", types, DOC_TYPES), ("status", statuses, DOC_STATUSES)):
            if val is not None and (not isinstance(val, list) or not set(val) <= allowed):
                raise MockError(400, 1006, f"Invalid {name}")
        frm, to = b.get("fromDate"), b.get("toDate")
        items = [d for d in self.docs.values()
                 if (types is None or d.get("type") in types)
                 and (statuses is None or d.get("status") in statuses)
                 and (not frm or str(d.get("documentDate", "")) >= frm)
                 and (not to or str(d.get("documentDate", "")) <= to)]
        key = b.get("sort") or "documentDate"
        items.sort(key=lambda d: (str(d.get(key, "")), str(d["id"])))
        return self._page(items, b)

    def _create_client(self, b: Any) -> dict:
        if not isinstance(b, dict) or not str(b.get("name") or "").strip():
            raise MockError(400, 1007, "name is required")
        if "emails" in b and not isinstance(b["emails"], list):
            raise MockError(400, 1008, "emails must be a list")
        c = {"id": self._next("cl"), "active": True,
             **{k: v for k, v in b.items() if k in CLIENT_FIELDS}}
        self.clients[c["id"]] = c
        return c

    # ---------- ניהול (לבדיקות ולהדגמה בלבד — לא חלק מה-API של morning) ----------
    def _admin(self, m: str, parts: list[str], b: Any) -> Any:
        if (m, parts) == ("POST", ["webhooks"]):
            url = str((b or {}).get("url", ""))
            if not url.startswith(("http://127.0.0.1", "http://localhost")):
                raise MockError(400, 9001, "mock webhooks: loopback only")
            self.webhooks.append(url)
            return {"webhooks": self.webhooks}
        if (m, parts) == ("GET", ["deliveries"]):
            return {"deliveries": self.deliveries}
        if (m, parts) == ("POST", ["documents"]):
            return self._add_doc(dict(b or {}), fire=True)
        if m == "POST" and len(parts) == 3 and parts[0] == "documents" and parts[2] == "pay":
            d = self.docs.get(parts[1])
            if d is None:
                raise MockError(404, 404, "Document not found")
            d["status"] = 1   # שולם ⇒ המסמך נסגר, ונוצרת קבלה (אירוע document.created)
            receipt = self._add_doc({"type": 400, "amount": d.get("amount"), "client": d.get("client"),
                                     "currency": d.get("currency", "ILS"),
                                     "linkedDocumentIds": [d["id"]]}, fire=True)
            return {"closed": d["id"], "receipt": receipt["id"]}
        if m == "POST" and len(parts) == 3 and parts[0] == "documents" and parts[2] == "partial":
            # תשלום חלקי: היתרה לתשלום יורדת, המסמך נשאר פתוח (לבדיקת אימות-סכום לפני שליחה)
            d = self.docs.get(parts[1])
            if d is None:
                raise MockError(404, 404, "Document not found")
            paid = float((b or {}).get("paid", 0))
            due = float(d.get("amountDueVat", d.get("amount", 0)))
            if not 0 < paid < due:
                raise MockError(400, 9002, "paid must be between 0 and the open balance")
            d["amountDueVat"] = round(due - paid, 2)
            self.fire("document.updated", d)
            return {"id": d["id"], "amountDueVat": d["amountDueVat"]}
        raise MockError(404, 404, "No mock admin route")

    # ---------- מתאמים ----------
    def handler(self, req: httpx.Request) -> httpx.Response:
        """ל-httpx.MockTransport (בדיקות, בלי רשת)."""
        body = json.loads(req.content) if req.content else None
        status, out = self.route(req.method, req.url.path, {k.lower(): v for k, v in req.headers.items()},
                                 body)
        return httpx.Response(status, json=out)


def _http_deliver(url: str, payload: dict, rec: dict | None = None) -> None:
    """שליחת webhook אמיתית — רק ל-127.0.0.1 (נאכף ברישום). עד 6 ניסיונות (השרת עוד עולה)."""
    for attempt in range(6):
        try:
            r = httpx.post(url, json=payload, timeout=5)
            if rec is not None:
                rec["ok"], rec["status"] = r.status_code < 300, r.status_code
            if r.status_code < 500:
                return
        except httpx.HTTPError as e:
            if rec is not None:
                rec["ok"], rec["error"] = False, type(e).__name__
        time.sleep(0.5 * (attempt + 1))


def create_mock_app(mock: GreenInvoiceMock):
    """עטיפת ASGI דקה (FastAPI) סביב GreenInvoiceMock.route."""
    app = FastAPI(title="Green Invoice mock (dry-run)", docs_url=None, redoc_url=None)

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
    async def any_route(path: str, request: Request):
        raw = await request.body()
        try:
            body = json.loads(raw) if raw else None
        except ValueError:
            return JSONResponse({"errorCode": 1000, "errorMessage": "Invalid JSON"}, status_code=400)
        status, out = mock.route(request.method, "/" + path,
                                 {k.lower(): v for k, v in request.headers.items()}, body)
        return JSONResponse(out, status_code=status)

    return app


def main(argv: list[str] | None = None) -> None:
    import uvicorn

    ap = argparse.ArgumentParser(description="Green Invoice mock server (127.0.0.1 בלבד)")
    ap.add_argument("--port", type=int, default=8090)
    ap.add_argument("--seed", choices=["demo", "none"], default="demo")
    ap.add_argument("--webhook", action="append", default=[], help="URL לוקאלי לאירועי מסמכים")
    a = ap.parse_args(argv)
    from .demo_data import DEMO_ID, DEMO_SECRET, demo_docs

    mock = GreenInvoiceMock(api_id=DEMO_ID, api_secret=DEMO_SECRET,
                            docs=demo_docs() if a.seed == "demo" else [])
    for url in a.webhook:
        mock.route("POST", "/_mock/webhooks", {}, {"url": url})
    print(f"Green Invoice mock: http://127.0.0.1:{a.port}{API_PREFIX}  ({len(mock.docs)} מסמכים)",
          flush=True)
    uvicorn.run(create_mock_app(mock), host="127.0.0.1", port=a.port, log_level="warning")


if __name__ == "__main__":
    main()

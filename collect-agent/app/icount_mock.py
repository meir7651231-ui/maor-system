"""mock בתוך התהליך של iCount API v3 (קריאה), לבדיקות contract ולהדגמה. בלי רשת.

החוזה לפי התיעוד הציבורי (ראו docstring של app/integrations/icount.py):
  POST /auth/login   {cid, user, pass}                ⇒ {status:true, sid} | {status:false, reason:"bad_login"}
  POST /doc/search   {doctype, status, offset, limit, detail_level, sid?} ⇒ {status, results_count, results_list}
                     בלי פרמטר שאילתה ⇒ reason "empty_query" · אין תוצאות ⇒ reason "no_results_found"
  POST /doc/info     {doctype, docnum}                ⇒ {status, doctype, docnum, doc_info} | "doc_not_found"
  POST /client/info  {client_id}                      ⇒ {status, client_info} | "client_not_found"
  תשובה: HTTP 200 גם בשגיאה; status:false + reason.
  אימות: Authorization: Bearer <api_token> **או** sid מ-auth/login (בגוף). חסר ⇒ "auth_required".
פעולות כתיבה מתועדות (doc/create, doc/cancel, doc/close, client/create, webhook/add …) נרשמות
ב-`write_attempts` ונדחות — כדי שבדיקה תוכיח שהלקוח שלנו לא קרא להן לעולם.
«לאמת»: שדות התוצאה בחיפוש ב-detail_level=2 (כאן: כמו doc_info, בלי טלפון/מייל של הלקוח).
«לאמת»: חשבונית זיכוי = doctype "refund"; הקישור לחשבונית המקורית ב-`based_on` [{doctype, docnum}]
(שם השדה לא מתועד בפומבי — ה-mock משקף את ההנחה של ה-adapter, לא מוכיח את החוזה).
"""
from __future__ import annotations

import json
from typing import Any

import httpx

API_PREFIX = "/api/v3.php"
WRITE_METHODS = {"doc/create", "doc/edit", "doc/cancel", "doc/close", "doc/reopen", "doc/email",
                 "doc/sms", "client/create", "client/update", "client/create_or_update",
                 "client/delete", "webhook/add", "webhook/delete"}
STATUS_OPEN, STATUS_CLOSED, STATUS_PARTIAL = 0, 1, 2
MAX_RESULTS = 1000


def demo_docs() -> list[dict]:
    """מסמכים בדויים (טלפון 05X-000XXXX, מייל example.com)."""
    return [
        {"doctype": "invoice", "docnum": 3001, "client_id": 11, "client_name": "נועה ברק (דמו)",
         "dateissued": "2026-09-01", "duedate": "2026-10-01", "currency_code": "ILS",
         "totalwithvat": 1500.0, "remainingsum": 1500.0, "status": STATUS_OPEN, "is_cancelled": False},
        {"doctype": "deal", "docnum": 3002, "client_id": 12, "client_name": "אבי שמש (דמו)",
         "dateissued": "2026-09-10", "duedate": "", "currency_code": "ILS",
         "totalwithvat": 900.0, "remainingsum": 400.0, "status": STATUS_PARTIAL, "is_cancelled": False},
    ]


def demo_clients() -> dict[int, dict]:
    return {11: {"client_id": 11, "client_name": "נועה ברק (דמו)", "email": "noa@example.com",
                 "mobile": "050-0000011"},
            12: {"client_id": 12, "client_name": "אבי שמש (דמו)", "email": "",
                 "phone": "052-0000012"}}


class ICountMock:
    def __init__(self, *, api_token: str = "demo-icount-token", cid: str = "demo", user: str = "u",  # noqa: S107 — mock
                 password: str = "p", docs: list[dict] | None = None,  # noqa: S107 — mock
                 clients: dict[int, dict] | None = None) -> None:
        self.api_token, self.cid, self.user, self.password = api_token, cid, user, password
        self.docs = {(d["doctype"], int(d["docnum"])): dict(d) for d in (docs or [])}
        self.clients = dict(clients or {})
        self.sids: set[str] = set()
        self.requests: list[tuple[str, dict]] = []
        self.write_attempts: list[str] = []

    # ---------- עזר לבדיקות/הדגמה (לא חלק מה-API) ----------
    def pay(self, doctype: str, docnum: int) -> None:
        self.docs[(doctype, docnum)].update(status=STATUS_CLOSED, remainingsum=0.0)

    def partial(self, doctype: str, docnum: int, paid: float) -> None:
        d = self.docs[(doctype, docnum)]
        d.update(status=STATUS_PARTIAL, remainingsum=round(float(d["remainingsum"]) - paid, 2))

    def cancel(self, doctype: str, docnum: int) -> None:
        self.docs[(doctype, docnum)]["is_cancelled"] = True

    def credit(self, doctype: str, docnum: int, amount: float, *, link: bool = True,
               links: list[tuple[str, int]] | None = None, dateissued: str = "2026-10-05") -> int:
        """מנפיק חשבונית זיכוי (refund) ללקוח של המסמך. link=False ⇒ בלי קישור. ⇒ מספר הזיכוי."""
        src = self.docs[(doctype, docnum)]
        num = 9000 + sum(1 for k in self.docs if k[0] == "refund") + 1
        refs = links if links is not None else ([(doctype, docnum)] if link else [])
        self.docs[("refund", num)] = {
            "doctype": "refund", "docnum": num, "client_id": src["client_id"],
            "client_name": src["client_name"], "dateissued": dateissued, "duedate": "",
            "currency_code": src.get("currency_code", "ILS"), "totalwithvat": float(amount),
            "remainingsum": 0.0, "status": STATUS_CLOSED, "is_cancelled": False,
            **({"based_on": [{"doctype": t, "docnum": n} for t, n in refs]} if refs else {})}
        return num

    # ---------- API ----------
    @staticmethod
    def _err(reason: str) -> dict:
        return {"status": False, "reason": reason}

    def _authed(self, headers: dict[str, str], body: dict) -> bool:
        if headers.get("authorization") == f"Bearer {self.api_token}":
            return True
        return str(body.get("sid", "")) in self.sids

    def route(self, method: str, path: str, headers: dict[str, str], body: Any) -> tuple[int, dict]:
        if method != "POST":
            return 405, self._err("method_not_allowed")
        if not isinstance(body, dict):
            return 200, self._err("bad_request")
        m = path.removeprefix(API_PREFIX).strip("/")
        self.requests.append((m, body))
        if m in WRITE_METHODS:
            self.write_attempts.append(m)
            return 200, self._err("not_allowed")
        if m == "auth/login":
            if (body.get("cid"), body.get("user"), body.get("pass")) != (self.cid, self.user, self.password):
                return 200, self._err("bad_login")
            sid = f"sid-{len(self.sids) + 1}"
            self.sids.add(sid)
            return 200, {"status": True, "sid": sid}
        if not self._authed(headers, body):
            return 200, self._err("auth_required")
        if m == "doc/search":
            return 200, self._search(body)
        if m == "doc/info":
            key = (str(body.get("doctype", "")), _int(body.get("docnum")))
            if key not in self.docs:
                return 200, self._err("doc_not_found")
            return 200, {"status": True, "doctype": key[0], "docnum": key[1], "doc_info": dict(self.docs[key])}
        if m == "client/info":
            c = self.clients.get(_int(body.get("client_id")) or -1)
            return (200, {"status": True, "client_info": dict(c)}) if c else (200, self._err("client_not_found"))
        return 404, self._err("unknown_method")

    def _search(self, b: dict) -> dict:
        q = {k for k in ("doctype", "docnum", "client_id", "status", "start_date", "end_date") if k in b}
        if not q:
            return self._err("empty_query")
        if int(b.get("detail_level", 1)) < 0 or int(b.get("detail_level", 1)) > 10:
            return self._err("bad_detail_level")
        rows = list(self.docs.values())
        if "doctype" in b:
            rows = [d for d in rows if d["doctype"] == b["doctype"]]
        if "status" in b:
            st = int(b["status"])
            # מתועד: חיפוש «פתוח» כולל גם «נסגר חלקית»
            rows = [d for d in rows if d["status"] == st or (st == STATUS_OPEN and d["status"] == STATUS_PARTIAL)]
        rows.sort(key=lambda d: (d["dateissued"], d["docnum"]))
        off, lim = int(b.get("offset", 0)), int(b.get("limit", 0))
        page = rows[off: off + lim] if lim else rows[off:off + MAX_RESULTS]
        if not page:
            return self._err("no_results_found")
        return {"status": True, "max_results": MAX_RESULTS, "offset": off, "limit": lim,
                "results_count": len(rows), "results_list": [dict(d) for d in page]}

    def handler(self, req: httpx.Request) -> httpx.Response:
        try:
            body = json.loads(req.content) if req.content else {}
        except ValueError:
            body = None
        status, out = self.route(req.method, req.url.path, {k.lower(): v for k, v in req.headers.items()}, body)
        return httpx.Response(status, json=out)


def _int(v: Any) -> int | None:
    try:
        return int(v)
    except (TypeError, ValueError):
        return None

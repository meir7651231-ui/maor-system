"""mock של InforU (ספק ה-SMS לגיבוי) — אותו חוזה שה-adapter מניח. **חוזה לא מאומת.**

POST /api/v2/SMS/SendSms · Authorization: Basic base64(user:token) · JSON:
  {"Data": {"Message": …, "Recipients": [{"Phone": "05XXXXXXXX"}], "Settings": {"Sender": …}}}
תשובה: {"StatusId": 1, "StatusDescription": "Success", "Data": {"MessageId": …}}
שגיאות (לפי ההנחה): -2 אימות · -18 שולח · -20 נמען · -1 הודעה/גוף. תקלות מדומות: fail_next.
מימוש אחד לבדיקות (httpx.MockTransport(mock.handler)). כשיגיע מסמך רשמי — מעדכנים כאן.
"""
from __future__ import annotations

import base64
import json
import re
import secrets
from typing import Any

import httpx

OK, ERR_BODY, ERR_AUTH, ERR_SENDER, ERR_DEST = 1, -1, -2, -18, -20
_SENDER_RX = re.compile(r"(?=.*[A-Za-z])[A-Za-z0-9 ]{1,11}|\+?\d{9,15}")
_MOBILE_RX = re.compile(r"05\d{8}")
PATH = "/api/v2/SMS/SendSms"


class InforUMock:
    def __init__(self, *, username: str = "demoinforu", token: str = "demo-inforu-token") -> None:  # noqa: S107  # nosec B107 — mock
        self.username, self.token = username, token
        self.sent: list[dict[str, Any]] = []
        self.requests: list[tuple[str, str]] = []
        self.fail_next: list[int] = []

    def _res(self, status_id: int, desc: str, **data: Any) -> tuple[int, dict]:
        out: dict[str, Any] = {"StatusId": status_id, "StatusDescription": desc}
        if data:
            out["Data"] = data
        return 200, out

    def route(self, method: str, path: str, headers: dict[str, str], raw: bytes) -> tuple[int, Any]:
        self.requests.append((method, path))
        if self.fail_next:
            return self.fail_next.pop(0), {}
        if method != "POST" or path != PATH:
            return 404, {}
        want = "Basic " + base64.b64encode(f"{self.username}:{self.token}".encode()).decode()
        if headers.get("authorization", "") != want:
            return self._res(ERR_AUTH, "Authentication failed")
        try:
            d = json.loads(raw or b"{}")["Data"]
            msg, rec, snd = d["Message"], d["Recipients"], d["Settings"]["Sender"]
        except (ValueError, KeyError, TypeError):
            return self._res(ERR_BODY, "Invalid request body")
        if not _SENDER_RX.fullmatch(snd or ""):
            return self._res(ERR_SENDER, "Invalid sender")
        phones = [r.get("Phone", "") for r in rec if isinstance(r, dict)]
        if not phones or not all(_MOBILE_RX.fullmatch(p) for p in phones):
            return self._res(ERR_DEST, "Invalid recipient")
        if not str(msg).strip():
            return self._res(ERR_BODY, "Empty message")
        mid = "inforu-" + secrets.token_hex(6)
        self.sent.append({"MessageId": mid, "phones": phones, "message": msg, "sender": snd,
                          "customer_id": d["Settings"].get("CustomerMessageId")})
        return self._res(OK, "Success", MessageId=mid)

    def handler(self, req: httpx.Request) -> httpx.Response:
        status, body = self.route(req.method, req.url.path,
                                  {k.lower(): v for k, v in req.headers.items()}, req.content)
        return httpx.Response(status, json=body)

"""mock של 019 SMS — אותו חוזה שה-adapter מניח (XML מעל HTTPS, Bearer). **חוזה לא מאומת.**

מימוש אחד לבדיקות (`httpx.MockTransport(mock.handler)`) ולשרת מקומי (127.0.0.1 בלבד):
  POST /api/test  — מאמת את הבקשה ומחזיר הצלחה **בלי** "לשלוח" (כמו endpoint הבדיקה של 019)
  POST /api       — מאמת, "שולח" (נרשם ב-mock.sent), מחזיר shipment_id
תשובה: <sms><status>0</status><message>…</message><shipment_id>…</shipment_id></sms>
שגיאות (קודים לפי ההנחה, לא מאומתים): 2 = אימות · 3 = שולח · 4 = נמען · 5 = הודעה · 9 = XML פסול.
תקלות מדומות: `fail_next=[503, 429]` — סדרת תשובות HTTP לפני שהמוק חוזר לעבוד.
DLR: `dlr(shipment_id, status)` מחזיר את גוף ה-webhook (form) כפי שה-adapter מצפה לקבל.

כשיגיע מסמך רשמי מ-019: מעדכנים כאן את הקודים/השדות, ו-scripts/sms019_contract_check.py מראה מה נשבר.
"""
from __future__ import annotations

import argparse
import re
import secrets
import threading
import xml.etree.ElementTree as ET  # noqa: S405  # nosec B405 — DOCTYPE/ENTITY נדחים לפני הפענוח (_parse)
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import Response

STATUS_OK, ERR_AUTH, ERR_SOURCE, ERR_DEST, ERR_MESSAGE, ERR_XML = 0, 2, 3, 4, 5, 9
_SENDER_RX = re.compile(r"(?=.*[A-Za-z])[A-Za-z0-9 ]{1,11}|\+?\d{9,15}")
_MOBILE_RX = re.compile(r"05\d{8}")


def _xml(status: int, message: str, shipment_id: str = "") -> str:
    from xml.sax.saxutils import escape  # nosec B406 — בונה XML, לא מפענח
    sid = f"<shipment_id>{escape(shipment_id)}</shipment_id>" if shipment_id else ""
    return f"<sms><status>{status}</status><message>{escape(message)}</message>{sid}</sms>"


class Sms019Mock:
    def __init__(self, *, username: str = "demo019", token: str = "demo019-token") -> None:  # noqa: S107  # nosec B107 — mock
        self.username, self.token = username, token
        self.sent: list[dict[str, Any]] = []        # רק /api (לא /api/test)
        self.requests: list[tuple[str, str]] = []
        self.fail_next: list[int] = []
        self.lock = threading.RLock()

    # ---------- ליבה ----------
    def _parse(self, raw: bytes) -> ET.Element:
        text = raw.decode("utf-8")
        if "<!DOCTYPE" in text.upper() or "<!ENTITY" in text.upper():
            raise ValueError("DOCTYPE/ENTITY אסורים")              # הגנת XXE / billion laughs
        return ET.fromstring(text)  # noqa: S314  # nosec B314 — אחרי חסימת DOCTYPE/ENTITY

    def route(self, method: str, path: str, headers: dict[str, str], raw: bytes) -> tuple[int, str]:
        with self.lock:
            self.requests.append((method, path))
            if self.fail_next:
                return self.fail_next.pop(0), ""
            if method != "POST" or path.rstrip("/") not in ("/api", "/api/test"):
                return 404, ""
            if headers.get("authorization", "") != f"Bearer {self.token}":
                return 200, _xml(ERR_AUTH, "authentication failed")
            if not headers.get("content-type", "").startswith("application/xml"):
                return 200, _xml(ERR_XML, "content-type must be application/xml")
            try:
                root = self._parse(raw)
            except (ValueError, ET.ParseError) as e:
                return 200, _xml(ERR_XML, f"invalid xml: {e}")
            if root.tag != "sms" or (root.findtext("user/username") or "") != self.username:
                return 200, _xml(ERR_AUTH, "unknown user")
            if not _SENDER_RX.fullmatch(root.findtext("source") or ""):
                return 200, _xml(ERR_SOURCE, "invalid source")
            phones = [p.text or "" for p in root.findall("destinations/phone")]
            if not phones or not all(_MOBILE_RX.fullmatch(p) for p in phones):
                return 200, _xml(ERR_DEST, "invalid destination")
            msg = root.findtext("message") or ""
            if not msg.strip():
                return 200, _xml(ERR_MESSAGE, "empty message")
            if path.rstrip("/") == "/api/test":
                return 200, _xml(STATUS_OK, "test ok — not sent")
            sid = "019-" + secrets.token_hex(6)
            self.sent.append({"shipment_id": sid, "phones": phones, "message": msg,
                              "source": root.findtext("source")})
            return 200, _xml(STATUS_OK, "sent", sid)

    @staticmethod
    def dlr(shipment_id: str, status: str = "DELIVRD") -> bytes:
        """גוף webhook של דוח מסירה (form), כפי ש-parse_019_dlr מצפה (לא מאומת)."""
        return urlencode({"type": "dlr", "shipment_id": shipment_id, "status": status}).encode()

    # ---------- מתאמים ----------
    def handler(self, req: httpx.Request) -> httpx.Response:
        status, body = self.route(req.method, req.url.path,
                                  {k.lower(): v for k, v in req.headers.items()}, req.content)
        return httpx.Response(status, text=body,
                              headers={"content-type": "application/xml; charset=utf-8"})


def create_mock_app(mock: Sms019Mock):
    app = FastAPI(title="019 SMS mock (dry-run)", docs_url=None, redoc_url=None)

    @app.api_route("/{path:path}", methods=["GET", "POST"])
    async def any_route(path: str, request: Request):
        status, body = mock.route(request.method, "/" + path,
                                  {k.lower(): v for k, v in request.headers.items()},
                                  await request.body())
        return Response(body, status_code=status, media_type="application/xml")

    return app


def main(argv: list[str] | None = None) -> None:
    import uvicorn

    ap = argparse.ArgumentParser(description="019 SMS mock server (127.0.0.1 בלבד)")
    ap.add_argument("--port", type=int, default=8095)
    a = ap.parse_args(argv)
    mock = Sms019Mock()
    print(f"019 mock: http://127.0.0.1:{a.port}/api (user={mock.username})", flush=True)
    uvicorn.run(create_mock_app(mock), host="127.0.0.1", port=a.port, log_level="warning")


if __name__ == "__main__":
    main()

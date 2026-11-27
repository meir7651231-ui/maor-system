"""תקרת גוף-בקשה בשכבת ה-ASGI (מבקר 267🟠).

לפני כן כל נקודה קראה `await request.body()` לזיכרון ורק אז בדקה גודל — כולל `/api/connect/orbit`
הציבורית (לפני אימות). כאן: Content-Length מעל התקרה ⇒ 413 מיד, בלי למשוך אף נתח; בלי Content-Length
(chunked) — סופרים בתים תוך כדי קריאה, ובחריגה עונים 413 ולא ממשיכים למשוך.
התקרות זהות לבדיקות הקיימות בנקודות (הן נשארות — זו שכבה נוספת, לא מחליפה)."""
from __future__ import annotations

import json

from .csv_import import MAX_BYTES as CSV_MAX_BYTES

ORBIT_CONNECT_MAX = 6144          # כמו connect_orbit_verify
WEBHOOK_MAX = 16 * 1024           # כמו MAX_WEBHOOK_BODY
DEFAULT_MAX = 1024 * 1024         # כל השאר (JSON קטן; מייל נכנס עם טקסט ארוך)
CSV_TOO_BIG = "הקובץ גדול מדי (מקס׳ 2MB)"   # אותו נוסח כמו csv_import.parse


def limit_for(path: str) -> tuple[int, str]:
    if path == "/api/connect/orbit":
        return ORBIT_CONNECT_MAX, "too large"
    if path in ("/import/csv", "/settings/source/csv"):
        return CSV_MAX_BYTES, CSV_TOO_BIG
    if path in ("/webhooks/greeninvoice", "/webhooks/sms/019", "/webhooks/sms/inforu") or \
            path.startswith("/webhooks/source/"):
        return WEBHOOK_MAX, "too large"
    return DEFAULT_MAX, "too large"


class _TooLarge(Exception):
    pass


async def _send_413(send, detail: str) -> None:
    body = json.dumps({"detail": detail}, ensure_ascii=False).encode("utf-8")
    await send({"type": "http.response.start", "status": 413,
                "headers": [(b"content-type", b"application/json"),
                            (b"content-length", str(len(body)).encode()),
                            (b"connection", b"close")]})
    await send({"type": "http.response.body", "body": body})


class BodyCapMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope.get("method") in ("GET", "HEAD", "OPTIONS"):
            return await self.app(scope, receive, send)
        cap, detail = limit_for(scope.get("path", ""))
        for k, v in scope.get("headers", []):
            if k == b"content-length":
                try:
                    declared = int(v)
                except ValueError:
                    declared = -1
                if declared < 0 or declared > cap:
                    return await _send_413(send, detail)
                break
        seen = 0
        started = False

        async def capped_receive():
            nonlocal seen
            msg = await receive()
            if msg["type"] == "http.request":
                seen += len(msg.get("body", b""))
                if seen > cap:
                    raise _TooLarge
            return msg

        async def tracking_send(msg):
            nonlocal started
            if msg["type"] == "http.response.start":
                started = True
            await send(msg)

        try:
            await self.app(scope, capped_receive, tracking_send)
        except BaseException as e:   # BaseHTTPMiddleware עוטף ב-ExceptionGroup (task group)
            if not _is_too_large(e):
                raise
            if not started:
                await _send_413(send, detail)


def _is_too_large(e: BaseException) -> bool:
    if isinstance(e, _TooLarge):
        return True
    if isinstance(e, BaseExceptionGroup):
        return all(_is_too_large(x) for x in e.exceptions)
    return isinstance(e.__cause__, _TooLarge) or isinstance(e.__context__, _TooLarge)

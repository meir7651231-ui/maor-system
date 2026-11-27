"""מנהל 439 (מבקר 267🟠): תקרת גוף בשכבת ה-ASGI — גם בלי Content-Length (chunked), תקרה פר-נתיב,
ובקשות רגילות לא נפגעות."""
from __future__ import annotations

import asyncio
import json

from fastapi.testclient import TestClient

from app.bodycap import CSV_TOO_BIG, DEFAULT_MAX, ORBIT_CONNECT_MAX, WEBHOOK_MAX, limit_for
from app.csv_import import MAX_BYTES
from app.main import create_app
from app.ratelimit import RateLimiter
from tests.conftest import OWNER_TOKEN

CHUNK = b"x" * 65536


def _post_chunked(app, path, chunks, headers=()):
    """גוף בלי Content-Length — השרת חייב לספור בתים בעצמו."""
    pulled = {"n": 0}
    out = {"body": b""}

    async def receive():
        if pulled["n"] >= chunks:
            return {"type": "http.disconnect"}
        pulled["n"] += 1
        return {"type": "http.request", "body": CHUNK, "more_body": pulled["n"] < chunks}

    async def send(msg):
        if msg["type"] == "http.response.start":
            out["code"] = msg["status"]
        elif msg["type"] == "http.response.body":
            out["body"] += msg.get("body", b"")

    scope = {"type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1", "method": "POST",
             "scheme": "http", "path": path, "raw_path": path.encode(), "query_string": b"",
             "root_path": "", "client": ("203.0.113.9", 5555), "server": ("testserver", 80),
             "headers": [(b"host", b"testserver"), *headers]}
    asyncio.run(app(scope, receive, send))
    return out.get("code"), pulled["n"], out["body"]


def _app(svc):
    return create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={}))


def test_limits_per_path():
    assert limit_for("/api/connect/orbit")[0] == ORBIT_CONNECT_MAX == 6144
    assert limit_for("/import/csv") == (MAX_BYTES, CSV_TOO_BIG)
    assert limit_for("/settings/source/csv")[0] == MAX_BYTES
    for p in ("/webhooks/greeninvoice", "/webhooks/sms/019", "/webhooks/sms/inforu", "/webhooks/source/icount"):
        assert limit_for(p)[0] == WEBHOOK_MAX
    assert limit_for("/api/settings")[0] == DEFAULT_MAX


def test_chunked_public_orbit_stops_reading_at_cap(svc):
    code, n, body = _post_chunked(_app(svc), "/api/connect/orbit", 200,
                                  [(b"content-type", b"application/json")])
    assert code == 413
    assert n <= 1, f"נמשכו {n} נתחים"


def test_chunked_csv_stops_at_2mb_with_hebrew_message(svc):
    code, n, body = _post_chunked(_app(svc), "/import/csv", 200,
                                  [(b"authorization", f"Bearer {OWNER_TOKEN}".encode())])
    assert code == 413
    assert n <= MAX_BYTES // len(CHUNK) + 1
    assert json.loads(body)["detail"] == CSV_TOO_BIG


def test_declared_oversize_csv_keeps_friendly_message(svc):
    c = TestClient(_app(svc))
    r = c.post("/settings/source/csv", content=b"a" * (MAX_BYTES + 1),
               headers={"Authorization": f"Bearer {OWNER_TOKEN}"})
    assert r.status_code == 413
    assert r.json()["detail"] == CSV_TOO_BIG


def test_normal_requests_unaffected(svc):
    c = TestClient(_app(svc))
    h = {"Authorization": f"Bearer {OWNER_TOKEN}"}
    assert c.get("/health").status_code == 200
    csv = "מספר מסמך,לקוח,טלפון,סכום,תאריך פירעון\n9001,לקוח בדוי,0501234567,100,01/01/2026\n"
    r = c.post("/import/csv", content=csv.encode(), headers=h)
    assert r.status_code == 200, r.text
    # ציבורי בגודל סביר ⇒ מגיע לנקודה (401 אחיד על טוקן שגוי), לא 413
    r = c.post("/api/connect/orbit", json={"token": "x" * 100})
    assert r.status_code != 413


def test_bad_content_length_rejected(svc):
    code, n, _ = _post_chunked(_app(svc), "/api/connect/orbit", 3,
                               [(b"content-length", b"abc")])
    assert code == 413 and n == 0

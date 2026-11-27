"""מבקר סבב 267 (🟠, גבי חיבורים): אין תקרת גודל לגוף הבקשה בשרת.

`/api/connect/orbit` — נקודה **ציבורית, לפני אימות** — קוראת `await request.body()` ורק אז בודקת
`len(raw) > 6144`. כך גם /import/csv (2MB נבדק ב-csv_import.parse, אחרי שהכול כבר בזיכרון) והוובהוקים.
אין middleware שבודק Content-Length / סופר בתים תוך כדי קריאה, ו-uvicorn לא מגביל גוף כברירת מחדל ⇒
בקשה אחת של כמה GB בלי שום אימות נצברת כולה בזיכרון לפני ה-413 (מניעת שירות; מגבלת הקצב סופרת
בקשות, לא בתים). הבדיקה מריצה את אפליקציית ה-ASGI ישירות עם גוף ב-200 נתחים של 64KB וסופרת כמה
נתחים השרת משך לפני שענה. מצופה: Content-Length מעל התקרה ⇒ 413 בלי לקרוא את הגוף (≤2 נתחים).
רכיב: app/main.py → create_app (middleware / connect_orbit_verify, import_csv, webhooks).
"""
from __future__ import annotations

import asyncio

from app.main import create_app
from app.ratelimit import RateLimiter
from tests.conftest import OWNER_TOKEN

CHUNK = b"x" * 65536
CHUNKS = 200   # ≈13MB


def _post(app, path: str, headers: list[tuple[bytes, bytes]]):
    pulled = {"n": 0}
    status = {}

    async def receive():
        if pulled["n"] >= CHUNKS:
            return {"type": "http.disconnect"}
        pulled["n"] += 1
        return {"type": "http.request", "body": CHUNK, "more_body": pulled["n"] < CHUNKS}

    async def send(msg):
        if msg["type"] == "http.response.start":
            status["code"] = msg["status"]

    scope = {"type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1", "method": "POST",
             "scheme": "http", "path": path, "raw_path": path.encode(), "query_string": b"",
             "root_path": "", "client": ("203.0.113.9", 5555), "server": ("testserver", 80),
             "headers": [(b"host", b"testserver"),
                         (b"content-length", str(len(CHUNK) * CHUNKS).encode()), *headers]}
    asyncio.run(app(scope, receive, send))
    return status.get("code"), pulled["n"]


def test_public_orbit_connect_reads_whole_body_before_413_control(svc):
    """בקרה: היום ה-413 מגיע, אבל רק אחרי שכל 200 הנתחים נמשכו לזיכרון."""
    app = create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={}))
    code, n = _post(app, "/api/connect/orbit", [(b"content-type", b"application/json")])
    assert code == 413


def test_public_orbit_connect_rejects_oversized_without_reading(svc):
    app = create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={}))
    code, n = _post(app, "/api/connect/orbit", [(b"content-type", b"application/json")])
    assert code == 413
    assert n <= 2, f"השרת משך {n} נתחים (~{n * 64}KB) לפני הדחייה"


def test_csv_import_rejects_oversized_without_reading(svc):
    app = create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={}))
    code, n = _post(app, "/import/csv", [(b"authorization", f"Bearer {OWNER_TOKEN}".encode())])
    assert code in (400, 413)
    assert n <= 2, f"השרת משך {n} נתחים (~{n * 64}KB) לפני הדחייה"

from __future__ import annotations

import json
from datetime import datetime

import httpx
import pytest

from app.config import load_settings
from app.db import DB
from app.greeninvoice import GreenInvoiceClient
from app.policy import TZ
from app.service import CollectService

SANDBOX = "https://sandbox.d.greeninvoice.co.il/api/v1"
OWNER_TOKEN = "test-owner-token-0123456789abcdefXYZ"  # רק לבדיקות
AUTH = {"Authorization": f"Bearer {OWNER_TOKEN}"}


def gi_doc(i: int, *, amount="1200.00", phone="050-1234567", due="2026-10-01",
           client_id=None, name="דנה כהן"):
    return {"id": f"doc{i}", "number": str(1000 + i), "type": 305, "status": 0,
            "amount": amount, "currency": "ILS", "documentDate": "2026-09-15", "dueDate": due,
            "client": {"id": client_id or f"cl{i}", "name": name, "phone": phone,
                       "emails": [f"c{i}@example.com"]}}


class FakeGreenInvoice:
    """שרת sandbox מדומה — סופר קריאות, מאמת Authorization."""

    def __init__(self, docs, page_size=2):
        self.docs = docs
        self.page_size = page_size
        self.token_calls = 0
        self.search_calls = 0
        self.expire_next = False
        self.forms = 0
        self.fail_forms = False
        self.fail_refresh = False
        self.refresh_calls = 0

    def handler(self, req: httpx.Request) -> httpx.Response:
        if req.url.path.endswith("/account/token"):
            body = json.loads(req.content)
            # morning 2026: grant_type חובה. המוק דוחה גוף בלי השדה (מגן מפני רגרסיה)
            if body != {"id": "test-id", "secret": "test-secret",
                        "grant_type": "client_credentials"}:
                return httpx.Response(401, json={"errorMessage": "bad"})
            self.token_calls += 1
            return httpx.Response(200, json={"token": f"tok{self.token_calls}",
                                             "expires": 2_000_000_000})
        if req.url.path.endswith("/documents/search"):
            if not req.headers.get("authorization", "").startswith("Bearer tok"):
                return httpx.Response(401)
            if self.expire_next:
                self.expire_next = False
                return httpx.Response(401)
            self.search_calls += 1
            body = json.loads(req.content)
            if set(body["type"]) & {300, 305} and 330 not in body["type"] and \
                    set(body["status"]) == {0}:
                docs = self.docs                    # חיפוש החוב הפתוח — כמו קודם, בלי סינון סוג
            else:
                # ממצא 2.16: זיכויים (330) / מסמכי-המשך סגורים — מסנן לפי סוג וסטטוס כמו השרת
                assert body["type"] in ([330], [305, 320]), body
                docs = [d for d in self.docs if d.get("type") in body["type"]
                        and d.get("status", 0) in body["status"]]
            page = body["page"]
            ps = body["pageSize"]
            items = docs[(page - 1) * ps: page * ps]
            pages = max(1, -(-len(docs) // ps))
            return httpx.Response(200, json={"items": items, "page": page, "pages": pages,
                                             "total": len(docs), "pageSize": ps})
        if req.method == "GET" and "/documents/" in req.url.path:
            # ר-4: רענון מסמך יחיד לפני שליחה. fail_refresh ⇒ 500 (כשל רענון חוסם שליחה)
            if not req.headers.get("authorization", "").startswith("Bearer tok"):
                return httpx.Response(401)
            if self.fail_refresh:
                return httpx.Response(500)
            self.refresh_calls += 1
            doc_id = req.url.path.rsplit("/", 1)[1]
            doc = next((d for d in self.docs if d["id"] == doc_id), None)
            return httpx.Response(200, json=doc) if doc else httpx.Response(404)
        if req.url.path.endswith("/payments/form"):
            if self.fail_forms:
                return httpx.Response(500)
            body = json.loads(req.content)
            assert body["amount"] > 0 and body["custom"].startswith("doc")
            self.forms += 1
            self.last_form_amount = body["amount"]
            return httpx.Response(200, json={"errorCode": 0,
                                             "url": f"https://pay.greeninvoice.co.il/f/{body['custom']}"})
        return httpx.Response(404)


class Clock:
    def __init__(self, dt: datetime):
        self.now = dt

    def __call__(self) -> datetime:
        return self.now


@pytest.fixture
def clock():
    # ראשון 8.11.2026 10:00 שעון ישראל
    return Clock(datetime(2026, 11, 8, 10, 0, tzinfo=TZ))


@pytest.fixture
def fake_gi():
    return FakeGreenInvoice([gi_doc(1), gi_doc(2, phone="+972-52-7654321", name="יוסי לוי"),
                             gi_doc(3, amount="0")])


@pytest.fixture
def gi_client(fake_gi):
    return GreenInvoiceClient(SANDBOX, "test-id", "test-secret",
                              transport=httpx.MockTransport(fake_gi.handler))


@pytest.fixture
def svc(gi_client, clock):
    s = load_settings({"BUSINESS_NAME": "סטודיו מאיר", "SMS_SENDER_ID": "StudioMeir",
                       "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/studio",
                       "PUBLIC_BASE_URL": "https://gabi.example",
                       "SMS_WEBHOOK_KEY": "whk-test", "EMAIL_REPLY_TO": "owner@studio.example",
                       "EMAIL_WEBHOOK_KEY": "ewk-test",
                       "REAL_DATA_ALLOWED": "1"})   # בדיקות הלוגיקה; השער עצמו נבדק ב-test_real_data_gate
    return CollectService(s, DB(":memory:"), gi=gi_client, clock=clock)


@pytest.fixture(autouse=True)
def no_real_network(monkeypatch):
    """כל ניסיון לפתוח חיבור רשת אמיתי בבדיקות ⇒ כישלון."""
    import socket

    def boom(*a, **k):
        raise AssertionError("ניסיון חיבור רשת אמיתי בבדיקות!")

    monkeypatch.setattr(socket, "create_connection", boom)
    monkeypatch.setattr(socket.socket, "connect", boom)

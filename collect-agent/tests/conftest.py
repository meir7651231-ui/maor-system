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

    def handler(self, req: httpx.Request) -> httpx.Response:
        if req.url.path.endswith("/account/token"):
            body = json.loads(req.content)
            if body != {"id": "test-id", "secret": "test-secret"}:
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
            assert body["status"] == [0]
            page = body["page"]
            ps = body["pageSize"]
            items = self.docs[(page - 1) * ps: page * ps]
            pages = max(1, -(-len(self.docs) // ps))
            return httpx.Response(200, json={"items": items, "page": page, "pages": pages,
                                             "total": len(self.docs), "pageSize": ps})
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
    s = load_settings({"BUSINESS_NAME": "סטודיו מאיר", "PAYMENT_LINK": "https://pay.example/x"})
    return CollectService(s, DB(":memory:"), gi=gi_client, clock=clock)


@pytest.fixture(autouse=True)
def no_real_network(monkeypatch):
    """כל ניסיון לפתוח חיבור רשת אמיתי בבדיקות ⇒ כישלון."""
    import socket

    def boom(*a, **k):
        raise AssertionError("ניסיון חיבור רשת אמיתי בבדיקות!")

    monkeypatch.setattr(socket, "create_connection", boom)
    monkeypatch.setattr(socket.socket, "connect", boom)

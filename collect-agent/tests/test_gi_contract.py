"""בדיקות contract: GreenInvoiceClient ⇄ app/gi_mock.py (החוזה של morning API v1).

שני צדדים:
  (א) ה-mock אוכף את החוזה המתועד (שדות חובה, קודי סוג/סטטוס, עימוד, אימות, תפוגת טוקן).
  (ב) הלקוח שלנו מדבר לפי החוזה הזה (גוף טוקן, Bearer, חידוש על 401, עימוד, העשרת לקוח).
כשיהיה sandbox אמיתי — אותן בדיקות (ב) רצות מולו, וכל פער = עדכון ה-mock (ראו team/qa.md).
"""
from __future__ import annotations

import httpx
import pytest

from app.demo_data import DEMO_ID, DEMO_SECRET, demo_docs
from app.gi_mock import DOC_STATUSES, DOC_TYPES, MAX_PAGE_SIZE, GreenInvoiceMock, create_mock_app
from app.greeninvoice import GreenInvoiceClient, GreenInvoiceError, map_document, token_body

BASE = "https://sandbox.d.greeninvoice.co.il/api/v1"


class Clock:
    def __init__(self, t=1_800_000_000.0):
        self.t = t

    def __call__(self):
        return self.t


@pytest.fixture
def gclock():
    return Clock()


@pytest.fixture
def mock(gclock):
    events = []
    m = GreenInvoiceMock(api_id=DEMO_ID, api_secret=DEMO_SECRET, docs=demo_docs(), clock=gclock,
                         deliver=lambda url, p: events.append((url, p)))
    m.events = events
    return m


@pytest.fixture
def gi(mock, gclock):
    return GreenInvoiceClient(BASE, DEMO_ID, DEMO_SECRET, transport=httpx.MockTransport(mock.handler),
                              clock=gclock)


def call(mock, method, path, body=None, token=None):
    h = {"authorization": f"Bearer {token}"} if token else {}
    return mock.route(method, path, h, body)


def token(mock):
    st, out = call(mock, "POST", "/account/token", token_body(DEMO_ID, DEMO_SECRET))
    assert st == 200
    return out["token"]


# ───────── (א) ה-mock אוכף את החוזה ─────────
@pytest.mark.parametrize("body,status", [
    (None, 400), ({"id": DEMO_ID}, 400),
    ({"id": DEMO_ID, "secret": DEMO_SECRET}, 400),                        # בלי grant_type (2026)
    ({"id": DEMO_ID, "secret": "x", "grant_type": "client_credentials"}, 401),
    (token_body(DEMO_ID, DEMO_SECRET), 200),
])
def test_token_contract(mock, body, status):
    st, out = call(mock, "POST", "/account/token", body)
    assert st == status
    if st == 200:
        assert set(out) == {"token", "expires"} and isinstance(out["expires"], int)
    else:
        assert {"errorCode", "errorMessage"} <= set(out)


def test_api_prefix_and_auth_required(mock):
    for m, p in [("POST", "/documents/search"), ("GET", "/users/me"), ("POST", "/clients/search"),
                 ("GET", "/clients/x"), ("POST", "/payments/form")]:
        assert call(mock, m, p, {})[0] == 401
        assert call(mock, m, "/api/v1" + p, {})[0] == 401   # אותו ניתוב עם הקידומת
    assert call(mock, "GET", "/users/me", token="forged")[0] == 401


def test_token_expires(mock, gclock):
    tok = token(mock)
    assert call(mock, "GET", "/users/me", token=tok)[0] == 200
    gclock.t += 3600
    assert call(mock, "GET", "/users/me", token=tok)[0] == 401


def test_documents_search_shape_filters_and_paging(mock):
    tok = token(mock)
    st, out = call(mock, "POST", "/documents/search", {"page": 1, "pageSize": 4, "status": [0],
                                                       "type": [305]}, tok)
    assert st == 200 and set(out) == {"total", "page", "pageSize", "pages", "items"}
    assert out["total"] == 6 and out["pages"] == 2 and len(out["items"]) == 4
    st, out2 = call(mock, "POST", "/documents/search", {"page": 2, "pageSize": 4, "status": [0],
                                                        "type": [305]}, tok)
    assert len(out2["items"]) == 2
    ids = [d["id"] for d in out["items"] + out2["items"]]
    assert len(set(ids)) == 6                                 # אין כפילות בין עמודים
    for d in out["items"]:
        assert {"id", "number", "type", "status", "amount", "currency", "documentDate",
                "client"} <= set(d)
    assert call(mock, "POST", "/documents/search", {"type": [300]}, tok)[1]["total"] == 0


@pytest.mark.parametrize("body", [{"type": [999]}, {"status": [7]}, {"type": 305},
                                  {"pageSize": MAX_PAGE_SIZE + 1}, {"page": 0}])
def test_documents_search_rejects_invalid(mock, body):
    assert call(mock, "POST", "/documents/search", body, token(mock))[0] == 400


def test_documented_codes():
    assert {300, 305, 320, 330, 400} <= DOC_TYPES and DOC_STATUSES == {0, 1, 2, 3, 4}


def test_clients_crud_and_search(mock):
    tok = token(mock)
    assert call(mock, "POST", "/clients", {"emails": ["a@example.com"]}, tok)[0] == 400
    assert call(mock, "POST", "/clients", {"name": "x", "emails": "a@b"}, tok)[0] == 400
    st, c = call(mock, "POST", "/clients", {"name": "חברת בדיקה (דמו)", "emails": ["t@example.com"],
                                            "phone": "050-0000099", "taxId": "000000000",
                                            "hacker": "ignored"}, tok)
    assert st == 200 and c["id"] and "hacker" not in c and c["active"] is True
    assert call(mock, "GET", f"/clients/{c['id']}", token=tok)[1]["phone"] == "050-0000099"
    st, c2 = call(mock, "PUT", f"/clients/{c['id']}", {"phone": "052-0000098", "id": "steal"}, tok)
    assert c2["phone"] == "052-0000098" and c2["id"] == c["id"]
    st, res = call(mock, "POST", "/clients/search", {"name": "בדיקה", "page": 1, "pageSize": 10}, tok)
    assert res["total"] == 1 and res["items"][0]["id"] == c["id"]
    assert call(mock, "DELETE", f"/clients/{c['id']}", token=tok)[0] == 200
    assert call(mock, "GET", f"/clients/{c['id']}", token=tok)[0] == 404
    # לקוח עם מסמך פתוח לא נמחק
    assert call(mock, "DELETE", "/clients/dcl1", token=tok)[0] == 409


def test_payments_form_contract(mock):
    tok = token(mock)
    assert call(mock, "POST", "/payments/form", {"amount": 0}, tok)[0] == 400
    st, out = call(mock, "POST", "/payments/form", {"amount": 12.5, "currency": "ILS"}, tok)
    assert st == 200 and out["url"].startswith("https://")


def test_webhook_on_payment_has_documented_payload(mock):
    assert call(mock, "POST", "/_mock/webhooks", {"url": "https://evil.example/x"})[0] == 400
    call(mock, "POST", "/_mock/webhooks", {"url": "http://127.0.0.1:1/webhooks/greeninvoice?k=s"})
    st, out = call(mock, "POST", "/_mock/documents/demo5/pay")
    assert st == 200 and mock.docs["demo5"]["status"] == 1
    (url, p), = mock.events
    assert url.endswith("?k=s")
    assert {"id", "type", "number", "currency", "date", "total", "recipient", "items", "files"} <= set(p)
    assert p["type"] == 400 and p["id"] == out["receipt"]           # קבלה = אירוע יצירת מסמך
    assert set(p["recipient"]) == {"name", "emails"} and set(p["files"]["downloadLinks"]) == {"he", "en"}


# ───────── (ב) הלקוח שלנו מדבר לפי החוזה ─────────
def test_client_reads_all_open_invoices_across_pages(gi, mock):
    invs = list(gi.iter_open_invoices(page_size=4))
    assert sorted(i.number for i in invs) == [str(2000 + i) for i in range(1, 7)]
    assert ("POST", "/account/token") in mock.requests
    assert sum(1 for r in mock.requests if r == ("POST", "/documents/search")) == 2
    assert sum(1 for r in mock.requests if r == ("POST", "/account/token")) == 1   # טוקן אחד


def test_client_refreshes_expired_token(gi, mock, gclock):
    list(gi.iter_open_invoices())
    gclock.t += 3601
    list(gi.iter_open_invoices())
    assert sum(1 for r in mock.requests if r == ("POST", "/account/token")) == 2


def test_client_recovers_from_revoked_token(gi, mock):
    list(gi.iter_open_invoices())
    mock.tokens.clear()                       # morning ביטלה את הטוקן (401) ⇒ חידוש חד-פעמי
    assert len(list(gi.iter_open_invoices())) == 6


def test_closed_document_disappears_from_open_sync(gi, mock):
    call(mock, "POST", "/_mock/documents/demo5/pay")
    assert "2005" not in [i.number for i in gi.iter_open_invoices()]


def test_client_enriches_missing_contact_from_clients_endpoint(gi, mock):
    """אם המסמך לא נושא טלפון/מייל — משלימים מ-GET /clients/{id} (פעם אחת לכל לקוח)."""
    d = mock.docs["demo1"]
    d["client"] = {"id": "dcl1", "name": d["client"]["name"]}
    mock.clients["dcl1"].update(phone="050-0000001", emails=["dana@example.com"])
    inv = next(i for i in gi.iter_open_invoices() if i.number == "2001")
    assert inv.client_phone == "050-0000001" and inv.client_email == "dana@example.com"
    assert mock.requests.count(("GET", "/clients/dcl1")) == 1


def test_client_clients_and_me(gi):
    assert gi.me()["id"]
    assert gi.search_clients(name="דנה")["total"] == 1
    assert gi.get_client("dcl2")["name"].startswith("יוסי")
    with pytest.raises(KeyError):
        gi.get_client("nope")


def test_map_document_on_mock_output(mock):
    inv = map_document(mock.docs["demo2"])
    assert inv.amount_agorot == 345050 and inv.client_email == "yossi@example.com"


def test_bad_credentials_raise(mock):
    bad = GreenInvoiceClient(BASE, DEMO_ID, "wrong", transport=httpx.MockTransport(mock.handler))
    with pytest.raises(GreenInvoiceError):
        list(bad.iter_open_invoices())


def test_client_refuses_non_sandbox_non_loopback():
    with pytest.raises(GreenInvoiceError):
        GreenInvoiceClient("https://api.greeninvoice.co.il/api/v1", "a", "b")
    with pytest.raises(GreenInvoiceError):
        GreenInvoiceClient("http://10.0.0.5/api/v1", "a", "b")
    GreenInvoiceClient("http://127.0.0.1:9/api/v1", "a", "b").close()


def test_mock_asgi_app_same_contract(mock):
    from fastapi.testclient import TestClient

    c = TestClient(create_mock_app(mock))
    assert c.post("/api/v1/account/token", content=b"{bad").status_code == 400
    tok = c.post("/api/v1/account/token", json=token_body(DEMO_ID, DEMO_SECRET)).json()["token"]
    r = c.post("/api/v1/documents/search", json={"status": [0]}, headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200 and r.json()["total"] == 6


def test_app_webhook_triggers_sync(svc, fake_gi):
    """webhook ⇒ סנכרון מיידי; בלי מפתח ⇒ 403; ה-payload הוא רק טריגר."""
    from dataclasses import replace

    from fastapi.testclient import TestClient

    from app.main import create_app
    from tests.conftest import OWNER_TOKEN

    svc.s = replace(svc.s, gi_webhook_key="k" * 32)
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert c.post("/webhooks/greeninvoice", json={"id": "x"}).status_code == 403
    assert c.post("/webhooks/greeninvoice?k=wrong", json={"id": "x"}).status_code == 403
    assert c.post(f"/webhooks/greeninvoice?k={'k' * 32}", json={}).status_code == 400
    svc.sync()
    fake_gi.docs = [d for d in fake_gi.docs if d["id"] != "doc1"]
    r = c.post(f"/webhooks/greeninvoice?k={'k' * 32}", json={"id": "rcpt1", "type": 400})
    assert r.status_code == 200 and r.json()["sync"]["closed"] == 1
    assert svc.db.one("SELECT 1 FROM audit WHERE action='gi_webhook'")

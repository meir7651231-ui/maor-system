"""ממשק «מקור חשבוניות» (app/integrations/sources.py): בחירת מערכת בהגדרות, בידוד בין ספקים,
webhook כטריגר בלבד, וקריאה בלבד מכל ה-adapters. חשבונית ירוקה — אותה התנהגות כמו קודם."""
from __future__ import annotations

import ast
import dataclasses
import json
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import load_settings
from app.db import DB
from app.demo_data import demo_source_factory
from app.greeninvoice import GreenInvoiceClient, Invoice
from app.icount_mock import ICountMock, demo_clients, demo_docs
from app.integrations import ezcount, icount, rivhit
from app.integrations.icount import ICountClient
from app.integrations.sources import (
    SOURCE_KEYS,
    SOURCE_SYSTEMS,
    GreenInvoiceSource,
    InvoiceSource,
    build_source,
    parse_il_date,
    provider_of,
)
from app.main import create_app
from app.service import CollectService
from tests.conftest import AUTH, OWNER_TOKEN

ADAPTERS = (icount, rivhit, ezcount)


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _inv(ext: str, amount: int = 10000) -> Invoice:
    return Invoice(external_id=ext, number=ext[-4:], doc_type=305, amount_agorot=amount, currency="ILS",
                   issued=None, due=None, client_external_id="", client_name="לקוח",
                   client_phone="050-0000099", client_email="x@example.com")


# ---------- הממשק ----------
def test_greeninvoice_implements_interface_unchanged(gi_client):
    assert isinstance(gi_client, InvoiceSource) and gi_client.provider == "greeninvoice"
    src = GreenInvoiceSource(gi_client)
    assert isinstance(src, InvoiceSource)
    assert src.get_document("doc1").number == "1001"


def test_registry_and_provider_of():
    assert SOURCE_KEYS == ("greeninvoice", "icount", "rivhit", "ezcount", "csv")
    assert provider_of("doc1") == "greeninvoice" and provider_of("icount:invoice-1") == "icount"
    assert provider_of("rivhit:1:1:1") == "rivhit" and provider_of("ezcount:u") == "ezcount"
    assert provider_of("csv:1001") == "csv"
    for s in SOURCE_SYSTEMS.values():
        assert (s.kind == "csv") == (s.key == "csv")
        assert all(d.startswith("https://") for d in s.docs)


def test_parse_il_date_formats():
    assert parse_il_date("01/10/2026").isoformat() == "2026-10-01"
    assert parse_il_date("2026-10-01T00:00:00").isoformat() == "2026-10-01"
    assert parse_il_date("31/02/2026") is None and parse_il_date("") is None


def test_build_source_needs_secrets_and_never_networks():
    assert build_source("icount", lambda f: None) is None
    assert build_source("ezcount", {"ezcount_api_key": "k"}.get) is None    # חסר developer_email
    src = build_source("rivhit", {"rivhit_api_token": "t"}.get)
    assert src is not None and src.provider == "rivhit"
    with pytest.raises(Exception, match="שלב 1"):
        list(src.iter_open_invoices())


def _code_strings(mod) -> list[str]:
    """מחרוזות בקוד (בלי docstrings) — שם יופיע כל נתיב שה-adapter קורא אליו."""
    tree = ast.parse(Path(mod.__file__).read_text(encoding="utf-8"))
    docs = {id(n.body[0].value) for n in ast.walk(tree)
            if isinstance(n, (ast.Module, ast.FunctionDef, ast.ClassDef)) and n.body
            and isinstance(n.body[0], ast.Expr) and isinstance(n.body[0].value, ast.Constant)}
    return [n.value for n in ast.walk(tree)
            if isinstance(n, ast.Constant) and isinstance(n.value, str) and id(n) not in docs]


@pytest.mark.parametrize("mod", ADAPTERS, ids=lambda m: m.__name__)
def test_adapters_are_read_only_static(mod):
    """הכרעת מאיר: גבי רק קורא. אף adapter לא מכיל נתיב של יצירה/עדכון/ביטול/סגירה/שליחה."""
    write = ("create", "edit", "cancel", "close", "reopen", "delete", "update", "send", "new",
             "webhook/add", "email", "sms", "approval")
    for s in _code_strings(mod):
        if s.startswith("/") or "." in s and s[:1].isupper():   # נתיב / שם פעולה (Document.X)
            assert not any(w in s.lower() for w in write), f"{mod.__name__}: {s}"


# ---------- בחירה בהגדרות (DESIGN.md §3ב) ----------
def test_default_source_is_greeninvoice_and_contract_shape(api):
    src = api.get("/settings").json()["source"]
    assert src["system"] == "greeninvoice" and src["type"] == "api" and src["api_connected"] is True
    assert [x["key"] for x in src["systems"]] == list(SOURCE_KEYS)
    assert src["key_intake"] == "not_available_stage1"
    assert set(src["secrets"]) == {"gi_api_id", "gi_api_secret"}
    assert set(src["secrets"].values()) <= {"set", "missing"}


def test_choose_icount_persists_and_is_not_connected_without_mock(api, svc):
    r = api.put("/settings", json={"source": {"system": "icount"}})
    assert r.status_code == 200, r.text
    src = r.json()["source"]
    assert src["system"] == "icount" and src["system_label"] == "iCount"
    assert src["api_connected"] is False and src["secrets"] == {"icount_api_token": "missing"}
    s = api.post("/sync")
    assert s.status_code == 503 and "iCount" in s.json()["detail"]
    assert any(a["action"] == "source_system_changed" for a in api.get("/audit").json())
    assert CollectService(load_settings({}), svc.db).s.source_system == "icount"   # נשמר ב-DB
    # חזרה לחשבונית ירוקה ⇒ החיבור הקיים חוזר, הסנכרון עובד כמו קודם
    assert api.put("/settings", json={"source": {"system": "greeninvoice"}}).json()["source"]["api_connected"]
    assert api.post("/sync").json() == {"open": 2, "closed": 0}


def test_choose_csv(api):
    src = api.put("/settings", json={"source": {"system": "csv"}}).json()["source"]
    assert src["type"] == "csv" and src["api_connected"] is False
    r = api.post("/sync")
    assert r.status_code == 503 and "CSV" in r.json()["detail"]


@pytest.mark.parametrize("body", [
    {"source": {"system": "paypal"}},
    {"source": {"type": "csv"}},
    {"source": {"system": "icount", "api_connected": True}},
    {"source": {"system": "icount", "api_token": "real"}},
    {"source": "icount"},
])
def test_invalid_source_body_rejected_nothing_changes(api, svc, body):
    assert api.put("/settings", json=body).status_code == 422
    assert svc.s.source_system == "greeninvoice"


def test_full_settings_api_accepts_source_system(api):
    v = api.put("/api/settings", json={"source_system": "rivhit"}).json()
    assert v["source"]["system"] == "rivhit" and v["source"]["label"] == "רווחית"
    assert api.put("/api/settings", json={"source_system": "sap"}).status_code == 422


@pytest.mark.parametrize("system", ["greeninvoice", "icount", "rivhit", "ezcount"])
def test_source_key_still_501_and_nothing_stored(api, svc, system):
    api.put("/settings", json={"source": {"system": system}})
    r = api.post("/settings/source/key", json={"api_token": "real-token-123", "secret": "s"})
    assert r.status_code == 501 and SOURCE_SYSTEMS[system].label in r.json()["detail"]
    flat = json.dumps(api.get("/settings").json(), ensure_ascii=False)
    assert "real-token-123" not in flat and "test-secret" not in flat
    try:
        rows = svc.db.q("SELECT * FROM business_secrets")
    except Exception:  # noqa: BLE001 — הטבלה אולי לא נוצרה בכלל
        rows = []
    assert rows == []


def test_unknown_stored_source_is_ignored(svc):
    svc.db.x("INSERT INTO business_settings(key,value,updated_at) VALUES('source_system','\"sap\"','t')")
    assert CollectService(load_settings({}), svc.db).s.source_system == "greeninvoice"


# ---------- בידוד בין ספקים ----------
def test_gi_sync_does_not_close_other_provider_invoices(svc):
    svc.ingest([_inv("icount:invoice-7001")], full=False)
    svc.sync()
    st = svc.db.one("SELECT status FROM invoices WHERE external_id='icount:invoice-7001'")["status"]
    assert st == "open"


def test_icount_sync_closes_only_its_own(svc, clock):
    svc.sync()      # חשבוניות GI: doc1, doc2
    mock = ICountMock(api_token="T", docs=demo_docs(), clients=demo_clients())
    svc._sources["icount"] = ICountClient(api_token="T", transport=httpx.MockTransport(mock.handler))
    svc.update_settings({"source_system": "icount"})
    assert svc.sync() == {"open": 2, "closed": 0}
    mock.pay("invoice", 3001)
    assert svc.sync() == {"open": 1, "closed": 1}
    gi_open = svc.db.q("SELECT external_id FROM invoices WHERE status='open' AND external_id LIKE 'doc%'")
    assert len(gi_open) == 2


def test_refresh_never_asks_wrong_provider(svc, fake_gi):
    """חשבונית iCount כשהמקור חשבונית ירוקה ⇒ refresh_failed (לא נשלחת ולא נסגרת), בלי קריאה ל-GI."""
    svc.ingest([_inv("icount:invoice-7001")], full=False)
    iid = svc.db.one("SELECT id FROM invoices WHERE external_id='icount:invoice-7001'")["id"]
    cust = svc.db.one("SELECT customer_id FROM invoices WHERE id=?", (iid,))["customer_id"]
    assert svc.refresh_customer(cust) is False
    assert fake_gi.refresh_calls == 0
    assert svc.db.one("SELECT status FROM invoices WHERE id=?", (iid,))["status"] == "open"


def test_switching_with_factory_builds_once_and_keeps_gi(clock, gi_client):
    factory, mocks = demo_source_factory()
    calls = []
    s = load_settings({"BUSINESS_NAME": "סטודיו", "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/x"})
    svc = CollectService(s, DB(":memory:"), gi=gi_client, clock=clock,
                         source_factory=lambda k: calls.append(k) or factory(k))
    for system, n in (("icount", 2), ("rivhit", 2), ("ezcount", 1)):
        svc.update_settings({"source_system": system})
        assert svc.gi.provider == system and svc.sync()["open"] == n
    svc.update_settings({"source_system": "icount"})
    svc.update_settings({"source_system": "greeninvoice"})
    assert svc.gi is gi_client and calls == ["icount", "rivhit", "ezcount"]
    assert all(m.write_attempts == [] for m in mocks.values())


def test_service_starts_on_stored_source(clock, gi_client):
    s = load_settings({"BUSINESS_NAME": "סטודיו", "SOURCE_SYSTEM": "rivhit"})
    factory, _ = demo_source_factory()
    svc = CollectService(s, DB(":memory:"), gi=gi_client, clock=clock, source_factory=factory)
    assert svc.gi.provider == "rivhit"
    assert CollectService(s, DB(":memory:"), gi=gi_client, clock=clock).gi is None


def test_demo_service_offers_all_mocks():
    from app.demo import build_demo_service
    svc, _, _ = build_demo_service()
    for system in ("icount", "rivhit", "ezcount"):
        svc.update_settings({"source_system": system})
        assert svc.design_settings()["source"]["api_connected"] is True
        assert svc.sync()["open"] >= 1


# ---------- webhook (טריגר בלבד) ----------
def _webhook_app(svc, system="icount", key="swk-test"):
    factory, mocks = demo_source_factory()
    svc._source_factory = factory
    svc.s = dataclasses.replace(svc.s, source_webhook_key=key)
    svc.update_settings({"source_system": system})
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN)), mocks


def test_source_webhook_triggers_sync(svc):
    pub, _ = _webhook_app(svc)
    r = pub.post("/webhooks/source/icount?k=swk-test", json={"doctype": "invoice", "docnum": 3001})
    assert r.status_code == 200 and r.json() == {"ok": True, "sync": {"open": 2, "closed": 0}}
    assert pub.post("/webhooks/source/icount?k=wrong", json={}).status_code == 403
    assert pub.post("/webhooks/source/icount", json={}).status_code == 403
    assert pub.post("/webhooks/source/rivhit?k=swk-test", json={}).status_code == 404   # לא המקור הנבחר
    assert pub.post("/webhooks/source/icount?k=swk-test", content=b"[1]").status_code == 400


def test_source_webhook_closed_without_key_or_for_sources_without_webhook(svc):
    pub, _ = _webhook_app(svc, key="")
    assert pub.post("/webhooks/source/icount?k=", json={}).status_code == 403
    pub, _ = _webhook_app(svc, system="rivhit")
    assert pub.post("/webhooks/source/rivhit?k=swk-test", json={}).status_code == 404   # אין webhook מתועד


def test_greeninvoice_client_type_unchanged():
    """רגרסיה: GreenInvoiceClient לא הפך ל-wrapper — השירות מקבל אותו ישירות כמו קודם."""
    assert GreenInvoiceClient.provider == "greeninvoice"
    assert hasattr(GreenInvoiceClient, "iter_open_invoices") and hasattr(GreenInvoiceClient, "get_document")

"""בדיקות contract: RivhitClient ⇄ app/rivhit_mock.py (Rivhit Online API, צד הקריאה).

(א) ה-mock אוכף את החוזה המתועד (api_token בגוף, error_code/client_message, data.open_documents).
(ב) הלקוח: דוח יתרות פתוחות + Customer.Get לפרטי קשר, תאריכי DD/MM/YYYY, רענון לפי לקוח+סוג.
"""
from __future__ import annotations

import httpx
import pytest

from app.config import SafetyError, load_settings
from app.db import DB
from app.integrations.base import IntegrationError, ProviderError
from app.integrations.rivhit import RivhitClient, map_rivhit_open_doc
from app.integrations.sources import InvoiceSource
from app.rivhit_mock import SVC, RivhitMock, demo_customers, demo_docs
from app.service import CollectService

TOKEN = "TOK-rivhit"


@pytest.fixture
def mock():
    return RivhitMock(api_token=TOKEN, docs=demo_docs(), customers=demo_customers())


@pytest.fixture
def rv(mock):
    return RivhitClient(api_token=TOKEN, transport=httpx.MockTransport(mock.handler))


# ───────── (א) ─────────
def test_mock_error_envelope(mock):
    st, out = mock.route("POST", SVC + "Customer.OpenDocuments", {"api_token": "bad"})
    assert st == 200 and out["error_code"] != 0 and out["client_message"]
    st, out = mock.route("POST", SVC + "Customer.OpenDocuments", {"api_token": TOKEN})
    assert out["error_code"] == 0 and len(out["data"]["open_documents"]) == 2
    st, out = mock.route("POST", SVC + "Customer.OpenDocuments", {"api_token": TOKEN, "customer_id": 22})
    assert [d["document_number"] for d in out["data"]["open_documents"]] == [7002]


def test_mock_refuses_and_records_writes(mock):
    for op in ("Document.New", "Document.Close", "Customer.Update"):
        assert mock.route("POST", SVC + op, {"api_token": TOKEN})[1]["error_code"] != 0
    assert mock.write_attempts == ["Document.New", "Document.Close", "Customer.Update"]


# ───────── (ב) ─────────
def test_client_is_an_invoice_source(rv):
    assert isinstance(rv, InvoiceSource) and rv.provider == "rivhit"


def test_iter_open_maps_balance_dates_and_contacts(rv, mock):
    shira, omer = list(rv.iter_open_invoices())
    assert shira.external_id == "rivhit:21:1:7001" and shira.number == "7001"
    assert shira.amount_agorot == 220000 and shira.due.isoformat() == "2026-10-01"
    assert shira.client_phone == "054-0000021" and shira.client_email == "shira@example.com"
    assert shira.client_external_id == "rivhit:21"
    # balance (לא total_amount); אין due_date ⇒ הנפקה+30; phone ריק ⇒ phone2
    assert omer.amount_agorot == 50000 and omer.due.isoformat() == "2026-10-15" and omer.due_estimated
    assert omer.client_phone == "050-0000022"
    ops = [op for op, _ in mock.requests]
    assert ops.count("Customer.OpenDocuments") == 1 and ops.count("Customer.Get") == 2
    assert all(b["api_token"] == TOKEN for _, b in mock.requests)
    assert mock.write_attempts == []


def test_refresh_partial_paid_and_errors(rv, mock):
    assert rv.get_document("rivhit:22:1:7002").amount_agorot == 50000
    mock.partial(22, 1, 7002, 100)
    assert rv.get_document("rivhit:22:1:7002").amount_agorot == 40000
    mock.pay(22, 1, 7002)
    closed = rv.get_document("rivhit:22:1:7002")
    assert closed.status == 1 and closed.amount_agorot == 0
    for bad in ("doc1", "rivhit:22:7002", "rivhit:a:b:c"):
        with pytest.raises(IntegrationError):
            rv.get_document(bad)


def test_bad_token_and_no_transport(mock):
    with pytest.raises(ProviderError):
        list(RivhitClient(api_token="bad", transport=httpx.MockTransport(mock.handler)).iter_open_invoices())
    with pytest.raises(SafetyError):
        list(RivhitClient(api_token=TOKEN).iter_open_invoices())
    with pytest.raises(IntegrationError):
        RivhitClient(api_token="")


@pytest.mark.parametrize("row,agorot", [
    ({"balance": 100.0, "currency_id": 2}, 0),        # מטבע לא ידוע ⇒ לא מזכירים (לאמת)
    ({"total_amount": 100.0}, 0),                     # אין balance ⇒ לא חוב
    ({"balance": 99.995, "currency_id": 1}, 10000),
])
def test_conservative_amount_regression(row, agorot):
    assert map_rivhit_open_doc({"customer_id": 1, "document_type": 1, "document_number": 1, **row}) \
        .amount_agorot == agorot


def test_full_flow_through_collect_service(mock, clock):
    s = load_settings({"BUSINESS_NAME": "סטודיו", "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/x",
                       "SOURCE_SYSTEM": "rivhit"})
    rv = RivhitClient(api_token=TOKEN, transport=httpx.MockTransport(mock.handler))
    svc = CollectService(s, DB(":memory:"), gi=rv, clock=clock)
    assert svc.sync() == {"open": 2, "closed": 0}
    mock.pay(21, 1, 7001)
    assert svc.sync() == {"open": 1, "closed": 1}
    assert mock.write_attempts == []

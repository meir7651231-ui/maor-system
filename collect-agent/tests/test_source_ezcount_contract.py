"""בדיקות contract: EZcountClient ⇄ app/ezcount_mock.py.

⚠️ צד הקריאה של EZcount לא מתועד בפומבי (SEARCH_PATH = placeholder, «לאמת»). הבדיקות כאן מוכיחות:
(א) מה שמתועד נאכף — api_key+developer_email בגוף JSON, application/json, success:true, createDoc לא נקרא;
(ב) ההתנהגות שמרנית כשחסר מידע — בלי שדה יתרה ⇒ לא חוב; רק 300/305; ביטול ⇒ לא חוב.
"""
from __future__ import annotations

import httpx
import pytest

from app.config import SafetyError, load_settings
from app.db import DB
from app.ezcount_mock import EZcountMock, demo_docs
from app.integrations import ezcount
from app.integrations.base import IntegrationError, ProviderError
from app.integrations.ezcount import EZcountClient, map_ezcount_doc
from app.integrations.sources import SOURCE_SYSTEMS, InvoiceSource
from app.service import CollectService

KEY, DEV = "KEY-ez", "dev@example.com"


@pytest.fixture
def mock():
    return EZcountMock(api_key=KEY, developer_email=DEV, docs=demo_docs())


@pytest.fixture
def ez(mock):
    return EZcountClient(api_key=KEY, developer_email=DEV, transport=httpx.MockTransport(mock.handler))


def test_read_api_is_marked_unverified():
    assert ezcount.READ_API_DOCUMENTED is False
    assert SOURCE_SYSTEMS["ezcount"].docs_verified == "read_api_undocumented"
    assert "לאמת" in ezcount.__doc__ and "SEARCH_PATH" in ezcount.__doc__


# ───────── (א) ─────────
def test_mock_enforces_documented_auth_and_json(mock):
    h = {"content-type": "application/json"}
    assert mock.route("POST", ezcount.SEARCH_PATH, h, {"api_key": "bad", "developer_email": DEV})[1]["success"] \
        is False
    assert mock.route("POST", ezcount.SEARCH_PATH, h, {"api_key": KEY})[1]["success"] is False
    assert mock.route("POST", ezcount.SEARCH_PATH, {"content-type": "text/plain"}, {})[0] == 400
    assert mock.route("POST", "/api/createDoc", h, {})[0] == 403 and mock.write_attempts == ["/api/createDoc"]


# ───────── (ב) ─────────
def test_client_is_an_invoice_source(ez):
    assert isinstance(ez, InvoiceSource) and ez.provider == "ezcount"


def test_iter_open_only_debt_with_balance(ez, mock):
    invs = list(ez.iter_open_invoices())
    assert [i.external_id for i in invs] == ["ezcount:ez-0001"]
    liat = invs[0]
    assert liat.amount_agorot == 180000 and liat.number == "40001" and liat.doc_type == 305
    assert liat.due.isoformat() == "2026-10-01" and liat.client_phone == "053-0000031"
    body = mock.requests[0]
    assert body["api_key"] == KEY and body["developer_email"] == DEV and body["types"] == [300, 305]
    assert mock.write_attempts == []


def test_refresh(ez, mock):
    assert ez.get_document("ezcount:ez-0001").amount_agorot == 180000
    mock.pay("ez-0001")
    assert ez.get_document("ezcount:ez-0001").amount_agorot == 0
    mock.cancel("ez-0001")
    assert ez.get_document("ezcount:ez-0001").status == 1
    with pytest.raises(KeyError):
        ez.get_document("ezcount:nope")
    with pytest.raises(IntegrationError):
        ez.get_document("doc1")


@pytest.mark.parametrize("doc,agorot", [
    ({"type": 305, "price_total": 500}, 0),                # אין שדה יתרה ⇒ לא מניחים שפתוח
    ({"type": 320, "price_total": 500, "balance": 500}, 0),   # חשבונית מס קבלה = שולמה
    ({"type": 300, "balance": "12.5"}, 1250),
])
def test_conservative_regression(doc, agorot):
    assert map_ezcount_doc({"doc_uuid": "u", **doc}).amount_agorot == agorot


def test_errors_and_no_network(mock):
    with pytest.raises(ProviderError):
        list(EZcountClient(api_key="bad", developer_email=DEV,
                           transport=httpx.MockTransport(mock.handler)).iter_open_invoices())
    with pytest.raises(SafetyError):
        list(EZcountClient(api_key=KEY, developer_email=DEV).iter_open_invoices())
    with pytest.raises(IntegrationError):
        EZcountClient(api_key=KEY, developer_email="")


def test_full_flow_through_collect_service(mock, clock):
    s = load_settings({"BUSINESS_NAME": "סטודיו", "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/x",
                       "SOURCE_SYSTEM": "ezcount"})
    svc = CollectService(s, DB(":memory:"), clock=clock,
                         gi=EZcountClient(api_key=KEY, developer_email=DEV,
                                          transport=httpx.MockTransport(mock.handler)))
    assert svc.sync() == {"open": 1, "closed": 0}
    mock.pay("ez-0001")
    assert svc.sync() == {"open": 0, "closed": 1}

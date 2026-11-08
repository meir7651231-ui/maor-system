"""בדיקות contract: ICountClient ⇄ app/icount_mock.py (החוזה של iCount API v3, צד הקריאה).

(א) ה-mock אוכף את החוזה המתועד (status:false+reason, אימות, empty_query, no_results_found, doc_not_found).
(ב) הלקוח מדבר לפי החוזה (doctype/status/offset/limit, עימוד, «נסגר חלקית», client/info, רענון).
כשיהיה חשבון iCount מאושר (רק באישור מאיר) — בדיקות (ב) רצות מולו וכל פער = עדכון ה-mock.
"""
from __future__ import annotations

import httpx
import pytest

from app.config import SafetyError, load_settings
from app.db import DB
from app.icount_mock import STATUS_CLOSED, STATUS_PARTIAL, ICountMock, demo_clients, demo_docs
from app.integrations.base import IntegrationError, ProviderError
from app.integrations.icount import ICountClient, map_icount_doc
from app.integrations.sources import InvoiceSource
from app.service import CollectService

TOKEN = "TOK-icount"


@pytest.fixture
def mock():
    return ICountMock(api_token=TOKEN, docs=demo_docs(), clients=demo_clients())


@pytest.fixture
def ic(mock):
    return ICountClient(api_token=TOKEN, transport=httpx.MockTransport(mock.handler), page_size=1)


def call(mock, path, body, token=TOKEN):
    h = {"authorization": f"Bearer {token}"} if token else {}
    return mock.route("POST", "/api/v3.php/" + path, h, body)


# ───────── (א) ה-mock אוכף את החוזה ─────────
def test_mock_http_200_with_status_false_on_errors(mock):
    assert call(mock, "doc/search", {"doctype": "invoice"}, token="bad") == \
        (200, {"status": False, "reason": "auth_required"})
    assert call(mock, "doc/search", {})[1]["reason"] == "empty_query"
    assert call(mock, "doc/search", {"doctype": "offer"})[1]["reason"] == "no_results_found"
    assert call(mock, "doc/info", {"doctype": "invoice", "docnum": 9})[1]["reason"] == "doc_not_found"
    assert call(mock, "auth/login", {"cid": "x", "user": "u", "pass": "p"}, token=None)[1]["reason"] \
        == "bad_login"


def test_mock_open_search_includes_partially_closed(mock):
    rows = call(mock, "doc/search", {"status": 0})[1]["results_list"]
    assert {r["status"] for r in rows} == {0, STATUS_PARTIAL}
    mock.pay("invoice", 3001)
    assert [r["docnum"] for r in call(mock, "doc/search", {"status": 0})[1]["results_list"]] == [3002]


def test_mock_refuses_and_records_write_methods(mock):
    for m in ("doc/create", "doc/cancel", "client/create", "webhook/add"):
        assert call(mock, m, {})[1] == {"status": False, "reason": "not_allowed"}
    assert mock.write_attempts == ["doc/create", "doc/cancel", "client/create", "webhook/add"]


# ───────── (ב) הלקוח מדבר לפי החוזה ─────────
def test_client_is_an_invoice_source(ic):
    assert isinstance(ic, InvoiceSource) and ic.provider == "icount"


def test_iter_open_paginates_and_enriches_contacts(ic, mock):
    invs = list(ic.iter_open_invoices())
    assert [i.external_id for i in invs] == ["icount:invoice-3001", "icount:deal-3002"]
    noa, avi = invs
    assert noa.amount_agorot == 150000 and noa.client_phone == "050-0000011" \
        and noa.client_email == "noa@example.com" and noa.doc_type == 305
    # «נסגר חלקית»: היתרה (remainingsum), לא הסכום המלא; אין duedate ⇒ הנפקה+30, מסומן כהערכה
    assert avi.amount_agorot == 40000 and avi.status == 0 and avi.client_phone == "052-0000012"
    assert avi.due.isoformat() == "2026-10-10" and avi.due_estimated is True
    searches = [b for m, b in mock.requests if m == "doc/search"]
    assert {(b["doctype"], b["status"], b["limit"]) for b in searches} == \
        {("invoice", 0, 1), ("deal", 0, 1)}
    assert all(b["detail_level"] == 2 for b in searches)
    # no_results_found בעמוד הבא = סוף עימוד, לא שגיאה; client/info פעם אחת לכל לקוח
    assert [m for m, _ in mock.requests].count("client/info") == 2
    assert mock.write_attempts == []


def test_login_flow_with_sid(mock):
    c = ICountClient(cid="demo", user="u", password="p", transport=httpx.MockTransport(mock.handler))
    assert len(list(c.iter_open_invoices())) == 2
    assert mock.requests[0] == ("auth/login", {"cid": "demo", "user": "u", "pass": "p"})
    assert all(b.get("sid") == "sid-1" for m, b in mock.requests[1:])


def test_get_document_refresh_states(ic, mock):
    list(ic.iter_open_invoices())
    assert ic.get_document("icount:invoice-3001").amount_agorot == 150000
    mock.partial("invoice", 3001, 500)
    assert ic.get_document("icount:invoice-3001").amount_agorot == 100000
    mock.pay("invoice", 3001)
    assert ic.get_document("icount:invoice-3001").status == STATUS_CLOSED
    mock.cancel("deal", 3002)
    assert ic.get_document("icount:deal-3002").status == 4
    with pytest.raises(KeyError):
        ic.get_document("icount:invoice-9999")


def test_get_document_refuses_foreign_or_unknown_ids(ic):
    with pytest.raises(IntegrationError):
        ic.get_document("doc1")                 # חשבונית ירוקה
    with pytest.raises(IntegrationError):
        ic.get_document("icount:legacy-id")     # לא נראה בסנכרון ואין doctype-docnum


def test_bad_token_is_provider_error(mock):
    c = ICountClient(api_token="WRONG", transport=httpx.MockTransport(mock.handler))
    with pytest.raises(ProviderError, match="auth_required"):
        list(c.iter_open_invoices())


def test_no_transport_never_touches_network():
    c = ICountClient(api_token=TOKEN)
    with pytest.raises(SafetyError):
        list(c.iter_open_invoices())
    with pytest.raises(SafetyError):
        c.get_document("icount:invoice-1")


@pytest.mark.parametrize("doc,agorot", [
    ({"status": 2, "totalwithvat": 900}, 0),                       # חלקי בלי יתרה ידועה ⇒ לא מזכירים
    ({"status": 0, "totalwithvat": 900}, 90000),
    ({"status": 0, "totalwithvat": 900, "remainingsum": "120.5"}, 12050),
])
def test_amount_is_conservative_regression(doc, agorot):
    assert map_icount_doc({"doctype": "invoice", "docnum": 1, **doc}).amount_agorot == agorot


def test_full_flow_through_collect_service(mock, clock):
    """אותו CollectService: סנכרון ⇒ תזכורת ⇒ רענון לפני שליחה ⇒ תשלום סוגר."""
    s = load_settings({"BUSINESS_NAME": "סטודיו", "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/x",
                       "SOURCE_SYSTEM": "icount"})
    ic = ICountClient(api_token=TOKEN, transport=httpx.MockTransport(mock.handler))
    svc = CollectService(s, DB(":memory:"), gi=ic, clock=clock)
    assert svc.sync() == {"open": 2, "closed": 0}
    rid = svc.plan()[0]
    svc.approve(rid)
    mock.pay("invoice", 3001)
    svc.dispatch()
    assert svc._reminder(rid)["status"] == "cancelled"
    assert svc.sync() == {"open": 1, "closed": 0}   # כבר סגורה ע״י הרענון
    assert mock.write_attempts == []


# ───────── זיכויים (critic סבב 21 · 21.1/21.2) ─────────
def test_refunds_are_read_only_with_tolerant_link_and_marked_unverified(ic, mock):
    """refund = חשבונית זיכוי; הקישור ב-based_on — שניהם «לאמת» ומתועדים ככאלה."""
    from app.integrations import icount
    assert "refund" in icount.__doc__ and "לאמת" in icount.__doc__ and "based_on" in icount.__doc__
    n = mock.credit("invoice", 3001, 250)
    list(ic.iter_open_invoices())
    [c] = list(ic.iter_credits())
    assert (c.doc_type, c.amount_agorot, c.linked_ids) == (330, 25000, ("icount:invoice-3001",))
    # חיפוש הזיכויים בלי פילטר סטטוס (סטטוס של זיכוי לא מתועד) ⇒ גם «סגור» נספר; מבוטל לא
    assert all("status" not in b for m, b in mock.requests
               if m == "doc/search" and b["doctype"] == "refund")
    mock.cancel("refund", n)
    assert list(ic.iter_credits()) == []
    assert map_icount_doc({"doctype": "refund", "docnum": 1, "totalwithvat": -90,
                           "orig_doctype": "deal", "orig_docnum": 7}).linked_ids == ("icount:deal-7",)
    assert mock.write_attempts == []


def test_credits_for_and_open_debts(ic, mock):
    mock.credit("invoice", 3001, 400)
    net = ic.open_debts()
    assert {i.external_id: i.amount_agorot for i in net.invoices} == \
        {"icount:invoice-3001": 110000, "icount:deal-3002": 40000} and net.review == []
    assert ic.credits_for("icount:invoice-3001") == 40000
    with pytest.raises(IntegrationError):
        ic.credits_for("doc1")

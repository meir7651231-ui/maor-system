"""iCount + Green Invoice source (קריאה בלבד, MockTransport)."""
import json

import httpx
import pytest

from app.config import SafetyError, load_settings
from app.db import DB
from app.integrations.accounting import GreenInvoiceSource, ICountClient, map_icount_doc
from app.integrations.base import IntegrationError
from app.service import CollectService


def icount_doc(i, *, balance="500.50", doctype="invoice", phone="052-7654321"):
    return {"doc_id": f"d{i}", "doctype": doctype, "docnum": str(2000 + i),
            "client_id": f"c{i}", "client_name": "רונית אברהם", "client_mobile": phone,
            "client_email": f"r{i}@example.com", "balance": balance,
            "currency_code": "ILS", "dateissued": "2026-09-20", "duedate": "2026-10-20"}


class FakeICount:
    def __init__(self, docs_by_type, page_size=2, *, expire_once=False):
        self.docs, self.ps = docs_by_type, page_size
        self.logins = 0
        self.searches = []
        self.expire_once = expire_once

    def handler(self, req):
        b = json.loads(req.content)
        if req.url.path.endswith("/auth/login"):
            if b != {"cid": "co", "user": "u", "pass": "p"}:
                return httpx.Response(200, json={"status": False, "reason": "bad_login"})
            self.logins += 1
            return httpx.Response(200, json={"status": True, "sid": f"sid{self.logins}"})
        if req.url.path.endswith("/doc/search"):
            if req.headers.get("authorization") != "Bearer TOK" and \
                    b.get("sid") != f"sid{self.logins}":
                return httpx.Response(200, json={"status": False, "reason": "bad sid"})
            if self.expire_once:
                self.expire_once = False
                return httpx.Response(200, json={"status": False, "reason": "invalid sid"})
            self.searches.append(b)
            rows = self.docs.get(b["doctype"], [])[b["offset"]: b["offset"] + b["limit"]]
            return httpx.Response(200, json={"status": True, "results_list": rows,
                                             "results_count": len(rows)})
        return httpx.Response(404)


def test_icount_map():
    inv = map_icount_doc(icount_doc(1))
    assert inv.external_id == "icount:d1" and inv.number == "2001" and inv.doc_type == 305
    assert inv.amount_agorot == 50050 and inv.due.isoformat() == "2026-10-20"
    assert inv.client_external_id == "icount:c1" and inv.client_phone == "052-7654321"


def test_icount_map_tolerant():
    inv = map_icount_doc({"docnum": 5, "doctype": "deal", "total": 10})
    assert inv.amount_agorot == 1000 and inv.doc_type == 300 and inv.external_id == "icount:deal-5"
    assert inv.client_external_id == "" and inv.due is None


def test_icount_no_transport_is_blocked():
    c = ICountClient(api_token="TOK")
    with pytest.raises(SafetyError):
        list(c.iter_open_invoices())
    with pytest.raises(SafetyError):
        ICountClient(api_token="TOK", transport=httpx.HTTPTransport())


def test_icount_requires_credentials():
    with pytest.raises(IntegrationError):
        ICountClient(cid="co")


def test_icount_token_pagination_both_doctypes_skip_zero():
    fake = FakeICount({"invoice": [icount_doc(1), icount_doc(2), icount_doc(3, balance="0")],
                       "deal": [icount_doc(4, doctype="deal")]})
    c = ICountClient(api_token="TOK", transport=httpx.MockTransport(fake.handler), page_size=2)
    invs = list(c.iter_open_invoices())
    assert [i.external_id for i in invs] == ["icount:d1", "icount:d2", "icount:d4"]
    assert [(s["doctype"], s["offset"]) for s in fake.searches] == \
        [("invoice", 0), ("invoice", 2), ("deal", 0)]
    assert fake.logins == 0


def test_icount_login_and_sid_refresh():
    fake = FakeICount({"invoice": [icount_doc(1)]}, expire_once=True)
    c = ICountClient(cid="co", user="u", password="p",
                     transport=httpx.MockTransport(fake.handler))
    assert len(list(c.iter_open_invoices())) == 1
    assert fake.logins == 2


def test_icount_bad_login():
    fake = FakeICount({})
    c = ICountClient(cid="co", user="u", password="WRONG",
                     transport=httpx.MockTransport(fake.handler))
    with pytest.raises(IntegrationError, match="bad_login"):
        list(c.iter_open_invoices())


def test_icount_feeds_collect_service(clock):
    """אותו CollectService בדיוק — מקור iCount במקום Green Invoice."""
    fake = FakeICount({"invoice": [icount_doc(1)]})
    c = ICountClient(api_token="TOK", transport=httpx.MockTransport(fake.handler))
    s = load_settings({"BUSINESS_NAME": "סטודיו", "PAYMENT_LINK": "https://pay.example/x"})
    svc = CollectService(s, DB(":memory:"), clock=clock)
    res = svc.ingest(list(c.iter_open_invoices()))
    assert res == {"open": 1, "closed": 0}


def test_greeninvoice_source(gi_client):
    src = GreenInvoiceSource(gi_client)
    assert [i.external_id for i in src.iter_open_invoices()] == ["doc1", "doc2"]

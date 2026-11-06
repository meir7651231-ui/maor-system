import httpx
import pytest

from app.greeninvoice import GreenInvoiceClient, GreenInvoiceError, map_document
from tests.conftest import SANDBOX, FakeGreenInvoice, gi_doc


def test_pagination_and_skip_zero(gi_client, fake_gi):
    invs = list(gi_client.iter_open_invoices(page_size=2))
    assert [i.external_id for i in invs] == ["doc1", "doc2"]  # doc3 = 0 ₪ מסונן
    assert fake_gi.search_calls == 2


def test_token_cached(gi_client, fake_gi):
    list(gi_client.iter_open_invoices(page_size=1))
    assert fake_gi.token_calls == 1


def test_token_refresh_on_401(gi_client, fake_gi):
    list(gi_client.iter_open_invoices())
    fake_gi.expire_next = True
    gi_client.search_documents()
    assert fake_gi.token_calls == 2


def test_bad_credentials():
    fake = FakeGreenInvoice([])
    c = GreenInvoiceClient(SANDBOX, "x", "y", transport=httpx.MockTransport(fake.handler))
    with pytest.raises(GreenInvoiceError):
        c.search_documents()


def test_production_url_refused():
    with pytest.raises(GreenInvoiceError):
        GreenInvoiceClient("https://api.greeninvoice.co.il/api/v1", "a", "b")


def test_mapping_amount_exact():
    inv = map_document(gi_doc(1, amount="1234.565"))
    assert inv.amount_agorot == 123457
    assert inv.client_phone == "050-1234567"
    assert inv.due.isoformat() == "2026-10-01"


def test_mapping_tolerates_missing_fields():
    inv = map_document({"id": 9, "amount": 10})
    assert inv.amount_agorot == 1000 and inv.client_name == "" and inv.due is None

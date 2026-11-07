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


def test_token_request_includes_grant_type():
    """רגרסיה: מ-2026 morning דורשת grant_type=client_credentials בבקשת הטוקן.
    בלי השדה השרת (והמוק הקפדני) מחזיר 401."""
    seen = []

    def h(req):
        if req.url.path.endswith("/account/token"):
            import json
            seen.append(json.loads(req.content))
            return httpx.Response(200, json={"token": "t", "expires": 2_000_000_000})
        return httpx.Response(200, json={"items": [], "pages": 1})

    c = GreenInvoiceClient(SANDBOX, "i", "s", transport=httpx.MockTransport(h))
    c._auth()
    assert seen == [{"id": "i", "secret": "s", "grant_type": "client_credentials"}]


def test_create_payment_form_is_blocked_and_makes_no_network_call():
    """critic סבב 19: הפונקציה שיוצרת ב-GI דף תשלום שמנפיק קבלה (type 400) נשארה בקוד ומוכנה לכתיבה,
    בניגוד ל-«לא יוצרים קבלות» ו-«גבי רק קורא». עכשיו SafetyError, ושום בקשה לא יוצאת."""
    import httpx
    import pytest

    from app.config import SafetyError
    from app.greeninvoice import GreenInvoiceClient, Invoice
    calls = []
    tr = httpx.MockTransport(lambda req: calls.append(req.url.path) or httpx.Response(200, json={
        "token": "t", "expires": 2_000_000_000, "url": "https://pay.greeninvoice.co.il/f/x"}))
    c = GreenInvoiceClient("https://sandbox.d.greeninvoice.co.il/api/v1", "id", "secret", transport=tr)
    inv = Invoice("d1", "1", 305, 10000, "ILS", None, None, "c1", "דנה", "0501234567", "")
    with pytest.raises(SafetyError):
        c.create_payment_form(inv)
    assert calls == []

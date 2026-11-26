"""מנהל 430 · חיבורים: סריקת החובות הפתוחים לא נעצרת בשקט.

הבאג: `iter_open_invoices` (חשבונית ירוקה) עצר בשקט אחרי max_pages=200 (10,000 חובות), ו-`pages` חסר בתשובה
נחשב 1 ⇒ עצירה אחרי העמוד הראשון. בשני המקרים החובות שמעבר «נעלמו» מהמקור ⇒ הסנכרון סגר אותם כשולמו
(כשהם מתחת לסף api_mass_vanish — למשל 50 מתוך 10,050). אותו דפוס ב-iCount (`_rows`) וב-EZcount.

התיקון: עוד עמודים מעבר לתקרה ⇒ PageCapError/ProviderError «page_cap» ⇒ הסנכרון נכשל **בלי לסגור כלום**
(fail-closed, עבודת הבוקר = sync_failed). `pages` חסר ⇒ ממשיכים כל עוד העמוד מלא. זיכויים/קבלות בסנכרון
נשארים לא-strict במכוון — הרענון שלפני שליחה (strict, מנהל 318) הוא השער שם.
"""
from __future__ import annotations

import httpx
import pytest

from app.ezcount_mock import EZcountMock
from app.greeninvoice import GreenInvoiceError, PageCapError
from app.icount_mock import STATUS_OPEN, ICountMock, demo_clients
from app.integrations.base import ProviderError
from app.integrations.ezcount import EZcountClient
from app.integrations.icount import ICountClient
from tests.conftest import gi_doc


def _debts(n, start=50_000):
    return [gi_doc(start + i, amount="10.00", client_id=f"y{i}", phone="052-0000000", name="אחר")
            for i in range(n)]


def _open_rows(svc):
    return svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open'")["n"]


# ───────── חשבונית ירוקה ─────────
def test_gi_open_debts_page_cap_raises(gi_client, fake_gi):
    fake_gi.docs.extend(_debts(10_001))
    with pytest.raises(PageCapError, match="page_cap"):
        gi_client.open_debts()


def test_gi_exactly_at_cap_ok(gi_client, fake_gi):
    """בדיוק 200 עמודים ⇒ `pages`=200 ⇒ אין עמוד נוסף ⇒ לא חריגה (גבול)."""
    fake_gi.docs[:] = _debts(10_000)
    assert len(gi_client.open_debts().invoices) == 10_000


def test_gi_non_strict_still_available(gi_client, fake_gi):
    """הקריאה הגולמית עם strict=False (כלי אבחון) — עוצרת כמו קודם, לא זורקת."""
    fake_gi.docs.extend(_debts(30))
    got = list(gi_client.iter_open_invoices(page_size=10, max_pages=2, strict=False))
    assert len(got) == 19   # 20 מסמכים בשני עמודים, אחד מהם (doc3) בסכום 0


def _drop_pages(gi):
    orig = gi.search_documents

    def h(*a, **kw):
        body = dict(orig(*a, **kw))
        body.pop("pages", None)
        return body
    gi.search_documents = h


def test_gi_missing_pages_keeps_paging_while_full(gi_client, fake_gi):
    """בלי `pages`: קודם נחשב 1 ⇒ רק 50 החובות הראשונים. עכשיו ממשיכים עד עמוד חלקי."""
    fake_gi.docs.extend(_debts(120))
    _drop_pages(gi_client)
    ids = {i.external_id for i in gi_client.iter_open_invoices()}
    assert len(ids) == 122   # 2 של המוק (השלישי בסכום 0) + 120


def test_gi_missing_pages_empty_last_page_stops(gi_client, fake_gi):
    """בדיוק עמוד מלא בלי `pages` ⇒ עמוד ריק אחד נוסף, ואז עצירה (לא לולאה ולא חריגה)."""
    fake_gi.docs[:] = _debts(50)
    _drop_pages(gi_client)
    n0 = fake_gi.search_calls
    assert len(list(gi_client.iter_open_invoices())) == 50
    assert fake_gi.search_calls - n0 == 2


def test_gi_invalid_pages_treated_as_missing(gi_client, fake_gi):
    fake_gi.docs.extend(_debts(60))
    orig = gi_client.search_documents
    gi_client.search_documents = lambda *a, **kw: {**orig(*a, **kw), "pages": "x"}
    assert len(list(gi_client.iter_open_invoices())) == 62


def test_sync_over_cap_closes_nothing(svc, fake_gi):
    """הליבה: חשבון שגדל מעבר ל-10,000 ⇒ הסנכרון נכשל, ושום חוב קיים לא נסגר כ«שולם»."""
    svc.sync()
    before = _open_rows(svc)
    assert before == 2
    fake_gi.docs.extend(_debts(10_001))
    with pytest.raises(GreenInvoiceError, match="page_cap"):
        svc.sync()
    assert _open_rows(svc) == before
    assert svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status!='open'")["n"] == 0


def test_morning_over_cap_is_sync_failed(svc, fake_gi):
    from app import morning
    svc.sync()
    fake_gi.docs.extend(_debts(10_001))
    out = morning.run_morning(svc)
    if out["status"] == "closed_day":
        pytest.skip("יום סגור בשעון הבדיקה")
    assert out["status"] == "sync_failed" and "page_cap" in out["sync_error"]
    assert _open_rows(svc) == 2


# ───────── iCount ─────────
def _icount(n_invoices, max_pages):
    docs = [{"doctype": "invoice", "docnum": 3000 + i, "client_id": 11, "client_name": "נועה ברק (דמו)",
             "dateissued": "2026-09-01", "duedate": "2026-10-01", "currency_code": "ILS",
             "totalwithvat": 100.0, "remainingsum": 100.0, "status": STATUS_OPEN, "is_cancelled": False}
            for i in range(n_invoices)]
    mock = ICountMock(api_token="T", docs=docs, clients=demo_clients())
    return ICountClient(api_token="T", transport=httpx.MockTransport(mock.handler),
                        page_size=1, max_pages=max_pages)


def test_icount_over_cap_raises():
    with pytest.raises(ProviderError, match="page_cap"):
        list(_icount(3, max_pages=2).iter_open_invoices())


def test_icount_exactly_at_cap_ok():
    """עמוד מלא בגבול ⇒ עמוד בדיקה אחד; ריק ⇒ תקין."""
    assert len(list(_icount(2, max_pages=2).iter_open_invoices())) == 2


# ───────── EZcount ─────────
def _ez(n, max_pages):
    docs = [{"doc_uuid": f"ez-{i:04}", "doc_number": str(40000 + i), "type": 305, "date": "01/09/2026",
             "pay_until": "01/10/2026", "customer_name": "ליאת רום (דמו)", "customer_email": "liat@example.com",
             "customer_phone": "053-0000031", "main_currency_iso": "ILS", "price_total": 100.0,
             "balance": 100.0} for i in range(n)]
    mock = EZcountMock(api_key="K", developer_email="d@example.com", docs=docs)
    return EZcountClient(api_key="K", developer_email="d@example.com",
                         transport=httpx.MockTransport(mock.handler), page_size=1, max_pages=max_pages)


def test_ezcount_over_cap_raises():
    with pytest.raises(ProviderError, match="page_cap"):
        list(_ez(3, max_pages=2).iter_open_invoices())


def test_ezcount_exactly_at_cap_ok():
    assert len(list(_ez(2, max_pages=2).iter_open_invoices())) == 2

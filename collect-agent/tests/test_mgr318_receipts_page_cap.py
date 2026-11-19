"""מנהל 318 · תיקון מבקר סבב 170: הרענון שלפני שליחה לא נעצר בשקט אחרי 10,000 קבלות/זיכויים.

(1) `_iter_docs(strict=True)`: הגעה ל-max_pages כשיש עוד עמודים ⇒ GreenInvoiceError ⇒ `refresh_failed` ⇒ לא
    שולחים (fail-closed, כמו ר-4). נאכף ב-`receipts_for` וב-`credits_for`. הסנכרון (`open_debts`) לא strict —
    הרענון לפני השליחה הוא השער.
(2) עלות: בתוך ריצת dispatch (`receipt_batch`) הקבלות נשלפות פעם אחת ומסוננות מקומית לפי תאריך;
    גם כשל נשמר (לא 200 עמודים לכל תזכורת). מחוץ ל-batch — רענון טרי לכל קריאה, כמו קודם.
"""
import pytest

from app.greeninvoice import GreenInvoiceError
from tests.conftest import gi_doc
from tests.test_paid_never_reminded import _approve_all, _receipt, _to_dana


def _foreign(n, typ=400, amount="10.00"):
    out = []
    for i in range(n):
        d = gi_doc(70_000 + i, amount=amount, client_id=f"x{i}", name="אחר", phone="052-0000000")
        d["type"], d["status"] = typ, 1 if typ == 400 else 0
        out.append(d)
    return out


def _count_receipt_searches(gi):
    n = {"rc": 0}
    orig = gi.search_documents

    def h(*a, **kw):
        if list(kw.get("types") or []) == [400]:
            n["rc"] += 1
        return orig(*a, **kw)
    gi.search_documents = h
    return n


def test_receipts_page_cap_raises(gi_client, fake_gi):
    fake_gi.docs.extend(_foreign(10_001))
    with pytest.raises(GreenInvoiceError, match="page_cap"):
        gi_client.receipts_for("doc1")


def test_receipts_exactly_at_cap_ok(gi_client, fake_gi):
    """בדיוק 200 עמודים (10,000) ⇒ אין עמוד נוסף ⇒ לא חריגה (גבול)."""
    fake_gi.docs.extend(_foreign(10_000))
    assert gi_client.receipts_for("doc1") == {}


def test_credits_page_cap_raises(gi_client, fake_gi):
    fake_gi.docs.extend(_foreign(10_001, typ=330))
    with pytest.raises(GreenInvoiceError, match="page_cap"):
        gi_client.credits_for("doc1")


def test_credit_beyond_cap_blocks_send(svc, fake_gi):
    svc.sync()
    _approve_all(svc, svc.plan())
    fake_gi.docs.extend(_foreign(10_001, typ=330))
    svc.dispatch()
    assert _to_dana(svc) == []
    assert svc.db.one("SELECT COUNT(*) n FROM reminders WHERE block_reason='refresh_failed'")["n"] >= 1


def test_page_cap_failure_retries_next_run_not_lost(svc, fake_gi):
    """התזכורת נשארת מאושרת (refresh_failed), וכשהחשבון קטן שוב — יוצאת."""
    svc.sync()
    _approve_all(svc, svc.plan())
    extra = _foreign(10_001)
    fake_gi.docs.extend(extra)
    svc.dispatch()
    assert _to_dana(svc) == []
    for d in extra:
        fake_gi.docs.remove(d)
    svc.dispatch()
    assert _to_dana(svc) != []


def test_one_receipt_fetch_per_dispatch(svc, fake_gi):
    """שתי תזכורות (דנה ויוסי) ⇒ שליפת קבלות אחת בריצה, לא אחת לכל תזכורת."""
    svc.sync()
    _approve_all(svc, svc.plan())
    fake_gi.docs.extend(_foreign(120))
    n = _count_receipt_searches(svc.gi)
    svc.dispatch()
    assert len({m["to"] for m in svc.sender.sent}) >= 2      # שתי תזכורות יצאו
    assert n["rc"] == 3                                        # 121 קבלות ⇒ 3 עמודים, פעם אחת


def test_page_cap_cached_within_dispatch(svc, fake_gi):
    """כשל נשמר בתוך הריצה: לא 200 עמודים לכל תזכורת, ואף תזכורת לא יוצאת."""
    svc.sync()
    _approve_all(svc, svc.plan())
    fake_gi.docs.extend(_foreign(10_001))
    n = _count_receipt_searches(svc.gi)
    svc.dispatch()
    assert svc.sender.sent == []
    assert n["rc"] == 200


def test_batch_filters_by_invoice_date(gi_client, fake_gi):
    """המטמון מהתאריך המוקדם; חשבונית מאוחרת מקבלת רק קבלות מתאריכה ואילך (כמו סינון השרת)."""
    from datetime import date
    old = _receipt(1)   # לא מקושרת, אותו לקוח ואותו סכום ⇒ נתפסת רק אם בטווח התאריך
    old["documentDate"] = "2026-09-20"
    fake_gi.docs.append(old)
    with gi_client.receipt_batch():
        assert gi_client.receipts_for("doc1", since=date(2026, 9, 15)) != {}
        assert gi_client.receipts_for("doc1", since=date(2026, 9, 25)) == {}


def test_no_cache_outside_batch(gi_client, fake_gi):
    """מחוץ לריצה: קבלה שנוספה בין שתי קריאות נראית מיד (רענון טרי, ר-4)."""
    assert gi_client.receipts_for("doc1") == {}
    fake_gi.docs.append(_receipt(9, linked=["doc1"]))
    assert gi_client.receipts_for("doc1") != {}


def test_sync_not_strict(svc, fake_gi):
    """הסנכרון לא נכשל בחשבון גדול — השער הוא הרענון שלפני שליחה."""
    fake_gi.docs.extend(_foreign(10_001))
    svc.sync()
    assert svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open'")["n"] >= 2

"""רגרסיה לפריטי מבקר פתוחים (team/critic.md, סבב 21):
  21.1 — קיזוז זיכויים היה רק בחשבונית ירוקה. iCount / רווחית / EZcount לא קיזזו: חשבונית שזוכתה
         קיבלה תזכורת על הסכום המלא, ובזיכוי של רווחית (יתרה שלילית) השורה נבלעה בשקט.
         עכשיו אותו כלל שמרני (`greeninvoice.net_credits`): שיוך ודאי ⇒ קיזוז; ספק ⇒ credit_review.
  21.2 — זיכוי שהונפק בין הסנכרון לשליחה נבדק רק בחשבונית ירוקה (`credits_for`). עכשיו הרענון
         (`_fresh_doc`) זהה לכל מקור, גם לטיוטות ולהסדרים (`refresh_customer`), ומקור שאין לו
         `credits_for` ⇒ חסימת שליחה (לא מניחים «אין זיכויים»).
  21.3 — מטבעות שונים: הצעת פריסה יצאה בשיחה, אבל שום הסדר לא נרשם. עכשיו אין הצעה; כרטיס לבעל העסק.
הכול מול ה-mocks בתוך התהליך (בלי רשת, בלי חשבון אמיתי)."""
import httpx
import pytest

from app.config import load_settings
from app.db import DB
from app.ezcount_mock import EZcountMock
from app.ezcount_mock import demo_docs as ez_docs
from app.gi_mock import GreenInvoiceMock
from app.greeninvoice import GreenInvoiceClient
from app.icount_mock import ICountMock, demo_clients
from app.icount_mock import demo_docs as ic_docs
from app.integrations.ezcount import EZcountClient
from app.integrations.icount import ICountClient
from app.integrations.rivhit import RivhitClient
from app.integrations.sources import CreditAmbiguous, credits_on_doc
from app.rivhit_mock import RivhitMock, demo_customers
from app.rivhit_mock import demo_docs as rv_docs
from app.service import CollectService
from tests.conftest import SANDBOX


def _settings(system):
    return load_settings({"BUSINESS_NAME": "סטודיו", "SOURCE_SYSTEM": system,
                          "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/x",
                          "PUBLIC_BASE_URL": "https://gabi.example", "REAL_DATA_ALLOWED": "1",
                          "SMS_WEBHOOK_KEY": "whk-test", "EMAIL_REPLY_TO": "owner@studio.example",
                          "EMAIL_WEBHOOK_KEY": "ewk-test"})


def _icount(clock):
    m = ICountMock(api_token="T", docs=ic_docs(), clients=demo_clients())
    c = ICountClient(api_token="T", transport=httpx.MockTransport(m.handler))
    return CollectService(_settings("icount"), DB(":memory:"), gi=c, clock=clock), m


def _rivhit(clock):
    m = RivhitMock(api_token="T", docs=rv_docs(), customers=demo_customers())
    c = RivhitClient(api_token="T", transport=httpx.MockTransport(m.handler))
    return CollectService(_settings("rivhit"), DB(":memory:"), gi=c, clock=clock), m


def _ezcount(clock):
    m = EZcountMock(api_key="K", developer_email="dev@example.com", docs=ez_docs())
    c = EZcountClient(api_key="K", developer_email="dev@example.com",
                      transport=httpx.MockTransport(m.handler))
    return CollectService(_settings("ezcount"), DB(":memory:"), gi=c, clock=clock), m


def _open(svc):
    return {r["external_id"]: r["amount_agorot"]
            for r in svc.db.q("SELECT * FROM invoices WHERE status='open'")}


def _cid(svc, ext):
    return svc._invoice(svc.db.one("SELECT id FROM invoices WHERE external_id=?", (ext,))["id"]) \
        ["customer_id"]


def _reminder_for(svc, ext):
    rows = [r for r in svc.plan() if svc._invoice(svc._reminder(r)["invoice_id"])["external_id"] == ext]
    assert rows, f"לא נוצרה תזכורת ל-{ext}"
    return rows[0]


def _notes(svc):
    return svc.db.q("SELECT * FROM messages WHERE intent='credit_review'")


# ═══════════ ליבה טהורה: credits_on_doc ═══════════
def test_credits_on_doc_counts_only_certain_and_flags_doubt():
    from tests.test_credit_netting_and_plan_total import _inv
    d = _inv("a", 100_000)
    assert credits_on_doc([_inv("c1", 20_000, type_=330, links=["a"]),
                           _inv("c2", 5_000, type_=330, links=["zz"])], d) == 20_000
    with pytest.raises(CreditAmbiguous) as e:
        credits_on_doc([_inv("c1", 20_000, type_=330, links=["a"]),
                        _inv("c3", 7_000, type_=330, links=["a", "b"])], d)
    assert [w for _, w in e.value.items] == ["credit_multi_invoice"] and e.value.certain == 20_000
    with pytest.raises(CreditAmbiguous, match="credit_unlinked"):
        credits_on_doc([_inv("c4", 1_000, type_=330)], d)          # אותו לקוח, בלי קישור
    # לקוח אחר בלי קישור ⇒ לא שלנו; מזהה בלבד (בלי פרטי לקוח) ⇒ לא מנחשים שייכות
    assert credits_on_doc([_inv("c5", 1_000, type_=330, client="cl9")], d) == 0
    assert credits_on_doc([_inv("c4", 1_000, type_=330)], "a") == 0


# ═══════════ iCount ═══════════
def test_icount_linked_refund_nets_and_full_refund_removes(clock):
    svc, m = _icount(clock)
    m.credit("invoice", 3001, 500)
    m.credit("deal", 3002, 900, links=[("deal", 3002)], dateissued="2026-09-20")
    # ה-deal כבר «נסגר חלקית» (400 מתוך 900) ⇒ זיכוי מקושר = review (אולי כבר בתוך היתרה)
    res = svc.sync()
    assert _open(svc) == {"icount:invoice-3001": 100_000, "icount:deal-3002": 40_000}
    assert res.get("review") == 1                                    # credit_after_partial
    assert svc._customer_block(_cid(svc, "icount:deal-3002")) == "credit_review"
    assert svc._customer_block(_cid(svc, "icount:invoice-3001")) is None
    m.credit("invoice", 3001, 1000)                                  # עכשיו זוכתה במלואה
    svc.sync()
    assert "icount:invoice-3001" not in _open(svc)
    assert m.write_attempts == []


def test_icount_unlinked_or_multi_refund_holds_for_owner_never_guesses(clock):
    svc, m = _icount(clock)
    m.credit("invoice", 3001, 300, link=False)
    res = svc.sync()
    assert res["review"] == 1 and _open(svc)["icount:invoice-3001"] == 150_000   # לא קוזז
    cid = _cid(svc, "icount:invoice-3001")
    assert svc._customer_block(cid) == "credit_review"
    [note] = _notes(svc)
    assert "iCount" in note["body"] and "חשבונית ירוקה" not in note["body"]
    svc2, m2 = _icount(clock)
    m2.credit("invoice", 3001, 300, links=[("invoice", 3001), ("deal", 3002)])
    assert svc2.sync()["review"] == 1 and _open(svc2)["icount:invoice-3001"] == 150_000


def test_icount_cancelled_refund_is_ignored(clock):
    svc, m = _icount(clock)
    n = m.credit("invoice", 3001, 500)
    m.cancel("refund", n)
    assert svc.sync() == {"open": 2, "closed": 0}
    assert _open(svc)["icount:invoice-3001"] == 150_000


def test_icount_refund_issued_between_sync_and_send_is_not_sent_stale(clock):
    """21.2: אושר 1,500 ⇒ זיכוי 500 ב-iCount ⇒ dispatch. לפני: נשלח "1,500 ₪"."""
    svc, m = _icount(clock)
    svc.sync()
    rid = _reminder_for(svc, "icount:invoice-3001")
    svc.approve(rid)
    m.credit("invoice", 3001, 500)
    svc.dispatch()
    r = svc._reminder(rid)
    assert r["status"] == "pending_approval" and r["amount_agorot"] == 100_000, dict(r)
    assert not any("1,500" in x["body"] for x in svc.sender.sent)


def test_icount_unlinked_refund_after_sync_blocks_send_and_holds(clock):
    svc, m = _icount(clock)
    svc.sync()
    rid = _reminder_for(svc, "icount:invoice-3001")
    svc.approve(rid)
    m.credit("invoice", 3001, 200, link=False)
    svc.dispatch()
    assert svc._reminder(rid)["status"] == "cancelled" and svc.sender.sent == []
    cid = _cid(svc, "icount:invoice-3001")
    assert svc._customer_block(cid) == "credit_review" and len(_notes(svc)) == 1
    # בעל העסק בדק וחידש ⇒ אותו זיכוי לא משהה שוב, ומקזזים רק מה שוודאי (כלום)
    svc.resume_customer(cid)
    rid2 = _reminder_for(svc, "icount:invoice-3001")
    svc.approve(rid2)
    svc.dispatch()
    assert svc._reminder(rid2)["status"].startswith("sent") and len(_notes(svc)) == 1


# ═══════════ רווחית ═══════════
def test_rivhit_open_credit_row_holds_customer_instead_of_being_swallowed(clock):
    """21.1 (שוחזר): זיכוי פתוח (יתרה שלילית) נבלע ⇒ תזכורת על 2,200 המלאים ללקוח שזוכה."""
    svc, m = _rivhit(clock)
    m.credit(21, 700)
    res = svc.sync()
    assert res == {"open": 2, "closed": 0, "review": 1}
    cid = _cid(svc, "rivhit:21:1:7001")
    assert svc._customer_block(cid) == "credit_review"
    planned = {svc._invoice(svc._reminder(r)["invoice_id"])["external_id"] for r in svc.plan()}
    assert planned == {"rivhit:22:1:7002"}                           # רק הלקוח שלא זוכה
    [note] = _notes(svc)
    assert "רווחית" in note["body"]


def test_rivhit_credit_between_sync_and_send_blocks(clock):
    svc, m = _rivhit(clock)
    svc.sync()
    rid = _reminder_for(svc, "rivhit:21:1:7001")
    svc.approve(rid)
    m.credit(21, 700)
    svc.dispatch()
    assert svc._reminder(rid)["status"] == "cancelled"
    assert not any("2,200" in x["body"] for x in svc.sender.sent)
    assert svc._customer_block(_cid(svc, "rivhit:21:1:7001")) == "credit_review"


# ═══════════ EZcount ═══════════
def test_ezcount_linked_credit_nets_unlinked_holds(clock):
    svc, m = _ezcount(clock)
    m.credit("ez-0001", 300)
    svc.sync()
    assert _open(svc) == {"ezcount:ez-0001": 150_000}
    svc2, m2 = _ezcount(clock)
    m2.credit("ez-0001", 300, link=False)
    assert svc2.sync()["review"] == 1 and _open(svc2) == {"ezcount:ez-0001": 180_000}
    assert svc2.plan() == []                                         # מושהה לבדיקה


def test_ezcount_credit_between_sync_and_send(clock):
    svc, m = _ezcount(clock)
    svc.sync()
    [rid] = svc.plan()
    svc.approve(rid)
    m.credit("ez-0001", 800)
    svc.dispatch()
    r = svc._reminder(rid)
    assert r["status"] == "pending_approval" and r["amount_agorot"] == 100_000
    assert svc.sender.sent == []


# ═══════════ חסר credits_for ⇒ חסימה ═══════════
class _NoCredits:
    """מקור שיודע לקרוא מסמכים אבל לא זיכויים ⇒ אסור להניח «אין זיכויים»."""

    provider = "icount"

    def __init__(self, inner):
        self.inner = inner

    def iter_open_invoices(self):
        return self.inner.iter_open_invoices()

    def get_document(self, ext):
        return self.inner.get_document(ext)


def test_source_without_credits_for_blocks_send(clock):
    m = ICountMock(api_token="T", docs=ic_docs(), clients=demo_clients())
    src = _NoCredits(ICountClient(api_token="T", transport=httpx.MockTransport(m.handler)))
    svc = CollectService(_settings("icount"), DB(":memory:"), gi=src, clock=clock)
    svc.sync()
    rid = _reminder_for(svc, "icount:invoice-3001")
    svc.approve(rid)
    svc.dispatch()
    r = svc._reminder(rid)
    assert r["status"] == "approved" and r["block_reason"] == "refresh_failed", dict(r)
    assert not svc.sender.sent
    assert svc.refresh_customer(_cid(svc, "icount:invoice-3001")) is False


# ═══════════ טיוטות/הסדרים: refresh_customer רואה זיכוי חדש ═══════════
def test_plan_approval_sees_credit_issued_after_sync_any_source(clock):
    svc, m = _icount(clock)
    svc.sync()
    cid = _cid(svc, "icount:invoice-3001")
    pid = svc.propose_plan(cid, 3)
    m.credit("invoice", 3001, 600)
    with pytest.raises(ValueError, match="היתרה השתנתה"):
        svc.approve_plan(pid)
    assert _open(svc)["icount:invoice-3001"] == 90_000


def test_plan_approval_with_new_unlinked_credit_is_held_not_sent(clock):
    svc, m = _rivhit(clock)
    svc.sync()
    cid = _cid(svc, "rivhit:21:1:7001")
    pid = svc.propose_plan(cid, 3)
    m.credit(21, 100)
    with pytest.raises(ValueError, match="לא ניתן לאמת"):
        svc.approve_plan(pid)
    paused = svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))["paused_reason"]
    assert paused == "credit_review" and not svc.sender.sent and len(_notes(svc)) == 1


def test_gi_plan_approval_sees_credit_issued_after_sync(clock):
    """refresh_customer השתמש בזיכוי השמור מהסנכרון, גם בחשבונית ירוקה."""
    from tests.test_credit_netting_and_plan_total import _admin, _doc
    from tests.test_credit_netting_and_plan_total import _svc as gi_svc
    svc, mock = gi_svc(clock, [_doc(1)])
    svc.sync()
    pid = svc.propose_plan(1, 3)
    _admin(mock, "/_mock/documents/doc1/credit", {"amount": 300})
    with pytest.raises(ValueError, match="היתרה השתנתה"):
        svc.approve_plan(pid)


def test_gi_unlinked_credit_after_sync_blocks_send(clock):
    from tests.test_credit_netting_and_plan_total import _admin, _doc
    from tests.test_credit_netting_and_plan_total import _svc as gi_svc
    svc, mock = gi_svc(clock, [_doc(1)])
    svc.sync()
    [rid] = svc.plan()
    svc.approve(rid)
    _admin(mock, "/_mock/documents/doc1/credit", {"amount": 300, "link": False})
    svc.dispatch()
    assert svc._reminder(rid)["status"] == "cancelled" and not svc.sender.sent
    assert svc._customer_block(1) == "credit_review"


# ═══════════ 21.3 · מטבעות שונים ═══════════
def test_mixed_currency_plan_request_gets_owner_card_not_offer(clock):
    docs = [{"id": "doc1", "number": "1001", "type": 305, "status": 0, "amount": "1200.00",
             "currency": "ILS", "documentDate": "2026-09-15", "dueDate": "2026-10-01",
             "client": {"id": "cl1", "name": "דנה כהן", "phone": "050-1234567",
                        "emails": ["cl1@example.com"]}},
            {"id": "doc2", "number": "1002", "type": 305, "status": 0, "amount": "300.00",
             "currency": "USD", "documentDate": "2026-09-15", "dueDate": "2026-10-01",
             "client": {"id": "cl1", "name": "דנה כהן", "phone": "050-1234567",
                        "emails": ["cl1@example.com"]}}]
    mock = GreenInvoiceMock(api_id="test-id", api_secret="test-secret", docs=docs,
                            deliver=lambda url, payload: None)
    gi = GreenInvoiceClient(SANDBOX, "test-id", "test-secret",
                            transport=httpx.MockTransport(mock.handler))
    svc = CollectService(_settings("greeninvoice"), DB(":memory:"), gi=gi, clock=clock)
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "אין לי כסף כרגע, אפשר תשלומים?")
    assert r["plan_id"] is None and svc.db.q("SELECT * FROM plans") == []
    d = svc.db.one("SELECT * FROM drafts WHERE id=?", (r["draft_id"],))
    assert "תשלומים חודשיים" not in d["body"] and "הצעה לפריסת" not in d["body"]
    assert "מטבעות שונים" in d["owner_summary"] and "mixed_currency" in r["tags"]
    assert "1,500" not in d["owner_summary"]                       # לא חיברנו שקל ודולר
    conv = svc.db.one("SELECT * FROM conversations WHERE customer_id=1")
    assert not conv["offered_plan"]


# ═══════════ 3.6.7 · מייל נכנס: תיעוד אימות השולח ═══════════
@pytest.mark.parametrize("hdr, ok", [
    ("mx.example; spf=pass smtp.mailfrom=x; dkim=pass header.d=x; dmarc=pass", True),
    ("mx.example; spf=pass; dkim=none", True),                    # בלי DMARC: SPF מספיק
    ("mx.example; spf=pass; dkim=pass; dmarc=fail", False),        # DMARC נכשל גובר
    ("mx.example; spf=softfail; dkim=fail", False),
    ("", False),                                                   # חסר ⇒ לא מניחים שעבר
])
def test_email_auth_verdict(hdr, ok):
    from app.service import email_auth_verdict
    assert email_auth_verdict(hdr)["verified"] is ok


def test_unverified_inbound_email_is_recorded_and_flagged_for_owner(clock):
    from tests.test_credit_netting_and_plan_total import _doc
    from tests.test_credit_netting_and_plan_total import _svc as gi_svc
    svc, _ = gi_svc(clock, [_doc(1)])
    svc.sync()
    r = svc.email_webhook("cl1@example.com", "שילמתי בהעברה", "<m1@x>")
    assert r["email_verified"] is False
    d = svc.db.one("SELECT owner_summary FROM drafts WHERE id=?", (r["draft_id"],))
    assert "לא עבר אימות שולח" in d["owner_summary"]
    r2 = svc.email_webhook("cl1@example.com", "שילמתי שוב", "<m2@x>",
                           auth_results="mx; spf=pass; dkim=pass; dmarc=pass")
    assert r2["email_verified"] is True
    d2 = svc.db.one("SELECT owner_summary FROM drafts WHERE id=?", (r2["draft_id"],))
    assert "אימות שולח" not in (d2["owner_summary"] or "")
    rows = svc.db.q("SELECT * FROM audit WHERE action='email_auth'")
    assert len(rows) == 2 and "cl1@example.com" not in "".join(str(dict(a)) for a in rows)


def test_csv_negative_balance_line_holds_customer_for_credit_review(svc):
    """critic סבב 35: ב-CSV שורה ביתרה שלילית (זיכוי ללקוח) **נבלעה בשקט** (`amount <= 0 ⇒ continue`) —
    אותה מחלקה של 21.1 ברווחית. לקוח עם חשבונית 1,000 וזיכוי -200 קיבל תזכורת על 1,000. עכשיו: הזיכוי
    מעביר את הלקוח ל-credit_review (בלי ניחוש סכום), כמו בכל שאר המקורות, והשורה מדווחת בתוצאה."""
    raw = ("מספר חשבונית,לקוח,סכום,תאריך לתשלום,טלפון\n"
           "10,משה כהן,1000,2026-10-01,050-0001111\n"
           "11,משה כהן,-200,2026-10-02,050-0001111\n").encode()
    r = svc.import_csv(raw)
    assert r["imported"] == 1 and r.get("credits") == 1
    cust = svc.db.one("SELECT paused_reason FROM customers")
    assert cust["paused_reason"] == "credit_review"
    assert svc.plan() == []


def test_csv_settings_endpoint_reports_credits(svc):
    from fastapi.testclient import TestClient

    from app.main import create_app
    from tests.conftest import AUTH, OWNER_TOKEN
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    raw = ("מספר חשבונית,לקוח,סכום,תאריך לתשלום,טלפון\n10,משה,1000,2026-10-01,050-0001111\n"
           "11,משה,-200,2026-10-02,050-0001111\n").encode()
    r = c.post("/settings/source/csv", content=raw)
    assert r.status_code == 200 and r.json()["credits"] == 1 and r.json()["imported"] == 1

"""רגרסיה לשני ממצאי מבקר (team/critic.md):
  2.16 — זיכוי (330) וחשבון עסקה (300) שהומר ל-305 לא קוזזו ⇒ חוב שזוכה קיבל תזכורת, ואותו חוב
         הופיע פעמיים. התיקון שמרני: מקזזים רק שיוך חד-משמעי; כל ספק ⇒ הלקוח לבדיקת בעל העסק.
  §4.6 — הצעת הסדר חושבה על החשבונית הוותיקה בלבד (ORDER BY due LIMIT 1) ולא על כלל החוב.
הכול מול app/gi_mock.py (בלי רשת, בלי חשבון אמיתי)."""
from datetime import date

import httpx
import pytest

from app.config import load_settings
from app.db import DB
from app.gi_mock import GreenInvoiceMock
from app.greeninvoice import GreenInvoiceClient, Invoice, net_credits
from app.service import CollectService
from tests.conftest import SANDBOX


def _doc(i, *, amount="1200.00", type_=305, client="cl1", name="דנה כהן",
         phone="050-1234567", due="2026-10-01"):
    return {"id": f"doc{i}", "number": str(1000 + i), "type": type_, "status": 0,
            "amount": amount, "currency": "ILS", "documentDate": "2026-09-15", "dueDate": due,
            "client": {"id": client, "name": name, "phone": phone,
                       "emails": [f"{client}@example.com"]}}


def _svc(clock, docs):
    mock = GreenInvoiceMock(api_id="test-id", api_secret="test-secret", docs=docs,
                            deliver=lambda url, payload: None)
    gi = GreenInvoiceClient(SANDBOX, "test-id", "test-secret",
                            transport=httpx.MockTransport(mock.handler))
    s = load_settings({"BUSINESS_NAME": "סטודיו מאיר", "SMS_SENDER_ID": "StudioMeir",
                       "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/studio",
                       "PUBLIC_BASE_URL": "https://gabi.example",
                       "SMS_WEBHOOK_KEY": "whk-test", "EMAIL_REPLY_TO": "owner@studio.example",
                       "EMAIL_WEBHOOK_KEY": "ewk-test", "REAL_DATA_ALLOWED": "1"})
    return CollectService(s, DB(":memory:"), gi=gi, clock=clock), mock


def _admin(mock, path, body=None):
    status, out = mock.route("POST", path, {}, body)
    assert status == 200, out
    return out


def _open(svc):
    return {r["external_id"]: r["amount_agorot"]
            for r in svc.db.q("SELECT * FROM invoices WHERE status='open'")}


def _inv(ext, amount, *, type_=305, links=(), gross=0, client="cl1"):
    return Invoice(external_id=ext, number=ext, doc_type=type_, amount_agorot=amount,
                   currency="ILS", issued=date(2026, 9, 15), due=date(2026, 10, 1),
                   client_external_id=client, client_name="x", client_phone="", client_email="",
                   linked_ids=tuple(links), gross_agorot=gross)


# ═══════════ 2.16 · הליבה הטהורה ═══════════
def test_net_linked_credit_reduces_and_full_credit_removes():
    res = net_credits([_inv("a", 120_000), _inv("b", 50_000)],
                      [_inv("c1", 20_000, type_=330, links=["a"]),
                       _inv("c2", 50_000, type_=330, links=["b"])])
    assert [(i.external_id, i.amount_agorot, i.credit_agorot) for i in res.invoices] == \
        [("a", 100_000, 20_000)]
    assert res.review == []


def test_net_proforma_converted_to_tax_invoice_counts_once():
    res = net_credits([_inv("p", 80_000, type_=300), _inv("t", 80_000, links=["p"])], [])
    assert [i.external_id for i in res.invoices] == ["t"] and res.review == []
    # ה-305 כבר שולם (סגור) וה-300 נשאר פתוח ⇒ אין חוב בכלל
    res = net_credits([_inv("p", 80_000, type_=300)], [], [_inv("t", 80_000, links=["p"])])
    assert res.invoices == [] and res.review == []


def test_net_credit_on_converted_proforma_follows_to_tax_invoice():
    res = net_credits([_inv("p", 80_000, type_=300), _inv("t", 80_000, links=["p"])],
                      [_inv("c", 30_000, type_=330, links=["p"])])
    assert [(i.external_id, i.amount_agorot) for i in res.invoices] == [("t", 50_000)]


@pytest.mark.parametrize("credit, debts, why", [
    (_inv("c", 10_000, type_=330), [_inv("a", 50_000)], "credit_unlinked"),
    (_inv("c", 10_000, type_=330, links=["a", "b"]), [_inv("a", 50_000), _inv("b", 50_000)],
     "credit_multi_invoice"),
    # היתרה כבר ירדה (amountDueVat<amount) — אולי הזיכוי כבר נכלל בה ⇒ לא מקזזים פעמיים
    (_inv("c", 10_000, type_=330, links=["a"]), [_inv("a", 30_000, gross=50_000)],
     "credit_after_partial"),
])
def test_net_ambiguous_credit_goes_to_review_without_guessing(credit, debts, why):
    res = net_credits(debts, [credit])
    assert [r for _, r in res.review] == [why]
    assert sorted(i.amount_agorot for i in res.invoices) == sorted(d.amount_agorot for d in debts)


def test_net_credit_exceeding_balance_flags_review():
    res = net_credits([_inv("a", 50_000), _inv("b", 40_000)],
                      [_inv("c", 70_000, type_=330, links=["a"])])
    assert [i.external_id for i in res.invoices] == ["b"]
    assert [r for _, r in res.review] == ["credit_exceeds_balance"]


def test_net_partial_conversion_flags_review():
    res = net_credits([_inv("p", 80_000, type_=300), _inv("t", 30_000, links=["p"])], [])
    assert [i.external_id for i in res.invoices] == ["t"]
    assert [r for _, r in res.review] == ["conversion_amount_mismatch"]


# ═══════════ 2.16 · מקצה לקצה מול ה-mock ═══════════
def test_mock_produces_credit_note_and_conversion():
    mock = GreenInvoiceMock(docs=[_doc(1), _doc(2, type_=300)], deliver=lambda u, p: None)
    c = _admin(mock, "/_mock/documents/doc1/credit", {"amount": 200})
    assert c["type"] == 330 and c["linkedDocumentIds"] == ["doc1"] and c["amount"] == 200
    assert "linkedDocumentIds" not in _admin(mock, "/_mock/documents/doc1/credit",
                                             {"amount": 50, "link": False})
    t = _admin(mock, "/_mock/documents/doc2/convert")
    assert t["type"] == 305 and t["linkedDocumentIds"] == ["doc2"]
    assert mock.docs["doc2"]["status"] == 0                    # ברירת מחדל: המקרה המסוכן


def test_fully_credited_invoice_is_not_reminded(clock):
    svc, mock = _svc(clock, [_doc(1), _doc(2, client="cl2", name="יוסי", phone="052-7654321")])
    svc.sync()
    rid = svc.plan()
    assert len(rid) == 2
    _admin(mock, "/_mock/documents/doc1/credit", {"amount": 1200})
    assert svc.sync() == {"open": 1, "closed": 1}
    assert set(_open(svc)) == {"doc2"}
    assert svc._reminder(rid[0])["status"] == "cancelled"


def test_partial_credit_reminds_net_amount_and_refresh_keeps_it(clock):
    svc, mock = _svc(clock, [_doc(1)])
    _admin(mock, "/_mock/documents/doc1/credit", {"amount": 200})
    svc.sync()
    assert _open(svc) == {"doc1": 100_000}
    [rid] = svc.plan()
    assert "1,000" in svc._reminder(rid)["body"] and "1,200" not in svc._reminder(rid)["body"]
    svc.approve(rid)
    svc.dispatch()            # הרענון לפני שליחה מקבל מ-GI את 1,200 הגולמי — חייב לקזז שוב
    r = svc._reminder(rid)
    assert r["status"].startswith("sent"), (r["status"], r["block_reason"])
    assert all("1,200" not in m["body"] for m in svc.sender.sent) and svc.sender.sent


def test_converted_proforma_not_counted_twice(clock):
    svc, mock = _svc(clock, [_doc(1, type_=300, amount="800.00")])
    _admin(mock, "/_mock/documents/doc1/convert")              # ה-300 נשאר «פתוח» ב-GI
    svc.sync()
    opened = _open(svc)
    assert list(opened.values()) == [80_000] and "doc1" not in opened
    assert svc.inbox._open_total(1) == 80_000
    assert len(svc.plan()) == 1


def test_converted_then_paid_proforma_is_not_reminded(clock):
    svc, mock = _svc(clock, [_doc(1, type_=300, amount="800.00")])
    t = _admin(mock, "/_mock/documents/doc1/convert")
    _admin(mock, f"/_mock/documents/{t['id']}/pay")             # ה-305 שולם; ה-300 עדיין «פתוח»
    svc.sync()
    assert _open(svc) == {} and svc.plan() == []


def test_unlinked_credit_holds_customer_for_owner_review(clock):
    svc, mock = _svc(clock, [_doc(1), _doc(2, client="cl2", name="יוסי", phone="052-7654321")])
    _admin(mock, "/_mock/documents/doc1/credit", {"amount": 300, "link": False})
    res = svc.sync()
    assert res["review"] == 1
    assert _open(svc) == {"doc1": 120_000, "doc2": 120_000}     # לא ניחשנו קיזוז
    cid = svc.db.one("SELECT id FROM customers WHERE external_id='cl1'")["id"]
    assert svc._customer_block(cid) == "credit_review"
    planned = {svc._invoice(svc._reminder(r)["invoice_id"])["external_id"] for r in svc.plan()}
    assert planned == {"doc2"}                                  # רק הלקוח הלא-מעורב
    note = svc.db.q("SELECT * FROM messages WHERE intent='credit_review'")
    assert len(note) == 1 and note[0]["needs_owner"] == 1
    svc.sync()                                                  # אותו זיכוי ⇒ אין התראה כפולה
    assert len(svc.db.q("SELECT * FROM messages WHERE intent='credit_review'")) == 1
    svc.resume_customer(cid)                                    # בעל העסק בדק ⇒ לא מושהה שוב
    svc.sync()
    assert svc._customer_block(cid) is None


# ═══════════ §4.6 · הסדר על כלל החוב ═══════════
def _two_invoices(clock):
    return _svc(clock, [_doc(1, amount="1200.00", due="2026-10-01"),
                        _doc(2, amount="600.00", due="2026-10-20")])


def test_plan_offer_covers_total_open_debt(clock):
    svc, _ = _two_invoices(clock)
    svc.sync()
    pid = svc.propose_plan(1, 3)
    p = svc.db.one("SELECT * FROM plans WHERE id=?", (pid,))
    import json
    items = json.loads(p["installments"])
    assert sum(i["amount_agorot"] for i in items) == 180_000 and len(items) == 3
    assert sorted(json.loads(p["invoice_ids"])) == [1, 2]
    res = svc.approve_plan(pid)
    assert res["draft_status"] == "sent_dry_run"
    assert "1001" in res["text"] and "1002" in res["text"] and "ללא תוספת" in res["text"]
    body = svc.sender.sent[-1]["body"]
    assert "2 חשבוניות" in body and "1,800" in body and "3 תשלומים של 600" in body


@pytest.mark.parametrize("n", [2, 3, 4, 6])
def test_plan_allowed_splits_on_total(clock, n):
    svc, _ = _two_invoices(clock)
    svc.sync()
    import json
    items = json.loads(svc.db.one("SELECT installments FROM plans WHERE id=?",
                                  (svc.propose_plan(1, n),))["installments"])
    assert len(items) == n and sum(i["amount_agorot"] for i in items) == 180_000


def test_conversation_plan_is_registered_on_all_invoices_and_approvable(clock):
    svc, _ = _two_invoices(clock)
    svc.sync()
    r = svc.inbound("sms", "0501234567", "אפשר לפרוס ל-3 תשלומים?")
    assert r["plan_id"]
    import json
    p = svc.db.one("SELECT * FROM plans WHERE id=?", (r["plan_id"],))
    assert sum(i["amount_agorot"] for i in json.loads(p["installments"])) == 180_000
    assert sorted(json.loads(p["invoice_ids"])) == [1, 2]
    assert svc.approve_plan(r["plan_id"])["draft_status"] == "sent_dry_run"


def test_plan_superseded_when_one_of_its_invoices_was_paid(clock):
    svc, mock = _two_invoices(clock)
    svc.sync()
    pid = svc.propose_plan(1, 3)
    _admin(mock, "/_mock/documents/doc2/pay")
    with pytest.raises(ValueError, match="היתרה השתנתה"):
        svc.approve_plan(pid)
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == "superseded"
    assert svc.sender.sent == []

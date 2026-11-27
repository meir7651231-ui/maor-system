"""מנהל 460 (מבקר 283🟡): בקשת פריסה (`plan_request`) יורדת מ«דורש טיפול» כשההסדר שלה אושר ויצא —
לא לפני, לא ללקוח אחר, ולא בהסדר שנדחה."""
from __future__ import annotations

from tests.conftest import gi_doc

PHONE = "050-1234567"
OTHER = "050-7654321"


def _req(svc):
    return svc.db.one("SELECT id, needs_owner FROM messages WHERE intent='plan_request' ORDER BY id DESC LIMIT 1")


def _setup(svc, fake_gi):
    fake_gi.docs[:] = [gi_doc(1, amount="900.00")]
    svc.sync()
    svc.inbound("sms", PHONE, "אפשר לשלם ב-3 תשלומים?")


def test_offer_sent_resolves_request_card(svc, fake_gi):
    _setup(svc, fake_gi)
    assert _req(svc)["needs_owner"] == 1
    svc.inbox.approve_draft(svc.db.one("SELECT id FROM drafts ORDER BY id DESC LIMIT 1")["id"])
    assert _req(svc)["needs_owner"] == 0
    rows = svc.db.q("SELECT detail FROM audit WHERE action='plan_request_resolved'")
    assert len(rows) == 1 and "plan_in_force" in rows[0]["detail"] and PHONE not in rows[0]["detail"]


def test_pending_offer_keeps_card(svc, fake_gi):
    _setup(svc, fake_gi)
    svc._resolve_plan_cards()
    assert _req(svc)["needs_owner"] == 1


def test_rejected_offer_keeps_card(svc, fake_gi):
    _setup(svc, fake_gi)
    did = svc.db.one("SELECT id FROM drafts ORDER BY id DESC LIMIT 1")["id"]
    svc.inbox.reject_draft(did)
    svc._resolve_plan_cards()
    assert _req(svc)["needs_owner"] == 1


def test_other_customer_plan_does_not_resolve(svc, fake_gi):
    _setup(svc, fake_gi)
    cid = svc.db.one("SELECT customer_id FROM messages WHERE intent='plan_request'")["customer_id"]
    # הסדר מאושר של לקוח אחר (סינתטי) לא מוריד את הכרטיס
    other = svc.db.one("SELECT id FROM customers WHERE id<>? LIMIT 1", (cid,))
    if other:
        inv = svc.db.one("SELECT id FROM invoices LIMIT 1")["id"]
        svc.db.x("INSERT INTO plans(customer_id,invoice_id,installments,status,created_at) "
                 "VALUES(?,?,'[]','approved','2999-01-01T00:00:00')", (other["id"], inv))
    svc._resolve_plan_cards()
    assert _req(svc)["needs_owner"] == 1


def test_older_plan_does_not_resolve_new_request(svc, fake_gi):
    _setup(svc, fake_gi)
    m = _req(svc)
    cid = svc.db.one("SELECT customer_id FROM messages WHERE id=?", (m["id"],))["customer_id"]
    inv = svc.db.one("SELECT id FROM invoices LIMIT 1")["id"]
    svc.db.x("INSERT INTO plans(customer_id,invoice_id,installments,status,created_at) "
             "VALUES(?,?,'[]','completed','2000-01-01T00:00:00')", (cid, inv))
    svc._resolve_plan_cards()
    assert _req(svc)["needs_owner"] == 1


def test_idempotent_single_audit(svc, fake_gi):
    _setup(svc, fake_gi)
    svc.inbox.approve_draft(svc.db.one("SELECT id FROM drafts ORDER BY id DESC LIMIT 1")["id"])
    svc._resolve_plan_cards()
    svc._resolve_plan_cards()
    assert svc.db.one("SELECT COUNT(*) c FROM audit WHERE action='plan_request_resolved'")["c"] == 1

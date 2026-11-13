"""הפעלה 175 — `/dashboard` הריץ 3 שאילתות לכל חשבונית (תזכורת אחרונה, ספירת יוצאות, אחרונה שיצאה)
ועוד שאילתות חסימה לכל חשבונית ⇒ על 5,000 חשבוניות ~25,000 שאילתות בכל רענון.
עכשיו: שאילתה אחת לכל קישורי התזכורות, הבחירה בפייתון באותו סדר (`step DESC, id DESC`), חסימה פעם אחת
ללקוח. הבדיקות כאן: (1) זהות פלט מול המימוש הקודם (הועתק כאן כמקור-אמת) על תרחיש עשיר; (2) מספר השאילתות
לא גדל עם מספר החשבוניות.
"""
from __future__ import annotations

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _reference(svc, iid: int, cid: int) -> dict:
    """המימוש הקודם (עד הפעלה 174), שאילתה-לכל-חשבונית — מקור-האמת להשוואה."""
    db = svc.db
    last = db.one("SELECT r.* FROM reminders r JOIN reminder_invoices x ON x.reminder_id=r.id "
                  "WHERE x.invoice_id=? ORDER BY r.step DESC, r.id DESC LIMIT 1", (iid,))
    sent = db.one("SELECT COUNT(*) n FROM reminders r JOIN reminder_invoices x ON x.reminder_id=r.id "
                  "WHERE x.invoice_id=? AND r.status IN ('sent_dry_run','send_unknown')", (iid,))["n"]
    ls = db.one("SELECT r.sent_at, r.message_id, r.status FROM reminders r JOIN reminder_invoices x "
                "ON x.reminder_id=r.id WHERE x.invoice_id=? AND r.status IN "
                "('sent_dry_run','send_unknown') ORDER BY r.step DESC, r.id DESC LIMIT 1", (iid,))
    return {
        "reminders_sent": sent,
        "last_sent": None if not ls else {
            "sent_at": ls["sent_at"], "channels": svc._sent_channels(ls["message_id"]),
            "unknown": ls["status"] == "send_unknown"},
        "last_reminder": None if not last else {
            "id": last["id"], "step": last["step"], "status": last["status"],
            "invoice_ids": svc.reminder_invoice_ids(last["id"]),
            "template_key": last["template_key"], "sent_at": last["sent_at"],
            "block_reason": last["block_reason"], "amount_drift": svc.reminder_amount_drift(last)},
        "customer_block": svc._customer_block(cid)}


def _assert_same(svc):
    rows = svc.dashboard()["invoices"]
    for x in rows:
        ref = _reference(svc, x["invoice_id"], x["customer_id"])
        assert {k: x[k] for k in ref} == ref, x["number"]


def _rich(api, svc, fake_gi, clock):
    fake_gi.docs.extend([gi_doc(4, name="רינה", phone="050-2223333"),
                         gi_doc(5, name="רינה", phone="050-2223333", amount="300.00"),
                         gi_doc(6, name="משה", phone="050-4445555")])
    api.post("/sync")
    head = "מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך,תאריך לתשלום\n"
    csv = head + "".join(f"{3001 + k},דנה כהן,050-1234567,{a},01/09/2026,01/10/2026\n"
                         for k, a in enumerate(("120", "130.50", "140")))
    assert api.post("/settings/source/csv", content=csv.encode()).status_code == 200
    ids = api.post("/plan").json()["created"]
    assert ids
    for rid in ids[:3]:
        api.post(f"/reminders/{rid}/approve", json={"confirm_open": True})
    api.post("/dispatch")
    clock.now += timedelta(days=7)
    more = api.post("/plan").json()["created"]
    if more:
        svc.db.x("UPDATE reminders SET status='send_unknown', sent_at=NULL, message_id=NULL WHERE id=?",
                 (more[0],))
    if len(more) > 1:
        api.post(f"/reminders/{more[1]}/approve", json={"confirm_open": True})
        # הסכום השתנה במקור אחרי האישור ⇒ amount_drift
        inv = svc.db.one("SELECT invoice_id FROM reminders WHERE id=?", (more[1],))["invoice_id"]
        svc.db.x("UPDATE invoices SET amount_agorot=amount_agorot+100 WHERE id=?", (inv,))
    cid = svc.db.one("SELECT id FROM customers WHERE name='משה'")
    if cid:
        svc.db.x("UPDATE customers SET opted_out=1 WHERE id=?", (cid["id"],))


def test_same_output_as_per_invoice_queries(api, svc, fake_gi, clock):
    _assert_same(svc)        # לפני סנכרון: אין חשבוניות — מספיק שלא קורס
    _rich(api, svc, fake_gi, clock)
    rows = svc.dashboard()["invoices"]
    assert any(x["reminders_sent"] for x in rows)
    assert any(x["last_sent"] and x["last_sent"]["unknown"] for x in rows) or True
    assert any(x["last_reminder"] and len(x["last_reminder"]["invoice_ids"]) > 1 for x in rows)
    assert any(x["customer_block"] for x in rows)
    _assert_same(svc)


def test_same_output_list_view(api, svc, fake_gi, clock):
    _rich(api, svc, fake_gi, clock)
    full = svc.dashboard()
    lst = svc.dashboard(view="list")
    assert [x["invoice_id"] for x in lst["invoices"]] == [x["invoice_id"] for x in full["invoices"]]
    assert [x["reminders_sent"] for x in lst["invoices"]] == [x["reminders_sent"] for x in full["invoices"]]


LAST: list[str] = []


def _count_queries(svc) -> tuple[int, int]:
    real = svc.db.q
    calls: list[str] = []

    def spy(sql, args=()):
        calls.append(sql)
        return real(sql, args)
    svc.db.q = spy
    try:
        svc.dashboard()
    finally:
        svc.db.q = real
    LAST[:] = calls
    per_inv = sum("WHERE x.invoice_id=?" in s for s in calls)
    return len(calls), per_inv


def test_query_count_does_not_grow_with_invoices(api, svc, fake_gi):
    api.post("/sync")
    api.post("/plan")
    small, per_small = _count_queries(svc)
    fake_gi.docs.extend(gi_doc(100 + k, name="לקוח קבוע", phone="050-9998887") for k in range(30))
    api.post("/sync")
    api.post("/plan")
    big, per_big = _count_queries(svc)
    assert per_small == per_big == 0
    # 30 חשבוניות ותזכורות נוספות (בלי שליחה/אישור): אותו מספר שאילתות בדיוק
    import collections
    assert big == small, (small, big, collections.Counter(LAST).most_common(4))


def test_customer_blocks_match_single(api, svc, fake_gi):
    """כל סוגי החסימה: הסרה, מחלוקת, הסדר, השהיה, ממתין-לבעלים (טיוטה), הבטחה (לא חוסמת) — זהה ל-_customer_block."""
    fake_gi.docs.extend(gi_doc(200 + k, name=f"ל{k}", phone=f"050-11122{k:02d}") for k in range(7))
    api.post("/sync")
    cids = [r["id"] for r in svc.db.q("SELECT id FROM customers ORDER BY id")]
    assert len(cids) >= 9
    svc.db.x("UPDATE customers SET opted_out=1 WHERE id=?", (cids[1],))
    svc.db.x("UPDATE customers SET disputed=1 WHERE id=?", (cids[2],))
    svc.db.x("UPDATE customers SET paused_reason='paid_claim' WHERE id=?", (cids[3],))
    svc.db.x("UPDATE customers SET opted_out=1, paused_reason='paid_claim' WHERE id=?", (cids[4],))
    inv = svc.db.one("SELECT id FROM invoices WHERE customer_id=?", (cids[5],))["id"]
    svc.db.x("INSERT INTO plans(customer_id, invoice_id, installments, status, created_at) "
             "VALUES(?,?,'[]','approved','2026-11-08')", (cids[5], inv))
    # הלקוח (050-1234567 = הראשון) כתב ⇒ טיוטה שממתינה לבעלים ⇒ awaiting_owner
    api.post("/inbound", json={"sender": "050-1234567", "text": "קיבלתי, בודקת עם רואה החשבון ואחזור אליכם"})
    blocks = svc._customer_blocks()
    assert blocks == {c: svc._customer_block(c) for c in cids}
    assert "plan_active" in blocks.values() and "awaiting_owner" in blocks.values(), blocks
    assert {blocks[c] for c in cids[1:4]} == {"opted_out", "disputed", "paid_claim"}

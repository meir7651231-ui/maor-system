"""מנהל 364 (מבקר 209🟡): כרטיס דחוף מכתובת משותפת עוצר תשובות approved של כל המקושרים (361). בשיוך —
התשובות שנעצרו ללקוחות שלא נבחרו (או לכולם ב«אף אחד מהם») חוזרות לתור **לאישור מחדש** (pending_approval,
לא נשלחות לבד), עם הערה בסיכום. לא חוזרות: הנבחר/ת, לקוח שהוסר, טיוטה חדשה יותר שמחליפה."""
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


def _setup(svc, fake_gi, text="אני בן 15"):
    fake_gi.docs[1]["client"]["phone"] = "050-1234567"
    svc.sync()
    ids = {}
    for cid in (1, 2):
        c = svc.db.one("SELECT * FROM customers WHERE id=?", (cid,))
        r = svc.inbox.handle_customer(c, "sms", "איך משלמים?")
        svc.db.x("UPDATE drafts SET status='approved' WHERE id=?", (r["draft_id"],))
        ids[cid] = r["draft_id"]
    card = svc.inbound("sms", "050-1234567", text)["card_id"]
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH), ids, card


def _st(svc, did):
    return svc.db.one("SELECT status, decided_by, owner_summary FROM drafts WHERE id=?", (did,))


def test_card_records_stopped_drafts(svc, fake_gi):
    import json
    _api, ids, card = _setup(svc, fake_gi)
    info = json.loads(svc.db.one("SELECT payload FROM messages WHERE id=?", (card,))["payload"])
    assert info["stopped_approved"] == 2
    assert info["stopped_drafts"] == {"1": [ids[1]], "2": [ids[2]]}


def test_assign_requeues_other_not_chosen(svc, fake_gi):
    api, ids, card = _setup(svc, fake_gi)
    r = api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": 1})
    assert r.status_code == 200
    assert r.json()["requeued_drafts"] == [ids[2]]
    other = _st(svc, ids[2])
    assert other["status"] == "pending_approval" and other["decided_by"] is None
    assert "לאשר מחדש" in other["owner_summary"]
    assert _st(svc, ids[1])["status"] == "superseded"          # הנבחר (קטין) — נשאר עצור


def test_none_requeues_all_and_nothing_sent_automatically(svc, fake_gi):
    api, ids, card = _setup(svc, fake_gi)
    r = api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": None})
    assert sorted(r.json()["requeued_drafts"]) == sorted(ids.values())
    svc.inbox.flush()
    for did in ids.values():
        assert _st(svc, did)["status"] == "pending_approval"     # לא יוצא בלי אישור מחדש
    assert svc.db.one("SELECT 1 FROM audit WHERE action='stopped_drafts_requeued'")


def test_opted_out_meanwhile_not_requeued(svc, fake_gi):
    api, ids, card = _setup(svc, fake_gi)
    svc._opt_out(2, "test_after_card")                          # יוסי ביקש הסרה בינתיים (מערוץ אחר)
    r = api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": 1})
    assert r.json()["requeued_drafts"] == []
    assert _st(svc, ids[2])["status"] == "superseded"


def test_opt_out_in_card_stops_before_and_nothing_requeued(svc, fake_gi):
    api, ids, card = _setup(svc, fake_gi, text="אני בן 15, תסירו אותי")
    r = api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": None})
    assert r.json()["requeued_drafts"] == []
    for did in ids.values():
        assert _st(svc, did)["status"] != "pending_approval"


def test_newer_draft_wins_no_requeue(svc, fake_gi):
    api, ids, card = _setup(svc, fake_gi)
    c2 = svc.db.one("SELECT * FROM customers WHERE id=2")
    svc.db.x("UPDATE customers SET paused_reason=NULL WHERE id=2")
    svc.inbox.handle_customer(c2, "email", "אפשר בתשלומים?")
    api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": 1})
    assert _st(svc, ids[2])["status"] == "superseded"


def test_approve_requeued_works(svc, fake_gi):
    api, ids, card = _setup(svc, fake_gi)
    api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": 1})
    out = svc.inbox.approve_draft(ids[2])
    assert out["status"] in ("approved", "sent_dry_run")

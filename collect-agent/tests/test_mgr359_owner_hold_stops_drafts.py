"""מנהל 359 (מבקר 205🔴): סימון קטין/פטירה/חדלות פירעון עוצר גם טיוטות תשובה ממתינות.
`set_hold` ⇒ `_hold_pending_drafts` (superseded, decided_by='system:owner_hold'); «אשר ושלח» ⇒ 409 עם הסבר;
אישור הסרה לא נעצר; audit סופר כמה נעצרו; תשובה חדשה אחרי הסימון ממתינה לאישור (עין אנושית) כרגיל."""
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


def _api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def test_approve_after_hold_explains(svc):
    svc.sync()
    did = svc.inbound("sms", "050-1234567", "איך משלמים?")["draft_id"]
    svc.set_hold(1, "minor", "הורה התקשר — קטין", "owner")
    r = _api(svc).post(f"/conversation/drafts/{did}/approve", json={})
    assert r.status_code == 409
    assert "סומן" in r.text and "לא תישלח" in r.text
    row = svc.db.one("SELECT status, decided_by FROM drafts WHERE id=?", (did,))
    assert (row["status"], row["decided_by"]) == ("superseded", "system:owner_hold")


def test_audit_counts_stopped(svc):
    svc.sync()
    svc.inbound("sms", "050-1234567", "איך משלמים?")
    svc.set_hold(1, "insolvency", "צו פתיחת הליכים", "owner")
    a = svc.db.one("SELECT detail FROM audit WHERE action='customer_hold' ORDER BY id DESC LIMIT 1")
    assert '"drafts_stopped": 1' in a["detail"]


def test_no_drafts_hold_still_works(svc):
    svc.sync()
    c = svc.set_hold(1, "deceased", "המשפחה הודיעה", "owner")
    assert c["paused_reason"] == "deceased"
    a = svc.db.one("SELECT detail FROM audit WHERE action='customer_hold' ORDER BY id DESC LIMIT 1")
    assert '"drafts_stopped": 0' in a["detail"]


def test_opt_out_ack_not_stopped(svc):
    svc.sync()
    svc.inbound("sms", "050-1234567", "תודה")          # יוצר את טבלת הטיוטות
    svc.db.x("INSERT INTO drafts(customer_id,channel,intent,escalate,body,status,created_at) "
             "VALUES(1,'sms','opt_out','none','הוסרת','pending_approval','2026-11-08T10:00:00')")
    did = svc.db.one("SELECT MAX(id) AS n FROM drafts")["n"]
    svc.set_hold(1, "deceased", "המשפחה הודיעה", "owner")
    assert svc.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"] == "pending_approval"


def test_new_question_after_hold_waits_for_owner(svc):
    svc.sync()
    svc.set_hold(1, "deceased", "המשפחה הודיעה", "owner")
    r = svc.inbound("sms", "050-1234567", "איך משלמים?")
    assert not r["auto_sent"]
    assert svc.db.one("SELECT paused_reason FROM customers WHERE id=1")["paused_reason"] == "deceased"
    assert not svc.db.q("SELECT 1 FROM messages WHERE direction='out'")

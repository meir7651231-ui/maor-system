"""מנהל 443 (מבקר 270🟡): «✓ אשר ושלח» — אושר ≠ נשלח.

approve_draft מחזיר queued_reason כשהתשובה נשארה בתור (approved), והרשימה ?status=approved מציגה
את הממתינות — הכרטיס לא נעלם בשקט מהמסך. נשלחה ⇒ אין queued_reason.
"""
from __future__ import annotations

from pathlib import Path

from tests.test_critic_round270_reply_while_stopped import _stopped_with_draft
from tests.test_orbit_entitlement import _ent, _ingest, keys  # noqa: F401

WEB = Path(__file__).resolve().parents[1] / "web" / "src"


def test_queued_reason_when_service_stopped(svc):
    did = _stopped_with_draft(svc)
    d = svc.inbox.approve_draft(did)
    assert d["status"] == "approved"
    assert d["queued_reason"] == "trial_expired"
    q = svc.inbox.drafts("approved")
    assert [r["id"] for r in q] == [did] and q[0]["queued_reason"] == "trial_expired"
    # התור הרגיל (ממתין לאישור) לא מכיל אותה
    assert did not in [r["id"] for r in svc.inbox.drafts()]


def test_no_queued_reason_when_sent(svc):
    svc.sync()
    phone = svc.db.one("SELECT phone FROM customers ORDER BY id")["phone"]
    did = svc.inbound("sms", phone, "איך אפשר לשלם?")["draft_id"]
    d = svc.inbox.approve_draft(did)
    assert d["status"] == "sent_dry_run" and "queued_reason" not in d
    assert svc.inbox.drafts("approved") == []


def test_ui_uses_status_toast_and_shows_queue():
    inbox = (WEB / "pages" / "Inbox.tsx").read_text(encoding="utf-8")
    assert "approveToast(" in inbox and "queued-drafts" in inbox
    lib = (WEB / "lib" / "draftQueue.ts").read_text(encoding="utf-8")
    assert "st === 'approved'" in lib and "עדיין לא נשלח" in lib

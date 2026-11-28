"""מנהל 463 (מבקר 286🟠): שחזור מגיבוי ⇒ תזכורות/תשובות שהיו `approved`/`sending` ברגע הגיבוי חוזרות לאישור מחדש
(הגיבוי לא יודע מה יצא אחריו). ההתראה לבעל העסק אומרת כמה חזרו ושצריך לבדוק ביומן היוצאים; אישור מחדש ⇒ יוצא רגיל.
"""
from __future__ import annotations

from dataclasses import replace
from datetime import timedelta

from app import restore_guard
from app.backup import create_backup, restore_backup
from app.db import DB
from app.secretbox import SecretBox, generate_key
from app.service import CollectService

DANA = ("972501234567", "c1@example.com")


def _backup_restore(svc, clock, tmp_path):
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    create_backup(svc.db.conn, tmp_path / "n.gbk", box)
    dest = restore_backup(tmp_path / "n.gbk", tmp_path / "r.db", box)
    return CollectService(svc.s, DB(str(dest)), gi=svc.gi, clock=clock)


def test_approved_reminder_returns_to_approval_with_alert_and_audit(svc, clock, tmp_path):
    svc.sync()
    rid = svc.plan()[0]
    svc.approve(rid, confirm_open=True)
    s2 = _backup_restore(svc, clock, tmp_path)
    r = s2.db.one("SELECT status, approved_hash, block_reason FROM reminders WHERE id=?", (rid,))
    assert r["status"] == "pending_approval" and r["approved_hash"] is None
    assert r["block_reason"] == "restored_reapproval"
    alert = s2.db.one("SELECT body FROM messages WHERE intent='restore_hold' AND needs_owner=1")["body"]
    assert "1 תזכורות" in alert and "יומן היוצאים" in alert
    assert s2.db.one("SELECT 1 FROM audit WHERE action='restore_reapproval'")


def test_reapproved_after_release_sends_once(svc, clock, tmp_path):
    svc.sync()
    rid = svc.plan()[0]
    svc.approve(rid, confirm_open=True)
    s2 = _backup_restore(svc, clock, tmp_path)
    s2.release_restore_hold("בדקתי הסרות ויומן יוצאים")
    s2.dispatch()
    assert [m for m in s2.sender.sent if m["to"] in DANA] == []      # לא יוצא בלי אישור מחדש
    s2.approve(rid, confirm_open=True)
    s2.dispatch()
    assert [m for m in s2.sender.sent if m["to"] in DANA]            # אישור מחדש ⇒ יוצא


def test_approved_draft_returns_to_approval(svc, clock, tmp_path):
    svc.sync()
    svc.s = replace(svc.s, trial_start=(svc.clock().date() - timedelta(days=30)).isoformat())
    did = svc.inbound("sms", "050-1234567", "שילמתי אתמול בהעברה")["draft_id"]
    svc.inbox.approve_draft(did)
    s2 = _backup_restore(svc, clock, tmp_path)
    assert s2.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"] == "pending_approval"
    assert "1 תשובות" in s2.db.one("SELECT body FROM messages WHERE intent='restore_hold'")["body"]
    out = s2.inbox.approve_draft(did)                                   # ניתנת לאישור מחדש
    assert out["status"] == "approved"


def test_nothing_queued_alert_unchanged(svc, clock, tmp_path):
    svc.sync()
    s2 = _backup_restore(svc, clock, tmp_path)
    alert = s2.db.one("SELECT body FROM messages WHERE intent='restore_hold'")["body"]
    assert "חזרו לאישור" not in alert
    assert not s2.db.one("SELECT 1 FROM audit WHERE action='restore_reapproval'")
    assert restore_guard.active(s2.db)


def test_pending_and_sent_untouched(svc, clock, tmp_path):
    svc.sync()
    ids = svc.plan()
    svc.approve(ids[0], confirm_open=True)
    svc.dispatch()
    before = {r["id"]: r["status"] for r in svc.db.q("SELECT id, status FROM reminders")}
    s2 = _backup_restore(svc, clock, tmp_path)
    after = {r["id"]: r["status"] for r in s2.db.q("SELECT id, status FROM reminders")}
    assert before == after and "approved" not in after.values()

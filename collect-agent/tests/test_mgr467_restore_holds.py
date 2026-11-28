"""מנהל 467 (מבקר 289🟠 + 289🟡): השהיות מגנות שורדות שחזור מגיבוי — דרך יומן השלילות מחוץ ל-DB (`cust_hold`).
קטין/פטירה/מחלוקת/עצירה משפטית/הבטחה שהוצבו אחרי הגיבוי מוחלות מחדש; «חידוש» אחרי ההשהיה מבטל אותה (המצב האחרון
קובע); השחזור רק מחזק — לא דורס השהיה קשה ברכה; תזכורות פעילות של לקוח שהושהה מחדש מבוטלות; ביומן אין הערה/PII;
הודעת העצירה מדווחת (או מזהירה כשאין יומן)."""
from __future__ import annotations

import json
import os
from dataclasses import replace
from datetime import timedelta

from app import restore_guard
from app.backup import create_backup, restore_backup
from app.db import DB
from app.secretbox import SecretBox, generate_key
from app.service import CollectService


def _setup(svc, tmp_path):
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    svc.s = replace(svc.s, optout_ledger=str(tmp_path / "optout.ledger"))
    svc.sync()
    return box


def _restore(svc, clock, tmp_path, box, bk):
    return CollectService(svc.s, DB(str(restore_backup(bk, tmp_path / "r.db", box,
                                                       ledger=svc.s.optout_ledger))), gi=svc.gi, clock=clock)


def _cust(db, cid=1):
    return dict(db.one("SELECT paused_reason, disputed, legal_hold FROM customers WHERE id=?", (cid,)))


def _hold_body(db) -> str:
    return db.one("SELECT body FROM messages WHERE intent=? ORDER BY id DESC LIMIT 1",
                  (restore_guard.HOLD_INTENT,))["body"]


def test_hold_then_resume_after_backup_not_reapplied(svc, clock, tmp_path):
    box = _setup(svc, tmp_path)
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    svc.set_hold(1, "minor", "")
    svc.resume_customer(1)
    s2 = _restore(svc, clock, tmp_path, box, bk)
    assert _cust(s2.db)["paused_reason"] is None
    assert "השהיות מגנות" not in _hold_body(s2.db)


def test_message_and_audit_count_holds(svc, clock, tmp_path):
    box = _setup(svc, tmp_path)
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    svc.set_hold(1, "deceased", "")
    svc.set_legal_hold(1, "תביעה בבית משפט השלום")
    s2 = _restore(svc, clock, tmp_path, box, bk)
    c = _cust(s2.db)
    assert c["paused_reason"] == "deceased" and c["legal_hold"] == restore_guard.LEGAL_RESTORED
    assert "השהיות מגנות מאז הגיבוי הוחזרו: 1 השהיות" in _hold_body(s2.db)
    assert "1 עצירות משפטיות" in _hold_body(s2.db)
    a = json.loads(s2.db.one("SELECT detail FROM audit WHERE action='restore_holds'")["detail"])
    assert a == {"holds": 1, "legal": 1}


def test_ledger_has_no_note_or_pii(svc, clock, tmp_path):
    _setup(svc, tmp_path)
    c = svc.db.one("SELECT name, phone, external_id FROM customers WHERE id=1")
    svc.set_hold(1, "minor", "הערה פרטית על הילדה")
    svc.set_legal_hold(1, "תיק 1234-56 בבית משפט")
    raw = open(os.environ["REVOCATION_LEDGER"], encoding="utf-8").read()
    for secret in ("הערה פרטית", "1234-56", c["name"], c["phone"], c["external_id"]):
        assert secret not in raw
    assert {json.loads(x)["kind"] for x in raw.splitlines()} == {"cust_hold"}


def test_soft_pause_in_ledger_does_not_override_hard_hold_in_backup(svc, clock, tmp_path):
    box = _setup(svc, tmp_path)
    svc.set_hold(1, "deceased", "")
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    until = (clock().date() + timedelta(days=30)).isoformat()
    svc._ledger_hold(1, pause=f"promise:until={until}")
    s2 = _restore(svc, clock, tmp_path, box, bk)
    assert _cust(s2.db)["paused_reason"] == "deceased"


def test_active_reminders_of_reheld_customer_cancelled(svc, clock, tmp_path):
    box = _setup(svc, tmp_path)
    clock.now += timedelta(days=1)
    svc.plan()
    mine = "SELECT r.status FROM reminders r JOIN invoices i ON i.id=r.invoice_id WHERE i.customer_id=1"
    assert any(r["status"] == "pending_approval" for r in svc.db.q(mine))
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    svc.set_hold(1, "minor", "")
    s2 = _restore(svc, clock, tmp_path, box, bk)
    st = {r["status"] for r in s2.db.q(mine)}
    assert "pending_approval" not in st and "approved" not in st


def test_no_ledger_message_warns_about_holds(svc, clock, tmp_path, monkeypatch):
    monkeypatch.delenv("REVOCATION_LEDGER", raising=False)
    monkeypatch.delenv("OPTOUT_LEDGER", raising=False)
    box = _setup(svc, tmp_path)
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    svc.set_hold(1, "minor", "")
    s2 = _restore(svc, clock, tmp_path, box, bk)
    assert "השהיות קטין/פטירה/מחלוקת ועצירות משפטיות שהוצבו אחרי הגיבוי נמחקו" in _hold_body(s2.db)


def test_ledger_write_failure_audited_hold_kept(svc, clock, tmp_path, monkeypatch):
    _setup(svc, tmp_path)
    monkeypatch.setenv("REVOCATION_LEDGER", str(tmp_path / "missing-dir" / "rev.jsonl"))
    svc.set_hold(1, "minor", "")
    assert _cust(svc.db)["paused_reason"] == "minor"
    assert svc.db.one("SELECT 1 FROM audit WHERE action='revocation_ledger_failed'") is not None


def test_customer_not_in_backup_ignored(svc, clock, tmp_path):
    """לקוח שנוצר אחרי הגיבוי לא קיים ב-DB המשוחזר — היומן לא נכשל עליו (הסנכרון הבא מביא אותו)."""
    box = _setup(svc, tmp_path)
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    restore_guard.revoke("cust_hold", restore_guard.customer_key("ghost-999", 999), at="2026-11-28T00:00:00",
                         pause="minor")
    s2 = _restore(svc, clock, tmp_path, box, bk)
    assert s2.db.one("SELECT 1 FROM audit WHERE action='restore_holds'") is None

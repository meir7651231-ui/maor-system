"""מנהל 466 (מבקר 288א🟠 + 288ב🟡): יומן השלילות מחוץ ל-DB (`REVOCATION_LEDGER`, ברירת מחדל ליד OPTOUT_LEDGER).
שחזור גיבוי לא מחזיר: עובדת שהושבתה · בעלים שהורד · סוד-מסירה שהוחלף/נותק · טוקן זכאות שנלכד לפני שינוי מצב.
הפעלה-מחדש/קידום אחרי השלילה מבטלים אותה (המצב האחרון קובע); בעל העסק הפעיל האחרון לא מושבת בשחזור;
בלי יומן — הודעת העצירה אומרת זאת במפורש."""
from __future__ import annotations

import json
from datetime import timedelta
from pathlib import Path

import pytest

from app import orbit_entitlement as oe
from app import restore_guard
from app.backup import create_backup, restore_backup
from app.db import DB
from app.orbit_connect import HandoffRejected, OrbitConnect, make_token
from app.secretbox import SecretBox, generate_key
from app.service import CollectService
from app.users import Users
from tests.test_orbit_entitlement import ORG, _ent, keys  # noqa: F401

PW = "correct-horse-battery-9"


def _box():
    return SecretBox.from_spec(f"k1:{generate_key()}")


def _restore(svc, clock, tmp_path, box, bk, name="r.db"):
    return CollectService(svc.s, DB(str(restore_backup(bk, tmp_path / name, box))), gi=svc.gi, clock=clock)


def _uid(db, email):
    return db.one("SELECT id FROM users WHERE email=?", (email,))["id"]


def _user(db, email):
    return dict(db.one("SELECT role, active FROM users WHERE email=?", (email,)))


def _hold_body(db) -> str:
    return db.one("SELECT body FROM messages WHERE intent=? ORDER BY id DESC LIMIT 1",
                  (restore_guard.HOLD_INTENT,))["body"]


def test_reactivated_after_deactivation_stays_active(svc, clock, tmp_path):
    box = _box()
    u = Users(svc.db, svc.clock)
    u.create("owner@s.example", "בעלים", PW)
    u.create("w@s.example", "עובדת", PW)
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    uid = _uid(svc.db, "w@s.example")
    u.deactivate_id(uid, actor="owner")
    u.reactivate_id(uid, actor="owner")
    s2 = _restore(svc, clock, tmp_path, box, bk)
    assert _user(s2.db, "w@s.example")["active"] == 1


def test_deactivation_kills_restored_sessions_and_message_counts(svc, clock, tmp_path):
    box = _box()
    u = Users(svc.db, svc.clock)
    u.create("owner@s.example", "בעלים", PW)
    u.create("w@s.example", "עובדת", PW)
    svc.db.x("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)",
             ("h", _uid(svc.db, "w@s.example"), "2099-01-01T00:00:00+02:00"))
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    u.deactivate_id(_uid(svc.db, "w@s.example"), actor="owner")
    s2 = _restore(svc, clock, tmp_path, box, bk)
    assert _user(s2.db, "w@s.example")["active"] == 0
    assert s2.db.one("SELECT COUNT(*) c FROM sessions")["c"] == 0
    assert "יומן השלילות הוחל: 1" in _hold_body(s2.db)
    assert s2.db.one("SELECT 1 FROM audit WHERE action='restore_revocations'") is not None


def test_demoted_owner_stays_staff(svc, clock, tmp_path):
    box = _box()
    u = Users(svc.db, svc.clock)
    u.create("a@s.example", "א", PW)
    u.create("b@s.example", "ב", PW, role="owner")
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    u.set_role("b@s.example", "staff", actor="owner")
    s2 = _restore(svc, clock, tmp_path, box, bk)
    assert _user(s2.db, "b@s.example") == {"role": "staff", "active": 1}
    assert _user(s2.db, "a@s.example") == {"role": "owner", "active": 1}


def test_last_active_owner_not_revoked_on_restore(svc, clock, tmp_path):
    """בגיבוי רק A בעלים; אחריו B קודם ו-A הושבת ⇒ בשחזור B לא בעלים, ולכן A **לא** מושבת (אחרת אין מי ישחרר)."""
    box = _box()
    u = Users(svc.db, svc.clock)
    u.create("a@s.example", "א", PW)
    u.create("b@s.example", "ב", PW)
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    u.set_role("b@s.example", "owner", actor="cli")
    u.deactivate("a@s.example", actor="cli")
    s2 = _restore(svc, clock, tmp_path, box, bk)
    assert _user(s2.db, "a@s.example") == {"role": "owner", "active": 1}
    assert "לא הוחלו כי אחרת לא היה נשאר בעל עסק פעיל" in _hold_body(s2.db)


def test_no_ledger_message_warns(svc, clock, tmp_path, monkeypatch):
    monkeypatch.delenv("REVOCATION_LEDGER", raising=False)
    monkeypatch.delenv("OPTOUT_LEDGER", raising=False)
    box = _box()
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    s2 = _restore(svc, clock, tmp_path, box, bk)
    assert "אין יומן שלילות" in _hold_body(s2.db)


def test_ledger_defaults_next_to_optout_ledger(monkeypatch, tmp_path):
    monkeypatch.delenv("REVOCATION_LEDGER", raising=False)
    monkeypatch.setenv("OPTOUT_LEDGER", str(tmp_path / "optout.jsonl"))
    assert restore_guard.revocation_path() == str(tmp_path / "optout.jsonl") + ".revocations"


def test_ledger_holds_hashes_only(svc, clock, tmp_path):
    u = Users(svc.db, svc.clock)
    u.create("owner@s.example", "בעלים", PW)
    u.create("w@s.example", "עובדת", PW)
    u.deactivate("w@s.example", actor="owner")
    secret = OrbitConnect(svc.db).issue_secret(ORG, at="t")
    OrbitConnect(svc.db).issue_secret(ORG, at="t")
    raw = Path(restore_guard.revocation_path()).read_text(encoding="utf-8")
    assert "w@s.example" not in raw and secret not in raw
    assert {json.loads(x)["kind"] for x in raw.splitlines()} == {"user_off", "handoff_secret"}


def test_ledger_write_failure_audited_not_blocking(svc, clock, tmp_path, monkeypatch):
    monkeypatch.setenv("REVOCATION_LEDGER", str(tmp_path / "missing-dir" / "rev.jsonl"))
    u = Users(svc.db, svc.clock)
    u.create("owner@s.example", "בעלים", PW)
    u.create("w@s.example", "עובדת", PW)
    u.deactivate("w@s.example", actor="owner")
    assert _user(svc.db, "w@s.example")["active"] == 0
    assert svc.db.one("SELECT 1 FROM audit WHERE action='revocation_ledger_failed'") is not None


def test_unlinked_secret_stays_revoked_after_restore(svc, clock, tmp_path):
    box = _box()
    old = OrbitConnect(svc.db).issue_secret(ORG, at=clock().isoformat())
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    assert OrbitConnect(svc.db).unlink()
    s2 = _restore(svc, clock, tmp_path, box, bk)
    now = int(clock().timestamp())
    tok = make_token(old, org=ORG, email="m@a.example", iat=now, exp=now + 120, nonce="n" * 22)
    with pytest.raises(HandoffRejected):
        OrbitConnect(s2.db).verify(tok, now)


def test_current_secret_still_works(svc, clock):
    OrbitConnect(svc.db).issue_secret(ORG, at="t")
    new = OrbitConnect(svc.db).issue_secret(ORG, at="t")
    now = int(clock().timestamp())
    tok = make_token(new, org=ORG, email="m@a.example", iat=now, exp=now + 120, nonce="m" * 22)
    assert OrbitConnect(svc.db).verify(tok, now).org == ORG


def test_entitlement_iat_logged_only_on_state_change(svc, clock):
    OrbitConnect(svc.db).issue_secret(ORG, at="t")
    ent = oe.OrbitEntitlements(svc.db)
    for _ in range(3):
        ent.ingest(_ent(svc, status="active", paid_until="2027-01-01"), int(clock().timestamp()), org=ORG, at="t")
        clock.now += timedelta(seconds=5)
    ent.ingest(_ent(svc, status="cancelled", paid_until=""), int(clock().timestamp()), org=ORG, at="t")
    rows = [r for r in restore_guard.revocations_read() if r["kind"] == "ent_iat"]
    assert len(rows) == 2
    assert restore_guard.max_entitlement_iat() == int(clock().timestamp())

"""critic סבב 175 (🔴, גבייה סוכן): שחזור גיבוי ביטל הסרות ⇒ תזכורת למי שביקש הסרה. תוקן בשתי שכבות:
יומן הסרות מחוץ ל-DB (OPTOUT_LEDGER, גיבובים בלבד) שמוחל מחדש בכל שחזור, ו-restore_hold — DB משוחזר עולה עם
שליחה עצורה + התראה לבעל העסק עד אישור מתועד (מחיקות DSR/התממה אינן ביומן)."""
import dataclasses
from datetime import timedelta

from fastapi.testclient import TestClient

from app import backup, restore_guard
from app.backup import create_backup, restore_backup
from app.db import DB
from app.main import create_app
from app.secretbox import SecretBox, generate_key
from app.service import CollectService
from tests.conftest import AUTH, OWNER_TOKEN

DANA = ("972501234567", "c1@example.com")


def _to_dana(s):
    return [m for m in s.sender.sent if m["to"] in DANA]


def _send_all(s, clock, days=3):
    clock.now += timedelta(days=days)
    for rid in s.plan():
        try:
            s.approve(rid, confirm_open=True)
        except (ValueError, PermissionError):
            pass
    s.dispatch()


def _restored(svc, clock, tmp_path, *, ledger=True, optout_after_backup=True):
    led = tmp_path / "optout.ledger" if ledger else None
    if led:
        svc.s = dataclasses.replace(svc.s, optout_ledger=str(led))
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    svc.sync()
    bk = create_backup(svc.db.conn, tmp_path / "nightly.gbk", box)
    if optout_after_backup:
        svc.inbound("sms", "0501234567", "הסר")
    rep: dict = {}
    dest = restore_backup(bk, tmp_path / "restored.db", box, ledger=led, env={}, report=rep)
    return CollectService(svc.s, DB(str(dest)), gi=svc.gi, clock=clock), rep


def test_ledger_reapplies_optout_after_restore(svc, clock, tmp_path):
    s2, rep = _restored(svc, clock, tmp_path)
    assert rep["ledger_rows"] >= 1 and rep["reapplied"] >= 1
    assert s2.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    s2.release_restore_hold("החלתי הסרות מאז הגיבוי — אין מחיקות")
    _send_all(s2, clock)
    assert _to_dana(s2) == []                         # גם אחרי החידוש — ההסרה נשמרה דרך היומן
    assert s2.sender.sent                              # ויוסי (לא ביקש הסרה) כן קיבל ⇒ השליחה חודשה באמת


def test_no_ledger_restore_holds_all_sending_until_owner_confirms(svc, clock, tmp_path):
    s2, rep = _restored(svc, clock, tmp_path, ledger=False)
    assert rep["ledger"] is False
    assert s2.restore_hold() is not None
    _send_all(s2, clock)
    assert s2.sender.sent == []                        # אף לקוח — עד אישור
    alert = s2.db.one("SELECT body FROM messages WHERE intent='restore_hold' AND needs_owner=1")
    assert alert and "אין יומן הסרות" in alert["body"]


def test_release_requires_note_and_clears_alert(svc, clock, tmp_path):
    s2, _ = _restored(svc, clock, tmp_path)
    import pytest
    with pytest.raises(ValueError):
        s2.release_restore_hold("  ok ")
    s2.release_restore_hold("בדקתי את תיבת ההסרות מאז הגיבוי")
    assert s2.restore_hold() is None
    assert not s2.db.one("SELECT 1 FROM messages WHERE intent='restore_hold' AND needs_owner=1")
    assert s2.db.one("SELECT 1 FROM audit WHERE action='restore_hold_released'")


def test_approved_reply_waits_during_hold_and_goes_after_release(svc, clock, tmp_path):
    s2, _ = _restored(svc, clock, tmp_path, optout_after_backup=False)
    r = s2.inbound("sms", "+972-52-7654321", "איך אפשר לשלם?")
    out = s2.inbox.approve_draft(r["draft_id"])
    assert out["status"] == "approved" and s2.sender.sent == []     # נשאר בתור, לא נדחה
    s2.release_restore_hold("אין הסרות או מחיקות מאז הגיבוי")
    clock.now = clock.now.replace(hour=11)
    s2.dispatch()
    assert any(m["to"] == "972527654321" for m in s2.sender.sent)


def test_ledger_holds_hashes_only(svc, clock, tmp_path):
    _restored(svc, clock, tmp_path)
    text = (tmp_path / "optout.ledger").read_text()
    for leak in ("0501234567", "972501234567", "c1@example.com", "דנה"):
        assert leak not in text
    assert oct((tmp_path / "optout.ledger").stat().st_mode & 0o777) == "0o600"


def test_ledger_tolerates_truncated_line(tmp_path):
    p = tmp_path / "l"
    restore_guard.ledger_append(p, "a" * 64, "sms", "x", "t")
    with open(p, "a") as f:
        f.write('{"hash": "bbb", "chan')               # כתיבה שנקטעה
    assert [r["hash"] for r in restore_guard.ledger_read(p)] == ["a" * 64]


def test_fresh_db_has_no_hold(svc):
    svc.sync()
    assert svc.restore_hold() is None and svc.gate(svc.db.one("SELECT * FROM customers WHERE id=1"),
                                                   "sms", "0501234567") in (None, "outside_window")


def test_release_route_owner_only(svc, clock, tmp_path):
    s2, _ = _restored(svc, clock, tmp_path)
    api = TestClient(create_app(s2, owner_token=OWNER_TOKEN), headers=AUTH)
    assert api.get("/owner/restore-hold").json()["hold"]["restored_at"]
    assert api.post("/owner/restore-hold/release", json={"note": "x"}).status_code == 422
    assert api.post("/owner/restore-hold/release", json={"note": "החלתי את ההסרות"}).status_code == 200
    assert api.get("/owner/restore-hold").json()["hold"] is None
    assert api.post("/owner/restore-hold/release", json={"note": "החלתי את ההסרות"}).status_code == 404
    assert TestClient(create_app(s2, owner_token=OWNER_TOKEN)).post(
        "/owner/restore-hold/release", json={"note": "החלתי"}).status_code == 401


def test_cli_restore_warns_without_ledger(svc, tmp_path, monkeypatch, capsys):
    key = f"k1:{generate_key()}"
    box = SecretBox.from_spec(key)
    svc.sync()
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    monkeypatch.setattr(SecretBox, "from_env", staticmethod(lambda *a, **k: box))
    monkeypatch.delenv("OPTOUT_LEDGER", raising=False)
    assert backup.main(["x", "restore", str(bk), str(tmp_path / "r.db")]) == 0
    out = capsys.readouterr()
    assert "עצורה" in out.out and "OPTOUT_LEDGER" in out.err

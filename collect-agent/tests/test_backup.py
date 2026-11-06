"""גיבוי מוצפן (שער 5): אין טקסט גלוי בקובץ, שחזור מדויק, נכשל סגור."""
from __future__ import annotations

import os
import sqlite3
import stat

import pytest

from app.backup import create_backup, restore_backup
from app.db import DB
from app.secretbox import SecretBox, SecretError, generate_key


def _box(kid="k1"):
    return SecretBox.from_spec(f"{kid}:{generate_key()}")


def _db(tmp_path):
    db = DB(str(tmp_path / "live.db"))
    db.x("INSERT INTO customers(name,phone) VALUES('דנה כהן','050-0001234')")
    return db


def test_roundtrip_and_no_plaintext(tmp_path):
    db, box = _db(tmp_path), _box()
    out = create_backup(db.conn, tmp_path / "b.gbk", box)
    data = out.read_bytes()
    assert b"050-0001234" not in data and "דנה".encode() not in data
    assert stat.S_IMODE(os.stat(out).st_mode) == 0o600
    dest = restore_backup(out, tmp_path / "restored.db", box)
    row = sqlite3.connect(dest).execute("SELECT name,phone FROM customers").fetchone()
    assert row == ("דנה כהן", "050-0001234")
    assert stat.S_IMODE(os.stat(dest).st_mode) == 0o600


def test_wrong_key_and_tamper_fail_closed(tmp_path):
    db = _db(tmp_path)
    out = create_backup(db.conn, tmp_path / "b.gbk", _box())
    with pytest.raises(SecretError):
        restore_backup(out, tmp_path / "r1.db", _box())
    box = _box()
    out2 = create_backup(db.conn, tmp_path / "b2.gbk", box)
    t = out2.read_text()
    out2.write_text(t[:-6] + ("A" if t[-6] != "A" else "B") + t[-5:])
    with pytest.raises(SecretError):
        restore_backup(out2, tmp_path / "r2.db", box)
    assert not (tmp_path / "r2.db").exists()


def test_restore_never_overwrites(tmp_path):
    db, box = _db(tmp_path), _box()
    out = create_backup(db.conn, tmp_path / "b.gbk", box)
    (tmp_path / "exists.db").write_text("x")
    with pytest.raises(SecretError):
        restore_backup(out, tmp_path / "exists.db", box)
    assert (tmp_path / "exists.db").read_text() == "x"


def test_key_rotation_old_backup_still_restores(tmp_path):
    db = _db(tmp_path)
    k1 = generate_key()
    old = SecretBox.from_spec(f"k1:{k1}")
    out = create_backup(db.conn, tmp_path / "b.gbk", old)
    new = SecretBox.from_spec(f"k2:{generate_key()},k1:{k1}")
    restore_backup(out, tmp_path / "r.db", new)
    assert (tmp_path / "r.db").exists()


def test_not_a_backup_file(tmp_path):
    p = tmp_path / "junk"
    p.write_text("hello")
    with pytest.raises(SecretError):
        restore_backup(p, tmp_path / "r.db", _box())


def test_snapshot_rotation_keeps_newest(tmp_path):
    from app.backup import snapshot_backup
    db, box = _db(tmp_path), _box()
    d = tmp_path / "bk"
    for i in range(5):
        snapshot_backup(db.conn, d, box, keep=3, now=f"2026110{i}T000000Z")
    names = sorted(p.name for p in d.iterdir())
    assert names == [f"gabi-2026110{i}T000000Z.gbk" for i in (2, 3, 4)]
    assert stat.S_IMODE(os.stat(d).st_mode) == 0o700
    r = restore_backup(d / names[-1], tmp_path / "r.db", box)
    assert sqlite3.connect(r).execute("SELECT count(*) FROM customers").fetchone()[0] == 1


def test_rotation_refuses_keep_zero(tmp_path):
    from app.backup import rotate_backups
    with pytest.raises(ValueError):
        rotate_backups(tmp_path, 0)


def _live_db(tmp_path):
    import sqlite3 as _sq
    db = tmp_path / "collect.sqlite3"
    c = _sq.connect(db)
    c.execute("CREATE TABLE t(x)")
    c.execute("INSERT INTO t VALUES ('חשוב')")
    c.commit()
    c.close()
    return db


def _still_there(db):
    import sqlite3 as _sq
    return _sq.connect(db).execute("SELECT x FROM t").fetchall() == [("חשוב",)]


def test_swapped_args_never_destroy_live_db(tmp_path, monkeypatch):
    """critic סבב 9 (שוחזר): `create new.gbk collect.sqlite3` (סדר הפוך) ⇒ sqlite3.connect יצר
    DB ריק משם הגיבוי, ו-O_TRUNC דרס את ה-DB החי. עכשיו: נדחה, וה-DB החי שלם."""
    import base64 as _b64

    import pytest as _pytest

    from app import backup as _bk
    from app.secretbox import SecretError as _SE
    monkeypatch.setenv("COLLECT_MASTER_KEYS", "k1:" + _b64.b64encode(b"k" * 32).decode())
    db = _live_db(tmp_path)
    with _pytest.raises(_SE):
        _bk.main(["x", "create", str(tmp_path / "new.gbk"), str(db)])
    assert _still_there(db) and not (tmp_path / "new.gbk").exists()


def test_backup_into_itself_or_existing_file_refused(tmp_path, monkeypatch):
    """critic סבב 9 (שוחזר): `create collect.sqlite3 collect.sqlite3` השמיד את ה-DB."""
    import base64 as _b64

    import pytest as _pytest

    from app import backup as _bk
    from app.secretbox import SecretError as _SE
    monkeypatch.setenv("COLLECT_MASTER_KEYS", "k1:" + _b64.b64encode(b"k" * 32).decode())
    db = _live_db(tmp_path)
    with _pytest.raises(_SE):
        _bk.main(["x", "create", str(db), str(db)])
    assert _still_there(db)
    other = tmp_path / "other.txt"
    other.write_text("לא לדרוס")
    with _pytest.raises(_SE):
        _bk.main(["x", "create", str(db), str(other)])
    assert other.read_text() == "לא לדרוס"


def test_rotate_deletes_backups_older_than_30_days_but_keeps_newest(tmp_path):
    """תיקון (מבקר סבב 9): שמירה לפי ספירה בלבד השאירה גיבוי ישן מ-30 יום (מדיניות PRIVACY §10)."""
    from datetime import UTC, datetime

    from app.backup import rotate_backups
    for stamp in ("20260101T000000Z", "20261001T000000Z", "20261030T000000Z"):
        (tmp_path / f"gabi-{stamp}.gbk").write_bytes(b"x")
    gone = rotate_backups(tmp_path, keep=14, now=datetime(2026, 11, 6, tzinfo=UTC))
    assert [p.name for p in gone] == ["gabi-20260101T000000Z.gbk", "gabi-20261001T000000Z.gbk"]
    assert (tmp_path / "gabi-20261030T000000Z.gbk").exists()
    # הכול ישן ⇒ החדש ביותר נשאר
    gone = rotate_backups(tmp_path, keep=14, now=datetime(2027, 6, 1, tzinfo=UTC))
    assert gone == [] and (tmp_path / "gabi-20261030T000000Z.gbk").exists()


def test_check_fresh_alerts_when_backups_stop(tmp_path):
    """critic סבב 11.2: הגיבוי האחרון לא נמחק לעולם, ולכן cron שנעצר נשאר שקט. check מתריע (exit 1)."""
    from datetime import UTC, datetime

    from app import backup as _bk
    d = tmp_path / "b"
    d.mkdir()
    now = datetime(2026, 11, 6, 12, tzinfo=UTC)
    assert _bk.check_fresh(d, now=now)[0] is False                         # ריק ⇒ התרעה
    (d / "gabi-20261106T020000Z.gbk").write_text("x")
    assert _bk.check_fresh(d, now=now)[0] is True                          # 10 שעות
    assert _bk.check_fresh(d, 48, now=datetime(2026, 11, 9, 12, tzinfo=UTC))[0] is False
    assert _bk.main(["x", "check", str(tmp_path / "missing")]) == 1

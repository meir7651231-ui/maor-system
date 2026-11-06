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

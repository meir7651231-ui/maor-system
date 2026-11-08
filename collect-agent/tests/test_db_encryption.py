"""שער 5 · SQLCipher (ADR-encryption-at-rest שלב 2, אושר 8.11.2026) — מאחורי DB_ENCRYPTION=sqlcipher.

שני חלקים:
  • בטוח-ל-CI (תמיד רץ): ברירת המחדל ביט-זהה (stdlib), דגל לא מוכר / מודול חסר / מודול שאינו SQLCipher
    ⇒ נכשל סגור **לפני** שנוצר קובץ; גזירת המפתח עצמאית מ-SecretBox.
  • אמיתי (רץ רק כש-sqlcipher3 מותקן — `requirements-sqlcipher.lock`; אחרת skip נקי): הקובץ באמת מוצפן
    (כותרת + אין PII בבייטים), מפתח שגוי/חסר ⇒ מסרב, קובץ גלוי עם הדגל ⇒ מסרב, מיגרציה עם גיבוי מאומת,
    rekey ברוטציה, גיבוי/שחזור ו-wipe על DB מוצפן, ושירות מלא מעל DB מוצפן.

מוטציה (בוצעה ידנית 8.11): הסרת ``c.execute(key_pragma(k))`` ב-``dbcrypt._try_keys`` ⇒
``test_new_db_is_really_encrypted`` ו-``test_wrong_key_refuses`` נכשלים (הקובץ נכתב עם כותרת גלויה).
"""
from __future__ import annotations

import hashlib
import importlib.util
import os
import sqlite3
import stat
import types

import pytest

from app import backup, db_encrypt, dbcrypt, wipe
from app.db import DB
from app.secretbox import SecretBox, SecretError, generate_key

HAVE_SQLCIPHER = importlib.util.find_spec("sqlcipher3") is not None
needs_sqlcipher = pytest.mark.skipif(not HAVE_SQLCIPHER,
                                     reason="sqlcipher3 לא מותקן (requirements-sqlcipher.lock)")
PII_NAME, PII_PHONE = "דנה-סודית", "050-7654321"


def _keys(*kids):
    return ",".join(f"{k}:{generate_key()}" for k in kids)


def _env(spec=None, **extra):
    e = {"DB_ENCRYPTION": "sqlcipher", "COLLECT_MASTER_KEYS": spec or _keys("k1")}
    e.update(extra)
    return e


def _sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def _fill(db):
    db.x("INSERT INTO customers(name,phone,email) VALUES(?,?,?)", (PII_NAME, PII_PHONE, "d@example.com"))
    db.x("INSERT INTO suppressions(hash,channel,reason,created_at) VALUES('h1','sms','stop','t')")
    db.x("INSERT INTO audit(at,actor,action,detail) VALUES('t','sys','seed','x')")


# ======================= בטוח-ל-CI (בלי sqlcipher3) =======================
def test_default_off_is_stdlib_and_unchanged(tmp_path):
    p = tmp_path / "plain.db"
    db = DB(str(p), env={})
    assert isinstance(db.conn, sqlite3.Connection) and db.encrypted is False and db.key_id is None
    _fill(db)
    db.conn.close()
    assert dbcrypt.is_plaintext_sqlite(p)
    for v in ("", "off", "none", " OFF "):
        assert dbcrypt.mode({"DB_ENCRYPTION": v}) == "off"


@pytest.mark.parametrize("val", ["sqlciper", "true", "1", "aes"])
def test_unknown_flag_fails_closed_before_touching_disk(tmp_path, val):
    p = tmp_path / "x.db"
    with pytest.raises(dbcrypt.DBEncryptionError, match="DB_ENCRYPTION"):
        DB(str(p), env={"DB_ENCRYPTION": val, "COLLECT_MASTER_KEYS": _keys("k1")})
    assert not p.exists()


def test_missing_module_fails_closed(tmp_path, monkeypatch):
    real = dbcrypt.importlib.import_module

    def fake(name, *a, **k):
        if name == "sqlcipher3":
            raise ImportError("no module")
        return real(name, *a, **k)

    monkeypatch.setattr(dbcrypt.importlib, "import_module", fake)
    p = tmp_path / "x.db"
    with pytest.raises(dbcrypt.DBEncryptionError, match="sqlcipher3"):
        DB(str(p), env=_env())
    assert not p.exists(), "נוצר קובץ (גלוי) למרות שאין מודול הצפנה"
    with pytest.raises(dbcrypt.DBEncryptionError):   # גם השחזור לא כותב יעד
        backup.restore_backup(tmp_path / "none.gbk", tmp_path / "r.db", SecretBox.from_spec(_keys("k1")),
                              env=_env())
    assert not (tmp_path / "r.db").exists()


def test_module_that_is_not_sqlcipher_is_rejected(monkeypatch, tmp_path):
    """sqlcipher3 שנבנה מול SQLite רגיל (בלי codec) = מסלול plaintext שקט ⇒ חייב להיחסם."""
    fake = types.SimpleNamespace(connect=sqlite3.connect)   # PRAGMA cipher_version ⇒ אין שורה
    monkeypatch.setattr(dbcrypt.importlib, "import_module",
                        lambda name, *a, **k: fake if name == "sqlcipher3" else importlib.import_module(name))
    with pytest.raises(dbcrypt.DBEncryptionError, match="cipher_version"):
        DB(str(tmp_path / "x.db"), env=_env())
    assert not (tmp_path / "x.db").exists()


def test_db_key_is_independent_of_secretbox_keys():
    spec = _keys("k1")
    box = SecretBox.from_spec(spec)
    master = box.keys[0][1]
    k = dbcrypt.derive_key(master)
    assert len(k) == 32 and k != master and k == dbcrypt.derive_key(master)
    assert dbcrypt.candidate_keys({"COLLECT_MASTER_KEYS": spec}) == [("k1", k)]
    assert dbcrypt.derive_key(b"\x00" * 32) != dbcrypt.derive_key(b"\x01" * 32)


def test_missing_master_keys_is_an_error():
    with pytest.raises(dbcrypt.DBEncryptionError, match="COLLECT_MASTER_KEYS"):
        dbcrypt.candidate_keys({})


def test_key_pragma_validates_and_never_repr_leaks():
    with pytest.raises(dbcrypt.DBEncryptionError):
        dbcrypt.key_pragma(b"short")
    with pytest.raises(dbcrypt.DBEncryptionError):
        dbcrypt.key_pragma(b"\x00" * 32, verb="key; DROP TABLE x")
    assert dbcrypt.key_pragma(b"\xab" * 32) == "PRAGMA key = \"x'" + "ab" * 32 + "'\""


def test_copy_database_preserves_schema_data_and_triggers(tmp_path):
    src = DB(str(tmp_path / "a.db"), env={})
    _fill(src)
    src.conn.execute("PRAGMA user_version = 7")
    dst = sqlite3.connect(":memory:")
    dbcrypt.copy_database(src.conn, dst)
    assert dbcrypt.table_counts(dst) == dbcrypt.table_counts(src.conn)
    assert dst.execute("PRAGMA user_version").fetchone()[0] == 7
    with pytest.raises(sqlite3.DatabaseError, match="append-only"):
        dst.execute("UPDATE audit SET actor='x'")


def test_tools_refuse_encrypted_looking_file_without_flag(tmp_path, monkeypatch):
    monkeypatch.delenv("DB_ENCRYPTION", raising=False)
    p = tmp_path / "enc.db"
    p.write_bytes(os.urandom(4096))
    h = _sha(p)
    assert wipe.main(["wipe", str(p), "--confirm", "WIPE"]) == 1
    with pytest.raises(SecretError, match="DB_ENCRYPTION"):
        backup._open_source_db(str(p))
    assert _sha(p) == h


# ======================= אמיתי (sqlcipher3 מותקן) =======================
@needs_sqlcipher
def test_new_db_is_really_encrypted(tmp_path):
    p = tmp_path / "live.db"
    env = _env()
    db = DB(str(p), env=env)
    assert db.encrypted and db.key_id == "k1" and not db.needs_rekey
    _fill(db)
    db.conn.close()
    raw = p.read_bytes()
    assert raw[:16] != dbcrypt.PLAIN_HEADER, "כותרת SQLite גלויה — הקובץ לא מוצפן"
    assert PII_PHONE.encode() not in raw and PII_NAME.encode() not in raw
    assert stat.S_IMODE(p.stat().st_mode) == 0o600
    with pytest.raises(sqlite3.DatabaseError):   # stdlib לא קורא אותו
        sqlite3.connect(p).execute("SELECT * FROM customers").fetchall()
    again = DB(str(p), env=env)
    assert tuple(again.one("SELECT name, phone FROM customers")) == (PII_NAME, PII_PHONE)


@needs_sqlcipher
def test_wrong_key_refuses(tmp_path):
    p = tmp_path / "live.db"
    _fill(DB(str(p), env=_env()))
    h = _sha(p)
    with pytest.raises(dbcrypt.DBEncryptionError, match="COLLECT_MASTER_KEYS"):
        DB(str(p), env=_env())             # מפתח אחר
    with pytest.raises(dbcrypt.DBEncryptionError, match="COLLECT_MASTER_KEYS"):
        DB(str(p), env={"DB_ENCRYPTION": "sqlcipher"})   # בלי מפתח בכלל
    assert _sha(p) == h


@needs_sqlcipher
def test_plaintext_file_with_flag_on_is_refused_not_used(tmp_path):
    p = tmp_path / "live.db"
    _fill(DB(str(p), env={}))
    h = _sha(p)
    with pytest.raises(dbcrypt.DBEncryptionError, match="db_encrypt"):
        DB(str(p), env=_env())
    assert _sha(p) == h and dbcrypt.is_plaintext_sqlite(p)


@needs_sqlcipher
def test_engine_errors_are_exposed_for_callers(tmp_path):
    db = DB(str(tmp_path / "e.db"), env=_env())
    with pytest.raises(db.OperationalError):
        db.x("UPDATE no_such_table SET a=1")
    _fill(db)
    with pytest.raises(db.IntegrityError):
        db.x("UPDATE audit SET actor='x'")


@needs_sqlcipher
def test_service_flow_over_encrypted_db(tmp_path, gi_client, clock):
    from app.config import load_settings
    from app.service import CollectService
    s = load_settings({"BUSINESS_NAME": "סטודיו מאיר", "SMS_SENDER_ID": "StudioMeir",
                       "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/studio",
                       "PUBLIC_BASE_URL": "https://gabi.example", "REAL_DATA_ALLOWED": "1"})
    p = tmp_path / "svc.db"
    svc = CollectService(s, DB(str(p), env=_env()), gi=gi_client, clock=clock)
    svc.sync()
    svc.plan()
    svc._supersede_plan_drafts(999)   # טבלת drafts חסרה ⇒ db.OperationalError של sqlcipher נתפס
    assert svc.db.one("SELECT count(*) FROM invoices")[0] > 0
    svc.db.conn.close()
    raw = p.read_bytes()
    assert raw[:16] != dbcrypt.PLAIN_HEADER and "דנה כהן".encode() not in raw


@needs_sqlcipher
def test_migration_encrypts_with_verified_backup_and_refuses_twice(tmp_path):
    p = tmp_path / "live.db"
    _fill(DB(str(p), env={}))
    sqlite3.connect(p).execute("PRAGMA user_version = 3")
    env = _env()
    bk = db_encrypt.encrypt_db(p, env=env)
    assert bk.exists() and stat.S_IMODE(bk.stat().st_mode) == 0o600
    raw = p.read_bytes()
    assert raw[:16] != dbcrypt.PLAIN_HEADER and PII_PHONE.encode() not in raw
    assert not (tmp_path / "live.db.encrypting").exists()
    db = DB(str(p), env=env)
    assert db.one("SELECT phone FROM customers")[0] == PII_PHONE
    assert db.one("PRAGMA user_version")[0] == 3
    with pytest.raises(db.IntegrityError, match="append-only"):   # הטריגרים עברו
        db.x("DELETE FROM audit")
    box = SecretBox.from_env(env)
    assert backup.verify_backup(bk, box) == dbcrypt.table_counts(db.conn)
    db.conn.close()
    with pytest.raises(db_encrypt.MigrationError, match="כבר מוצפן"):
        db_encrypt.encrypt_db(p, env=env)
    # הגיבוי שלפני ההצפנה = דרך חזרה: משחזר לקובץ גלוי עם אותו תוכן
    r = backup.restore_backup(bk, tmp_path / "rollback.db", box, env={})
    assert sqlite3.connect(r).execute("SELECT phone FROM customers").fetchone()[0] == PII_PHONE


@needs_sqlcipher
def test_migration_failure_leaves_original_untouched(tmp_path, monkeypatch):
    p = tmp_path / "live.db"
    _fill(DB(str(p), env={}))
    h = _sha(p)

    def boom(path):
        raise dbcrypt.DBEncryptionError("simulated")

    monkeypatch.setattr(dbcrypt, "assert_encrypted_file", boom)
    with pytest.raises(dbcrypt.DBEncryptionError):
        db_encrypt.encrypt_db(p, env=_env())
    assert _sha(p) == h and not (tmp_path / "live.db.encrypting").exists()


@needs_sqlcipher
def test_migration_refuses_live_journal(tmp_path):
    p = tmp_path / "live.db"
    _fill(DB(str(p), env={}))
    (tmp_path / "live.db-wal").write_bytes(b"x" * 10)
    with pytest.raises(db_encrypt.MigrationError, match="wal"):
        db_encrypt.encrypt_db(p, env=_env())
    assert dbcrypt.is_plaintext_sqlite(p)


@needs_sqlcipher
def test_migration_cli_requires_confirm_and_reports(tmp_path, monkeypatch):
    p = tmp_path / "live.db"
    _fill(DB(str(p), env={}))
    monkeypatch.setenv("COLLECT_MASTER_KEYS", _keys("k1"))
    assert db_encrypt.main(["x", str(p)]) == 2
    assert db_encrypt.main(["x", str(p), "--confirm", "yes"]) == 2
    assert db_encrypt.main(["x", str(p), "--rekey", "--confirm", "ENCRYPT"]) == 2
    assert dbcrypt.is_plaintext_sqlite(p)
    assert db_encrypt.main(["x", str(p), "--confirm", "ENCRYPT", "--backup", str(tmp_path / "pre.gbk")]) == 0
    assert (tmp_path / "pre.gbk").exists() and not dbcrypt.is_plaintext_sqlite(p)
    assert db_encrypt.main(["x", str(p), "--confirm", "ENCRYPT"]) == 1      # כבר מוצפן
    assert db_encrypt.main(["x", str(p), "--rekey", "--confirm", "REKEY"]) == 0   # כבר במפתח הפעיל


@needs_sqlcipher
def test_rekey_follows_master_key_rotation(tmp_path):
    k1 = f"k1:{generate_key()}"
    k2 = f"k2:{generate_key()}"
    p = tmp_path / "live.db"
    _fill(DB(str(p), env=_env(k1)))
    rotated = _env(f"{k2},{k1}")
    db = DB(str(p), env=rotated)                     # הישן עדיין פותח (כמו SecretBox)
    assert db.key_id == "k1" and db.needs_rekey
    db.conn.close()
    bk = db_encrypt.rekey_db(p, env=rotated)
    assert bk is not None and bk.exists()
    assert db_encrypt.rekey_db(p, env=rotated) is None   # כבר במפתח הפעיל
    db = DB(str(p), env=_env(k2))                       # רק החדש — עובד
    assert db.key_id == "k2" and db.one("SELECT phone FROM customers")[0] == PII_PHONE
    db.conn.close()
    with pytest.raises(dbcrypt.DBEncryptionError):
        DB(str(p), env=_env(k1))                        # רק הישן — כבר לא פותח
    # גיבוי ה-rekey קשור ל-SecretBox, לא למפתח ה-DB ⇒ משחזר עם רשימת המפתחות המסובבת
    r = backup.restore_backup(bk, tmp_path / "r.db", SecretBox.from_spec(f"{k2},{k1}"), env=rotated)
    assert DB(str(r), env=rotated).one("SELECT count(*) FROM customers")[0] == 1


@needs_sqlcipher
def test_backup_and_restore_with_encrypted_db(tmp_path):
    env = _env()
    box = SecretBox.from_env(env)
    db = DB(str(tmp_path / "live.db"), env=env)
    _fill(db)
    out = backup.create_backup(db.conn, tmp_path / "b.gbk", box)
    data = out.read_bytes()
    assert out.read_text().startswith(backup.MAGIC)          # אותו פורמט GBK1
    assert PII_PHONE.encode() not in data and PII_NAME.encode() not in data
    enc = backup.restore_backup(out, tmp_path / "enc.db", box, env=env)
    assert enc.read_bytes()[:16] != dbcrypt.PLAIN_HEADER
    assert DB(str(enc), env=env).one("SELECT phone FROM customers")[0] == PII_PHONE
    plain = backup.restore_backup(out, tmp_path / "plain.db", box, env={})
    assert sqlite3.connect(plain).execute("SELECT phone FROM customers").fetchone()[0] == PII_PHONE
    with pytest.raises(SecretError):                        # גיבוי במפתח אחר ⇒ אין יעד
        backup.restore_backup(out, tmp_path / "bad.db", SecretBox.from_spec(_keys("k1")), env=env)
    assert not (tmp_path / "bad.db").exists()


@needs_sqlcipher
def test_backup_cli_snapshot_and_restore_encrypted(tmp_path, monkeypatch):
    env = _env()
    for k, v in env.items():
        monkeypatch.setenv(k, v)
    p = tmp_path / "live.db"
    _fill(DB(str(p)))
    assert backup.main(["x", "snapshot", str(p), str(tmp_path / "snaps"), "3"]) == 0
    snap = next((tmp_path / "snaps").glob("gabi-*.gbk"))
    assert backup.main(["x", "restore", str(snap), str(tmp_path / "r.db")]) == 0
    assert not dbcrypt.is_plaintext_sqlite(tmp_path / "r.db")
    assert DB(str(tmp_path / "r.db")).one("SELECT phone FROM customers")[0] == PII_PHONE


@needs_sqlcipher
def test_wipe_cli_on_encrypted_db(tmp_path, monkeypatch):
    env = _env()
    for k, v in env.items():
        monkeypatch.setenv(k, v)
    p = tmp_path / "live.db"
    _fill(DB(str(p)))
    assert wipe.main(["wipe", str(p), "--confirm", "WIPE"]) == 0
    raw = p.read_bytes()
    assert raw[:16] != dbcrypt.PLAIN_HEADER and PII_PHONE.encode() not in raw
    db = DB(str(p))
    assert db.one("SELECT count(*) FROM customers")[0] == 0
    assert db.one("SELECT count(*) FROM suppressions")[0] == 1
    assert db.one("SELECT count(*) FROM audit WHERE action='business_wipe'")[0] == 1
    monkeypatch.setenv("COLLECT_MASTER_KEYS", _keys("k1"))   # מפתח שגוי ⇒ לא נוגעים
    h = _sha(p)
    assert wipe.main(["wipe", str(p), "--confirm", "WIPE"]) == 1
    assert _sha(p) == h

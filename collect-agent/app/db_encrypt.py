"""מיגרציה ל-SQLCipher ורוטציית מפתח ה-DB (שער 5, ADR שלב 2).

  python -m app.db_encrypt <db> --confirm ENCRYPT [--backup <out.gbk>]
      DB גלוי ⇒ מוצפן. קודם גיבוי GBK1 מוצפן (``app/backup.py``) **שמאומת** (פענוח+integrity+ספירות),
      אחר כך ``sqlcipher_export`` לקובץ זמני 0600, אימות מלא שלו (מפתח פעיל, integrity, ספירות זהות,
      כותרת לא-גלויה), ורק אז החלפה אטומית (``os.replace``). DB שכבר מוצפן ⇒ מסרב.
  python -m app.db_encrypt <db> --rekey --confirm REKEY [--backup <out.gbk>]
      רוטציה כמו ``COLLECT_MASTER_KEYS``: מוסיפים מפתח חדש **ראשון** ברשימה (הישן נשאר אחריו), מריצים
      rekey ⇒ ה-DB עובר למפתח הפעיל (אותו מסלול: גיבוי מאומת ⇒ export לזמני ⇒ אימות ⇒ החלפה אטומית).
      כבר במפתח הפעיל ⇒ אין מה לעשות (0).

לעצור את השרת לפני ההרצה (אין כתיבה מקבילה). אחרי ההצפנה: ``DB_ENCRYPTION=sqlcipher`` בסביבת השרת.
⚠️ את המפתח הישן מוציאים מ-COLLECT_MASTER_KEYS רק אחרי שגיבויי GBK1 הישנים (שהוצפנו בו) פגו (30 יום).
⚠️ החלפת קובץ לא מוחקת פיזית בלוקים ישנים מהדיסק — לכן שלב 1 (הצפנת נפח אצל הספק) נשאר חובה.
"""
from __future__ import annotations

import os
import sqlite3
import sys
from datetime import UTC, datetime
from pathlib import Path

from . import dbcrypt
from .backup import create_backup, verify_backup
from .secretbox import SecretBox, SecretError

CONFIRM_ENCRYPT = "ENCRYPT"
CONFIRM_REKEY = "REKEY"
USAGE = ("שימוש: python -m app.db_encrypt <db> --confirm ENCRYPT [--backup <out.gbk>]\n"
         "       python -m app.db_encrypt <db> --rekey --confirm REKEY [--backup <out.gbk>]")


class MigrationError(RuntimeError):
    pass


def _stamp() -> str:
    return datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")


def _guard_wal(p: Path) -> None:
    for suf in ("-wal", "-journal"):
        side = p.with_name(p.name + suf)
        if side.exists() and side.stat().st_size > 0:
            raise MigrationError(f"קיים {side.name} לא ריק — עצרו את השרת לפני ההמרה "
                                 f"/ non-empty {side.name}: stop the server first")


def _verified_backup(conn, p: Path, out: Path | None, box: SecretBox, tag: str) -> Path:
    out = out or p.with_name(f"{p.name}.pre-{tag}-{_stamp()}.gbk")
    before = dbcrypt.table_counts(conn)
    create_backup(conn, out, box)
    if verify_backup(out, box) != before:
        raise MigrationError(f"אימות הגיבוי נכשל ({out}) — לא ממשיכים / backup verification failed")
    return out


def _export_and_swap(src, p: Path, db_key: bytes, expected: dict[str, int], env) -> None:
    """``src`` (פתוח, sqlcipher3) ⇒ קובץ זמני מוצפן ב-``db_key`` ⇒ אימות ⇒ os.replace."""
    tmp = p.with_name(p.name + ".encrypting")
    if tmp.exists() or tmp.is_symlink():
        raise MigrationError(f"קובץ זמני קיים: {tmp} — מחקו אחרי בדיקה")
    os.close(os.open(tmp, os.O_CREAT | os.O_EXCL | os.O_WRONLY | getattr(os, "O_NOFOLLOW", 0), 0o600))
    try:
        uv = int(src.execute("PRAGMA user_version").fetchone()[0])
        src.execute("ATTACH DATABASE ? AS enc KEY ?", (str(tmp), dbcrypt.raw_key_literal(db_key)))
        src.execute("SELECT sqlcipher_export('enc')")
        src.execute("PRAGMA enc.user_version = " + str(uv))
        src.execute("DETACH DATABASE enc")
        src.close()
        dbcrypt.assert_encrypted_file(tmp)
        chk = dbcrypt.open_db(str(tmp), env=env, force_mode=dbcrypt.SQLCIPHER)
        try:
            if chk.kid != chk.active_kid:
                raise MigrationError("הקובץ החדש לא במפתח הפעיל / new file not on the active key")
            if chk.conn.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise MigrationError("integrity_check נכשל בקובץ המוצפן")
            if dbcrypt.table_counts(chk.conn) != expected:
                raise MigrationError("ספירות השורות לא תואמות אחרי ההצפנה — לא מחליפים")
        finally:
            chk.conn.close()
        os.replace(tmp, p)
        os.chmod(p, 0o600)
    except BaseException:
        src.close()
        tmp.unlink(missing_ok=True)
        raise


def encrypt_db(path: str | Path, *, env=None, backup_out: str | Path | None = None) -> Path:
    """DB גלוי ⇒ SQLCipher במפתח הפעיל. מחזיר את נתיב הגיבוי המאומת."""
    p = Path(path)
    if not p.is_file() or p.is_symlink():
        raise MigrationError(f"ה-DB לא קיים (או symlink): {p}")
    mod = dbcrypt.load_module()
    keys = dbcrypt.candidate_keys(env)
    if not dbcrypt.is_plaintext_sqlite(p):
        try:
            dbcrypt.open_db(str(p), env=env, force_mode=dbcrypt.SQLCIPHER).conn.close()
        except dbcrypt.DBEncryptionError:
            raise MigrationError(f"{p} אינו SQLite גלוי ולא נפתח באף מפתח — מסרב / unknown file") from None
        raise MigrationError(f"{p} כבר מוצפן — לרוטציה: --rekey --confirm REKEY / already encrypted")
    _guard_wal(p)
    box = SecretBox.from_env(None if env is None else dict(env))
    plain = sqlite3.connect(f"file:{p}?mode=ro", uri=True)
    try:
        if plain.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise MigrationError("integrity_check נכשל ב-DB המקורי — לא מצפינים DB פגום")
        expected = dbcrypt.table_counts(plain)
        bk = _verified_backup(plain, p, Path(backup_out) if backup_out else None, box, "encrypt")
    finally:
        plain.close()
    src = mod.connect(str(p))   # בלי מפתח ⇒ SQLCipher קורא את הקובץ הגלוי
    _export_and_swap(src, p, keys[0][1], expected, env)
    return bk


def rekey_db(path: str | Path, *, env=None, backup_out: str | Path | None = None) -> Path | None:
    """DB מוצפן במפתח ישן ⇒ המפתח הפעיל. None = כבר במפתח הפעיל."""
    p = Path(path)
    if not p.is_file() or p.is_symlink():
        raise MigrationError(f"ה-DB לא קיים (או symlink): {p}")
    if dbcrypt.is_plaintext_sqlite(p):
        raise MigrationError(f"{p} לא מוצפן — קודם --confirm ENCRYPT / not encrypted yet")
    _guard_wal(p)
    opened = dbcrypt.open_db(str(p), env=env, force_mode=dbcrypt.SQLCIPHER)
    if opened.kid == opened.active_kid:
        opened.conn.close()
        return None
    try:
        if opened.conn.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise MigrationError("integrity_check נכשל — לא מבצעים rekey ל-DB פגום")
        box = SecretBox.from_env(None if env is None else dict(env))
        expected = dbcrypt.table_counts(opened.conn)
        bk = _verified_backup(opened.conn, p, Path(backup_out) if backup_out else None, box, "rekey")
    except BaseException:
        opened.conn.close()
        raise
    _export_and_swap(opened.conn, p, dbcrypt.candidate_keys(env)[0][1], expected, env)
    return bk


def main(argv: list[str]) -> int:
    args = argv[1:]
    backup_out = None
    if "--backup" in args:
        i = args.index("--backup")
        if i + 1 >= len(args):
            print(USAGE, file=sys.stderr)
            return 2
        backup_out = args[i + 1]
        args = args[:i] + args[i + 2:]
    rekey = "--rekey" in args
    if rekey:
        args.remove("--rekey")
    want = CONFIRM_REKEY if rekey else CONFIRM_ENCRYPT
    if len(args) != 3 or args[1] != "--confirm" or args[2] != want:
        print(USAGE, file=sys.stderr)
        return 2
    try:
        if rekey:
            bk = rekey_db(args[0], backup_out=backup_out)
            print("כבר במפתח הפעיל — אין מה לעשות" if bk is None else f"ok · rekey · גיבוי מאומת: {bk}")
        else:
            bk = encrypt_db(args[0], backup_out=backup_out)
            print(f"ok · הוצפן · גיבוי מאומת: {bk}\nעכשיו: {dbcrypt.FLAG}=sqlcipher בסביבת השרת")
    except (MigrationError, dbcrypt.DBEncryptionError, SecretError) as e:
        print(f"נכשל: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

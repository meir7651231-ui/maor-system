"""הצפנת ה-DB החי במנוחה — SQLCipher (שער בטא 5, ADR-encryption-at-rest שלב 2).

מאחורי דגל: ``DB_ENCRYPTION=sqlcipher``. בלי הדגל (ריק/``off``/``none``) — sqlite3 של ה-stdlib,
ביט-זהה להתנהגות הקודמת. ערך לא מוכר ⇒ שגיאה (טעות-הקלדה לא מורידה הצפנה בשקט).

עקרונות:
  • **נכשל סגור.** הדגל דלוק ו: המודול ``sqlcipher3`` חסר / אינו SQLCipher אמיתי, ``COLLECT_MASTER_KEYS``
    חסר, אף מפתח לא פותח את הקובץ, או שהקובץ הוא SQLite גלוי ⇒ ``DBEncryptionError`` והשרת לא עולה.
    לעולם אין נפילה ל-plaintext.
  • **מפתח נפרד מ-SecretBox.** מפתח ה-DB נגזר ב-HKDF-SHA256 מכל מפתח ראשי ב-``COLLECT_MASTER_KEYS``
    עם תווית ייעודית (``_HKDF_INFO``) ⇒ בלתי-תלוי חישובית במפתחות ה-AES-GCM של הסודות/הגיבויים.
    מפתח גולמי (``x'…'``) ⇒ בלי PBKDF2 בכל פתיחה; ה-salt פר-קובץ של SQLCipher נשמר.
  • **רוטציה כמו SecretBox.** הראשון ברשימה = פעיל (DB חדש נוצר בו); כל המפתחות נוסים בפתיחה.
    DB שנפתח במפתח ישן ⇒ עובד + אזהרה; ``python -m app.db_encrypt <db> --rekey --confirm REKEY`` מעביר
    אותו למפתח הפעיל.
  • **אימות אמיתי.** אחרי יצירה — כותרת הקובץ אינה ``SQLite format 3`` (אחרת: שגיאה).
"""
from __future__ import annotations

import importlib
import logging
import os
import re
import sqlite3
from collections.abc import Mapping
from pathlib import Path
from types import ModuleType
from typing import Any, NamedTuple

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from .secretbox import SecretBox, SecretError

FLAG = "DB_ENCRYPTION"
SQLCIPHER = "sqlcipher"
_OFF = ("", "off", "none")
PLAIN_HEADER = b"SQLite format 3\x00"
MODULE_NAME = "sqlcipher3"
# תווית ייעודית ⇒ מפתח ה-DB לא זהה לשום מפתח SecretBox. שינוי כאן = DB קיים לא נפתח, לכן קבוע.
_HKDF_SALT = b"gabi/collect-agent:db-at-rest"
_HKDF_INFO = b"sqlcipher-db-key:v1"
_HEX64 = re.compile(r"^[0-9a-f]{64}$")
INSTALL_HINT = "pip install --require-hashes -r requirements-sqlcipher.lock"

log = logging.getLogger("collect.db")


class DBEncryptionError(RuntimeError):
    """כשל בהצפנת ה-DB. ההודעה דו-לשונית ולעולם לא כוללת מפתח."""


class Opened(NamedTuple):
    conn: Any                 # sqlite3.Connection או sqlcipher3.Connection
    module: ModuleType        # המודול שפתח (לשגיאות/Row)
    kid: str | None           # מזהה המפתח הראשי שפתח (None = לא מוצפן)
    active_kid: str | None    # המפתח הפעיל ב-COLLECT_MASTER_KEYS (None = לא מוצפן)


def mode(env: Mapping[str, str] | None = None) -> str:
    """'off' | 'sqlcipher'. ערך לא מוכר ⇒ שגיאה (נכשל סגור)."""
    v = (os.environ if env is None else env).get(FLAG, "").strip().lower()
    if v in _OFF:
        return "off"
    if v == SQLCIPHER:
        return SQLCIPHER
    raise DBEncryptionError(
        f"{FLAG}={v!r} לא מוכר — ערכים: sqlcipher או off. "
        f"/ Unknown {FLAG} value; use 'sqlcipher' or 'off' (refusing to guess).")


def load_module() -> ModuleType:
    """sqlcipher3 — רק אם הוא באמת SQLCipher (cipher_version לא ריק)."""
    try:
        mod = importlib.import_module(MODULE_NAME)
    except ImportError:
        raise DBEncryptionError(
            f"{FLAG}=sqlcipher אבל המודול {MODULE_NAME} לא מותקן — השרת לא יעלה בלי הצפנה. "
            f"התקנה: {INSTALL_HINT} / {MODULE_NAME} is not installed; refusing to start unencrypted."
        ) from None
    c = mod.connect(":memory:")
    try:
        row = c.execute("PRAGMA cipher_version").fetchone()
    finally:
        c.close()
    if not row or not row[0]:
        raise DBEncryptionError(
            f"{MODULE_NAME} נטען אבל אינו SQLCipher (אין cipher_version) — מסרב. "
            f"/ {MODULE_NAME} is not linked against SQLCipher; refusing.")
    return mod


def derive_key(master: bytes) -> bytes:
    """מפתח DB (32 בייט) ממפתח ראשי. HKDF עם תווית ייעודית — עצמאי ממפתחות SecretBox."""
    return HKDF(algorithm=hashes.SHA256(), length=32, salt=_HKDF_SALT, info=_HKDF_INFO).derive(master)


def candidate_keys(env: Mapping[str, str] | None = None) -> list[tuple[str, bytes]]:
    """[(kid, db_key)] — הפעיל ראשון. COLLECT_MASTER_KEYS חסר/פגום ⇒ שגיאה."""
    try:
        box = SecretBox.from_env(None if env is None else dict(env))
    except SecretError as e:
        raise DBEncryptionError(
            f"{FLAG}=sqlcipher דורש COLLECT_MASTER_KEYS תקין: {e} "
            f"/ {FLAG}=sqlcipher requires a valid COLLECT_MASTER_KEYS; refusing to start.") from None
    return [(kid, derive_key(key)) for kid, key in box.keys]


def key_pragma(db_key: bytes, verb: str = "key") -> str:
    """``PRAGMA key = "x'…'"`` — מפתח גולמי. ההקס מאומת (אין הזרקה); לא נרשם ללוג."""
    h = db_key.hex()
    if verb not in ("key", "rekey") or not _HEX64.match(h):
        raise DBEncryptionError("מפתח DB לא תקין / invalid DB key")
    return "PRAGMA " + verb + " = \"x'" + h + "'\""


def raw_key_literal(db_key: bytes) -> str:
    """הערך ל-``ATTACH … KEY ?`` (פרמטר מאוגד)."""
    h = db_key.hex()
    if not _HEX64.match(h):
        raise DBEncryptionError("מפתח DB לא תקין / invalid DB key")
    return "x'" + h + "'"


def _is_memory(path: str) -> bool:
    return path == ":memory:" or "mode=memory" in path


def file_header(path: str | Path) -> bytes:
    try:
        with open(path, "rb") as f:
            return f.read(16)
    except FileNotFoundError:
        return b""


def is_plaintext_sqlite(path: str | Path) -> bool:
    return file_header(path) == PLAIN_HEADER


def assert_encrypted_file(path: str | Path) -> None:
    """הקובץ קיים, לא ריק, ואין לו כותרת SQLite גלויה (אחרת: שגיאה)."""
    head = file_header(path)
    if not head:
        raise DBEncryptionError(f"קובץ ה-DB ריק או חסר: {path} / DB file empty or missing")
    if head == PLAIN_HEADER:
        raise DBEncryptionError(
            f"ה-DB נכתב לא-מוצפן ({path}) — מסרב. / DB file has a plaintext SQLite header; refusing.")


def _try_keys(mod: ModuleType, target: str, keys: list[tuple[str, bytes]], *, uri: bool,
              check_same_thread: bool) -> tuple[Any, str] | None:
    for kid, k in keys:
        c = mod.connect(target, uri=uri, check_same_thread=check_same_thread)
        try:
            # ניסיון מפתח ישן (רוטציה) הוא מסלול רגיל — לא להציף stderr ב-«hmac check failed»
            c.execute("PRAGMA cipher_log_level = NONE")
            c.execute(key_pragma(k))
            c.execute("SELECT count(*) FROM sqlite_master").fetchone()
            return c, kid
        except mod.DatabaseError:
            c.close()
    return None


def open_db(path: str, *, env: Mapping[str, str] | None = None, readonly: bool = False,
            check_same_thread: bool = True, force_mode: str | None = None) -> Opened:
    """פותח DB לפי הדגל. ``readonly`` ⇒ ``file:…?mode=ro`` (קובץ קיים בלבד)."""
    m = force_mode or mode(env)
    target, uri = path, path.startswith("file:")
    if readonly and not uri:
        target, uri = f"file:{path}?mode=ro", True
    if m == "off":
        return Opened(sqlite3.connect(target, uri=uri, check_same_thread=check_same_thread),
                      sqlite3, None, None)
    mod = load_module()
    if _is_memory(path):   # אין כלום במנוחה — אותו מנוע, בלי מפתח
        return Opened(mod.connect(target, uri=uri, check_same_thread=check_same_thread), mod, None, None)
    if not uri and is_plaintext_sqlite(path):
        raise DBEncryptionError(
            f"{FLAG}=sqlcipher אבל {path} הוא SQLite לא-מוצפן — מסרב לפתוח (לא נופלים ל-plaintext). "
            f"הצפנה: python -m app.db_encrypt {path} --confirm ENCRYPT "
            f"/ {path} is a plaintext SQLite DB; run the migration (refusing to open it unencrypted).")
    keys = candidate_keys(env)
    got = _try_keys(mod, target, keys, uri=uri, check_same_thread=check_same_thread)
    if got is None:
        raise DBEncryptionError(
            f"אף מפתח ב-COLLECT_MASTER_KEYS לא פותח את {path} (מפתח שגוי, או שהקובץ אינו DB) — מסרב. "
            f"/ No key in COLLECT_MASTER_KEYS opens {path} (wrong key or not a database); refusing.")
    conn, kid = got
    if kid != keys[0][0]:
        log.warning("DB %s פתוח במפתח ישן (%s); להעביר: python -m app.db_encrypt <db> --rekey --confirm REKEY",
                    path, kid)
    return Opened(conn, mod, kid, keys[0][0])


def connect_existing(path: str | Path, *, env: Mapping[str, str] | None = None,
                     readonly: bool = False) -> Any:
    """לכלי CLI (גיבוי/מחיקה) על קובץ קיים: SQLite גלוי ⇒ stdlib; מוצפן ⇒ דורש את הדגל."""
    p = str(path)
    if is_plaintext_sqlite(p):
        if mode(env) == SQLCIPHER:
            raise DBEncryptionError(
                f"{FLAG}=sqlcipher אבל {p} לא מוצפן — הריצו קודם python -m app.db_encrypt {p} --confirm ENCRYPT "
                f"/ {p} is plaintext while {FLAG}=sqlcipher; encrypt it first.")
        return open_db(p, env=env, readonly=readonly, force_mode="off").conn
    if mode(env) != SQLCIPHER:
        raise DBEncryptionError(
            f"{p} אינו SQLite גלוי (מוצפן?) — הגדירו {FLAG}=sqlcipher ו-COLLECT_MASTER_KEYS "
            f"/ {p} is not a plaintext SQLite DB (encrypted?); set {FLAG}=sqlcipher.")
    return open_db(p, env=env, readonly=readonly).conn


# ---------- העתקה לוגית בין חיבורים (stdlib ⇄ SQLCipher) ----------
def _q(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def table_counts(conn: Any) -> dict[str, int]:
    """מספר שורות לכל טבלת משתמש — לאימות גיבוי/הצפנה (שמות מ-sqlite_master, לא מקלט)."""
    names = [r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
    out = {}
    for n in names:
        sql = "SELECT count(*) FROM " + _q(n)  # noqa: S608  # nosec B608 — שם טבלה מ-sqlite_master, מצוטט
        out[n] = conn.execute(sql).fetchone()[0]
    return out


def copy_database(src: Any, dst: Any) -> None:
    """מעתיק סכמה+נתונים מ-``src`` ל-``dst`` ריק (גם בין sqlite3 ל-sqlcipher3, שאין ביניהם backup API).
    טבלאות ⇒ שורות ⇒ אינדקסים/טריגרים/views (טריגרי append-only לא חוסמים הכנסה). כולל sqlite_sequence
    ו-user_version. טרנזקציה אחת ב-dst."""
    # critic סבב 42: טרנזקציית קריאה במקור ⇒ snapshot אחד לכל הטבלאות. בלעדיה כתיבה של השרת בין טבלה
    # לטבלה נכנסה לגיבוי באמצע (חשבונית בלי הלקוח שלה). אם המקור כבר בטרנזקציה — היא ה-snapshot.
    own_tx = not getattr(src, "in_transaction", False)
    if own_tx:
        src.execute("BEGIN")
    try:
        _copy_database(src, dst)
    finally:
        if own_tx:
            src.execute("COMMIT")


def _copy_database(src: Any, dst: Any) -> None:
    objs = src.execute("SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL "
                       "AND name NOT LIKE 'sqlite_%' ORDER BY rowid").fetchall()
    tables = [(n, s) for t, n, s in objs if t == "table"]
    rest = [s for t, n, s in objs if t != "table"]
    dst.execute("BEGIN")
    try:
        for _, sql in tables:
            dst.execute(sql)
        for name, _ in tables:
            cols = [r[1] for r in src.execute("PRAGMA table_info(" + _q(name) + ")")]
            if not cols:
                continue
            sel = "SELECT " + ",".join(_q(c) for c in cols) + " FROM " + _q(name)  # noqa: S608  # nosec B608
            ins = ("INSERT INTO " + _q(name) + "(" + ",".join(_q(c) for c in cols) + ") VALUES("  # noqa: S608  # nosec B608
                   + ",".join("?" * len(cols)) + ")")
            cur = src.execute(sel)
            while batch := cur.fetchmany(500):
                dst.executemany(ins, [tuple(r) for r in batch])
        has_seq = src.execute("SELECT 1 FROM sqlite_master WHERE name='sqlite_sequence'").fetchone()
        if has_seq:
            seq = src.execute("SELECT name, seq FROM sqlite_sequence").fetchall()
            dst.execute("DELETE FROM sqlite_sequence")
            dst.executemany("INSERT INTO sqlite_sequence(name, seq) VALUES(?,?)", [tuple(r) for r in seq])
        for sql in rest:
            dst.execute(sql)
        uv = int(src.execute("PRAGMA user_version").fetchone()[0])
        dst.execute("PRAGMA user_version = " + str(uv))
        dst.execute("COMMIT")
    except Exception:
        dst.execute("ROLLBACK")
        raise

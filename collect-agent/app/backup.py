"""גיבוי DB מוצפן (שער בטא 5: «גיבוי מוצפן»).

תצלום עקבי של ה-DB (sqlite backup API ⇒ serialize) מוצפן ב-SecretBox (AES-256-GCM,
הקשר קשור ל-``backup:db``) ונכתב בהרשאות 0600. המפתח מחוץ ל-DB (COLLECT_MASTER_KEYS).
שחזור: פענוח ⇒ בדיקת תקינות (integrity_check) ⇒ כתיבה לנתיב חדש בלבד (לעולם לא דורס).

שימוש:  python -m app.backup create <db> <out>   |   python -m app.backup restore <in> <db_new>
"""
from __future__ import annotations

import base64
import os
import sqlite3
import sys
from pathlib import Path

from .secretbox import SecretBox, SecretError

CONTEXT = "backup:db"
MAGIC = "GBK1\n"


def _snapshot(conn: sqlite3.Connection) -> bytes:
    mem = sqlite3.connect(":memory:")
    try:
        conn.backup(mem)
        return mem.serialize()
    finally:
        mem.close()


def create_backup(conn: sqlite3.Connection, out: str | Path, box: SecretBox) -> Path:
    out = Path(out)
    blob = base64.b64encode(_snapshot(conn)).decode("ascii")
    token = box.encrypt(blob, context=CONTEXT)
    fd = os.open(out, os.O_CREAT | os.O_WRONLY | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="ascii") as f:
        f.write(MAGIC + token + "\n")
    os.chmod(out, 0o600)
    return out


def restore_backup(src: str | Path, dest: str | Path, box: SecretBox) -> Path:
    dest = Path(dest)
    if dest.exists():
        raise SecretError("יעד השחזור קיים — לא דורסים (מחקו ידנית אחרי בדיקה)")
    text = Path(src).read_text(encoding="ascii")
    if not text.startswith(MAGIC):
        raise SecretError("קובץ גיבוי לא מוכר")
    raw = base64.b64decode(box.decrypt(text[len(MAGIC):].strip(), context=CONTEXT).reveal())
    mem = sqlite3.connect(":memory:")
    try:
        mem.deserialize(raw)
        if mem.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise SecretError("הגיבוי פגום (integrity_check)")
        fd = os.open(dest, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        os.close(fd)
        out = sqlite3.connect(dest)
        try:
            mem.backup(out)
        finally:
            out.close()
    finally:
        mem.close()
    os.chmod(dest, 0o600)
    return dest


def main(argv: list[str]) -> int:
    if len(argv) != 4 or argv[1] not in ("create", "restore"):
        print(__doc__)
        return 2
    box = SecretBox.from_env()
    if argv[1] == "create":
        conn = sqlite3.connect(argv[2])
        try:
            create_backup(conn, argv[3], box)
        finally:
            conn.close()
    else:
        restore_backup(argv[2], argv[3], box)
    print("ok")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

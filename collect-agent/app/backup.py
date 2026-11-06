"""גיבוי DB מוצפן (שער בטא 5: «גיבוי מוצפן»).

תצלום עקבי של ה-DB (sqlite backup API ⇒ serialize) מוצפן ב-SecretBox (AES-256-GCM,
הקשר קשור ל-``backup:db``) ונכתב בהרשאות 0600. המפתח מחוץ ל-DB (COLLECT_MASTER_KEYS).
שחזור: פענוח ⇒ בדיקת תקינות (integrity_check) ⇒ כתיבה לנתיב חדש בלבד (לעולם לא דורס).

שימוש:  python -m app.backup create <db> <out>   |   python -m app.backup restore <in> <db_new>
         python -m app.backup snapshot <db> <dir> [keep=14]   (cron; מסבב ישנים)
"""
from __future__ import annotations

import base64
import os
import sqlite3
import sys
from datetime import UTC
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


PREFIX = "gabi-"
SUFFIX = ".gbk"


def rotate_backups(directory: str | Path, keep: int) -> list[Path]:
    """משאיר את ``keep`` הגיבויים החדשים (לפי שם = חותמת זמן) ומוחק את הישנים. מחזיר את שנמחקו."""
    if keep < 1:
        raise ValueError("keep חייב להיות ≥1 (לא מוחקים את כל הגיבויים)")
    files = sorted(p for p in Path(directory).glob(f"{PREFIX}*{SUFFIX}") if p.is_file())
    old = files[:-keep]
    for p in old:
        p.unlink()
    return old


def snapshot_backup(conn: sqlite3.Connection, directory: str | Path, box: SecretBox,
                    keep: int = 14, now: str | None = None) -> Path:
    """גיבוי מתוזמן (cron): קובץ ``gabi-<UTC>.gbk`` בתיקייה 0700 + סבב שמירה."""
    from datetime import datetime
    d = Path(directory)
    d.mkdir(parents=True, exist_ok=True)
    os.chmod(d, 0o700)
    stamp = now or datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    out = create_backup(conn, d / f"{PREFIX}{stamp}{SUFFIX}", box)
    rotate_backups(d, keep)
    return out


def main(argv: list[str]) -> int:
    if argv[1:2] == ["snapshot"] and len(argv) in (4, 5):
        box = SecretBox.from_env()
        conn = sqlite3.connect(argv[2])
        try:
            snapshot_backup(conn, argv[3], box, int(argv[4]) if len(argv) == 5 else 14)
        finally:
            conn.close()
        print("ok")
        return 0
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

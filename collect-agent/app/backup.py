"""גיבוי DB מוצפן (שער בטא 5: «גיבוי מוצפן»).

תצלום עקבי של ה-DB (sqlite backup API ⇒ serialize) מוצפן ב-SecretBox (AES-256-GCM,
הקשר קשור ל-``backup:db``) ונכתב בהרשאות 0600. המפתח מחוץ ל-DB (COLLECT_MASTER_KEYS).
שחזור: פענוח ⇒ בדיקת תקינות (integrity_check) ⇒ כתיבה לנתיב חדש בלבד (לעולם לא דורס).

שימוש:  python -m app.backup create <db> <out>   |   python -m app.backup restore <in> <db_new>
         python -m app.backup snapshot <db> <dir> [keep=14]   (cron; מסבב ישנים)
         python -m app.backup check <dir> [max_hours=48]      (ניטור: 0 = טרי, 1 = ישן/חסר)
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
    # critic סבב 9: O_TRUNC דרס כל קובץ קיים. `create <db> <db>` או החלפת ארגומנטים
    # (`create new.gbk collect.sqlite3`) **השמידו את ה-DB החי** (שוחזר). עכשיו: לעולם לא דורסים
    # (O_EXCL) ולא הולכים אחרי symlink.
    out = Path(out)
    if out.exists() or out.is_symlink():
        raise SecretError(f"יעד הגיבוי קיים — לא דורסים: {out}")
    blob = base64.b64encode(_snapshot(conn)).decode("ascii")
    token = box.encrypt(blob, context=CONTEXT)
    fd = os.open(out, os.O_CREAT | os.O_EXCL | os.O_WRONLY | getattr(os, "O_NOFOLLOW", 0), 0o600)
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


MAX_AGE_DAYS = 30  # PRIVACY §10 / DPA §4.3: גיבויים נשמרים עד 30 יום


def _stamp_dt(p: Path):
    from datetime import datetime
    try:
        return datetime.strptime(p.name[len(PREFIX):-len(SUFFIX)], "%Y%m%dT%H%M%SZ").replace(tzinfo=UTC)
    except ValueError:
        return None


def rotate_backups(directory: str | Path, keep: int, max_age_days: int | None = MAX_AGE_DAYS,
                   now=None) -> list[Path]:
    """משאיר את ``keep`` הגיבויים החדשים (לפי שם = חותמת זמן) ומוחק את הישנים. בנוסף נמחק כל גיבוי
    בן יותר מ-``max_age_days`` (מדיניות 30 יום) — מלבד החדש ביותר (לא נשארים בלי גיבוי). מחזיר את שנמחקו."""
    from datetime import datetime, timedelta
    if keep < 1:
        raise ValueError("keep חייב להיות ≥1 (לא מוחקים את כל הגיבויים)")
    files = sorted(p for p in Path(directory).glob(f"{PREFIX}*{SUFFIX}") if p.is_file())
    old = files[:-keep]
    if max_age_days is not None and files:
        cutoff = (now or datetime.now(UTC)) - timedelta(days=max_age_days)
        for p in files[:-1]:
            t = _stamp_dt(p)
            if t is not None and t < cutoff and p not in old:
                old.append(p)
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


def check_fresh(directory: str | Path, max_hours: float = 48, now=None) -> tuple[bool, str]:
    """critic סבב 11.2: rotate_backups משאיר תמיד את הגיבוי החדש ביותר, גם בן יותר מ-30 יום. אם ה-cron
    נעצר, אף אחד לא שם לב: אין גיבויים חדשים, והישן עם ה-PII נשאר לתמיד. בדיקה לניטור או ל-cron:
    האם הגיבוי האחרון (לפי חותמת השם) בן פחות מ-``max_hours``."""
    from datetime import datetime, timedelta
    stamps = [t for p in Path(directory).glob(f"{PREFIX}*{SUFFIX}") if p.is_file()
              and (t := _stamp_dt(p)) is not None] if Path(directory).is_dir() else []
    if not stamps:
        return False, "אין גיבויים בתיקייה"
    newest = max(stamps)
    age = (now or datetime.now(UTC)) - newest
    if age > timedelta(hours=max_hours):
        return False, f"הגיבוי האחרון בן {age.total_seconds() / 3600:.0f} שעות (מעל {max_hours:g}) — ה-cron נעצר?"
    return True, f"הגיבוי האחרון בן {age.total_seconds() / 3600:.1f} שעות"


def _open_source_db(path: str) -> sqlite3.Connection:
    """המקור חייב להיות DB קיים. sqlite3.connect יוצר DB ריק בשקט, וכך החלפת ארגומנטים הפכה
    את שם קובץ הגיבוי ל"מקור" ריק ואת ה-DB החי ל"יעד" שנדרס. פתיחה לקריאה בלבד."""
    p = Path(path)
    if not p.is_file():
        raise SecretError(f"מקור הגיבוי לא קיים: {p} (הסדר: create <db> <out>)")
    with open(p, "rb") as f:
        if not f.read(16).startswith(b"SQLite format 3"):
            raise SecretError(f"המקור אינו DB של SQLite: {p} (הסדר: create <db> <out>)")
    return sqlite3.connect(f"file:{p}?mode=ro", uri=True)


def main(argv: list[str]) -> int:
    if argv[1:2] == ["check"] and len(argv) in (3, 4):
        ok, msg = check_fresh(argv[2], float(argv[3]) if len(argv) == 4 else 48)
        print(("ok: " if ok else "ALERT: ") + msg, file=sys.stdout if ok else sys.stderr)
        return 0 if ok else 1
    if argv[1:2] == ["snapshot"] and len(argv) in (4, 5):
        box = SecretBox.from_env()
        conn = _open_source_db(argv[2])
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
        conn = _open_source_db(argv[2])
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

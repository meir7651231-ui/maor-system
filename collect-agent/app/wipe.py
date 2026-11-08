"""מחיקה מלאה של נתוני העסק בסוף בטא (שער בטא 8: «מחיקה מלאה 14 יום אחרי סוף בטא»).

מוחק כל מידע אישי ועסקי: לקוחות, חשבוניות, תזכורות, הודעות, טיוטות, שיחות, טוקני הסרה,
הגדרות, כספת סודות, עובדים וסשנים. נשארים בכוונה (ללא PII, ראו DPA §11):
  * ``suppressions`` — גיבוב בלבד; מי שביקש הסרה לא יקבל הודעה אם המערכת תעלה שוב
  * ``audit`` ו-``access_log`` — הוספה-בלבד (טריגרים), תוכן ללא PII; נרשמת שורת ``business_wipe``

אחרי המחיקה: VACUUM (דורס דפים פנויים) ו-wal_checkpoint. גיבויים מוצפנים נמחקים
רק אם צוינה תיקייה: ``--backups <dir>`` (מוחק ``gabi-*.gbk`` בלבד; בלעדיה — מחיקתם חלק מהנוהל ב-``legal/BETA-GATE.md``).

שימוש:  python -m app.wipe <db> --confirm WIPE [--backups <dir>]
"""
from __future__ import annotations

import sqlite3
import sys
from datetime import UTC, datetime
from pathlib import Path

CONFIRM = "WIPE"

# SQL קבוע (שער האבטחה: בלי f-string). סדר: ילדים לפני הורים בגלל foreign_keys.
_TABLES = ("sessions", "login_locks", "users", "link_tokens", "drafts", "conversations", "messages",
           "reminder_invoices", "reminders", "plans", "invoices", "customers", "business_settings",
           "business_secrets", "orbit_nonces", "orbit_entitlements", "orbit_links")
_DELETE = {t: f"DELETE FROM {t}" for t in _TABLES}  # noqa: S608 — שמות קבועים מהרשימה למעלה
_COUNT = {t: f"SELECT COUNT(*) FROM {t}" for t in _TABLES}  # noqa: S608


def wipe_all(conn: sqlite3.Connection, actor: str = "system") -> dict[str, int]:
    """מוחק את כל נתוני העסק מחיבור פתוח. מחזיר כמה שורות נמחקו לכל טבלה (רק קיימות)."""
    have = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    counts: dict[str, int] = {}
    with conn:
        for t in _TABLES:
            if t in have:
                counts[t] = conn.execute(_COUNT[t]).fetchone()[0]
                conn.execute(_DELETE[t])
        conn.execute("INSERT INTO audit(at,actor,action,detail) VALUES(?,?,?,?)",
                     (datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"), actor, "business_wipe",
                      "{" + ", ".join(f'"{k}": {v}' for k, v in counts.items()) + "}"))
    conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    conn.execute("VACUUM")
    return counts


def delete_backups(directory: str | Path) -> int:
    """מוחק כל קובץ גיבוי של גבי בתיקייה: לפי השם (``gabi-*.gbk``) **או** לפי התוכן (כותרת ``GBK1``).
    critic סבב 11 (שוחזר): המחיקה זיהתה רק ``gabi-*.gbk``, וגיבוי ידני (``app.backup create <db>
    before-beta-end.gbk``) שרד את ה-wipe עם כל ה-PII, בזמן שהכלי דיווח על הצלחה.
    קבצים זרים ו-symlink לא נוגעים. מחזיר כמה נמחקו."""
    from app.backup import MAGIC, PREFIX, SUFFIX
    head = MAGIC.encode("ascii")
    n = 0
    for f in Path(directory).iterdir():
        if not f.is_file() or f.is_symlink():
            continue
        named = f.name.startswith(PREFIX) and f.name.endswith(SUFFIX)
        if not named:
            with open(f, "rb") as fh:
                if fh.read(len(head)) != head:
                    continue
        f.unlink()
        n += 1
    return n


def main(argv: list[str]) -> int:
    backups = None
    if len(argv) == 6 and argv[4] == "--backups":
        backups = Path(argv[5])
        argv = argv[:4]
    if len(argv) != 4 or argv[2] != "--confirm" or argv[3] != CONFIRM:
        print(f"שימוש: python -m app.wipe <db> --confirm {CONFIRM} [--backups <dir>]   (מוחק את כל נתוני העסק!)",
              file=sys.stderr)
        return 2
    if backups is not None and not backups.is_dir():
        print(f"תיקיית הגיבויים לא קיימת: {backups}", file=sys.stderr)
        return 1
    p = Path(argv[1])
    if not p.is_file():
        print(f"ה-DB לא קיים: {p}", file=sys.stderr)
        return 1
    conn = sqlite3.connect(str(p))
    try:
        counts = wipe_all(conn, actor="cli")
    finally:
        conn.close()
    print("נמחק:", ", ".join(f"{k}={v}" for k, v in counts.items()))
    if backups is not None:
        print(f"גיבויים שנמחקו: {delete_backups(backups)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

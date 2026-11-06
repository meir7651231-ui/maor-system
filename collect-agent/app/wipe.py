"""מחיקה מלאה של נתוני העסק בסוף בטא (שער בטא 8: «מחיקה מלאה 14 יום אחרי סוף בטא»).

מוחק כל מידע אישי ועסקי: לקוחות, חשבוניות, תזכורות, הודעות, טיוטות, שיחות, טוקני הסרה,
הגדרות, כספת סודות, עובדים וסשנים. נשארים בכוונה (ללא PII, ראו DPA §11):
  * ``suppressions`` — גיבוב בלבד; מי שביקש הסרה לא יקבל הודעה אם המערכת תעלה שוב
  * ``audit`` ו-``access_log`` — הוספה-בלבד (טריגרים), תוכן ללא PII; נרשמת שורת ``business_wipe``

אחרי המחיקה: VACUUM (דורס דפים פנויים) ו-wal_checkpoint. גיבויים מוצפנים שכבר נוצרו
**לא** נמחקים כאן — מחיקתם חלק מהנוהל (``legal/BETA-GATE.md``).

שימוש:  python -m app.wipe <db> --confirm WIPE
"""
from __future__ import annotations

import sqlite3
import sys
from datetime import UTC, datetime
from pathlib import Path

CONFIRM = "WIPE"

# SQL קבוע (שער האבטחה: בלי f-string). סדר: ילדים לפני הורים בגלל foreign_keys.
_TABLES = ("sessions", "users", "link_tokens", "drafts", "conversations", "messages",
           "reminders", "plans", "invoices", "customers", "business_settings",
           "business_secrets")
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


def main(argv: list[str]) -> int:
    if len(argv) != 4 or argv[2] != "--confirm" or argv[3] != CONFIRM:
        print(f"שימוש: python -m app.wipe <db> --confirm {CONFIRM}   (מוחק את כל נתוני העסק!)",
              file=sys.stderr)
        return 2
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
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

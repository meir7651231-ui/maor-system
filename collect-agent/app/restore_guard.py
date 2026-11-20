"""critic סבב 175 (🔴): שחזור גיבוי החזיר את ה-DB **כולו** למצב רגע הגיבוי — כולל ``suppressions`` ו-``opted_out``.
לקוח שביקש הסרה אחרי הגיבוי חזר להיות «לא מוסר» וקיבל SMS ומייל; אותו דבר למחיקה לפי בקשה (DSR) ולהתממה.

שתי שכבות:
  1. **יומן הסרות מחוץ ל-DB** (``OPTOUT_LEDGER``, append-only, 0600, **גיבובים בלבד** — כמו ``suppressions``):
     כל ``suppress()`` נרשם גם בו, וכל שחזור מחיל אותו מחדש על ה-DB המשוחזר (וגם ``opted_out`` ללקוחות שהכתובת
     שלהם ביומן). היומן לא נכלל בגיבוי ולכן שורד אותו.
  2. **עצירת שליחה אחרי שחזור** (``restore_hold``): DB משוחזר עולה עם שליחה ללקוחות עצורה + התראה בולטת לבעל
     העסק, עד שהוא מאשר (בתיעוד) שהחיל מחדש הסרות/מחיקות מאז הגיבוי. היומן מכסה הסרות; מחיקות DSR והתממה
     אינן ביומן (הוא לא מחזיק PII) — ולכן העצירה נשארת גם כשהיומן הוחל.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

HOLD_INTENT = "restore_hold"
NOTE_MIN = 5

_SCHEMA = ("CREATE TABLE IF NOT EXISTS restore_hold (id INTEGER PRIMARY KEY, restored_at TEXT NOT NULL, "
           "source TEXT, ledger_applied INTEGER NOT NULL DEFAULT 0, released_at TEXT, released_by TEXT, note TEXT)")


# ---------- יומן ההסרות ----------
def ledger_append(path: str | Path, h: str, channel: str, reason: str, at: str) -> None:
    """שורת JSON אחת לכל הסרה. O_APPEND (לא דורס), 0600, בלי ללכת אחרי symlink. גיבוב בלבד — אין כתובת גלויה."""
    line = json.dumps({"hash": h, "channel": channel, "reason": reason, "at": at}, ensure_ascii=False) + "\n"
    fd = os.open(path, os.O_CREAT | os.O_APPEND | os.O_WRONLY | getattr(os, "O_NOFOLLOW", 0), 0o600)
    try:
        os.write(fd, line.encode())
        os.fsync(fd)
    finally:
        os.close(fd)


def ledger_read(path: str | Path) -> list[dict]:
    p = Path(path)
    if not p.exists():
        return []
    out = []
    for line in p.read_text(encoding="utf-8").splitlines():
        try:
            row = json.loads(line)
        except ValueError:
            continue   # שורה חלקית (כתיבה שנקטעה) — מדלגים; שאר היומן תקף
        if isinstance(row, dict) and isinstance(row.get("hash"), str) and row.get("channel") in ("sms", "email"):
            out.append(row)
    return out


def ledger_apply(conn, rows: list[dict]) -> int:
    """מחיל את היומן על DB (משוחזר): suppressions + opted_out ללקוח שהכתובת שלו ביומן. מחזיר כמה הסרות חדשות."""
    from .service import CollectService  # מאוחר: service מייבא את המודול הזה
    if not rows:
        return 0
    before = conn.execute("SELECT COUNT(*) FROM suppressions").fetchone()[0]
    conn.executemany("INSERT OR IGNORE INTO suppressions(hash,channel,reason,created_at) VALUES(?,?,?,?)",
                     [(r["hash"], r["channel"], r.get("reason") or "ledger", r.get("at") or "") for r in rows])
    hashes = {(r["channel"], r["hash"]) for r in rows}
    for cid, phone, email in conn.execute("SELECT id, phone, email FROM customers WHERE opted_out=0").fetchall():
        if (phone and ("sms", CollectService.addr_hash("sms", phone)) in hashes) or \
                (email and ("email", CollectService.addr_hash("email", email)) in hashes):
            conn.execute("UPDATE customers SET opted_out=1 WHERE id=?", (cid,))
    conn.commit()
    return conn.execute("SELECT COUNT(*) FROM suppressions").fetchone()[0] - before


# ---------- עצירה אחרי שחזור ----------
def mark_restored(conn, *, at: str, source: str, ledger_rows: int, applied: int) -> None:
    conn.execute(_SCHEMA)
    conn.execute("INSERT INTO restore_hold(restored_at, source, ledger_applied) VALUES(?,?,?)",
                 (at, Path(source).name, applied))
    has_msgs = conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='messages'").fetchone()
    if has_msgs:
        led = (f"יומן ההסרות הוחל: {applied} הסרות שנוספו אחרי הגיבוי הוחזרו. " if ledger_rows else
               "⚠️ אין יומן הסרות (OPTOUT_LEDGER) — הסרות שהתבקשו אחרי הגיבוי לא הוחזרו אוטומטית. ")
        conn.execute("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,message_id,"
                     "created_at) VALUES(NULL,'system','owner',?,?,1,?,?)",
                     ("🛑 המערכת שוחזרה מגיבוי — כל השליחה ללקוחות עצורה. " + led +
                      "לפני חידוש: החילו מחדש כל בקשת הסרה, מחיקה או התממה שהתקבלה מאז הגיבוי, ואז אשרו את החידוש "
                      "עם תיעוד של מה שבדקתם.", HOLD_INTENT, f"{HOLD_INTENT}:{at}", at))
    conn.commit()


def active(db) -> dict | None:
    """השחזור האחרון שלא שוחרר (או None). בלי הטבלה ⇒ מעולם לא שוחזר."""
    if not db.one("SELECT 1 FROM sqlite_master WHERE type='table' AND name='restore_hold'"):
        return None
    r = db.one("SELECT * FROM restore_hold WHERE released_at IS NULL ORDER BY id DESC LIMIT 1")
    return dict(r) if r else None


def release(db, *, actor: str, note: str, at: str) -> dict:
    hold = active(db)
    if hold is None:
        raise KeyError("אין עצירת שחזור פעילה")
    if len((note or "").strip()) < NOTE_MIN:
        raise ValueError("נדרש תיעוד (לפחות 5 תווים) של ההסרות/המחיקות שהוחלו מחדש מאז הגיבוי")
    db.x("UPDATE restore_hold SET released_at=?, released_by=?, note=? WHERE released_at IS NULL",
         (at, actor, note.strip()[:500]))
    db.x("UPDATE messages SET needs_owner=0 WHERE intent=? AND needs_owner=1", (HOLD_INTENT,))
    return {**hold, "released_at": at, "released_by": actor}

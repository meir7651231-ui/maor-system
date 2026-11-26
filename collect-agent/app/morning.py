"""עבודת הבוקר: «כל בוקר רשימה מוכנה» — סנכרון ⇒ הכנת תזכורות ⇒ «מה דורש אותך היום». **בלי שליחה.**

    python -m app.morning <db>                 # מריצים מ-cron פעם בבוקר (למשל 07:30 שעון ישראל)
    python -m app.morning check <db> [hours]   # ניטור: האם עבודת הבוקר רצה ב-<hours> האחרונות (ברירת מחדל 26)

מה זה עושה:
  1. סנכרון מהמקור (חשבונית ירוקה / iCount / … לפי ההגדרות; שלב 1 = sandbox/mock). כשל בסנכרון ⇒ נרשם,
     וממשיכים עם מה שכבר ב-DB (כל שליחה ממילא מרעננת סכום ומקור לפני שהיא יוצאת — ר-4).
     מקור CSV ⇒ אין סנכרון (לא כשל): הסיכום מוסיף csv_last_import + csv_upload_needed (ייבוא מעל 24 שעות).
  2. plan(): הכנת תזכורות. מועד השליחה שלהן ממילא נקבע לפי חלון השליחה (בלי שבת/חג, 08–20).
  3. סיכום לבעל העסק: כמה ממתינות לאישורו, כמה דורשות טיפול, כמה חובות פתוחים.

מה זה **לא** עושה: dispatch / שליחה. אף הודעה לא יוצאת בלי אישור בעל העסק (מבחן: tests/test_morning.py
מחליף את השולח במלכודת שנכשלת על כל send).
שבת/חג (אין חלון שליחה ביום הזה) ⇒ לא מסנכרנים ולא מכינים — היום נרשם כ«סגור».
אידמפוטנטי ליום: ריצה שנייה באותו יום (שעון ישראל) לא עושה כלום ומחזירה את הסיכום של הראשונה.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta
from typing import Any

from .policy import TZ

_DDL = ("CREATE TABLE IF NOT EXISTS morning_runs (day TEXT PRIMARY KEY, at TEXT NOT NULL, "
        "status TEXT NOT NULL, summary TEXT NOT NULL)")


def _ensure_table(db) -> None:
    db.x(_DDL)


def _summary(svc) -> dict[str, Any]:
    """«מה דורש אותך היום» — ספירות בלבד (בלי שמות/טלפונים: הסיכום נשמר ב-DB ומודפס ללוג ה-cron)."""
    pending = svc.db.one("SELECT COUNT(*) n FROM reminders WHERE status='pending_approval'")["n"]
    attention = svc.db.one("SELECT COUNT(*) n FROM messages WHERE needs_owner=1")["n"]
    open_inv = svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open'")["n"]
    # שער «אישור רשימת הפתוחות»: חשבונית שבעל העסק עוד לא סימן «עדיין פתוחה» לא מקבלת תזכורת.
    # בלי השורה הזו הבוקר הראשון נראה «אין מה לעשות» — והרשימה בעצם מחכה לו.
    list_review = len(svc.open_list()["pending"]) if getattr(svc.s, "open_review", False) else 0
    out = {"pending_approval": pending, "needs_owner": attention, "open_invoices": open_inv,
           "open_list_to_confirm": list_review}
    if svc.s.source_system == "csv":
        out.update(_csv_freshness(svc))
    return out


CSV_FRESH = timedelta(hours=24)   # ר-4: חשבונית CSV תקפה לשליחה 24 שעות (service._refresh_invoice / refresh_customer)


CSV_LAST_IMPORT_KEY = "csv_last_import"   # business_settings: מועד הייבוא האחרון (מנהל 374)


def _aware(dt: datetime) -> datetime:
    return dt.replace(tzinfo=TZ) if dt.tzinfo is None else dt


def _csv_freshness(svc) -> dict[str, Any]:
    """עסק שעובד עם CSV: אין סנכרון. מה שבעל העסק צריך לדעת בבוקר = האם הקובץ טרי. ייבוא אחרון מעל 24 שעות ⇒
    תזכורות על חשבוניות CSV לא ייצאו (ר-4) ⇒ «העלו קובץ עדכני היום». ספירות/תאריך בלבד, בלי פרטי לקוח."""
    last = svc.db.one("SELECT MAX(synced_at) m FROM invoices WHERE source='csv'")["m"]
    # מנהל 374 (מבקר 217): גם ייבוא שלא השאיר חשבונית פתוחה (הכול «שולם») הוא קובץ טרי
    stamp = svc.db.one("SELECT value FROM business_settings WHERE key=?", (CSV_LAST_IMPORT_KEY,))
    if stamp:
        v = json.loads(stamp["value"])
        last = max(filter(None, (last, v)), key=lambda x: _aware(datetime.fromisoformat(x)))
    last_dt = _aware(datetime.fromisoformat(last)) if last else None
    return {"csv_last_import": last_dt.astimezone(TZ).date().isoformat() if last_dt else None,
            "csv_upload_needed": last_dt is None or svc.clock() - last_dt > CSV_FRESH}


def run_morning(svc, now: datetime | None = None, *, force: bool = False) -> dict[str, Any]:
    now = (now or svc.clock()).astimezone(TZ)
    day = now.date().isoformat()
    _ensure_table(svc.db)
    prev = svc.db.one("SELECT * FROM morning_runs WHERE day=?", (day,))
    if prev and not force:
        return {"day": day, "status": prev["status"], "already_ran": True,
                **json.loads(prev["summary"])}
    if svc.policy.window(now.date()) is None:
        out: dict[str, Any] = {"day": day, "status": "closed_day",
                               "reason": svc.policy.reason_closed(now) or "אין חלון שליחה היום"}
    else:
        out = {"day": day, "status": "ok"}
        if svc.s.source_system == "csv":
            # עסק CSV (30%–50% מהבטא, market.md): אין API לסנכרן. קודם sync() זרק ⇒ «sync_failed» כל בוקר ⇒
            # הניטור התריע «הסנכרון נכשל» לשווא, וה-cron יצא 1. במקום: מדלגים, והסיכום אומר אם הקובץ טרי.
            out["sync"] = {"source": "csv", "skipped": True}
        else:
            try:
                out["sync"] = svc.sync()
                if out["sync"].get("vanish_held"):
                    # מנהל 420 (מבקר 252🟡): המקור החזיר רשימה ריקה/מקוצרת והחובות מוחזקים פתוחים (כרטיס
                    # api_mass_vanish לבעל העסק) — קודם הסטטוס נשאר «ok» והניטור התפעולי שתק ימים. עכשיו: חשוד ⇒ ALERT.
                    out["status"] = "sync_suspect"
            except Exception as e:  # noqa: BLE001 — כל כשל סנכרון: ממשיכים עם מה שב-DB, ומדווחים
                out["status"] = "sync_failed"
                out["sync_error"] = f"{type(e).__name__}: {str(e)[:200]}"
        out["planned"] = len(svc.plan())
        out.update(_summary(svc))
    svc.db.x("INSERT OR REPLACE INTO morning_runs(day,at,status,summary) VALUES(?,?,?,?)",
             (day, now.isoformat(timespec="seconds"), out["status"],
              json.dumps({k: v for k, v in out.items() if k not in ("day", "status")},
                         ensure_ascii=False)))
    svc.audit("system", "morning", {k: out[k] for k in out if k not in ("sync_error",)})
    return out


def check(db, max_hours: float = 26, now: datetime | None = None) -> tuple[bool, str]:
    """לניטור (כמו backup check): עבודת הבוקר רצה ב-max_hours האחרונות? סגור בשבת/חג נחשב ריצה."""
    _ensure_table(db)
    row = db.one("SELECT * FROM morning_runs ORDER BY at DESC LIMIT 1")
    if row is None:
        return False, "עבודת הבוקר לא רצה אף פעם — ה-cron לא מוגדר?"
    age = (now or datetime.now(TZ)) - datetime.fromisoformat(row["at"])
    if age > timedelta(hours=max_hours):
        return False, (f"עבודת הבוקר האחרונה ({row['day']}) לפני {age.total_seconds() / 3600:.0f} שעות "
                       f"(מעל {max_hours:g}) — ה-cron נעצר?")
    if row["status"] == "sync_failed":
        return False, f"עבודת הבוקר ({row['day']}) רצה אבל הסנכרון נכשל — לבדוק את החיבור למקור"
    if row["status"] == "sync_suspect":
        sync = json.loads(row["summary"]).get("sync") or {}
        return False, (f"עבודת הבוקר ({row['day']}): המקור החזיר {sync.get('open', 0)} חשבוניות פתוחות ו-"
                       f"{sync.get('vanish_held', 0)} חובות שנעלמו מוחזקים פתוחים (לא נסגרו) — לבדוק את החיבור למקור")
    return True, f"עבודת הבוקר ({row['day']}, {row['status']}) לפני {age.total_seconds() / 3600:.1f} שעות"


def _service_from_env(db_path: str):
    """אותו בנייה כמו create_app (נתיב הפריסה), עם DB מהארגומנט."""
    import os

    from .config import load_settings
    from .db import DB
    from .greeninvoice import GreenInvoiceClient
    from .service import CollectService

    s = load_settings({**os.environ, "DB_PATH": db_path})
    gi = (GreenInvoiceClient(s.greeninvoice_base_url, s.greeninvoice_api_id, s.greeninvoice_api_secret)
          if s.greeninvoice_api_id else None)
    return CollectService(s, DB(db_path), gi=gi)


def main(argv: list[str]) -> int:
    from pathlib import Path
    if argv[1:2] == ["check"] and len(argv) in (3, 4):
        if not Path(argv[2]).is_file():
            print(f"ALERT: ה-DB לא קיים: {argv[2]}", file=sys.stderr)
            return 1
        from .db import DB
        ok, msg = check(DB(argv[2]), float(argv[3]) if len(argv) == 4 else 26)
        print(("ok: " if ok else "ALERT: ") + msg, file=sys.stdout if ok else sys.stderr)
        return 0 if ok else 1
    if len(argv) == 2 and not argv[1].startswith("-"):
        if not Path(argv[1]).is_file():
            print(f"ה-DB לא קיים: {argv[1]} (לא יוצרים DB ריק בשקט)", file=sys.stderr)
            return 2
        out = run_morning(_service_from_env(argv[1]))
        print(json.dumps(out, ensure_ascii=False))
        return 0 if out["status"] in ("ok", "closed_day") else 1
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))

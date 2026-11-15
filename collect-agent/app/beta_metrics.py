"""מדדי הצלחה של הבטא (גבי מכירות, BACKLOG «שאלון בטא + טבלת מדדים»).

כל מדד כאן מחושב מהנתונים שגבי כבר שומר (חשבוניות, תזכורות, טיוטות, הודעות). אין כאן ניחוש ואין הבטחה:
- «נגבה אחרי תזכורת» = חשבונית שנסגרה במקור **אחרי** שיצאה עליה תזכורת. זה מתאם, לא הוכחה שהתזכורת
  גרמה לתשלום. כך גם מוצג לבעל העסק ולמאיר.
- «זמן שנחסך» = הערכה שמבוססת על הנחה גלויה (MANUAL_MINUTES לתזכורת ידנית). ההנחה נבדקת בשאלון.
- נטישה (מי לא המשיך אחרי 14 ימי הניסיון) לא נמדדת כאן: אין במערכת מנוי או חיוב. היא נאספת בשאלון.
"""
from __future__ import annotations

from datetime import datetime
from statistics import median

# הנחה גלויה: כמה דקות לוקח לבעל עסק לנסח ולשלוח תזכורת אחת ידנית (לבדוק בשאלון, שאלה 5)
MANUAL_MINUTES = 4
SENT = ("sent_dry_run", "sent", "send_unknown")   # 3 ערכים ⇒ IN (?,?,?) בשאילתות


def _pct(a: int, b: int) -> float | None:
    return None if not b else round(100 * a / b, 1)


def _dt(s: str | None) -> datetime | None:
    return datetime.fromisoformat(s) if s else None


def beta_metrics(db) -> dict:
    """מדדי הבטא של עסק אחד. `db` = app.db.DB (או כל אובייקט עם q/one)."""
    first_sent: dict[int, datetime] = {}
    for r in db.q("SELECT invoice_id, MIN(sent_at) s FROM reminders WHERE status IN (?,?,?) "
                  "AND sent_at IS NOT NULL GROUP BY invoice_id", SENT):
        first_sent[r["invoice_id"]] = _dt(r["s"])
    # תזכורת מאוחדת (כמה חשבוניות בהודעה אחת): גם החשבוניות הנוספות נחשבות כמי שקיבלו תזכורת
    for r in db.q("SELECT ri.invoice_id, MIN(r.sent_at) s FROM reminder_invoices ri JOIN reminders r "
                  "ON r.id=ri.reminder_id WHERE r.status IN (?,?,?) AND r.sent_at IS NOT NULL "
                  "GROUP BY ri.invoice_id", SENT):
        s = _dt(r["s"])
        if r["invoice_id"] not in first_sent or s < first_sent[r["invoice_id"]]:
            first_sent[r["invoice_id"]] = s

    closed_after, days, agorot = 0, [], 0
    for r in db.q("SELECT id, amount_agorot, currency, closed_at FROM invoices WHERE status='closed' "
                  "AND closed_at IS NOT NULL"):
        s = first_sent.get(r["id"])
        c = _dt(r["closed_at"])
        if s and c and c >= s:
            closed_after += 1
            days.append((c - s).total_seconds() / 86400)
            if (r["currency"] or "ILS") == "ILS":
                agorot += r["amount_agorot"]

    sent = db.one("SELECT COUNT(*) n FROM reminders WHERE status IN (?,?,?)", SENT)["n"]
    messaged = {r["customer_id"] for r in db.q(
        "SELECT DISTINCT customer_id FROM messages WHERE direction='out' AND customer_id IS NOT NULL")}
    opted = {r["id"] for r in db.q("SELECT id FROM customers WHERE opted_out=1")}
    disputed = {r["id"] for r in db.q("SELECT id FROM customers WHERE disputed=1")}
    has_drafts = db.one("SELECT 1 FROM sqlite_master WHERE type='table' AND name='drafts'")
    drafts = db.q("SELECT edited FROM drafts WHERE decided_by IS NOT NULL AND status IN (?,?)",
                  ("sent_dry_run", "approved")) if has_drafts else []   # טבלת מנוע השיחה (app/inbox.py)
    undelivered = db.one("SELECT COUNT(*) n FROM messages WHERE intent='sms_undelivered'")["n"]

    return {
        "invoices_reminded": len(first_sent),
        "closed_after_reminder": closed_after,
        "closed_after_reminder_pct": _pct(closed_after, len(first_sent)),
        "closed_after_reminder_ils_agorot": agorot,
        "median_days_reminder_to_close": round(median(days), 1) if days else None,
        "reminders_sent": sent,
        "owner_minutes_saved_estimate": sent * MANUAL_MINUTES,
        "customers_messaged": len(messaged),
        "opt_out_pct": _pct(len(opted & messaged), len(messaged)),
        "dispute_pct": _pct(len(disputed & messaged), len(messaged)),
        "replies_approved_without_edit_pct": _pct(sum(1 for d in drafts if not d["edited"]), len(drafts)),
        "sms_undelivered": undelivered,
        "assumptions": {"manual_minutes_per_reminder": MANUAL_MINUTES,
                        "closed_after_reminder": "מתאם בלבד: נסגרה במקור אחרי שיצאה תזכורת",
                        "churn": "לא נמדד במערכת (אין מנוי); נאסף בשאלון"},
    }


def main(argv: list[str] | None = None) -> None:
    """`python3 -m app.beta_metrics <קובץ DB>` ⇒ טבלת המדדים של עסק בבטא (קריאה בלבד)."""
    import argparse
    import json
    import sqlite3
    from pathlib import Path

    ap = argparse.ArgumentParser(description="מדדי הבטא של עסק אחד (קריאה בלבד)")
    ap.add_argument("db", help="נתיב לקובץ ה-DB של העסק")
    a = ap.parse_args(argv)
    if not Path(a.db).is_file():
        raise SystemExit(f"אין קובץ DB: {a.db}")

    class _RO:   # קריאה בלבד: mode=ro, בלי מיגרציות ובלי כתיבה
        def __init__(self, path: str):
            self.c = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
            self.c.row_factory = sqlite3.Row

        def q(self, sql, args=()):
            return self.c.execute(sql, args).fetchall()

        def one(self, sql, args=()):
            return self.c.execute(sql, args).fetchone()

    print(json.dumps(beta_metrics(_RO(a.db)), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()

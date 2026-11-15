"""מדדי הבטא (app/beta_metrics.py, גבי מכירות): מחושבים מהנתונים, בלי ניחוש.

- נסגרה **לפני** שיצאה תזכורת ⇒ לא נספרת כ«נגבה אחרי תזכורת» (אחרת המדד מנפח את ההצלחה).
- תזכורת שלא יצאה (ממתינה/נדחתה) ⇒ לא נספרת.
- חשבונית שנכללה בתזכורת מאוחדת ⇒ נחשבת כמי שקיבלה תזכורת.
- דולר לא מצטרף לשקלים. הנחת «זמן שנחסך» גלויה בתשובה.
- על הדמו: הסכום בשקלים שנגבה אחרי תזכורת לא עולה על «נגבה» בדשבורד.
"""
from __future__ import annotations

from app.beta_metrics import MANUAL_MINUTES, beta_metrics
from app.db import DB


def _db():
    db = DB(":memory:")
    for cid in (1, 2, 3, 4):
        db.x("INSERT INTO customers(id, external_id, name) VALUES(?,?,?)", (cid, f"c{cid}", f"לקוח {cid}"))
    return db


def _inv(db, iid, cid, amount, closed_at=None, currency="ILS"):
    db.x("INSERT INTO invoices(id, external_id, number, amount_agorot, currency, customer_id, status, closed_at) "
         "VALUES(?,?,?,?,?,?,?,?)", (iid, f"i{iid}", str(iid), amount, currency, cid,
                                     "closed" if closed_at else "open", closed_at))


def _rem(db, rid, iid, status, sent_at=None, step=0):
    db.x("INSERT INTO reminders(id, invoice_id, step, template_key, scheduled_for, status, requires_approval, "
         "body, payload, sent_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
         (rid, iid, step, "friendly", "2026-11-01T10:00:00+02:00", status, 1, "x", "[]", sent_at))


def test_counts_only_closed_after_a_sent_reminder():
    db = _db()
    _inv(db, 1, 1, 100_00, closed_at="2026-11-05T10:00:00+02:00")   # תזכורת 1.11 ⇒ נסגרה 5.11 ✓
    _rem(db, 1, 1, "sent_dry_run", "2026-11-01T10:00:00+02:00")
    _inv(db, 2, 2, 200_00, closed_at="2026-10-30T10:00:00+02:00")   # נסגרה לפני התזכורת ✗
    _rem(db, 2, 2, "sent_dry_run", "2026-11-01T10:00:00+02:00")
    _inv(db, 3, 3, 300_00, closed_at="2026-11-09T10:00:00+02:00")   # התזכורת לא יצאה ✗
    _rem(db, 3, 3, "pending_approval")
    _inv(db, 4, 4, 50_00, closed_at="2026-11-04T10:00:00+02:00", currency="USD")  # דולר ✓, לא בשקלים
    _rem(db, 4, 4, "sent_dry_run", "2026-11-01T10:00:00+02:00")
    m = beta_metrics(db)
    assert m["invoices_reminded"] == 3
    assert m["closed_after_reminder"] == 2
    assert m["closed_after_reminder_ils_agorot"] == 100_00
    assert m["median_days_reminder_to_close"] == 3.5          # 4 ימים ו-3 ימים
    assert m["reminders_sent"] == 3
    assert m["owner_minutes_saved_estimate"] == 3 * MANUAL_MINUTES
    assert m["assumptions"]["manual_minutes_per_reminder"] == MANUAL_MINUTES


def test_merged_reminder_counts_every_invoice_in_it():
    db = _db()
    _inv(db, 1, 1, 10_00, closed_at="2026-11-03T10:00:00+02:00")
    _inv(db, 2, 1, 20_00, closed_at="2026-11-03T10:00:00+02:00")
    _rem(db, 1, 1, "sent_dry_run", "2026-11-01T10:00:00+02:00")
    db.x("INSERT INTO reminder_invoices(reminder_id, invoice_id) VALUES(1,1),(1,2)")
    m = beta_metrics(db)
    assert m["invoices_reminded"] == 2 and m["closed_after_reminder"] == 2
    assert m["closed_after_reminder_ils_agorot"] == 30_00


def test_empty_business_has_no_fake_percentages():
    m = beta_metrics(_db())
    assert m["closed_after_reminder_pct"] is None and m["opt_out_pct"] is None
    assert m["median_days_reminder_to_close"] is None and m["closed_after_reminder"] == 0


def test_on_the_demo_matches_the_dashboard():
    from app.demo import build_demo_service, run_scenario
    svc, fake, _ = build_demo_service()
    run_scenario(svc, fake, out=lambda s: None)
    m = beta_metrics(svc.db)
    t = svc.dashboard()["totals"]
    assert m["reminders_sent"] == t["reminders_sent"]
    assert m["customers_messaged"] == t["customers_messaged"]
    assert 0 < m["closed_after_reminder_ils_agorot"] <= t["collected_agorot"]
    assert m["opt_out_pct"] is not None and m["opt_out_pct"] > 0      # רון ביקש הסרה בתרחיש

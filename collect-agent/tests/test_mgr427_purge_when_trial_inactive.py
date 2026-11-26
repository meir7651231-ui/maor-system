"""מנהל 427 (מבקר 257🟠): ר-10 (התממה 90 יום מסגירת החוב) רץ רק בתוך `plan()`, אחרי `if not trial.active: return []`
⇒ עסק שהניסיון/המנוי שלו נגמר שמר שם+טלפון של לקוחות לתמיד. עכשיו `purge_closed()` לפני שער ה-trial — התממה אינה
שליחה. השער עצמו נשאר: עסק לא פעיל לא מתכנן תזכורות. legal hold וחוב פתוח עדיין מונעים התממה."""
from dataclasses import replace
from datetime import timedelta

from app import morning

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def _closed_then_inactive(svc, clock, rows_open: str = "", rows_paid: str = ""):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + "7001,דויד כהן,050-0000111,,1200,פתוח,01/10/26,15/10/26\n" + rows_open).encode())
    clock.now += timedelta(days=1)
    svc.import_csv((H + "7001,דויד כהן,050-0000111,,1200,שולם,01/10/26,15/10/26\n" + rows_paid).encode())
    svc.s = replace(svc.s, trial_start=(clock.now.date() - timedelta(days=60)).isoformat())
    assert svc.trial()["active"] is False


def _cust(svc, name_phone: str):
    return svc.db.one("SELECT name, phone, purged_at, external_id FROM customers WHERE phone=? OR external_id LIKE ?",
                      (name_phone, "%"))


def test_inactive_trial_still_purges_and_plans_nothing(svc, clock):
    _closed_then_inactive(svc, clock)
    clock.now += timedelta(days=100)
    assert svc.plan() == []                     # השער נשאר: אין תכנון תזכורות
    row = svc.db.one("SELECT name, phone, purged_at, external_id FROM customers")
    assert row["purged_at"] and row["phone"] is None and row["name"] is None, dict(row)
    assert row["external_id"].startswith("purged:") and "0000111" not in row["external_id"]
    assert svc.db.one("SELECT COUNT(*) n FROM reminders WHERE status IN ('pending','approved')")["n"] == 0
    assert svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='retention_purge'")["n"] == 1


def test_inactive_trial_before_90_days_keeps_data(svc, clock):
    _closed_then_inactive(svc, clock)
    clock.now += timedelta(days=30)
    svc.plan()
    row = svc.db.one("SELECT name, phone, purged_at FROM customers")
    assert row["purged_at"] is None and row["name"] == "דויד כהן"


def test_inactive_trial_respects_legal_hold(svc, clock):
    _closed_then_inactive(svc, clock)
    svc.db.x("UPDATE customers SET legal_hold='תביעה 123'")
    clock.now += timedelta(days=100)
    svc.plan()
    row = svc.db.one("SELECT name, purged_at FROM customers")
    assert row["purged_at"] is None and row["name"] == "דויד כהן"


def test_inactive_trial_open_debt_customer_not_purged(svc, clock):
    extra = "7002,רות לוי,050-0000222,,500,פתוח,01/10/26,15/10/26\n"
    _closed_then_inactive(svc, clock, rows_open=extra, rows_paid=extra)
    clock.now += timedelta(days=100)
    svc.plan()
    kept = svc.db.one("SELECT name, purged_at FROM customers WHERE name='רות לוי'")
    assert kept is not None and kept["purged_at"] is None
    assert svc.db.one("SELECT COUNT(*) n FROM customers WHERE purged_at IS NOT NULL")["n"] == 1


def test_morning_run_purges_for_inactive_business(svc, clock):
    _closed_then_inactive(svc, clock)
    clock.now += timedelta(days=100)
    while svc.policy.window(clock.now.astimezone(morning.TZ).date()) is None:   # לא שבת/חג
        clock.now += timedelta(days=1)
    out = morning.run_morning(svc, clock.now)
    assert out["status"] == "ok" and out["planned"] == 0
    assert svc.db.one("SELECT purged_at FROM customers")["purged_at"]

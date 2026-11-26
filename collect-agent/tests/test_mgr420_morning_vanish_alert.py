"""מנהל 420 (מבקר 252🟡): בזמן החזקת `api_mass_vanish` עבודת הבוקר הייתה «ok» ו-`morning check` «תקין» — ה-cron
לא התריע שהמקור מחזיר רשימה ריקה כבר ימים. עכשיו: `sync_suspect` + ALERT עם המספרים; ריצה תקינה למחרת ⇒ חוזר ל-ok."""
from __future__ import annotations

from datetime import timedelta

from app import morning
from tests.conftest import gi_doc


def _hold(svc, clock, fake_gi, n=10):
    fake_gi.docs[:] = [gi_doc(i, phone=f"050-00001{i:02d}") for i in range(1, n + 1)]
    svc.sync()
    fake_gi.docs[:] = []
    clock.now += timedelta(days=1)


def test_suspect_status_and_alert_message_has_numbers(svc, clock, fake_gi):
    _hold(svc, clock, fake_gi)
    out = morning.run_morning(svc)
    assert out["status"] == "sync_suspect" and out["sync"]["vanish_held"] == 10
    ok, msg = morning.check(svc.db, now=svc.clock())
    assert not ok and "10" in msg and "החיבור" in msg, msg
    # אין סגירה בשקט — ההחזקה נשמרת
    assert svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open'")["n"] == 10


def test_same_day_rerun_keeps_suspect(svc, clock, fake_gi):
    _hold(svc, clock, fake_gi)
    morning.run_morning(svc)
    clock.now += timedelta(hours=2)
    again = morning.run_morning(svc)
    assert again["already_ran"] and again["status"] == "sync_suspect"


def test_recovery_next_day_returns_ok(svc, clock, fake_gi):
    _hold(svc, clock, fake_gi)
    morning.run_morning(svc)
    fake_gi.docs[:] = [gi_doc(i, phone=f"050-00001{i:02d}") for i in range(1, 11)]   # החיבור תוקן
    clock.now += timedelta(days=1)
    out = morning.run_morning(svc)
    assert out["status"] == "ok" and not out["sync"].get("vanish_held"), out
    ok, msg = morning.check(svc.db, now=svc.clock())
    assert ok, msg


def test_normal_sync_still_ok(svc, fake_gi):
    """בקרה: סנכרון רגיל (בלי החזקה) — עדיין ok ו-check תקין."""
    out = morning.run_morning(svc)
    assert out["status"] == "ok"
    assert morning.check(svc.db, now=svc.clock())[0]

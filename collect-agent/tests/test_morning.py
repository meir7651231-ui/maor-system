"""עבודת הבוקר (app.morning): «כל בוקר רשימה מוכנה» — sync ⇒ plan ⇒ סיכום. **בלי שליחה.**

ממצא גבי שיווק (BACKLOG «כל בוקר רשימה מוכנה»): מסר הליבה הבטיח רשימה כל בוקר, ובקוד sync/plan רצו
רק ידנית או מ-webhook. בדיקות: אין שום send (מלכודת), אידמפוטנטי ליום, שבת/חג = סגור, כשל סנכרון
גלוי, ו-check לניטור כמו בגיבוי.
"""
from __future__ import annotations

from datetime import datetime, timedelta

import pytest

from app import morning
from app.policy import TZ


@pytest.fixture
def trap(svc, monkeypatch):
    """כל ניסיון לשלוח/לבצע dispatch ⇒ כישלון מיידי."""
    def boom(*a, **k):
        raise AssertionError("עבודת הבוקר ניסתה לשלוח הודעה!")
    monkeypatch.setattr(svc.sender, "send", boom)
    monkeypatch.setattr(svc, "dispatch", boom)
    return svc


def _reminders(svc):
    return svc.db.one("SELECT COUNT(*) n FROM reminders")["n"]


def test_morning_syncs_plans_and_summarizes_without_sending(trap, fake_gi):
    out = morning.run_morning(trap)
    assert out["status"] == "ok" and out["sync"]["open"] >= 1, out
    assert out["planned"] >= 1 and out["pending_approval"] >= 1
    assert fake_gi.search_calls >= 1
    assert trap.sender.sent == []                                   # אף הודעה לא יצאה
    ok, msg = morning.check(trap.db, now=trap.clock())
    assert ok, msg


def test_second_run_same_day_is_idempotent(trap, fake_gi, clock):
    first = morning.run_morning(trap)
    n, calls = _reminders(trap), fake_gi.search_calls
    clock.now += timedelta(hours=3)
    again = morning.run_morning(trap)
    assert again["already_ran"] and again["pending_approval"] == first["pending_approval"]
    assert _reminders(trap) == n and fake_gi.search_calls == calls  # בלי סנכרון/תזכורות כפולים


def test_next_day_runs_again(trap, clock):
    morning.run_morning(trap)
    clock.now += timedelta(days=1)                                  # שני
    assert morning.run_morning(trap).get("already_ran") is None


def test_shabbat_is_closed_no_sync_no_plan(trap, fake_gi, clock):
    clock.now = datetime(2026, 11, 14, 8, 0, tzinfo=TZ)               # שבת
    out = morning.run_morning(trap)
    assert out["status"] == "closed_day" and "שבת" in out["reason"]
    assert fake_gi.search_calls == 0 and _reminders(trap) == 0
    ok, _ = morning.check(trap.db, now=clock.now)
    assert ok                                                       # יום סגור נחשב ריצה תקינה


def test_planned_reminders_never_scheduled_on_shabbat(trap, clock):
    clock.now = datetime(2026, 11, 13, 7, 30, tzinfo=TZ)              # שישי בבוקר
    morning.run_morning(trap)
    for r in trap.db.q("SELECT scheduled_for FROM reminders"):
        assert datetime.fromisoformat(r["scheduled_for"]).astimezone(TZ).weekday() != 5


def test_sync_failure_is_visible_and_still_prepares_list(trap, fake_gi, clock, monkeypatch):
    morning.run_morning(trap)                                        # יום א׳: נתונים ב-DB
    clock.now += timedelta(days=1)

    def down():
        raise RuntimeError("GI לא זמין")
    monkeypatch.setattr(trap, "sync", down)
    out = morning.run_morning(trap)
    assert out["status"] == "sync_failed" and "GI לא זמין" in out["sync_error"]
    assert "pending_approval" in out                                 # הרשימה מה-DB עדיין מוכנה
    ok, msg = morning.check(trap.db, now=clock.now)
    assert not ok and "הסנכרון נכשל" in msg


def test_check_alerts_when_never_ran_or_stale(trap, clock):
    ok, msg = morning.check(trap.db, now=clock.now)
    assert not ok and "לא רצה אף פעם" in msg
    morning.run_morning(trap)
    ok, msg = morning.check(trap.db, now=clock.now + timedelta(hours=30))
    assert not ok and "ה-cron נעצר" in msg


def test_cli_refuses_missing_db(tmp_path, capsys):
    assert morning.main(["m", str(tmp_path / "nope.sqlite3")]) == 2
    assert morning.main(["m", "check", str(tmp_path / "nope.sqlite3")]) == 1
    assert not (tmp_path / "nope.sqlite3").exists()                   # לא נוצר DB ריק בשקט
    assert morning.main(["m"]) == 2


def test_summary_shows_open_list_waiting_for_owner(trap):
    """שער אישור-הרשימה דלוק ⇒ אין תזכורות עד שבעל העסק מאשר. הסיכום חייב להגיד שהרשימה מחכה לו,
    אחרת הבוקר הראשון נראה «0 ממתינות» ושום דבר לא זז."""
    object.__setattr__(trap.s, "open_review", True)
    out = morning.run_morning(trap)
    assert out["open_list_to_confirm"] == out["open_invoices"] >= 1
    assert out["pending_approval"] == 0 and out["planned"] == 0

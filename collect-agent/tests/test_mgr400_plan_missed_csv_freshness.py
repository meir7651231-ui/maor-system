"""מנהל 400 · מבקר 236🟡 — במקור CSV «הוחמץ» רק לפי קובץ שהועלה **אחרי** מועד התשלום שהוחמץ.

`service._sweep_plans`: קובץ אחרון ישן (או מיום המועד עצמו) ⇒ ההסדר נשאר פעיל, בלי כרטיס «לא התקבל».
קובץ טרי שעדיין מראה את מלוא היתרה ⇒ «הוחמץ» כרגיל (התיקון לא משתיק הסדר שבאמת הוחמץ)."""
from tests.test_critic_round236_plan_missed_stale_csv import _plan_accepted, _until


def _status(svc):
    return svc.db.one("SELECT status FROM plans")["status"]


def _card(svc):
    return svc.db.one("SELECT 1 FROM messages WHERE intent='plan_missed'")


def test_stale_file_does_not_mark_missed(svc, clock):
    _plan_accepted(svc, clock)
    _until(svc, clock, "2026-12-10")
    assert _status(svc) == "approved" and _card(svc) is None


def test_file_on_due_day_is_still_stale(svc, clock):
    _plan_accepted(svc, clock)
    _until(svc, clock, "2026-11-16", upload=("2026-11-16", 1200))
    _until(svc, clock, "2026-11-30")
    assert _status(svc) == "approved" and _card(svc) is None


def test_fresh_file_unpaid_still_marks_missed(svc, clock):
    _plan_accepted(svc, clock)
    _until(svc, clock, "2026-11-30", upload=("2026-11-30", 1200))
    assert _status(svc) == "missed" and _card(svc) is not None


def test_fresh_file_after_grace_paid_keeps_plan(svc, clock):
    _plan_accepted(svc, clock)
    _until(svc, clock, "2026-11-25", upload=("2026-11-25", 800))
    _until(svc, clock, "2026-12-05")
    assert _status(svc) == "approved" and _card(svc) is None

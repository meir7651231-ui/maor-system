"""מנהל 322 · תיקון מבקר סבב 174: הימים שנותרו לבקשת עיון/מחיקה נספרים בימי לוח (שעון ישראל), לא ב-24 שעות.

היה `(due_at - now).days` ⇒ «היום האחרון להשיב» יום לפני היעד, ו«באיחור של 1 ימים» ביום היעד שמוצג על המסך
(«להשיב עד 08.12»). גם ההתראה לבעל העסק («עברה את המועד») יצאה ביום היעד עצמו. עכשיו: `dsr.days_left` אחד
למרשם, להתראות ולסגירה — 0 = יום היעד, שלילי = אחריו.
"""
from datetime import datetime

from app import dsr
from app.policy import TZ


def _open(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", "מחקו את המידע שלי")   # 8.11 10:00 ⇒ יעד 8.12


def _row(svc):
    return dsr.listing(svc)[0]


def _alerts(svc):
    return [m["body"] for m in svc.db.q("SELECT body FROM messages WHERE intent='dsr' AND direction='system' "
                                         "ORDER BY id")]


def test_days_left_pure_calendar():
    due = datetime(2026, 12, 8, 10, 0, tzinfo=TZ)
    assert dsr.days_left(due, datetime(2026, 12, 7, 23, 59, tzinfo=TZ)) == 1
    assert dsr.days_left(due, datetime(2026, 12, 8, 0, 1, tzinfo=TZ)) == 0
    assert dsr.days_left(due, datetime(2026, 12, 8, 23, 59, tzinfo=TZ)) == 0
    assert dsr.days_left(due, datetime(2026, 12, 9, 0, 0, tzinfo=TZ)) == -1


def test_days_left_uses_israel_time_not_utc():
    """23:30 בישראל = 21:30 UTC באותו יום, אבל 00:30 בישראל = 22:30 UTC של **אתמול** ⇒ סופרים לפי ישראל."""
    from zoneinfo import ZoneInfo
    utc = ZoneInfo("UTC")
    due = datetime(2026, 12, 8, 10, 0, tzinfo=TZ)
    assert dsr.days_left(due, datetime(2026, 12, 7, 22, 30, tzinfo=utc)) == 0      # 00:30 ב-8.12 בישראל
    assert dsr.days_left(due.astimezone(utc), datetime(2026, 12, 7, 21, 30, tzinfo=utc)) == 1


def test_day_before_due_late_evening(svc, clock):
    _open(svc)
    clock.now = datetime(2026, 12, 7, 23, 0, tzinfo=TZ)
    r = _row(svc)
    assert r["days_left"] == 1 and r["overdue"] is False


def test_due_day_last_minute_not_overdue(svc, clock):
    _open(svc)
    clock.now = datetime(2026, 12, 8, 23, 59, tzinfo=TZ)
    r = _row(svc)
    assert r["days_left"] == 0 and r["overdue"] is False


def test_day_after_due_early_morning_overdue(svc, clock):
    _open(svc)
    clock.now = datetime(2026, 12, 9, 0, 5, tzinfo=TZ)
    r = _row(svc)
    assert r["days_left"] == -1 and r["overdue"] is True


def test_late_alert_not_on_due_day(svc, clock):
    """ההתראה «עברה את המועד» לא יוצאת ביום היעד (היה: 8.12 10:01), רק למחרת."""
    _open(svc)
    clock.now = datetime(2026, 12, 8, 18, 0, tzinfo=TZ)
    dsr.sweep(svc)
    assert not any("עברה את המועד" in b for b in _alerts(svc))
    assert any("היום היום האחרון" in b for b in _alerts(svc))
    clock.now = datetime(2026, 12, 9, 8, 0, tzinfo=TZ)
    dsr.sweep(svc)
    assert any("עברה את המועד (2026-12-08)" in b for b in _alerts(svc))


def test_soon_alert_counts_calendar_days(svc, clock):
    _open(svc)
    clock.now = datetime(2026, 12, 3, 9, 0, tzinfo=TZ)      # 5 ימי לוח לפני 8.12 (היה: 4 ב-24 שעות)
    dsr.sweep(svc)
    assert any("נותרו 5 ימים" in b for b in _alerts(svc))


def test_close_on_due_day_not_late(svc, clock):
    _open(svc)
    rid = _row(svc)["id"]
    clock.now = datetime(2026, 12, 8, 22, 0, tzinfo=TZ)
    dsr.close_request(svc, rid, "נמחק לפי בקשה, אושר בטלפון")
    a = svc.db.one("SELECT detail FROM audit WHERE action='dsr_closed' ORDER BY id DESC LIMIT 1")
    assert '"late": false' in a["detail"]


def test_close_day_after_is_late(svc, clock):
    _open(svc)
    rid = _row(svc)["id"]
    clock.now = datetime(2026, 12, 9, 9, 0, tzinfo=TZ)
    dsr.close_request(svc, rid, "נמחק לפי בקשה, באיחור")
    a = svc.db.one("SELECT detail FROM audit WHERE action='dsr_closed' ORDER BY id DESC LIMIT 1")
    assert '"late": true' in a["detail"]


def test_closed_row_has_no_days(svc, clock):
    _open(svc)
    dsr.close_request(svc, _row(svc)["id"], "טופל בטלפון")
    r = _row(svc)
    assert r["days_left"] is None and r["overdue"] is False


def test_no_timedelta_days_in_listing_source():
    """הגנת-מקור: אין חזרה ל-`(due - now).days`."""
    import inspect
    src = inspect.getsource(dsr)
    assert "- now).days" not in src

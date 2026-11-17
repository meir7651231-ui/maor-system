"""critic סבב 119 · 🟡 לוח החגים המובנה נגמר ב-2029-07 — אחריו השליחה נסגרת (fail-closed, טוב), אבל בעל העסק מגלה
רק כשהכול כבר עצר («לוח החגים המובנה פג» בדשבורד). אין אזהרה מוקדמת. תיקון: /dashboard.send_window מחזיר
holidays_until (התאריך האחרון בלוח) ו-holidays_expiring (פחות מ-120 יום) — כדי שהממשק/הצוות יעדכנו בזמן."""
from datetime import datetime, timedelta

from app.policy import Policy


def _last():
    return max(Policy().builtin)


def test_dashboard_reports_table_end(svc):
    svc.sync()
    w = svc.dashboard()["send_window"]
    assert w["holidays_until"] == _last() and w["holidays_expiring"] is False


def test_warns_120_days_before(svc, clock):
    last = datetime.fromisoformat(_last() + "T10:00:00").replace(tzinfo=clock.now.tzinfo)
    clock.now = last - timedelta(days=100)
    assert svc.dashboard()["send_window"]["holidays_expiring"] is True
    clock.now = last - timedelta(days=200)
    assert svc.dashboard()["send_window"]["holidays_expiring"] is False

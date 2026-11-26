"""מנהל 428 (מבקר 258🟡): `dsr.sweep` רץ ב-`plan()` אחרי שער הניסיון ⇒ עסק שהמנוי/ניסיון שלו נגמר לא קיבל
«נותרו N ימים»/«עברה את המועד» לבקשת עיון/מחיקה (30 יום, חוק הגנת הפרטיות). עכשיו לפני השער, יחד עם ר-10.
ההתראה פנימית לבעל העסק בלבד — אף הודעה לא יוצאת ללקוח, ואין תכנון תזכורות."""
from dataclasses import replace
from datetime import timedelta

from app import dsr, morning


def _inactive_with_request(svc, clock, kind="access"):
    svc.sync()
    cid = svc.db.one("SELECT id FROM customers LIMIT 1")["id"]
    rid = dsr.open_request(svc, cid, kind, "owner", note="בקשה בטלפון")
    svc.s = replace(svc.s, trial_start=(clock.now.date() - timedelta(days=60)).isoformat())
    assert svc.trial()["active"] is False
    return rid


def _warned(svc, rid):
    return svc.db.one("SELECT warned FROM dsr WHERE id=?", (rid,))["warned"].split(",")


def _out_count(svc):
    return svc.db.one("SELECT COUNT(*) n FROM messages WHERE direction='out'")["n"]


def test_soon_alert_when_inactive(svc, clock):
    rid = _inactive_with_request(svc, clock)
    out0 = _out_count(svc)
    clock.now += timedelta(days=26)
    assert svc.plan() == []
    assert "soon" in _warned(svc, rid)
    assert svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent='dsr' AND message_id=?",
                      (f"dsr:{rid}:soon",))["n"] == 1
    assert _out_count(svc) == out0          # שום דבר לא יצא ללקוח


def test_late_alert_when_inactive_once(svc, clock):
    rid = _inactive_with_request(svc, clock, kind="deletion")
    clock.now += timedelta(days=31)
    svc.plan()
    svc.plan()
    assert "late" in _warned(svc, rid)
    assert svc.db.one("SELECT COUNT(*) n FROM messages WHERE message_id=?", (f"dsr:{rid}:late",))["n"] == 1
    assert svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='dsr_late'")["n"] == 1


def test_inactive_still_no_reminders_planned(svc, clock):
    _inactive_with_request(svc, clock)
    clock.now += timedelta(days=31)
    assert svc.plan() == []
    assert svc.db.one("SELECT COUNT(*) n FROM reminders WHERE status IN ('pending','approved')")["n"] == 0


def test_run_morning_carries_dsr_alert_when_inactive(svc, clock):
    rid = _inactive_with_request(svc, clock)
    clock.now += timedelta(days=31)
    while clock.now.weekday() in (4, 5):   # שישי/שבת — run_morning לא רץ
        clock.now += timedelta(days=1)
    r = morning.run_morning(svc, force=True)
    assert r.get("status") == "ok" or r.get("ok"), r
    assert "late" in _warned(svc, rid)

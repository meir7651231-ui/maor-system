"""מנהל 323 · פתוח-לביקורת מ-322: תזכורת מאושרת שתקועה על כשל רענון יותר מ-48 שעות ⇒ התראה לבעל העסק.

לפני: `refresh_failed` / `refresh_page_cap` הוצגו רק כתווית בצ׳יפ של התזכורת. מקור לא זמין (טוקן שפג, ספק למטה)
⇒ אף לקוח לא קיבל תזכורת במשך ימים, ובעל העסק שלא פתח את הטבלה לא ידע.

אחרי: בכל plan() — תזכורות מאושרות שתקועות ≥48 שעות על כשל רענון ⇒ הודעה אחת מרוכזת (intent=refresh_stuck)
בהתראות. פעם אחת לכל רצף; רענון מוצלח מאפס, וכשל חדש יספר מחדש. השליחה עצמה לא משתנה (עדיין לא יוצאת).
"""
import re
from datetime import timedelta
from pathlib import Path

from app.greeninvoice import GreenInvoiceError
from app.service import REFRESH_PAGE_CAP, REFRESH_STUCK_HOURS, refresh_stuck_text
from tests.test_mgr318_receipts_page_cap import _foreign
from tests.test_paid_never_reminded import _approve_all, _to_dana

ROOT = Path(__file__).resolve().parents[1]
NOTICES = (ROOT / "web" / "src" / "lib" / "notices.ts").read_text(encoding="utf-8")


def _alerts(svc):
    return svc.db.q("SELECT * FROM messages WHERE intent='refresh_stuck' ORDER BY id")


def _break(svc):
    def boom(*a, **kw):
        raise GreenInvoiceError("HTTP 503")
    orig = svc.gi.get_document
    svc.gi.get_document = boom
    return orig


def _stuck(svc, clock):
    svc.sync()
    _approve_all(svc, svc.plan())
    orig = _break(svc)
    svc.dispatch()
    assert {r["block_reason"] for r in svc.db.q("SELECT block_reason FROM reminders WHERE status='approved'")} \
        == {"refresh_failed"}
    return orig


def test_no_alert_before_48h(svc, clock):
    _stuck(svc, clock)
    clock.now += timedelta(hours=REFRESH_STUCK_HOURS - 1)
    svc.dispatch()   # עוד ניסיון כושל — לא מאפס את «מאז»
    svc.plan()
    assert _alerts(svc) == []


def test_alert_after_48h_once(svc, clock):
    _stuck(svc, clock)
    clock.now += timedelta(hours=REFRESH_STUCK_HOURS - 1)
    svc.dispatch()
    clock.now += timedelta(hours=2)
    svc.plan()
    a = _alerts(svc)
    assert len(a) == 1
    assert a[0]["needs_owner"] == 1 and a[0]["direction"] == "system"
    assert "48 שעות" in a[0]["body"] and "ננסה שוב אוטומטית" in a[0]["body"]
    assert "10,000" not in a[0]["body"]
    clock.now += timedelta(hours=24)
    svc.dispatch()
    svc.plan()
    assert len(_alerts(svc)) == 1   # פעם אחת לרצף — לא כל יום
    assert _to_dana(svc) == []      # השליחה לא השתנתה


def test_first_failure_kept_across_retries(svc, clock):
    """COALESCE: ניסיון כושל חוזר לא מזיז את תחילת הרצף (אחרת ההתראה לא הייתה יוצאת לעולם)."""
    _stuck(svc, clock)
    first = svc.db.one("SELECT refresh_failed_since s FROM reminders WHERE status='approved'")["s"]
    for _ in range(3):
        clock.now += timedelta(hours=20)
        svc.dispatch()
    assert svc.db.one("SELECT refresh_failed_since s FROM reminders WHERE status='approved'")["s"] == first


def test_recovery_resets_and_new_streak_realerts(svc, clock):
    orig = _stuck(svc, clock)
    clock.now += timedelta(hours=REFRESH_STUCK_HOURS + 1)
    svc.plan()
    assert len(_alerts(svc)) == 1
    svc.gi.get_document = orig
    svc.dispatch()          # רענון מצליח ⇒ נשלחת
    assert _to_dana(svc) != []
    svc.plan()
    assert svc.db.one("SELECT COUNT(*) n FROM reminders WHERE refresh_failed_since IS NOT NULL "
                      "OR refresh_alerted_at IS NOT NULL")["n"] == 0


def test_streak_reset_when_reapproved(svc, clock):
    """תזכורת שחזרה לאישור (למשל סכום השתנה) ואושרה שוב — הרצף הקודם לא נספר."""
    _stuck(svc, clock)
    r = svc.db.one("SELECT * FROM reminders WHERE status='approved'")
    svc._invalidate(r, "amount_changed")
    svc.plan()   # מאפס את הרצף של תזכורת שכבר לא מאושרת
    assert svc.db.one("SELECT refresh_failed_since s FROM reminders WHERE id=?", (r["id"],))["s"] is None
    svc.approve(r["id"])
    clock.now += timedelta(hours=REFRESH_STUCK_HOURS + 1)
    svc.dispatch()   # כשל ראשון של הרצף החדש — עכשיו
    svc.plan()
    # התזכורות האחרות (לקוח אחר) עדיין ברצף המקורי ⇒ עשויות להתריע; זו — לא
    assert svc.db.one("SELECT refresh_alerted_at a FROM reminders WHERE id=?", (r["id"],))["a"] is None
    assert all(str(r["id"]) not in a["message_id"].split(":")[1].split(",") for a in _alerts(svc))


def test_page_cap_text(svc, fake_gi, clock):
    svc.sync()
    _approve_all(svc, svc.plan())
    fake_gi.docs.extend(_foreign(10_001))
    svc.dispatch()
    clock.now += timedelta(hours=REFRESH_STUCK_HOURS + 1)
    svc.plan()
    a = _alerts(svc)
    assert len(a) == 1 and "10,000" in a[0]["body"] and "לבדוק ידנית" in a[0]["body"]


def test_aggregated_one_message(svc, clock):
    _stuck(svc, clock)
    n = svc.db.one("SELECT COUNT(*) n FROM reminders WHERE status='approved'")["n"]
    clock.now += timedelta(hours=REFRESH_STUCK_HOURS + 1)
    svc.plan()
    a = _alerts(svc)
    assert len(a) == 1
    if n > 1:
        assert a[0]["customer_id"] is None and f"{n} תזכורות" in a[0]["body"]


def test_text_pure():
    one = refresh_stuck_text([("דנה", "1001", "refresh_failed")])
    assert one.startswith("תזכורת מאושרת אחת לא יוצאת") and "דנה (חשבונית 1001)" in one
    many = refresh_stuck_text([(f"ל{i}", str(i), "refresh_failed") for i in range(8)])
    assert many.startswith("8 תזכורות") and "ועוד 3" in many and "ל5" not in many
    mixed = refresh_stuck_text([("א", "1", "refresh_failed"), ("ב", "2", REFRESH_PAGE_CAP)])
    assert "ננסה שוב" in mixed and "10,000" in mixed
    assert "לא נשלחת" in mixed


def test_web_notice_label():
    assert re.search(r"refresh_stuck: \{ icon: '⏳', title: '[^']+', tone: 'warn' \}", NOTICES)

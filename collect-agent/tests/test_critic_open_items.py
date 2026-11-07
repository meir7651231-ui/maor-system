"""רגרסיות לפריטים 🟡/🟠 פתוחים ב-team/critic.md שאינם תלויים בהכרעת בעלים/עו״ד/ספק (7.11.2026).
כל בדיקה כאן נכשלה לפני התיקון (מוטציה: החזרת הקוד הישן ⇒ אדום)."""
import dataclasses
import inspect
import re
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app import config
from app.backup import rotate_backups
from app.config import Settings, load_settings
from app.db import DB
from app.main import create_app
from app.service import CollectService
from tests.conftest import AUTH, OWNER_TOKEN

# שדות שהם קבועים בקוד בכוונה (מקור יחיד), ולא נקראים מהסביבה
CODE_ONLY = {"price_ils_month", "price_ils_year"}


# ---------- 3.5: Settings.timezone לא היה בשימוש ----------
def test_every_setting_is_loaded_or_explicitly_code_only():
    """שדה הגדרה שלא נקרא מהסביבה ולא משמש = הגדרה מטעה (critic 3.5: `timezone` נראה ניתן לשינוי,
    אבל TZ קשיח ב-policy). כל שדה חדש חייב להיקרא ב-load_settings או להירשם כ-CODE_ONLY."""
    src = inspect.getsource(config.load_settings)
    loaded = set(re.findall(r"^\s+(\w+)=", src, re.M))
    fields = {f.name for f in dataclasses.fields(Settings)}
    assert fields - loaded - CODE_ONLY == set()


def test_timezone_has_single_source():
    assert "timezone" not in {f.name for f in dataclasses.fields(Settings)}
    from app.policy import TZ
    assert str(TZ) == "Asia/Jerusalem"


# ---------- 11.2: סבב גיבויים לפי שם ולא לפי חותמת ----------
def _touch(d, *names):
    for n in names:
        (d / n).write_bytes(b"GBK1")


def test_rotation_ignores_manually_named_backup(tmp_path):
    """קובץ gabi-manual.gbk מוין «אחרון» לפי שם: תפס מקום ב-keep, והגיבוי המתוזמן האחרון נמחק."""
    _touch(tmp_path, "gabi-20261101T000000Z.gbk", "gabi-20261105T000000Z.gbk",
           "gabi-20261106T000000Z.gbk", "gabi-manual.gbk")
    gone = rotate_backups(tmp_path, 2, now=datetime(2026, 11, 7, tzinfo=UTC))
    assert [p.name for p in gone] == ["gabi-20261101T000000Z.gbk"]
    assert sorted(p.name for p in tmp_path.iterdir()) == [
        "gabi-20261105T000000Z.gbk", "gabi-20261106T000000Z.gbk", "gabi-manual.gbk"]


def test_rotation_never_deletes_the_newest_scheduled_backup(tmp_path):
    """cron שנעצר 60 יום + קובץ ידני: נשאר לפחות הגיבוי המתוזמן האחרון (היה: נמחק לפי גיל)."""
    _touch(tmp_path, "gabi-20260901T000000Z.gbk", "gabi-20260902T000000Z.gbk", "gabi-zzz.gbk")
    rotate_backups(tmp_path, 14, now=datetime(2026, 11, 7, tzinfo=UTC))
    assert (tmp_path / "gabi-20260902T000000Z.gbk").exists()
    assert not (tmp_path / "gabi-20260901T000000Z.gbk").exists()   # בן יותר מ-30 יום


# ---------- 3.6.4: אותה חשבונית מ-CSV ומה-API = שני שרשורים ----------
CSV_1001 = ("מספר מסמך,שם לקוח,טלפון,מייל,יתרה לתשלום,תאריך,תאריך לתשלום\n"
            "1001,דנה כהן,050-1234567,c1@example.com,1200,15/09/2026,01/10/2026\n")


def test_api_sync_adopts_csv_twin_instead_of_closing_it(svc):
    svc.import_csv(CSV_1001.encode())
    rid = svc.plan()[0]
    svc.approve(rid, confirm_open=True)
    assert svc.dispatch()                                    # תזכורת 1 יצאה בשרשור ה-CSV
    svc.sync()
    rows = svc.db.q("SELECT * FROM invoices WHERE number='1001'")
    assert len(rows) == 1                                   # היה: csv:1001 (נסגר) + doc1 (פתוח)
    assert rows[0]["external_id"] == "doc1" and rows[0]["source"] == "api"
    assert rows[0]["status"] == "open"
    sent = svc.db.one("SELECT COUNT(*) n FROM reminders WHERE invoice_id=? AND status LIKE 'sent%'",
                      (rows[0]["id"],))["n"]
    assert sent == 1                     # מונה 3 התזכורות ממשיך (היה: שרשור חדש מאפס)
    assert svc.dashboard()["totals"]["collected_agorot"] == 0         # היה: 1,200 ₪ «נגבו»


def test_csv_row_skipped_when_api_already_has_the_number(svc):
    svc.sync()
    res = svc.import_csv(CSV_1001.encode())
    assert res["imported"] == 0
    assert len(svc.db.q("SELECT id FROM invoices WHERE number='1001'")) == 1


# ---------- «רק קישור לעמוד העסק»: נתונים אמיתיים בלי קישור ⇒ קישור מוק יצא ללקוח ----------
def test_real_data_without_payment_link_blocks_instead_of_mock_link(gi_client, clock):
    s = load_settings({"BUSINESS_NAME": "סטודיו מאיר", "REAL_DATA_ALLOWED": "1"})
    assert s.payment_page == ""
    svc = CollectService(s, DB(":memory:"), gi=gi_client, clock=clock)
    svc.sync()
    rids = svc.plan()
    assert rids
    for rid in rids:
        r = svc.db.one("SELECT block_reason, payload FROM reminders WHERE id=?", (rid,))
        assert r["block_reason"] == "no_payment_link" and ".example/pay" not in r["payload"]


def test_demo_data_keeps_mock_link():
    assert load_settings({}).payment_page.endswith(".example/pay/demo")


# ---------- 2.3.2: הדשבורד לא אמר מתי מותר לשלוח ----------
def test_dashboard_shows_send_window(svc, clock):
    w = svc.dashboard()["send_window"]
    assert w == {"open_now": True, "closed_reason": None, "next_allowed": "2026-11-08T10:00:00+02:00"}
    clock.now += timedelta(days=6)                 # שבת 14.11 10:00
    w = svc.dashboard()["send_window"]
    assert w["open_now"] is False and w["closed_reason"] == "שבת"
    assert w["next_allowed"] == "2026-11-15T08:00:00+02:00"


def test_dashboard_survives_expired_holiday_table(svc, clock):
    clock.now = datetime(2029, 9, 2, 10, tzinfo=clock.now.tzinfo)
    w = svc.dashboard()["send_window"]
    assert w["open_now"] is False and w["next_allowed"] is None


# ---------- ר-13: עמוד הקישור הקצר (היעד של ה-SMS) בלי «למה קיבלתם» ובלי פרטיות ----------
def test_short_link_page_explains_and_has_privacy(svc):
    svc.sync()
    inv = svc.db.one("SELECT * FROM invoices WHERE number='1001'")
    code = svc.short_url(inv).rsplit("/", 1)[1]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    html = api.get(f"/p/{code}").text
    assert "קיבלתם הודעה זו" in html and "בעל השליטה במידע" in html and "פרטיות" in html

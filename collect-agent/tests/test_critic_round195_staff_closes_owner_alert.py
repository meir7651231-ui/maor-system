"""מבקר סבב 195 — מי סוגר את התראת «הגדרות רגישות שונו — ודאו שזה אתם».

רכיבים: `app/main.py` → `owner_inbox_done` (POST /owner/inbox/{mid}/done) + `app/service.py` →
`owner_message_done` / `_self_dismiss_blocked`.
מאז d081d0d2 רק בעל העסק משנה קישור תשלום / מייל תשובה / שולח SMS. ההתראה settings_changed נשארה «רשת הביטחון
לסשן גנוב של בעלים» (test_manager342: test_owner_can_change_sensitive_and_is_still_notified). אבל:
  א. **עובד/ת** (staff) סוגר/ת אותה ב«✓ טופל» — היא יורדת מ«דורש טיפול שלך» של בעל העסק. מאומת גם בדפדפן כעובדת
     ב-/app/ (מונה ההתראות הפתוחות 1⇒0).
  ב. **בעל העסק עצמו** לא יכול לסגור אותה (שינוי שהוא ביצע ⇒ _self_dismiss_blocked כל עוד יש עובד/ת פעיל/ה) — כלומר
     בעסק «בעלים + עובדת» את ההתראה שמיועדת לבעל העסק יכולה לסגור **רק העובדת**. הסמכות הפוכה.
הצעה: settings_changed נסגרת ע״י בעל עסק בלבד (is_owner); הכלל «לא מי שביצע» חל רק כשיש בעלים אחר.
**[REQUIRE_USER_LOGIN=1 + TOTP]** xfail(strict=True); בקרה ירוקה."""
import pytest
from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.secretbox import generate_key
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"
NEW_LINK = "https://www.greeninvoice.co.il/pay/c195-new"


def _api(svc, clock, monkeypatch):
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k1:{generate_key()}")
    u = Users(svc.db, svc.clock)
    regs = {"owner": u.create("owner@s.example", "בעלים", PW), "staff": u.create("staff@s.example", "עובד", PW)}
    svc.sync()
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    cache: dict = {}

    def hdr(who):
        if who not in cache:
            tok = api.post("/auth/login", json={"email": f"{who}@s.example", "password": PW,
                                                "code": totp.code_at(regs[who]["totp_secret"], clock().timestamp())})
            cache[who] = {"Authorization": f"Bearer {tok.json()['token']}"}
        return cache[who]
    assert api.put("/api/settings", json={"payment_link": NEW_LINK}, headers=hdr("owner")).status_code == 200
    mid = svc.db.one("SELECT id FROM messages WHERE intent='settings_changed' AND needs_owner=1")["id"]
    return api, hdr, mid


def _open(svc, mid) -> bool:
    return svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (mid,))["needs_owner"] == 1


@pytest.mark.xfail(strict=True, reason="195א: עובד/ת סוגר/ת את התראת-הביטחון של בעל העסק")
def test_staff_cannot_close_owner_security_alert(svc, clock, monkeypatch):
    api, hdr, mid = _api(svc, clock, monkeypatch)
    api.post(f"/owner/inbox/{mid}/done", headers=hdr("staff"))
    assert _open(svc, mid), "עובד/ת סגר/ה את «הגדרות רגישות שונו — ודאו שזה אתם»"


@pytest.mark.xfail(strict=True, reason="195ב: בעל העסק לא יכול לסגור התראה שמיועדת לו (רק העובדת יכולה)")
def test_owner_can_close_own_security_alert(svc, clock, monkeypatch):
    api, hdr, mid = _api(svc, clock, monkeypatch)
    r = api.post(f"/owner/inbox/{mid}/done", headers=hdr("owner"))
    assert r.status_code == 200 and not _open(svc, mid), r.text


def test_control_alert_created_and_open(svc, clock, monkeypatch):
    _api_, _hdr, mid = _api(svc, clock, monkeypatch)
    assert _open(svc, mid)

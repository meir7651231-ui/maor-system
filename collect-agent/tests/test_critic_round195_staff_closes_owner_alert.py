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
**[REQUIRE_USER_LOGIN=1 + TOTP]** xfail(strict=True); בקרה ירוקה.
   תוקן במנהל 348: `_actor_is_owner` (עובד/ת ⇒ 403 OwnerOnly + audit) · «אחר» ב-_self_dismiss_blocked
   = בעל עסק — ה-xfail הוסרו."""
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


def test_staff_cannot_close_owner_security_alert(svc, clock, monkeypatch):
    api, hdr, mid = _api(svc, clock, monkeypatch)
    r = api.post(f"/owner/inbox/{mid}/done", headers=hdr("staff"))
    assert _open(svc, mid), "עובד/ת סגר/ה את «הגדרות רגישות שונו — ודאו שזה אתם»"
    assert r.status_code == 403 and "בעל העסק" in r.text, r.text
    assert svc.db.q("SELECT 1 FROM audit WHERE action='owner_message_done_refused' AND detail LIKE '%owner_only%'")


def test_other_owner_closes_when_changer_is_owner(svc, clock, monkeypatch):
    """195ב: עם בעל עסק נוסף — מי שביצע לא סוגר, בעל העסק האחר כן; העובדת לא."""
    api, hdr, mid = _api(svc, clock, monkeypatch)
    Users(svc.db, svc.clock).set_role("staff@s.example", "owner")
    assert api.post(f"/owner/inbox/{mid}/done", headers=hdr("owner")).status_code == 409
    assert _open(svc, mid)
    assert api.post(f"/owner/inbox/{mid}/done", headers=hdr("staff")).status_code == 200
    assert not _open(svc, mid)


def test_other_notices_still_closable_by_staff(svc, clock, monkeypatch):
    api, hdr, _mid = _api(svc, clock, monkeypatch)
    svc.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,created_at) "
             "VALUES(NULL,'system','owner','x','max_reminders',1,'2026-11-14T10:00:00')")
    mid = svc.db.one("SELECT max(id) AS m FROM messages")["m"]
    assert api.post(f"/owner/inbox/{mid}/done", headers=hdr("staff")).status_code == 200


def test_owner_can_close_own_security_alert(svc, clock, monkeypatch):
    api, hdr, mid = _api(svc, clock, monkeypatch)
    r = api.post(f"/owner/inbox/{mid}/done", headers=hdr("owner"))
    assert r.status_code == 200 and not _open(svc, mid), r.text


def test_control_alert_created_and_open(svc, clock, monkeypatch):
    _api_, _hdr, mid = _api(svc, clock, monkeypatch)
    assert _open(svc, mid)

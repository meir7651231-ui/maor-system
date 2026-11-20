"""מבקר 192 · המשך מיפוי staff מול בעלים (אחרי 190ב/191). רכיבים:
  א. `app/main.py` → `put_settings` / `put_design_settings` + `app/service.py` → `update_settings`: מאז critic 179 יש
     תפקידים, אבל עובד/ת (או סשן גנוב של עובד/ת) עדיין החליף/ה את **קישור התשלום** לעמוד שלו/ה אצל אותו ספק (הדומיין
     מותר), את Reply-To, את שם השולח או את מקור הנתונים — ⇒ 200, ובעל העסק רק קיבל התראה (critic 72, מלפני התפקידים)
     **אחרי** שחייבים כבר שילמו לחשבון אחר. עכשיו: השדות האלה (וגם שם בעל העסק / מספר עוסק) = בעל העסק בלבד (403 +
     audit `settings_sensitive_refused`, כלום לא נשמר). שאר ההגדרות (ימי חג, SMS דו-כיווני) — עובד/ת ממשיך/ה.
  ב. `dsr_open` / `dsr_done`: היומן רשם «owner» קבוע גם כשעובד/ת פתח/ה או סגר/ה בקשת פרטיות ⇒ השחקן האמיתי."""
from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.secretbox import generate_key
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"
NEW_LINK = "https://www.greeninvoice.co.il/pay/someone-else"


def _api(svc, clock, monkeypatch):
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k1:{generate_key()}")
    u = Users(svc.db, svc.clock)
    regs = {"owner": u.create("owner@s.example", "בעלים", PW), "staff": u.create("staff@s.example", "עובד", PW)}
    svc.sync()
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))

    cache: dict = {}

    def hdr(who):   # קוד TOTP חד-פעמי ⇒ כניסה אחת לכל משתמש
        if who in cache:
            return cache[who]
        tok = api.post("/auth/login", json={"email": f"{who}@s.example", "password": PW,
                                            "code": totp.code_at(regs[who]["totp_secret"], clock().timestamp())})
        cache[who] = {"Authorization": f"Bearer {tok.json()['token']}"}
        return cache[who]
    return api, hdr


def _actions(svc, name):
    return svc.db.q("SELECT actor, detail FROM audit WHERE action=?", (name,))


def test_staff_cannot_redirect_payment_link(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    old = svc.s.payment_link
    r = api.put("/api/settings", json={"payment_link": NEW_LINK}, headers=hdr("staff"))
    assert r.status_code == 403, r.text
    assert "קישור התשלום" in r.json()["detail"]
    assert svc.s.payment_link == old
    assert not svc.db.one("SELECT 1 FROM business_settings WHERE key='payment_link'")
    rows = _actions(svc, "settings_sensitive_refused")
    assert rows and rows[0]["actor"].startswith("user:") and "payment_link" in rows[0]["detail"]
    assert not _actions(svc, "settings_sensitive_changed")


def test_staff_refused_each_owner_only_field_and_design_route(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    h = hdr("staff")
    for body in ({"email_reply_to": "x@evil.example"}, {"sms_sender_id": "Evil"},
                 {"business_name": "עסק אחר"}, {"source_system": "csv"},
                 {"vat_id": "000000018"}, {"owner_name": "מישהו אחר"}):
        assert api.put("/api/settings", json=body, headers=h).status_code == 403, body
    # מסך ההגדרות המעוצב (DESIGN §3ב) עובר דרך אותו שער
    r = api.put("/settings", json={"reply_email": "x@evil.example"}, headers=h)
    assert r.status_code == 403, r.text
    assert api.put("/settings", json={"business_name": "עסק אחר"}, headers=h).status_code == 403
    assert svc.s.business_name != "עסק אחר"
    assert len(_actions(svc, "settings_sensitive_refused")) >= 6


def test_staff_mixed_patch_is_all_or_nothing(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    before = svc.s.sms_two_way
    r = api.put("/api/settings", json={"sms_two_way": not before, "payment_link": NEW_LINK}, headers=hdr("staff"))
    assert r.status_code == 403
    assert svc.s.sms_two_way == before        # גם השדה המותר לא נשמר — אין שמירה חלקית


def test_staff_can_still_change_ordinary_settings(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    before = svc.s.sms_two_way
    r = api.put("/api/settings", json={"sms_two_way": not before}, headers=hdr("staff"))
    assert r.status_code == 200, r.text
    assert svc.s.sms_two_way == (not before)
    # שליחת ערך רגיש **זהה** לקיים (טופס שנשלח במלואו) — אינה שינוי, ולא נחסמת
    r = api.put("/api/settings", json={"business_name": svc.s.business_name}, headers=hdr("staff"))
    assert r.status_code == 200, r.text


def test_owner_can_change_sensitive_and_is_still_notified(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    r = api.put("/api/settings", json={"payment_link": NEW_LINK}, headers=hdr("owner"))
    assert r.status_code == 200, r.text
    assert svc.s.payment_link == NEW_LINK
    assert _actions(svc, "settings_sensitive_changed")    # רשת הביטחון (סשן גנוב של בעלים) נשארת
    assert svc.db.one("SELECT 1 FROM messages WHERE intent='settings_changed' AND needs_owner=1")


def test_dsr_audit_records_real_actor(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    h = hdr("staff")
    r = api.post("/customers/1/dsr", json={"kind": "access", "note": "התקשר לעסק"}, headers=h)
    assert r.status_code == 200, r.text
    rid = r.json()["id"]
    assert api.post(f"/dsr/{rid}/done", json={"note": "נשלח עותק במייל"}, headers=h).status_code == 200
    opened, closed = _actions(svc, "dsr_opened"), _actions(svc, "dsr_closed")
    assert opened[-1]["actor"].startswith("user:") and closed[-1]["actor"].startswith("user:")
    # הערוץ נשאר «owner» (הוזן ע״י העסק, לא ע״י הלקוח)
    assert svc.db.one("SELECT channel FROM dsr WHERE id=?", (rid,))["channel"] == "owner"

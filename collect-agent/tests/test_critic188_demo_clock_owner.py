"""מבקר 188 (על מנהל 337 — `POST /demo/advance`): הנתיב תועד כ«אימות בעלים» אבל נרשם עם `auth` הכללי ⇒ עובדת
מחוברת בתפקיד staff הזיזה את שעון ההדגמה לכולם (ופגה סשנים של אחרים); וה-audit נרשם תמיד כ-«owner:demo» קבוע, כך
שהיומן לא הראה מי הזיז. עכשיו: 403 לעובד/ת staff, והשחקן האמיתי נרשם ביומן."""

from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"
H = {"Authorization": f"Bearer {OWNER_TOKEN}"}


def _demo(monkeypatch):
    monkeypatch.setenv("DEMO", "1")
    monkeypatch.setenv("DEMO_CLOCK", "1")
    monkeypatch.setenv("DEMO_TRIAL_START", "2026-11-15")
    for k in ("DEMO_USER_EMAIL", "DEMO_STAFF_EMAIL", "REQUIRE_USER_LOGIN"):
        monkeypatch.delenv(k, raising=False)
    c = TestClient(create_app(owner_token=OWNER_TOKEN))
    svc = c.app.state.svc
    return c, svc, Users(svc.db, svc.clock)


def _login(c, svc, reg, email):
    code = totp.code_at(reg["totp_secret"], svc.clock().timestamp())
    r = c.post("/auth/login", json={"email": email, "password": PW, "code": code})
    assert r.status_code == 200, r.text
    return {"Authorization": "Bearer " + r.json()["token"]}


def test_staff_cannot_move_demo_clock(monkeypatch):
    c, svc, u = _demo(monkeypatch)
    u.create("owner@biz.example", "בעל העסק", PW)
    stf = u.create("staff@biz.example", "דנה", PW, role="staff")
    hs = _login(c, svc, stf, "staff@biz.example")
    before = svc.clock()
    r = c.post("/demo/advance?days=5", headers=hs)
    assert r.status_code == 403, r.text
    assert svc.clock() == before
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='demo_clock_advanced'")


def test_logged_in_owner_can_move_and_is_the_audited_actor(monkeypatch):
    c, svc, u = _demo(monkeypatch)
    own = u.create("owner@biz.example", "בעל העסק", PW)
    ho = _login(c, svc, own, "owner@biz.example")
    r = c.post("/demo/advance?days=2", headers=ho)
    assert r.status_code == 200, r.text
    actor = svc.db.one("SELECT actor FROM audit WHERE action='demo_clock_advanced'")[0]
    assert actor.startswith("user:"), actor        # פסאודונים, לא מייל ולא «owner:demo»
    assert "@" not in actor


def test_shared_token_audited_as_owner(monkeypatch):
    c, svc, _ = _demo(monkeypatch)
    assert c.post("/demo/advance?days=1", headers=H).status_code == 200
    assert svc.db.one("SELECT actor FROM audit WHERE action='demo_clock_advanced'")[0] == "owner"

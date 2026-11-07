"""שער 6: משתמש לכל עובד + 2FA (TOTP) + שחקן אמיתי ביומן הצפייה.

⚖️ "נאכף בקוד" ≠ "מאושר משפטית" (legal/BETA-GATE.md)."""
from __future__ import annotations

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app import totp
from app.config import load_settings
from app.db import DB
from app.main import create_app
from app.service import CollectService
from app.users import Users
from tests.conftest import AUTH, OWNER_TOKEN

PW = "correct-horse-battery"


def test_totp_rfc6238_vector():
    # RFC 6238 נספח B (SHA-1), סוד "12345678901234567890", T=59 ⇒ 94287082 ⇒ 6 ספרות: 287082
    import base64
    sec = base64.b32encode(b"12345678901234567890").decode()
    assert totp.code_at(sec, 59) == "287082"
    assert totp.code_at(sec, 1111111109) == "081804"


def test_totp_window_and_replay():
    sec = totp.new_secret()
    t = 1_800_000_000.0
    c = totp.code_at(sec, t)
    got = totp.verify(sec, c, t)
    assert got == int(t // 30)
    assert totp.verify(sec, c, t, last_counter=got) is None           # replay
    assert totp.verify(sec, totp.code_at(sec, t - 30), t) is not None  # סטייה ±1
    assert totp.verify(sec, totp.code_at(sec, t - 90), t) is None
    assert totp.verify(sec, "abcdef", t) is None and totp.verify(sec, "", t) is None


@pytest.fixture
def env(gi_client, clock):
    s = load_settings({"SMS_SENDER_ID": "StudioMeir", "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/s"})
    svc = CollectService(s, DB(":memory:"), gi=gi_client, clock=clock)
    users = Users(svc.db, svc.clock)
    reg = users.create("Dana@Example.co.il", "דנה", PW)
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    return svc, users, reg, api, clock


def _login(api, reg, clock, pw=PW, shift=0):
    code = totp.code_at(reg["totp_secret"], clock().timestamp() + shift)
    return api.post("/auth/login", json={"email": "dana@example.co.il", "password": pw, "code": code})


def test_login_needs_password_and_code(env):
    svc, users, reg, api, clock = env
    assert _login(api, reg, clock, pw="wrong-password-1").status_code == 401
    assert api.post("/auth/login", json={"email": "dana@example.co.il", "password": PW,
                                         "code": "000000"}).status_code == 401
    r = _login(api, reg, clock)
    assert r.status_code == 200 and len(r.json()["token"]) >= 32


def test_session_token_acts_as_the_employee_in_access_log(env):
    svc, users, reg, api, clock = env
    tok = _login(api, reg, clock).json()["token"]
    assert api.get("/customers", headers={"Authorization": f"Bearer {tok}"}).status_code in (200, 404)
    api.get("/dashboard", headers={"Authorization": f"Bearer {tok}"})
    actors = {r["actor"] for r in svc.db.q("SELECT actor FROM access_log")}
    # critic סבב 10: ביומן פסאודונים (user:<id>), לא המייל — היומן הוספה-בלבד ושורד מחיקת עסק
    dana = "user:%d" % svc.db.one("SELECT id FROM users WHERE email='dana@example.co.il'")["id"]
    assert dana in actors and "owner" not in actors and "dana@example.co.il" not in actors
    api.get("/dashboard", headers=AUTH)  # הטוקן המשותף נשאר ⇒ owner
    assert "owner" in {r["actor"] for r in svc.db.q("SELECT actor FROM access_log")}


def test_totp_code_is_single_use(env):
    svc, users, reg, api, clock = env
    assert _login(api, reg, clock).status_code == 200
    assert _login(api, reg, clock).status_code == 401  # אותו קוד, אותו counter


def test_lockout_after_5_failures_even_with_right_code(env):
    svc, users, reg, api, clock = env
    for _ in range(4):
        assert _login(api, reg, clock, pw="wrong-password-1").status_code == 401
    # הכשלון החמישי נועל את (החשבון, IP) ⇒ 429 עם Retry-After (מסך ההתחברות מציג «ננעל זמנית»)
    r5 = _login(api, reg, clock, pw="wrong-password-1")
    assert r5.status_code == 429 and int(r5.headers["Retry-After"]) > 0
    assert _login(api, reg, clock).status_code == 429  # נעול, גם עם הסיסמה והקוד הנכונים
    clock.now += timedelta(minutes=16)
    assert _login(api, reg, clock, shift=0).status_code == 200


def test_session_expiry_logout_and_deactivate(env):
    svc, users, reg, api, clock = env
    tok = _login(api, reg, clock).json()["token"]
    h = {"Authorization": f"Bearer {tok}"}
    assert api.get("/dashboard", headers=h).status_code == 200
    api.post("/auth/logout", headers=h)
    assert api.get("/dashboard", headers=h).status_code == 401
    clock.now += timedelta(minutes=1)
    tok2 = _login(api, reg, clock, shift=30).json()["token"]
    users.deactivate("dana@example.co.il")
    assert api.get("/dashboard", headers={"Authorization": f"Bearer {tok2}"}).status_code == 401
    clock.now += timedelta(hours=13)


def test_require_user_login_closes_shared_token(env, monkeypatch, gi_client):
    svc, users, reg, api, clock = env
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    strict = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert strict.get("/dashboard", headers=AUTH).status_code == 401
    tok = _login(strict, reg, clock).json()["token"]
    assert strict.get("/dashboard", headers={"Authorization": f"Bearer {tok}"}).status_code == 200


def test_secrets_not_stored_plain_password_and_weak_rejected(env):
    svc, users, reg, api, clock = env
    row = svc.db.one("SELECT pw_hash FROM users")
    assert PW not in row["pw_hash"] and row["pw_hash"].startswith("s1$")
    with pytest.raises(ValueError):
        users.create("x@y.co", "x", "short")
    with pytest.raises(ValueError):
        users.create("dana@example.co.il", "דנה", PW)


def test_mutating_actions_are_audited_under_the_employee(env):
    """שער 6: approve/reject/הגדרות/ייבוא/השהיה נרשמים ב-audit על שם העובד, לא «owner»."""
    svc, users, reg, api, clock = env
    tok = _login(api, reg, clock).json()["token"]
    h = {"Authorization": f"Bearer {tok}"}
    me = "user:%d" % svc.db.one("SELECT id FROM users WHERE email='dana@example.co.il'")["id"]
    svc.sync()
    svc.plan()
    pending = [r["id"] for r in svc.db.q("SELECT id FROM reminders WHERE status='pending_approval'")]
    assert len(pending) >= 2
    assert api.post(f"/reminders/{pending[0]}/approve", headers=h).status_code == 200
    assert api.post(f"/reminders/{pending[1]}/reject", headers=h).status_code == 200
    cid = svc.db.one("SELECT id FROM customers")["id"]
    assert api.post(f"/customers/{cid}/hold", headers=h,
                    json={"reason": "minor", "note": "x"}).status_code == 200
    assert api.put("/api/settings", headers=h, json={"business_name": "סטודיו"}).status_code in (200, 422)
    acts = {(r["actor"], r["action"]) for r in svc.db.q("SELECT actor,action FROM audit")}
    for a in ("approve", "reject", "customer_hold"):
        assert (me, a) in acts, a
        assert ("owner", a) not in acts, a
    # הטוקן המשותף ממשיך להירשם כ-owner
    other = svc.db.q("SELECT id FROM reminders WHERE status='pending_approval'")
    if other:
        api.post(f"/reminders/{other[0]['id']}/reject", headers=AUTH)
        assert ("owner", "reject") in {(r["actor"], r["action"]) for r in svc.db.q("SELECT actor,action FROM audit")}


def test_totp_secret_encrypted_at_rest_when_key_present(monkeypatch):
    """critic סבב 7: ההערה הבטיחה «מוצפן ב-SecretBox כשיש מפתח», אבל הסוד נשמר גלוי. דליפת DB
    הייתה נותנת לתוקף את הגורם השני של כל עובד. עכשיו: מוצפן, וההתחברות עדיין עובדת."""
    import base64
    import os as _os
    from datetime import datetime as _dt

    from app import totp as _totp
    from app.db import DB as _DB
    from app.policy import TZ as _TZ
    from app.users import Users as _Users
    monkeypatch.setenv("COLLECT_MASTER_KEYS", "k1:" + base64.b64encode(_os.urandom(32)).decode())
    now = _dt(2026, 11, 8, 10, tzinfo=_TZ)
    db = _DB(":memory:")
    u = _Users(db, lambda: now)
    sec = u.create("dana@biz.example", "דנה", "correct-horse-1")["totp_secret"]
    assert sec not in "\n".join(db.conn.iterdump())
    assert u.login("dana@biz.example", "correct-horse-1", _totp.code_at(sec, now.timestamp()))


def test_real_beta_refuses_user_without_encryption_key(monkeypatch):
    from datetime import datetime as _dt

    import pytest as _pytest

    from app.db import DB as _DB
    from app.policy import TZ as _TZ
    from app.users import Users as _Users
    monkeypatch.delenv("COLLECT_MASTER_KEYS", raising=False)
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    u = _Users(_DB(":memory:"), lambda: _dt(2026, 11, 8, 10, tzinfo=_TZ))
    with _pytest.raises(ValueError, match="מפתח"):
        u.create("x@biz.example", "x", "correct-horse-1")


def test_failed_login_audit_has_hash_not_email(svc):
    """critic סבב 7: 'email_sha' ביומן ההוספה-בלבד הכיל מייל מוסווה (אות ראשונה + דומיין)."""
    from fastapi.testclient import TestClient

    from app.main import create_app
    from tests.conftest import OWNER_TOKEN
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    c.post("/auth/login", json={"email": "someone@biz.example", "password": "x" * 10, "code": "000000"})
    d = svc.db.one("SELECT detail FROM audit WHERE action='login_failed'")["detail"]
    assert "@" not in d and "biz.example" not in d


def test_demo_user_never_created_on_a_real_service(tmp_path, monkeypatch, clock, gi_client):
    """critic סבב 8: DEMO=1 + DEMO_USER_* יצרו עובד עם סיסמה ידועה (וסוד TOTP בקובץ) גם על שירות
    אמיתי. דליפת סביבה לפרודקשן = דלת אחורית. והפעלה מחדש עם DB קבוע קרסה."""
    from app.config import load_settings
    from app.db import DB as _DB
    from app.main import create_app
    from app.service import CollectService
    from tests.conftest import OWNER_TOKEN
    monkeypatch.setenv("DEMO", "1")
    monkeypatch.setenv("DEMO_USER_EMAIL", "dana@example.co.il")
    monkeypatch.setenv("DEMO_USER_PASSWORD", "demo-pass-12345")
    s = load_settings({"PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/x"})
    dbp = str(tmp_path / "real.sqlite3")
    svc = CollectService(s, _DB(dbp), gi=gi_client, clock=clock)
    create_app(svc, owner_token=OWNER_TOKEN)
    create_app(CollectService(s, _DB(dbp), gi=gi_client, clock=clock), owner_token=OWNER_TOKEN)
    assert svc.db.one("SELECT COUNT(*) c FROM users")["c"] == 0


def test_attacker_cannot_lock_out_employee_from_another_ip(svc, clock):
    """critic סבב 16 (פתוח מסבב 7, שוחזר): 5 ניסיונות שגויים של תוקף מ-IP אחר נעלו את העובדת
    ל-15 דקות (DoS). עכשיו הנעילה לפי (חשבון, IP); נעילה גלובלית רק בסף גבוה (התקפה מבוזרת)."""
    from fastapi.testclient import TestClient

    from app import totp
    from app.main import create_app
    from app.users import Users
    from tests.conftest import OWNER_TOKEN
    app = create_app(svc, owner_token=OWNER_TOKEN)
    reg = Users(svc.db, svc.clock).create("dana@biz.example", "דנה", "correct-horse-1")
    attacker = TestClient(app, client=("203.0.113.9", 5555))
    dana = TestClient(app, client=("198.51.100.7", 5555))
    for _ in range(5):
        attacker.post("/auth/login", json={"email": "dana@biz.example", "password": "x" * 10, "code": "000000"})
    code = totp.code_at(reg["totp_secret"], clock.now.timestamp())
    r = dana.post("/auth/login", json={"email": "dana@biz.example", "password": "correct-horse-1", "code": code})
    assert r.status_code == 200, "התוקף נעל את העובדת מ-IP אחר"
    # מאותו IP של התוקף ⇒ עדיין נעול (ההגנה מפני ניחוש נשמרת)
    clock.now = clock.now.replace(second=(clock.now.second + 31) % 60)
    r2 = attacker.post("/auth/login", json={"email": "dana@biz.example", "password": "correct-horse-1",
                                            "code": totp.code_at(reg["totp_secret"], clock.now.timestamp() + 31)})
    assert r2.status_code in (401, 429)


def test_real_data_requires_per_employee_login(monkeypatch, tmp_path):
    """critic סבב 17 (פתוח מסבב 7, שוחזר): REAL_DATA_ALLOWED=1 (שער בטא 4) בלי REQUIRE_USER_LOGIN=1
    השאיר את הטוקן המשותף פעיל: גישה לנתוני חייבים אמיתיים בלי עובד מזוהה ובלי 2FA (שער 6).
    עכשיו: בנתיב הפריסה (create_app() בונה את השירות מהסביבה) השרת לא עולה בשילוב הזה."""
    import pytest as _pytest

    from app.config import SafetyError
    from app.main import create_app
    from tests.conftest import OWNER_TOKEN
    monkeypatch.delenv("DEMO", raising=False)
    monkeypatch.delenv("REQUIRE_USER_LOGIN", raising=False)
    monkeypatch.setenv("REAL_DATA_ALLOWED", "1")
    monkeypatch.setenv("DB_PATH", str(tmp_path / "real.sqlite3"))
    monkeypatch.setenv("PAYMENT_LINK", "https://www.greeninvoice.co.il/pay/x")
    with _pytest.raises(SafetyError, match="REQUIRE_USER_LOGIN"):
        create_app(owner_token=OWNER_TOKEN)
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    create_app(owner_token=OWNER_TOKEN)

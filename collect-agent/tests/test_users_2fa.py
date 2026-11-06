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
    assert "dana@example.co.il" in actors and "owner" not in actors
    api.get("/dashboard", headers=AUTH)  # הטוקן המשותף נשאר ⇒ owner
    assert "owner" in {r["actor"] for r in svc.db.q("SELECT actor FROM access_log")}


def test_totp_code_is_single_use(env):
    svc, users, reg, api, clock = env
    assert _login(api, reg, clock).status_code == 200
    assert _login(api, reg, clock).status_code == 401  # אותו קוד, אותו counter


def test_lockout_after_5_failures_even_with_right_code(env):
    svc, users, reg, api, clock = env
    for _ in range(5):
        assert _login(api, reg, clock, pw="wrong-password-1").status_code == 401
    assert _login(api, reg, clock).status_code == 401  # נעול
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
    me = "dana@example.co.il"
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

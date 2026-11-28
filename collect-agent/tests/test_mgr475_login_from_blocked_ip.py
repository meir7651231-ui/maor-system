"""מנהל 475 (חיבורים, דפוס 293ב): כניסה בסיסמה מכתובת שנחסמה ב-auth_fail.

לפני: מי שניחש טוקנים מאותה כתובת (NAT/CGNAT משותף — משרד, רשת סלולרית) נעל ל-5 דק׳ גם את /auth/login,
כי לבקשת כניסה אין טוקן ⇒ 429 גם לעובדת עם סיסמה+קוד TOTP נכונים. אחרי: דלי קטן נפרד (login_while_blocked)
מאפשר כמה ניסיונות כניסה; כשל עדיין 401 ונרשם; מעבר לתקרה ⇒ 429 כמו קודם. נתיבים אחרים בלי טוקן נשארים 429.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.ratelimit import DEFAULT_RULES
from app.users import Users
from tests.conftest import OWNER_TOKEN

BAD = {"Authorization": "Bearer wrong-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
PW = "correct-horse-battery"
EMAIL = "dana@example.co.il"


@pytest.fixture
def blocked(svc, clock):
    reg = Users(svc.db, svc.clock).create(EMAIL, "דנה לוי", PW)
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    for _ in range(DEFAULT_RULES["auth_fail"].limit + 1):   # ניחוש טוקנים מהכתובת המשותפת
        api.get("/dashboard", headers=BAD)
    assert api.get("/dashboard", headers=BAD).status_code == 429
    return api, reg, clock


def _login(api, reg, clock, pw=PW):
    code = totp.code_at(reg["totp_secret"], clock().timestamp())
    return api.post("/auth/login", json={"email": EMAIL, "password": pw, "code": code})


def test_correct_login_passes_from_blocked_ip(blocked):
    api, reg, clock = blocked
    r = _login(api, reg, clock)
    assert r.status_code == 200, r.text
    tok = r.json()["token"]
    assert api.get("/auth/me", headers={"Authorization": f"Bearer {tok}"}).status_code == 200


def test_wrong_password_from_blocked_ip_is_401_not_token(blocked):
    api, reg, clock = blocked
    r = _login(api, reg, clock, pw="wrong-password-123")
    assert r.status_code == 401 and "token" not in r.text


def test_login_attempts_from_blocked_ip_are_capped(blocked):
    api, reg, clock = blocked
    cap = DEFAULT_RULES["login_while_blocked"].limit
    emails = [f"spray{i}@example.co.il" for i in range(cap + 3)]   # ריסוס על מיילים שונים (עוקף נעילת מייל+IP)
    codes = [api.post("/auth/login", json={"email": e, "password": "x" * 12, "code": "000000"}).status_code
             for e in emails]
    assert codes[:cap] == [401] * cap
    assert set(codes[cap:]) == {429}
    assert _login(api, reg, clock).status_code == 429   # גם נכון — אחרי התקרה, כמו לפני


def test_other_tokenless_paths_still_blocked(blocked):
    api, _, _ = blocked
    assert api.get("/dashboard").status_code == 429
    assert api.post("/auth/logout").status_code == 429
    assert api.get("/auth/login").status_code in (405, 429)


def test_unblocked_ip_does_not_consume_login_bucket(svc, clock):
    Users(svc.db, svc.clock).create(EMAIL, "דנה לוי", PW)
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    for _ in range(DEFAULT_RULES["login_while_blocked"].limit + 2):
        api.post("/auth/login", json={"email": EMAIL, "password": "bad-password-1", "code": "000000"})
    assert api.app.state.limiter.blocked("login_while_blocked", "testclient") is None

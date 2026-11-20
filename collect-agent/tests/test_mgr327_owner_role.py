"""מנהל 327 · critic 179: תפקיד בעלים לעובד מחובר. בבטא (REQUIRE_USER_LOGIN=1) הטוקן המשותף סגור, ולכן שחרור עצירת
השחזור נבדק לפי `users.role='owner'` ולא לפי המחרוזת "owner". עובד רגיל ⇒ 403; DB ישן בלי עמודה ⇒ הוותיק הפעיל בעלים."""

import pytest
from fastapi.testclient import TestClient

from app import restore_guard, totp
from app.main import create_app
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"
NOTE = {"note": "עברתי על ההסרות מאז הגיבוי"}


def _hold(svc):
    restore_guard.mark_restored(svc.db.conn, at="2026-11-08T10:00:00+02:00", source="b.gbk", ledger_rows=0, applied=0)


def _login(api, reg, clock, email):
    code = totp.code_at(reg["totp_secret"], clock().timestamp())
    return {"Authorization": "Bearer " + api.post("/auth/login", json={
        "email": email, "password": PW, "code": code}).json()["token"]}


def test_first_user_is_owner_rest_staff(svc):
    u = Users(svc.db, svc.clock)
    assert u.create("a@biz.example", "בעלים", PW)["role"] == "owner"
    assert u.create("b@biz.example", "עובדת", PW)["role"] == "staff"
    assert u.create("c@biz.example", "שותף", PW, role="owner")["role"] == "owner"
    with pytest.raises(ValueError):
        u.create("d@biz.example", "x", PW, role="admin")


def test_staff_gets_403_owner_200_with_login(svc, clock, monkeypatch):
    u = Users(svc.db, svc.clock)
    own = u.create("owner@biz.example", "בעל העסק", PW)
    stf = u.create("staff@biz.example", "עובדת", PW)
    _hold(svc)
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    hs = _login(api, stf, clock, "staff@biz.example")
    assert api.get("/auth/me", headers=hs).json()["owner"] is False
    r = api.post("/owner/restore-hold/release", json=NOTE, headers=hs)
    assert r.status_code == 403 and svc.restore_hold() is not None
    ho = _login(api, own, clock, "owner@biz.example")
    assert api.get("/auth/me", headers=ho).json()["owner"] is True
    assert api.post("/owner/restore-hold/release", json=NOTE, headers=ho).status_code == 200
    assert svc.restore_hold() is None


def test_promoted_staff_can_release_demoted_cannot(svc, clock, monkeypatch):
    u = Users(svc.db, svc.clock)
    u.create("owner@biz.example", "בעל העסק", PW)
    stf = u.create("staff@biz.example", "עובדת", PW)
    u.set_role("staff@biz.example", "owner")
    _hold(svc)
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    hs = _login(api, stf, clock, "staff@biz.example")
    u.set_role("staff@biz.example", "staff")      # הורדה תופסת מיד גם לסשן פתוח
    assert api.post("/owner/restore-hold/release", json=NOTE, headers=hs).status_code == 403


def test_last_active_owner_cannot_be_demoted(svc):
    u = Users(svc.db, svc.clock)
    u.create("owner@biz.example", "בעל העסק", PW)
    with pytest.raises(ValueError):
        u.set_role("owner@biz.example", "staff")
    with pytest.raises(KeyError):
        u.set_role("nobody@biz.example", "owner")


def test_legacy_db_without_role_column_promotes_oldest_active(svc):
    u = Users(svc.db, svc.clock)
    u.create("old@biz.example", "ותיק", PW)
    u.create("new@biz.example", "חדש", PW)
    c = svc.db.conn
    # מדמה DB מלפני 179: בלי העמודה role
    c.executescript("""CREATE TABLE u2 AS SELECT id,email,name,pw_hash,totp_secret,totp_last,active,fails,
        locked_until,created_at FROM users; DROP TABLE users; ALTER TABLE u2 RENAME TO users;""")
    c.execute("UPDATE users SET active=0 WHERE email='old@biz.example'")
    c.commit()
    Users(svc.db, svc.clock)
    roles = {r["email"]: r["role"] for r in svc.db.conn.execute("SELECT email, role FROM users")}
    assert roles == {"old@biz.example": "staff", "new@biz.example": "owner"}


def test_shared_token_me_reports_owner(svc, monkeypatch):
    monkeypatch.delenv("REQUIRE_USER_LOGIN", raising=False)
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    me = api.get("/auth/me", headers={"Authorization": f"Bearer {OWNER_TOKEN}"}).json()
    assert me["kind"] == "owner" and me["owner"] is True


def test_source_guard_release_checks_role_not_string():
    src = open("app/main.py", encoding="utf-8").read()
    assert 'if request.state.actor != "owner":\n            raise HTTPException(403' not in src
    assert "if not request.state.is_owner:" in src

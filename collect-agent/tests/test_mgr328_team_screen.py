"""מנהל 328 (פתוח מ-327): «צוות ותפקידים» — ניהול תפקידים והשבתת עובדים מהמסך, לא רק מ-CLI.
GET /team · POST /team/{id}/role · POST /team/{id}/deactivate — בעל העסק בלבד (403 לעובד), audit בפסאודונים,
והתראת settings_changed לבעל העסק שמי ששינה לא סוגר בעצמו. לא מורידים/משביתים את הבעלים הפעיל האחרון."""

import pytest
from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"


def _login(api, reg, clock, email):
    code = totp.code_at(reg["totp_secret"], clock().timestamp())
    return {"Authorization": "Bearer " + api.post("/auth/login", json={
        "email": email, "password": PW, "code": code}).json()["token"]}


@pytest.fixture
def team(svc, clock, monkeypatch):
    u = Users(svc.db, svc.clock)
    own = u.create("owner@biz.example", "בעל העסק", PW)
    stf = u.create("staff@biz.example", "דנה", PW)
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    ho = _login(api, own, clock, "owner@biz.example")
    hs = _login(api, stf, clock, "staff@biz.example")
    ids = {r["email"]: r["id"] for r in u.listing()}
    return api, ho, hs, ids, u


def _notices(svc):
    return svc.db.conn.execute("SELECT id, body, message_id FROM messages WHERE intent='settings_changed' "
                               "AND needs_owner=1 ORDER BY id").fetchall()


def test_listing_owner_only_no_secrets(team):
    api, ho, hs, ids, _ = team
    assert api.get("/team", headers=hs).status_code == 403
    r = api.get("/team", headers=ho).json()
    assert r["me"] == ids["owner@biz.example"]
    rows = [(x["name"], x["role"], x["active"]) for x in r["users"]]
    assert rows == [("בעל העסק", "owner", True), ("דנה", "staff", True)]
    for x in r["users"]:
        assert set(x) == {"id", "name", "email", "role", "active", "created_at"}   # בלי pw_hash/totp/נעילות


def test_staff_cannot_change_roles_or_deactivate(team):
    api, ho, hs, ids, u = team
    assert api.post(f"/team/{ids['staff@biz.example']}/role", json={"role": "owner"}, headers=hs).status_code == 403
    assert api.post(f"/team/{ids['owner@biz.example']}/deactivate", headers=hs).status_code == 403
    assert {x["email"]: x["role"] for x in u.listing()}["staff@biz.example"] == "staff"


def test_promote_takes_effect_now_with_audit_and_notice(team, svc):
    api, ho, hs, ids, _ = team
    sid = ids["staff@biz.example"]
    r = api.post(f"/team/{sid}/role", json={"role": "owner"}, headers=ho)
    assert r.status_code == 200 and {x["id"]: x["role"] for x in r.json()["users"]}[sid] == "owner"
    assert api.get("/auth/me", headers=hs).json()["owner"] is True        # הסשן הפתוח של דנה — מיד
    a = svc.db.one("SELECT actor, detail FROM audit WHERE action='team_role_changed'")
    assert a["actor"] == f"user:{ids['owner@biz.example']}" and "@" not in (a["detail"] or "")
    n = _notices(svc)
    assert len(n) == 1 and "דנה" in n[0]["body"] and "«עובד» ⇒ «בעל העסק»" in n[0]["body"]
    assert n[0]["message_id"] == f"settings_changed:user:{ids['owner@biz.example']}"


def test_same_role_is_noop(team, svc):
    api, ho, _, ids, _ = team
    assert api.post(f"/team/{ids['staff@biz.example']}/role", json={"role": "staff"}, headers=ho).status_code == 200
    assert _notices(svc) == [] and svc.db.one("SELECT 1 FROM audit WHERE action='team_role_changed'") is None


def test_last_owner_protected_role_and_deactivate(team):
    api, ho, _, ids, _ = team
    oid = ids["owner@biz.example"]
    r = api.post(f"/team/{oid}/role", json={"role": "staff"}, headers=ho)
    assert r.status_code == 422 and "היחיד" in r.json()["detail"]


def test_cannot_deactivate_self(team):
    api, ho, hs, ids, _ = team
    api.post(f"/team/{ids['staff@biz.example']}/role", json={"role": "owner"}, headers=ho)
    r = api.post(f"/team/{ids['owner@biz.example']}/deactivate", headers=ho)
    assert r.status_code == 422 and "עצמכם" in r.json()["detail"]


def test_deactivate_kills_session_and_notifies(team, svc):
    api, ho, hs, ids, u = team
    r = api.post(f"/team/{ids['staff@biz.example']}/deactivate", headers=ho)
    assert r.status_code == 200
    assert {x["email"]: x["active"] for x in r.json()["users"]}["staff@biz.example"] is False
    assert api.get("/auth/me", headers=hs).status_code == 401
    assert len(_notices(svc)) == 1 and "דנה" in _notices(svc)[0]["body"]
    # השבתה כפולה ⇒ לא עוד התראה; קידום של מושבת ⇒ 422
    api.post(f"/team/{ids['staff@biz.example']}/deactivate", headers=ho)
    assert len(_notices(svc)) == 1
    r = api.post(f"/team/{ids['staff@biz.example']}/role", json={"role": "owner"}, headers=ho)
    assert r.status_code == 422 and "מושבת" in r.json()["detail"]


def test_changer_cannot_dismiss_own_notice(team, svc):
    api, ho, hs, ids, _ = team
    api.post(f"/team/{ids['staff@biz.example']}/role", json={"role": "owner"}, headers=ho)
    mid = _notices(svc)[0]["id"]
    assert api.post(f"/owner/inbox/{mid}/done", headers=ho).status_code in (409, 422)
    assert api.post(f"/owner/inbox/{mid}/done", headers=hs).status_code == 200


def test_bad_input(team):
    api, ho, _, ids, _ = team
    assert api.post(f"/team/{ids['staff@biz.example']}/role", json={"role": "admin"}, headers=ho).status_code == 422
    assert api.post("/team/9999/role", json={"role": "owner"}, headers=ho).status_code == 404
    assert api.post("/team/9999/deactivate", headers=ho).status_code == 404


def test_shared_token_sees_team_without_login(svc, monkeypatch):
    monkeypatch.delenv("REQUIRE_USER_LOGIN", raising=False)
    Users(svc.db, svc.clock).create("owner@biz.example", "בעל העסק", PW)
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    r = api.get("/team", headers={"Authorization": f"Bearer {OWNER_TOKEN}"})
    assert r.status_code == 200 and r.json()["me"] is None and len(r.json()["users"]) == 1
    # טוקן משותף אינו «עצמכם» — השומר שתופס הוא «בעלים פעיל אחרון»
    oid = r.json()["users"][0]["id"]
    r = api.post(f"/team/{oid}/deactivate", headers={"Authorization": f"Bearer {OWNER_TOKEN}"})
    assert r.status_code == 422 and "היחיד" in r.json()["detail"]


# ---------- critic סבב 180: השבתת הבעלים ⇒ קידום שקט של עובד בעלייה הבאה ----------
def test_cli_deactivate_last_owner_refused_and_no_bootstrap_on_restart(svc):
    u = Users(svc.db, svc.clock)
    u.create("owner@biz.example", "בעל העסק", PW)
    u.create("staff@biz.example", "דנה", PW)
    with pytest.raises(ValueError):
        u.deactivate("owner@biz.example")
    # גם אם הגיעו למצב בלי בעלים פעיל (DB ישן/עריכה ידנית) — עלייה רגילה לא מקדמת אף אחד בשקט
    svc.db.x("UPDATE users SET active=0 WHERE email='owner@biz.example'")
    Users(svc.db, svc.clock)
    assert svc.db.one("SELECT role FROM users WHERE email='staff@biz.example'")["role"] == "staff"
    assert svc.db.one("SELECT 1 FROM audit WHERE action='owner_bootstrap'") is None


def test_cli_role_change_and_bootstrap_are_audited(svc):
    u = Users(svc.db, svc.clock)
    u.create("owner@biz.example", "בעל העסק", PW)
    u.create("staff@biz.example", "דנה", PW)
    u.set_role("staff@biz.example", "owner")
    a = svc.db.one("SELECT actor, detail FROM audit WHERE action='team_role_changed'")
    assert a["actor"] == "cli" and "@" not in a["detail"] and '"to": "owner"' in a["detail"]
    u.deactivate("staff@biz.example")
    assert svc.db.one("SELECT actor FROM audit WHERE action='team_deactivated'")["actor"] == "cli"
    # מיגרציה מ-DB ישן (בלי העמודה) ⇒ הבוטסטרפ מתועד
    c = svc.db.conn
    c.executescript("""CREATE TABLE u2 AS SELECT id,email,name,pw_hash,totp_secret,totp_last,active,fails,
        locked_until,created_at FROM users; DROP TABLE users; ALTER TABLE u2 RENAME TO users;""")
    c.commit()
    Users(svc.db, svc.clock)
    assert svc.db.one("SELECT actor FROM audit WHERE action='owner_bootstrap'")["actor"] == "system"

"""מנהל 329 (פתוח מ-328): הפעלה-מחדש של עובד מושבת מהמסך — עד היום רק CLI/SQL.
POST /team/{id}/reactivate — בעל העסק בלבד, חוזר **כעובד** (גם בעלים לשעבר), audit בפסאודונים, התראה
שהמפעיל לא סוגר בעצמו; כפול = no-op; כניסה עובדת שוב עם אותה סיסמה+TOTP."""

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"


def _login(api, reg, clock, email):
    code = totp.code_at(reg["totp_secret"], clock().timestamp())
    return api.post("/auth/login", json={"email": email, "password": PW, "code": code})


@pytest.fixture
def team(svc, clock, monkeypatch):
    u = Users(svc.db, svc.clock)
    own = u.create("owner@biz.example", "בעל העסק", PW)
    stf = u.create("staff@biz.example", "דנה", PW)
    u.create("other@biz.example", "יוסי", PW)
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    ho = {"Authorization": "Bearer " + _login(api, own, clock, "owner@biz.example").json()["token"]}
    hs = {"Authorization": "Bearer " + _login(api, stf, clock, "staff@biz.example").json()["token"]}
    ids = {r["email"]: r["id"] for r in u.listing()}
    return api, ho, hs, ids, u, (stf, u)


def _notices(svc, needle):
    return [r for r in svc.db.conn.execute(
        "SELECT id, body, message_id FROM messages WHERE intent='settings_changed' AND needs_owner=1")
        if needle in r["body"]]



def test_staff_gets_403(team):
    api, ho, hs, ids, u, _ = team
    yid = ids["other@biz.example"]
    api.post(f"/team/{yid}/deactivate", headers=ho)
    assert api.post(f"/team/{yid}/reactivate", headers=hs).status_code == 403     # דנה עובדת, לא בעלים
    sid = ids["staff@biz.example"]
    api.post(f"/team/{sid}/deactivate", headers=ho)
    assert {x["id"]: x["active"] for x in u.listing()}[sid] is False


def test_reactivate_restores_login_audit_and_notice(team, svc, clock):
    api, ho, _, ids, u, (stf, _u) = team
    sid, oid = ids["staff@biz.example"], ids["owner@biz.example"]
    api.post(f"/team/{sid}/deactivate", headers=ho)
    clock.now += timedelta(seconds=30)
    assert _login(api, stf, clock, "staff@biz.example").status_code != 200
    r = api.post(f"/team/{sid}/reactivate", headers=ho)
    assert r.status_code == 200
    row = {x["id"]: x for x in r.json()["users"]}[sid]
    assert row["active"] is True and row["role"] == "staff"
    clock.now += timedelta(seconds=60)                                     # קוד TOTP חדש (לא שימוש-חוזר)
    assert _login(api, stf, clock, "staff@biz.example").status_code == 200   # אותה סיסמה+TOTP
    a = svc.db.one("SELECT actor, detail FROM audit WHERE action='team_reactivated'")
    assert a["actor"] == f"user:{oid}" and "@" not in a["detail"]
    n = _notices(svc, "הופעל מחדש")
    assert len(n) == 1 and "דנה" in n[0]["body"]
    assert n[0]["message_id"] == f"settings_changed:user:{oid}"   # המפעיל לא סוגר בעצמו


def test_former_owner_returns_as_staff(team, svc):
    api, ho, _, ids, u, _ = team
    sid, oid = ids["staff@biz.example"], ids["owner@biz.example"]
    api.post(f"/team/{sid}/role", json={"role": "owner"}, headers=ho)        # שני בעלים
    api.post(f"/team/{sid}/deactivate", headers=ho)
    r = api.post(f"/team/{sid}/reactivate", headers=ho).json()
    row = {x["id"]: x for x in r["users"]}[sid]
    assert row["role"] == "staff" and row["active"] is True                  # לא חוזר לבעלים בשקט
    owners = [x for x in r["users"] if x["role"] == "owner" and x["active"]]
    assert [x["id"] for x in owners] == [oid]


def test_active_is_noop_and_404(team, svc):
    api, ho, _, ids, _, _ = team
    sid = ids["staff@biz.example"]
    assert api.post(f"/team/{sid}/reactivate", headers=ho).status_code == 200
    assert _notices(svc, "הופעל מחדש") == []
    assert svc.db.one("SELECT 1 FROM audit WHERE action='team_reactivated'") is None
    assert api.post("/team/9999/reactivate", headers=ho).status_code == 404


def test_cli_reactivate_audited(svc):
    u = Users(svc.db, svc.clock)
    u.create("a@biz.example", "א", PW)
    u.create("b@biz.example", "ב", PW)
    bid = {r["email"]: r["id"] for r in u.listing()}["b@biz.example"]
    u.deactivate("b@biz.example")
    assert u.reactivate_id(bid) == {"name": "ב", "was_active": False}
    assert svc.db.one("SELECT actor FROM audit WHERE action='team_reactivated'")["actor"] == "cli"

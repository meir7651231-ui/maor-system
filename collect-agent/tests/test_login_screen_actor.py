"""שער 6 (legal/BETA-GATE.md): מסך התחברות ב-web + השחקן האמיתי בפעולות הכותבות.

מה שהממשק צריך מהשרת: /health.login_required (להסתיר «קוד גישה משותף» בבטא אמיתית), /auth/me
(שם העובד המחובר), 429 בנעילה (בלי לגלות קיום חשבון), ו-audit על שם העובד גם בטיוטות התשובה."""
from __future__ import annotations

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
DANA_PHONE = "050-1234567"


@pytest.fixture
def env(gi_client, clock):
    s = load_settings({"SMS_SENDER_ID": "StudioMeir", "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/s"})
    svc = CollectService(s, DB(":memory:"), gi=gi_client, clock=clock)
    users = Users(svc.db, svc.clock)
    reg = users.create("dana@example.co.il", "דנה לוי", PW)
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    code = totp.code_at(reg["totp_secret"], clock().timestamp())
    tok = api.post("/auth/login", json={"email": "dana@example.co.il", "password": PW,
                                        "code": code}).json()["token"]
    me = "user:%d" % svc.db.one("SELECT id FROM users")["id"]
    return svc, api, {"Authorization": f"Bearer {tok}"}, me


def _acts(svc):
    return {(r["actor"], r["action"]) for r in svc.db.q("SELECT actor, action FROM audit")}


def test_draft_approve_and_reject_audited_under_employee(env):
    """לפני התיקון: /conversation/drafts/{id}/approve|reject לא העבירו את השחקן ⇒ «owner» ביומן
    וב-drafts.decided_by, גם כשעובדת מזוהה אישרה תשובה ללקוח."""
    svc, api, h, me = env
    svc.sync()
    d1 = api.post("/conversation/inbound", headers=AUTH,
                  json={"channel": "sms", "sender": DANA_PHONE, "text": "מי זה?"}).json()["draft_id"]
    assert api.post(f"/conversation/drafts/{d1}/reject", headers=h).status_code == 200
    d2 = api.post("/conversation/inbound", headers=AUTH,
                  json={"channel": "sms", "sender": DANA_PHONE,
                        "text": "אפשר בתשלומים?"}).json()["draft_id"]
    assert api.post(f"/conversation/drafts/{d2}/approve", headers=h).status_code == 200
    acts = _acts(svc)
    assert (me, "draft_rejected") in acts and (me, "draft_approved") in acts
    assert ("owner", "draft_rejected") not in acts and ("owner", "draft_approved") not in acts
    rows = svc.db.q("SELECT decided_by FROM drafts WHERE id IN (?,?)", (d1, d2))
    assert {r["decided_by"] for r in rows} == {me}


def test_settings_audited_under_employee(env):
    svc, api, h, me = env
    r = api.put("/api/settings", headers=h, json={"business_name": "סטודיו דנה"})
    assert r.status_code == 200, r.text
    assert (me, "settings_updated") in _acts(svc)
    assert ("owner", "settings_updated") not in _acts(svc)


def test_shared_token_still_audited_as_owner(env):
    """המצב הישן (REQUIRE_USER_LOGIN כבוי, דמו/מוק) ממשיך לעבוד: הטוקן המשותף = owner."""
    svc, api, h, me = env
    assert api.put("/api/settings", headers=AUTH, json={"business_name": "סטודיו"}).status_code == 200
    assert ("owner", "settings_updated") in _acts(svc)


def test_auth_me_and_logout_audited(env):
    svc, api, h, me = env
    assert api.get("/auth/me").status_code == 401
    assert api.get("/auth/me", headers=h).json() == {"actor": me, "kind": "user", "name": "דנה לוי"}
    assert api.get("/auth/me", headers=AUTH).json()["kind"] == "owner"
    # /auth/me לא רושם צפייה במידע אישי (אין בו מידע על חייבים)
    assert not svc.db.q("SELECT 1 FROM access_log WHERE route='/auth/me'")
    api.post("/auth/logout", headers=h)
    assert (me, "logout") in _acts(svc)
    assert api.get("/auth/me", headers=h).status_code == 401


def test_health_says_whether_login_is_required(env, monkeypatch):
    svc, api, h, me = env
    assert api.get("/health").json()["login_required"] is False
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    strict = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert strict.get("/health").json()["login_required"] is True


def test_lockout_429_does_not_reveal_whether_account_exists(env):
    """מסך ההתחברות מציג «ננעל זמנית» (429). אם רק חשבון קיים היה ננעל, 5 ניסיונות היו מגלים מי
    עובד בעסק. לכן גם מייל שאינו קיים ננעל אחרי 5, ובטבלת הנעילות אין את המייל עצמו."""
    svc, api, h, me = env

    def burst(email):
        return [api.post("/auth/login", json={"email": email, "password": "x" * 12,
                                              "code": "000000"}).status_code for _ in range(6)]

    real, ghost = burst("dana@example.co.il"), burst("ghost@example.co.il")
    assert real == ghost == [401, 401, 401, 401, 429, 429]
    locks = "\n".join(str(tuple(r)) for r in svc.db.q("SELECT * FROM login_locks"))
    assert locks and "ghost@example.co.il" not in locks and "dana@example.co.il" not in locks
    assert "ghost@example.co.il" not in "\n".join(svc.db.conn.iterdump())

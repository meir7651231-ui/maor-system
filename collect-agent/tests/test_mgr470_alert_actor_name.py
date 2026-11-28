"""מנהל 470 (מבקר 291🟡): כל התראות האבטחה לבעל העסק נוקבות בשם המבצע, לא ב-user:N.

התיקון ב-`CollectService.alert_actor_he`: user:N ⇒ שם העובד/ת · הטוקן המשותף ⇒ «בעל העסק» · אחר ⇒ כפי שהוא.
ה-message_id (חסימת «טופל» עצמי, הפעלה 199) וה-audit ממשיכים לשמור את הפסאודונים.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.secretbox import generate_key
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"


def _login(api, email, secret, clock):
    return api.post("/auth/login", json={"email": email, "password": PW,
                                         "code": totp.code_at(secret, clock().timestamp())}).json()["token"]


def _team(svc, clock, monkeypatch):
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k1:{generate_key()}")
    u = Users(svc.db, svc.clock)
    own = u.create("owner@s.example", "שרה הבעלים", PW)
    u.create("dana@s.example", "דנה", PW)
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    tok = _login(api, "owner@s.example", own["totp_secret"], clock)
    dana = svc.db.one("SELECT id FROM users WHERE email='dana@s.example'")["id"]
    return api, {"Authorization": f"Bearer {tok}"}, dana


def _cards(svc):
    return list(svc.db.q("SELECT body, message_id FROM messages WHERE intent='settings_changed' ORDER BY id"))


def test_role_deactivate_reactivate_cards_name_the_actor(svc, clock, monkeypatch):
    api, h, dana = _team(svc, clock, monkeypatch)
    assert api.post(f"/team/{dana}/deactivate", headers=h).status_code == 200
    assert api.post(f"/team/{dana}/reactivate", headers=h).status_code == 200
    cards = _cards(svc)
    assert len(cards) == 2
    for c in cards:
        assert "על ידי שרה הבעלים" in c["body"] and "user:" not in c["body"]
        assert c["message_id"].startswith("settings_changed:user:")   # הפסאודונים נשמר למנגנון החסימה


def test_alert_actor_he_mapping(svc):
    Users(svc.db, svc.clock).create("x@s.example", "יוסי", PW)
    uid = svc.db.one("SELECT id FROM users WHERE email='x@s.example'")["id"]
    assert svc.alert_actor_he(f"user:{uid}") == "יוסי"
    assert svc.alert_actor_he("owner") == "בעל העסק"
    assert svc.alert_actor_he("user:9999") == "עובד/ת"
    assert svc.alert_actor_he("עובד/ת (דמו)") == "עובד/ת (דמו)"


def test_shared_token_settings_card_says_owner(svc):
    svc.update_settings({"payment_link": "https://www.greeninvoice.co.il/pay/zzz"}, "owner")
    body = svc.db.one("SELECT body FROM messages WHERE intent='settings_changed' ORDER BY id DESC")["body"]
    assert "על ידי בעל העסק" in body

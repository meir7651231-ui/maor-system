"""מנהל 472 (מבקר 293א/ב): הגבלת הקצב מבחינה בין ניחוש לבין מי שמחזיק מפתח/טוקן תקין.

א. webhook עם מפתח תקין ⇒ דלי נפרד (webhook_auth), לא חולק עם ניסיונות ללא מפתח — «הסר» מ-019 לא נחסם
   אחרי פרץ דיווחי מסירה. ניסיונות במפתח שגוי עדיין נחסמים אחרי 120.
ב. כתובת חסומה בגלל כשלי אימות ⇒ טוקן שגוי ממשיך לקבל 429 (בלי להגיע לאימות), טוקן תקין עובר.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app
from app.ratelimit import DEFAULT_RULES
from tests.conftest import AUTH, OWNER_TOKEN

BAD = {"Authorization": "Bearer wrong-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"}


def test_wrong_key_webhook_still_throttled(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    codes = [api.post("/webhooks/sms/019?k=nope&type=dlr", data={"status": "1"}).status_code
             for _ in range(DEFAULT_RULES["webhook"].limit + 1)]
    assert codes[0] == 403 and codes[-1] == 429


def test_wrong_key_burst_does_not_block_provider(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    for _ in range(DEFAULT_RULES["webhook"].limit + 5):
        api.post("/webhooks/sms/019?k=nope&type=dlr", data={"status": "1"})
    r = api.post("/webhooks/sms/019?k=whk-test&type=dlr", data={"status": "1", "messageId": "m1"})
    assert r.status_code == 200


def test_authenticated_webhook_has_its_own_ceiling():
    assert DEFAULT_RULES["webhook_auth"].limit > 10 * DEFAULT_RULES["webhook"].limit


def test_blocked_ip_guess_still_429_valid_token_passes(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    for _ in range(DEFAULT_RULES["auth_fail"].limit + 1):
        api.get("/dashboard", headers=BAD)
    assert api.get("/dashboard", headers=BAD).status_code == 429
    assert api.get("/dashboard").status_code == 429          # בלי טוקן = כמו ניחוש
    assert api.get("/dashboard", headers=AUTH).status_code == 200

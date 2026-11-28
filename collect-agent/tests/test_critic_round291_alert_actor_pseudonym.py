"""מבקר סבב 291 (🟡, גבי מנוע): התראות אבטחה לבעל העסק אומרות «על ידי user:2» — לא מי.

✓ אימות 290 (מנהל 468): מייל דחוף על «הסר» סופר את הכרטיס שלו. ℹ️ «מספר שגוי» לא שולח מייל דחוף (escalate=normal, לא
   צד מגן דחוף — הלקוח הוסר מיד) — נראה מכוון.
✓ מיילים לבעל העסק (רק שניים: «שינוי בהגדרות רגישות» ו«פנייה דחופה») — בלי טלפון/סכום/שם לקוח.
[מאומת] עובדת «רחל» (בעלת הרשאה, REQUIRE_USER_LOGIN+TOTP) משנה את קישור התשלום ⇒ גם המייל לבעל העסק («שונו הגדרות רגישות
על ידי user:2») וגם הכרטיס ב«דורש טיפול» («הגדרות רגישות שונו על ידי user:2… אם לא אתם שיניתם — בדקו מיד») מציגים את
הפסאודונים. כל המטרה של ההתראה היא «מי שינה?» — בעל העסק לא יודע מי זה user:2. אותו דבר ב-4 התראות נוספות
(`app/main.py`): ניתוק אורביט, שינוי תפקיד, השבתה, הפעלה מחדש («… על ידי {actor}: {r['name']}» — היעד בשם, המבצע לא).
`actor_label_he` (מנהל 454) כבר ממיר user:N ⇒ שם.
רכיב: app/service.py → _notify_sensitive_settings / _email_owner_settings_changed ·
app/main.py → notify_owner_sensitive.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.secretbox import generate_key
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"


def _rachel_changes_payment_link(svc, clock, monkeypatch):
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k1:{generate_key()}")
    u = Users(svc.db, svc.clock)
    u.create("owner@s.example", "בעלים", PW)
    reg = u.create("rachel@s.example", "רחל", PW)
    u.set_role_id(svc.db.one("SELECT id FROM users WHERE email='rachel@s.example'")["id"], "owner", actor="owner")
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    tok = api.post("/auth/login", json={"email": "rachel@s.example", "password": PW,
                                        "code": totp.code_at(reg["totp_secret"], clock().timestamp())}).json()["token"]
    r = api.put("/api/settings", json={"payment_link": "https://www.greeninvoice.co.il/pay/other"},
                headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200
    mail = [m for m in svc.sender.sent if m["channel"] == "email"][-1]["body"]
    card = svc.db.one("SELECT body FROM messages WHERE intent='settings_changed' ORDER BY id DESC")["body"]
    return mail, card


def test_alert_sent_with_change_control(svc, clock, monkeypatch):
    mail, card = _rachel_changes_payment_link(svc, clock, monkeypatch)
    assert "pay/other" in mail and "pay/other" in card


def test_alert_names_who_changed(svc, clock, monkeypatch):
    mail, card = _rachel_changes_payment_link(svc, clock, monkeypatch)
    assert "רחל" in mail and "רחל" in card
    assert "user:" not in mail and "user:" not in card

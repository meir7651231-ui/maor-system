"""critic סבב 190 · 🔴 לתיקון בונה — רכיב: `app/main.py` → `customer_legal_hold` (POST /customers/{cid}/legal-hold,
`dependencies=auth` בלבד — בלי בדיקת `is_owner`) + `app/service.py` → `set_legal_hold` (ביטול נרשם רק ב-audit).

legal hold = פטור ממחיקה לפי ר-10 (תביעה תלויה / בקשת עו״ד / חובה חוקית). **[מאומת עם REQUIRE_USER_LOGIN=1 + TOTP]**
עובד/ת (staff) שולח/ת `{"note": null}` ⇒ **200**, ה-hold מבוטל, **בלי שום כרטיס לבעל העסק**; 91 יום אחרי שהחשבונית
נסגרה ה-purge האוטומטי שרץ בכל `plan()` מתמם את הלקוח (name=None, purged_at) — מחיקת ראיות של תיק משפטי ע״י עובד,
בשקט. (בניגוד לשחרור עצירת שחזור / ניהול צוות — בעלים בלבד.) הצעה: **ביטול** legal hold = בעלים בלבד (403 לעובד),
ו/או כרטיס לבעל העסק שהמבטל לא יכול לסגור (כמו settings_changed). xfail(strict=True); הבקרה (בעלים מבטל ⇒ 200) ירוקה."""
import pytest
from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"


def _api(svc, clock, monkeypatch):
    u = Users(svc.db, svc.clock)
    regs = {"owner": u.create("owner@s.example", "בעלים", PW), "staff": u.create("staff@s.example", "עובד", PW)}
    svc.sync()
    svc.set_legal_hold(1, "תביעה תלויה — לא למחוק", actor="owner")
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))

    def hdr(who):
        tok = api.post("/auth/login", json={"email": f"{who}@s.example", "password": PW,
                                            "code": totp.code_at(regs[who]["totp_secret"], clock().timestamp())})
        return {"Authorization": f"Bearer {tok.json()['token']}"}
    return api, hdr


@pytest.mark.xfail(strict=True, reason="critic 190: עובד/ת מבטל/ת legal hold בשקט ⇒ purge מוחק תיק משפטי (לתיקון בונה)")
def test_staff_cannot_silently_lift_legal_hold(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    r = api.post("/customers/1/legal-hold", json={"note": None}, headers=hdr("staff"))
    lifted = svc.db.one("SELECT legal_hold FROM customers WHERE id=1")["legal_hold"] is None
    owner_told = svc.db.one("SELECT 1 FROM messages WHERE needs_owner=1 AND customer_id=1") is not None
    assert r.status_code == 403 or not lifted or owner_told, (r.status_code, lifted, owner_told)


def test_control_owner_can_lift_legal_hold(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    r = api.post("/customers/1/legal-hold", json={"note": None}, headers=hdr("owner"))
    assert r.status_code == 200 and svc.db.one("SELECT legal_hold FROM customers WHERE id=1")["legal_hold"] is None

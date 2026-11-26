"""מבקר סבב 253 · 🟡 — עובד/ת מול כרטיס `api_mass_vanish`: הכרטיס אומר «אם כולן באמת שולמו — סמנו כאן» בלי כפתור ובלי
«🔒 בעל העסק בלבד», והכפתור היחיד («✓ טופל») מוריד את הכרטיס מבעל העסק לפני שראה אותו.

רכיבים: `web/src/pages/Dashboard.tsx` (ענף `n.intent === 'api_mass_vanish' && !isStaff(me)` ⇒ לעובד/ת נופל ל«✓ טופל»
הגנרי) · `web/src/lib/roles.ts` (`OWNER_ONLY_NOTICES = ['settings_changed']` — דפוס 195ג) · `app/service.py` →
`owner_message_done` (חוסם רק settings_changed לעובד/ת; `api_mass_vanish` ⇒ `needs_owner=0`).
תרחיש (REQUIRE_USER_LOGIN + TOTP): 6 פתוחות ⇒ סנכרון ריק ⇒ כרטיס. עובד/ת: `accept-close` ⇒ 403 ✓; `/done` ⇒ 200, הכרטיס
יורד; `GET /owner/inbox` של בעל העסק ⇒ ריק. ההחזקה נשארת, והכרטיס חוזר רק בסנכרון הבא שבו התקלה עדיין קיימת. בדפדפן
(390px, build טרי, צילום docs/screens/critic-253-mass-vanish-staff-390.png): הנוסח «סמנו כאן» + «✓ טופל» בלבד, בלי תג
נעילה — בעוד שכרטיס «הגדרות רגישות שונו» ממש מתחתיו מציג «🔒 בעל העסק בלבד».
✓ 252 (מנהל 420) תוקן — החזקה ⇒ `sync_suspect` ו-check מתריע.
הצעה: `api_mass_vanish` ב-OWNER_ONLY_NOTICES (תג נעילה לעובד/ת) ו-`owner_message_done` של עובד/ת עליו ⇒ 403 + audit
(כמו 195א), או נוסח לעובד/ת «בעל העסק יכריע». ✓ תוקן במנהל 422 (403 + נעילה + «בעל העסק מכריע»)."""
from datetime import timedelta

from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.secretbox import generate_key
from app.users import Users
from tests.conftest import OWNER_TOKEN, gi_doc

PW = "correct-horse-battery-9"


def test_staff_done_does_not_hide_mass_vanish_from_owner(svc, clock, fake_gi, monkeypatch):
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k1:{generate_key()}")
    u = Users(svc.db, svc.clock)
    regs = {"owner": u.create("owner@s.example", "בעלים", PW), "staff": u.create("staff@s.example", "עובד", PW)}
    fake_gi.docs[:] = [gi_doc(i, phone=f"050-00001{i:02d}") for i in range(1, 7)]
    svc.sync()
    fake_gi.docs[:] = []
    clock.now += timedelta(hours=2)
    svc.sync()
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))

    def hdr(who):
        tok = api.post("/auth/login", json={"email": f"{who}@s.example", "password": PW,
                                            "code": totp.code_at(regs[who]["totp_secret"], clock().timestamp())})
        return {"Authorization": f"Bearer {tok.json()['token']}"}
    mid = svc.db.one("SELECT id FROM messages WHERE intent='api_mass_vanish'")["id"]
    staff = hdr("staff")
    assert api.post(f"/owner/inbox/{mid}/accept-close", headers=staff).status_code == 403
    api.post(f"/owner/inbox/{mid}/done", headers=staff)
    intents = [m["intent"] for m in api.get("/owner/inbox", headers=hdr("owner")).json()]
    assert "api_mass_vanish" in intents, intents

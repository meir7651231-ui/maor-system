"""מבקר סבב 254 · 🟡 — «✓ טופל» של עובד/ת על כרטיס `inherited_optout` מעלים לתמיד את ההכרעה ששמורה לבעל העסק: מיכל
נשארת מוסרת בלי מועד, ואף כרטיס לא חוזר.

רכיבים: `app/main.py` → `lift_inherited_optout` (בעלים בלבד — 403 לעובד/ת, מנהל 405) · `app/service.py` →
`owner_message_done` (חוסם רק `settings_changed`; כאן ⇒ `needs_owner=0`) · `_inherited_optout_card` (מפתח
`inherited_optout:{cid}` קבוע ⇒ לא נוצר שוב). סקירת-על 231–253, כרטיס-כרטיס, לעובד/ת:
  · `inherited_optout` — הכרעה של בעלים, «טופל» של עובד/ת מסתיר אותה **לצמיתות** ⇒ הממצא.
  · `api_mass_vanish` — 253 (עדיין פתוח): מוסתר עד הסנכרון התקול הבא.
  · `currency_changed` / `csv_contact_plan` — ההשהיה נשארת ומוצגת בטבלה, וחידוש מותר לעובד/ת — לא הכרעת בעלים.
  · `api_reopened` / `plan_amount_changed` / `csv_*` — יורדים לבד כשהמקור פותר (227/237/415).
  · `shared_contact_promise` / `plan_request` — «טופל» = «אף אחד מהם», מותר לעובד/ת כמו שאר כרטיסי 👥.
תרחיש (REQUIRE_USER_LOGIN + TOTP): דנה «הסר אותי» ⇒ 9001 עוברת בקובץ למיכל ⇒ מיכל «איך אפשר לשלם?» ⇒ כרטיס.
עובד/ת: lift ⇒ 403 ✓; `/done` ⇒ 200 ⇒ `GET /owner/inbox` של בעל העסק ריק; מיכל כותבת שוב + קובץ נוסף ⇒ אין כרטיס,
opted_out=1.
הצעה: `inherited_optout` (ו-api_mass_vanish) ברשימת כרטיסים שרק בעל העסק סוגר — 403 + audit לעובד/ת ותג «🔒 בעל העסק
בלבד» במסך (דפוס 195א/ג). xfail(strict=True)."""
from datetime import timedelta

from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.secretbox import generate_key
from app.users import Users
from tests.conftest import OWNER_TOKEN
from tests.test_critic_round239_inherited_optout import DANA, MICHAL, _row, _sent_to_dana

PW = "correct-horse-battery-9"


def test_staff_done_does_not_hide_inherited_optout(svc, clock, monkeypatch):
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k1:{generate_key()}")
    u = Users(svc.db, svc.clock)
    regs = {"owner": u.create("owner@s.example", "בעלים", PW), "staff": u.create("staff@s.example", "עובד", PW)}
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "הסר אותי")
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    svc.inbound("sms", MICHAL, "איך אפשר לשלם?")
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))

    def hdr(who):
        tok = api.post("/auth/login", json={"email": f"{who}@s.example", "password": PW,
                                            "code": totp.code_at(regs[who]["totp_secret"], clock().timestamp())})
        return {"Authorization": f"Bearer {tok.json()['token']}"}
    staff = hdr("staff")
    michal = svc.db.one("SELECT id FROM customers WHERE phone=?", (MICHAL,))["id"]
    card = svc.db.one("SELECT id FROM messages WHERE intent='inherited_optout'")["id"]
    assert api.post(f"/customers/{michal}/lift-inherited-optout", headers=staff).status_code == 403
    api.post(f"/owner/inbox/{card}/done", headers=staff)
    svc.inbound("sms", MICHAL, "מתי צריך לשלם?")
    intents = [m["intent"] for m in api.get("/owner/inbox", headers=hdr("owner")).json()]
    assert "inherited_optout" in intents, intents

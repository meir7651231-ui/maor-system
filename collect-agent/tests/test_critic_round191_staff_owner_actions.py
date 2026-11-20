"""critic סבב 191 · 🟠 לתיקון בונה — המשך מיפוי staff מול בעלים (אחרי 190ב). רכיבים:
  א. `app/main.py` → `resume` (POST /customers/{cid}/resume) + `app/service.py` → `resume_customer`: השהיה **שבעל העסק
     סימן** (`OWNER_HOLDS` — קטין/פטירה/חדלות פירעון, «ר-6: סימון בעל העסק = השהיה קשה») מתבטלת ע״י עובד/ת.
  ב. `app/main.py` → `orbit_link_secret` / `orbit_unlink`: עובד/ת מנפיק/ה סוד-מסירה לאורביט **לכל org שיבחר/תבחר**
     (רוטציה מבטלת את הסוד של בעל העסק) ומבטל/ת קישור.
**[מאומת עם REQUIRE_USER_LOGIN=1 + TOTP]** א: בעלים מסמן deceased «המשפחה הודיעה — לא לפנות» ⇒ עובד/ת POST resume ⇒
**200**, paused_reason=None — תזכורות חוזרות למשפחת הנפטר/ת — **בלי כרטיס לבעל העסק**. ב: עובד/ת POST
/orbit/link/secret {"org": "org-attacker"} ⇒ **200** + הסוד מוחזר לעובד/ת, בלי כרטיס. הצעה: ביטול השהיית-בעלים
(OWNER_HOLDS) ו-orbit secret/unlink = בעלים בלבד (403 לעובד/ת), כמו /team ו-restore-hold.
תוקן (מנהל 341): resume של OWNER_HOLDS ו-orbit secret/unlink = בעלים בלבד (403 + audit). בקרות ירוקות."""
from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.secretbox import generate_key
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"


def _api(svc, clock, monkeypatch):
    monkeypatch.setenv("COLLECT_MASTER_KEYS", f"k1:{generate_key()}")
    u = Users(svc.db, svc.clock)
    regs = {"owner": u.create("owner@s.example", "בעלים", PW), "staff": u.create("staff@s.example", "עובד", PW)}
    svc.sync()
    svc.set_hold(1, "deceased", "המשפחה הודיעה — לא לפנות", "owner")
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))

    def hdr(who):
        tok = api.post("/auth/login", json={"email": f"{who}@s.example", "password": PW,
                                            "code": totp.code_at(regs[who]["totp_secret"], clock().timestamp())})
        return {"Authorization": f"Bearer {tok.json()['token']}"}
    return api, hdr


def _owner_told(svc):
    return svc.db.one("SELECT 1 FROM messages WHERE needs_owner=1") is not None


def test_staff_cannot_silently_resume_owner_hold(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    r = api.post("/customers/1/resume", headers=hdr("staff"))
    still = svc.db.one("SELECT paused_reason FROM customers WHERE id=1")["paused_reason"] == "deceased"
    assert r.status_code == 403 or still or _owner_told(svc), r.status_code


def test_staff_cannot_issue_orbit_secret(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    r = api.post("/orbit/link/secret", json={"org": "org-attacker"}, headers=hdr("staff"))
    assert r.status_code == 403 or _owner_told(svc), r.status_code


def test_control_owner_can_resume_and_issue(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    h = hdr("owner")
    assert api.post("/customers/1/resume", headers=h).status_code == 200
    assert api.post("/orbit/link/secret", json={"org": "org-real"}, headers=h).status_code == 200


def test_staff_refusal_is_audited_and_secret_untouched(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    h_owner, h_staff = hdr("owner"), hdr("staff")
    assert api.post("/orbit/link/secret", json={"org": "org-real"}, headers=h_owner).status_code == 200
    before = api.get("/orbit/link", headers=h_owner).json()
    assert api.post("/orbit/link/secret", json={"org": "org-attacker"}, headers=h_staff).status_code == 403
    assert api.post("/orbit/link/unlink", headers=h_staff).status_code == 403
    after = api.get("/orbit/link", headers=h_owner).json()
    assert after == before and after["org"] == "org-real"
    acts = {r["action"] for r in svc.db.q("SELECT action FROM audit")}
    assert {"orbit_secret_refused", "orbit_unlink_refused"} <= acts


def test_staff_resume_refused_is_audited_and_hold_kept(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    assert api.post("/customers/1/resume", headers=hdr("staff")).status_code == 403
    assert svc.db.one("SELECT paused_reason FROM customers WHERE id=1")["paused_reason"] == "deceased"
    assert svc.db.one("SELECT 1 FROM audit WHERE action='resume_refused_owner_hold'")


def test_control_staff_can_resume_non_owner_pause(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    svc.db.x("UPDATE customers SET paused_reason='promise' WHERE id=2")
    assert api.post("/customers/2/resume", headers=hdr("staff")).status_code == 200

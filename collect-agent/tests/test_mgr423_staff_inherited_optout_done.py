"""מנהל 423 (מבקר 254🟡): «✓ טופל» של עובד/ת על כרטיס inherited_optout הסתיר לצמיתות את הכרעת בעל העסק
(מפתח קבוע ⇒ הכרטיס לא חוזר, הלקוחה נשארת מוסרת). עכשיו: עובד/ת ⇒ 403 + audit, הכרטיס נשאר; בעל העסק ⇒ כרגיל."""
from datetime import timedelta

from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.secretbox import generate_key
from app.users import Users
from tests.conftest import OWNER_TOKEN
from tests.test_critic_round239_inherited_optout import DANA, MICHAL, _row, _sent_to_dana

PW = "correct-horse-battery-9"


def _setup(svc, clock, monkeypatch):
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
    mid = svc.db.one("SELECT id FROM messages WHERE intent='inherited_optout'")["id"]
    return api, hdr, mid


def test_staff_done_refused_card_stays(svc, clock, monkeypatch):
    api, hdr, mid = _setup(svc, clock, monkeypatch)
    r = api.post(f"/owner/inbox/{mid}/done", headers=hdr("staff"))
    assert r.status_code == 403, r.text
    assert "בעל העסק" in r.text
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (mid,))["needs_owner"] == 1
    row = svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='owner_message_done_refused'")
    assert row["n"] == 1
    assert "inherited_optout" in [m["intent"] for m in api.get("/owner/inbox", headers=hdr("owner")).json()]


def test_owner_done_still_works(svc, clock, monkeypatch):
    api, hdr, mid = _setup(svc, clock, monkeypatch)
    assert api.post(f"/owner/inbox/{mid}/done", headers=hdr("owner")).status_code == 200
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (mid,))["needs_owner"] == 0

"""מנהל 422 (מבקר 253🟡): «✓ טופל» של עובד/ת על כרטיס api_mass_vanish הוריד אותו מבעל העסק לפני שראה אותו.
עכשיו: עובד/ת ⇒ 403 + audit, הכרטיס נשאר וההחזקה נשארת; בעל העסק («השאר פתוחות») ⇒ יורד כרגיל."""
from datetime import timedelta

from fastapi.testclient import TestClient

from app import totp
from app.main import create_app
from app.secretbox import generate_key
from app.users import Users
from tests.conftest import OWNER_TOKEN, gi_doc

PW = "correct-horse-battery-9"


def _setup(svc, clock, fake_gi, monkeypatch):
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
    return api, hdr, mid


def _open_invoices(svc):
    return svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open'")["n"]


def test_staff_done_refused_card_and_hold_stay(svc, clock, fake_gi, monkeypatch):
    api, hdr, mid = _setup(svc, clock, fake_gi, monkeypatch)
    r = api.post(f"/owner/inbox/{mid}/done", headers=hdr("staff"))
    assert r.status_code == 403, r.text
    assert "בעל העסק" in r.text
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (mid,))["needs_owner"] == 1
    assert svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='owner_message_done_refused'")["n"] == 1
    assert _open_invoices(svc) == 6
    assert "api_mass_vanish" in [m["intent"] for m in api.get("/owner/inbox", headers=hdr("owner")).json()]


def test_owner_keep_open_still_works(svc, clock, fake_gi, monkeypatch):
    api, hdr, mid = _setup(svc, clock, fake_gi, monkeypatch)
    assert api.post(f"/owner/inbox/{mid}/done", headers=hdr("owner")).status_code == 200
    assert svc.db.one("SELECT needs_owner FROM messages WHERE id=?", (mid,))["needs_owner"] == 0
    assert _open_invoices(svc) == 6     # «השאר פתוחות» — לא סוגר


def test_owner_token_done_unchanged(svc, clock, fake_gi):
    """בקרה: בלי REQUIRE_USER_LOGIN (קוד בעל העסק) — «טופל» עובד כמו קודם."""
    fake_gi.docs[:] = [gi_doc(i, phone=f"050-00001{i:02d}") for i in range(1, 7)]
    svc.sync()
    fake_gi.docs[:] = []
    clock.now += timedelta(hours=2)
    svc.sync()
    mid = svc.db.one("SELECT id FROM messages WHERE intent='api_mass_vanish'")["id"]
    assert svc.owner_message_done(mid)["done"] is True

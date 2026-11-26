"""מנהל 432 (מבקר 259 ℹ️): `/maintenance/purge` — המסלול הידני כשה-cron לא רץ — הריץ רק התממה (ר-10).
מועדי בקשות עיון/תיקון/מחיקה (30 יום) נבדקו רק ב-plan() ⇒ בלי cron אין «נותרו N ימים»/«עברה את המועד».
עכשיו ההפעלה הידנית מריצה גם את dsr.sweep: אידמפוטנטי, פנימי לבעל העסק בלבד, ובלי התראה ⇒ תשובה ביט-זהה."""
from datetime import timedelta

from app import dsr
from tests.test_manager342_staff_owner_settings import _api


def _request(svc):
    svc.sync()
    cid = svc.db.one("SELECT id FROM customers LIMIT 1")["id"]
    return dsr.open_request(svc, cid, "deletion", "owner", note="בטלפון")


def _out(svc):
    return svc.db.one("SELECT COUNT(*) n FROM messages WHERE direction='out'")["n"]


def test_manual_purge_raises_late_alert_once(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    rid = _request(svc)
    out0 = _out(svc)
    clock.now += timedelta(days=31)
    h = hdr("owner")   # כניסה אחרי קפיצת הזמן (הסשן פג)
    r = api.post("/maintenance/purge", headers=h)
    assert r.status_code == 200 and r.json().get("dsr_alerts") == 1, r.text
    assert svc.db.one("SELECT COUNT(*) n FROM messages WHERE message_id=?", (f"dsr:{rid}:late",))["n"] == 1
    # שוב ⇒ אין התראה כפולה, והתשובה חוזרת לצורה הישנה
    r2 = api.post("/maintenance/purge", headers=h)
    assert "dsr_alerts" not in r2.json()
    assert svc.db.one("SELECT COUNT(*) n FROM messages WHERE message_id=?", (f"dsr:{rid}:late",))["n"] == 1
    assert svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='dsr_late'")["n"] == 1
    assert _out(svc) == out0               # שום דבר לא יצא ללקוח


def test_manual_purge_soon_alert(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    rid = _request(svc)
    clock.now += timedelta(days=26)
    h = hdr("owner")
    assert api.post("/maintenance/purge", headers=h).json()["dsr_alerts"] == 1
    assert "soon" in svc.db.one("SELECT warned FROM dsr WHERE id=?", (rid,))["warned"].split(",")


def test_manual_purge_no_dsr_shape_unchanged(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    h = hdr("owner")
    assert set(api.post("/maintenance/purge", headers=h).json()) == {"invoices", "customers"}


def test_manual_purge_staff_refused_no_sweep(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    rid = _request(svc)
    clock.now += timedelta(days=31)
    r = api.post("/maintenance/purge", headers=hdr("staff"))
    assert r.status_code == 403 and "בעל העסק" in r.json()["detail"]
    assert svc.db.one("SELECT warned FROM dsr WHERE id=?", (rid,))["warned"] == ""

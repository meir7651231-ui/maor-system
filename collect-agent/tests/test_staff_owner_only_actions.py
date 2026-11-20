"""גבי עיצוב (מבקר 195ג + הכרעת ראש צוות): פעולות של בעל העסק בלבד — לעובד/ת 403 + audit, לבעל העסק 200.
  • ייצוא כל המידע על לקוח (`GET /customers/{cid}/data`) — `data_export_refused`.
  • סגירת בקשת **מחיקה** במרשם (`POST /dsr/{id}/done`, kind=deletion) — `dsr_deletion_close_refused`.
    עיון/תיקון — עובד/ת ממשיך/ה לסגור (בקרה).
  • הפעלה ידנית של המחיקה (`POST /maintenance/purge`) — `maintenance_purge_refused`.
המסך מסמן מראש (web/src/lib/roles.ts, app/ui.html isStaff) — כאן השרת, שהוא האוכף."""
from tests.test_manager342_staff_owner_settings import _actions, _api


def test_export_owner_only(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    r = api.get("/customers/1/data", headers=hdr("staff"))
    assert r.status_code == 403 and "בעל העסק" in r.json()["detail"]
    assert _actions(svc, "data_export_refused")[-1]["actor"].startswith("user:")
    assert api.get("/customers/1/data", headers=hdr("owner")).status_code == 200


def test_dsr_deletion_close_owner_only_access_still_open(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    staff, owner = hdr("staff"), hdr("owner")
    # פתיחת בקשת מחיקה ידנית — גם היא בעל העסק בלבד (הכרעת ראש צוות, סט #22b)
    req = {"kind": "deletion", "note": "ביקש מחיקה"}
    assert api.post("/customers/1/dsr", json=req, headers=staff).status_code == 403
    dele = api.post("/customers/1/dsr", json={"kind": "deletion", "note": "ביקש מחיקה"}, headers=owner).json()["id"]
    acc = api.post("/customers/1/dsr", json={"kind": "access", "note": "ביקש עותק"}, headers=staff).json()["id"]
    r = api.post(f"/dsr/{dele}/done", json={"note": "נמחק מהמערכת"}, headers=staff)
    assert r.status_code == 403 and "מחיקה" in r.json()["detail"]
    assert svc.db.one("SELECT status FROM dsr WHERE id=?", (dele,))["status"] == "open"
    assert _actions(svc, "dsr_deletion_close_refused")
    assert api.post(f"/dsr/{acc}/done", json={"note": "נשלח עותק במייל"}, headers=staff).status_code == 200
    assert api.post(f"/dsr/{dele}/done", json={"note": "נמחק מהמערכת"}, headers=owner).status_code == 200


def test_manual_purge_owner_only(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    assert api.post("/maintenance/purge", headers=hdr("staff")).status_code == 403
    assert _actions(svc, "maintenance_purge_refused")
    assert api.post("/maintenance/purge", headers=hdr("owner")).status_code == 200

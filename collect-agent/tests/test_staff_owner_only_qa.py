"""הכרעת ראש צוות (ממצא QA, 20.11; דפוס 190ב/191): מחיקת לקוח, ייצוא נתונים ופעולות תחזוקה — בעל העסק בלבד.
עובד/ת ⇒ 403 + audit (`*_refused`). מחיקה = גם פתיחה ידנית של בקשת מחיקה וגם סגירתה (סט #22b); בקשה שהגיעה בהודעה
מהלקוח נרשמת אוטומטית. בקשת עיון/תיקון — פתוחה לעובד/ת כמו קודם."""
from fastapi.testclient import TestClient

from app import dsr, totp
from app.main import create_app
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"


def _api(svc, clock, monkeypatch):
    u = Users(svc.db, svc.clock)
    regs = {w: u.create(f"{w}@s.example", w, PW) for w in ("owner", "staff")}
    svc.sync()
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    hdrs = {}
    for w in ("owner", "staff"):
        tok = api.post("/auth/login", json={"email": f"{w}@s.example", "password": PW,
                                            "code": totp.code_at(regs[w]["totp_secret"], clock().timestamp())})
        hdrs[w] = {"Authorization": f"Bearer {tok.json()['token']}"}
    return api, hdrs


def _refused(svc, action):
    return svc.db.one("SELECT actor FROM audit WHERE action=?", (action + "_refused",))


def test_staff_cannot_export_customer_data(svc, clock, monkeypatch):
    api, h = _api(svc, clock, monkeypatch)
    assert api.get("/customers/1/data", headers=h["staff"]).status_code == 403
    a = svc.db.one("SELECT actor FROM audit WHERE action='data_export_refused'")   # 4d1f369
    assert a and a["actor"] != "owner"                                        # השחקן האמיתי
    assert api.get("/customers/1/data", headers=h["owner"]).status_code == 200


def test_staff_cannot_run_maintenance(svc, clock, monkeypatch):
    api, h = _api(svc, clock, monkeypatch)
    assert api.post("/maintenance/purge", headers=h["staff"]).status_code == 403
    assert _refused(svc, "maintenance_purge")
    assert api.post("/maintenance/purge", headers=h["owner"]).status_code == 200


def test_deletion_request_open_and_close_owner_only(svc, clock, monkeypatch):
    """סט #22b (q22b-01): פתיחת בקשת מחיקה ידנית — גם היא בעל העסק בלבד; וגם הסגירה."""
    api, h = _api(svc, clock, monkeypatch)
    body = {"kind": "deletion", "note": "ביקשה בטלפון"}
    assert api.post("/customers/1/dsr", json=body, headers=h["staff"]).status_code == 403
    assert _refused(svc, "dsr_deletion_open")
    assert dsr.listing(svc) == []                                             # בלי השפעה
    rid = api.post("/customers/1/dsr", json=body, headers=h["owner"]).json()["id"]
    assert api.post(f"/dsr/{rid}/done", json={"note": "נמחק מהמערכת"}, headers=h["staff"]).status_code == 403
    assert _refused(svc, "dsr_deletion_close")
    assert api.post(f"/dsr/{rid}/done", json={"note": "נמחק מהמערכת"}, headers=h["owner"]).status_code == 200


def test_deletion_request_in_customer_message_still_registered(svc):
    """בקשת מחיקה שהגיעה בהודעה מהלקוח נרשמת אוטומטית — ההגבלה רק על פתיחה ידנית בממשק."""
    svc.sync()
    svc.inbound("sms", "050-1234567", "תמחקו את כל המידע שלי")
    assert [r["kind"] for r in dsr.listing(svc)] == ["deletion"]


def test_staff_can_still_close_access_request(svc, clock, monkeypatch):
    """בקשת עיון/תיקון — לא מחיקה ⇒ עובד/ת סוגר/ת כמו קודם."""
    api, h = _api(svc, clock, monkeypatch)
    rid = api.post("/customers/1/dsr", json={"kind": "access", "note": "טלפון"}, headers=h["staff"]).json()["id"]
    assert api.post(f"/dsr/{rid}/done", json={"note": "נשלח ללקוחה"}, headers=h["staff"]).status_code == 200

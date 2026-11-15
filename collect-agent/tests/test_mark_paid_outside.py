"""BACKLOG גבייה סוכן #3: כפתור בעלים «שולם מחוץ למערכת» בדשבורד — סוגר, מבטל תזכורות, audit."""
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


def _api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def test_mark_paid_closes_cancels_and_audits(svc):
    api = _api(svc)
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    for i in ids:
        api.post(f"/reminders/{i}/approve")
    iid = svc.db.one("SELECT id FROM invoices WHERE number='1001'")["id"]
    r = api.post(f"/invoices/{iid}/mark-paid")
    assert r.status_code == 200 and r.json()["status"] == "closed"
    api.post("/dispatch")
    assert all(m["to"] not in ("972501234567", "c1@example.com") for m in svc.sender.sent)
    a = next(x for x in api.get("/audit").json() if x["action"] == "invoice_marked_paid")
    assert '"number": "1001"' in a["detail"] and a["actor"] == "owner"
    api.post("/sync")                                       # עדיין פתוחה בחשבונית ירוקה
    assert svc._invoice(iid)["status"] == "closed"
    assert api.post(f"/invoices/{iid}/mark-paid").status_code == 409   # כבר סגורה
    assert api.post("/invoices/99999/mark-paid").status_code == 404


def test_mark_paid_requires_owner(svc):
    svc.sync()
    iid = svc.db.one("SELECT id FROM invoices LIMIT 1")["id"]
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert pub.post(f"/invoices/{iid}/mark-paid").status_code == 401
    assert svc._invoice(iid)["status"] == "open"


def test_dashboard_has_mark_paid_button():
    from pathlib import Path
    ui = (Path(__file__).resolve().parents[1] / "app" / "ui.html").read_text("utf-8")
    assert "markpaid" in ui and "/mark-paid" in ui and "שולם מחוץ למערכת" in ui

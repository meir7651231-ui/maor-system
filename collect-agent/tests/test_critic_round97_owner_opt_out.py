"""critic סבב 97 · 🔴 אין לבעל העסק שום פעולה «הסר את הלקוח». המנוע מפספס בקשת הסרה ⇒ «לא ברור» ⇒ בעל העסק
קורא בכרטיס «תפסיקו לכתוב לי» — ויכול רק לענות או «לסגור בלי מענה» ⇒ awaiting_owner משתחרר ⇒ התזכורות חוזרות
למי שביקש להפסיק. set_hold מקבל רק minor/deceased/insolvency. תיקון: POST /customers/{cid}/opt-out (אותו _opt_out
של קישור ההסרה — כולל כתובת משותפת וטיוטות ממתינות), כפתור בכרטיס «הודעות מלקוחות» ב-/ui ובתיבת /app/."""
from datetime import timedelta
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

ROOT = Path(__file__).resolve().parents[1]


def test_owner_can_opt_out_a_customer_and_nothing_goes_out(svc, clock):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    api.post("/inbound", json={"sender": "050-1234567", "text": "מה?"})   # המנוע לא זיהה; בעל העסק קרא
    r = api.post("/customers/1/opt-out")
    assert r.status_code == 200, r.text
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    assert api.get("/conversation/drafts").json() == []                 # הטיוטה הממתינה נעצרה
    assert any(a["action"] == "opt_out" and '"via": "owner"' in (a.get("detail") or "")
               for a in api.get("/audit").json())
    clock.now += timedelta(days=8)
    api.post("/sync")
    for i in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    assert [m for m in svc.sender.sent if m["to"] in ("972501234567", "c1@example.com")] == []


def test_unknown_customer_is_404(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    assert api.post("/customers/999/opt-out").status_code == 404


def test_requires_auth(svc):
    assert TestClient(create_app(svc, owner_token=OWNER_TOKEN)).post("/customers/1/opt-out").status_code == 401


def test_both_screens_offer_it():
    ui = (ROOT / "app/ui.html").read_text("utf-8")
    assert "/opt-out" in ui and 'data-a="optout"' in ui
    assert "/opt-out" in (ROOT / "web/src/api.ts").read_text("utf-8")
    assert "optOut" in (ROOT / "web/src/pages/Inbox.tsx").read_text("utf-8")

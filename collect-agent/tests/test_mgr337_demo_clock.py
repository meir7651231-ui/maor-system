"""מנהל 337 (פתוח מ-334/335/336 — «הוחמץ בדפדפן דורש הזזת שעון בשרת DEMO»): `POST /demo/advance?days=N`.
הנתיב קיים רק בשירות הדמו (DEMO=1) ורק עם opt-in `DEMO_CLOCK=1`; אף פעם לא על שירות אמיתי/מוזרק. דורש אימות בעלים,
רק קדימה, 1–90 ימים. ומעליו: מסלול «הוחמץ» המלא דרך ה-API (הסדר מאושר ⇒ +N ימים ⇒ סבב ⇒ missed + כרטיס לבעלים)."""

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import OWNER_TOKEN

H = {"Authorization": f"Bearer {OWNER_TOKEN}"}


def _client(monkeypatch, clock=True):
    monkeypatch.setenv("DEMO", "1")
    monkeypatch.setenv("DEMO_TRIAL_START", "2026-11-15")   # הניסיון (14 יום) לא נגמר באמצע ההזזה
    if clock:
        monkeypatch.setenv("DEMO_CLOCK", "1")
    else:
        monkeypatch.delenv("DEMO_CLOCK", raising=False)
    return TestClient(create_app(owner_token=OWNER_TOKEN))


def test_advance_moves_dashboard_today(monkeypatch):
    c = _client(monkeypatch)
    before = c.get("/dashboard", headers=H).json()["today"]
    r = c.post("/demo/advance?days=10", headers=H)
    assert r.status_code == 200, r.text
    assert before == "2026-11-08" and r.json() == {"today": "2026-11-18", "trial_active": True}
    assert c.get("/dashboard", headers=H).json()["today"] == "2026-11-18"


def test_not_registered_without_opt_in(monkeypatch):
    c = _client(monkeypatch, clock=False)
    assert c.post("/demo/advance?days=1", headers=H).status_code == 404


def test_never_on_injected_real_service(svc, monkeypatch):
    monkeypatch.setenv("DEMO", "1")
    monkeypatch.setenv("DEMO_CLOCK", "1")
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert c.post("/demo/advance?days=1", headers=H).status_code == 404


def test_requires_owner_auth(monkeypatch):
    c = _client(monkeypatch)
    assert c.post("/demo/advance?days=1").status_code == 401
    assert c.post("/demo/advance?days=1", headers={"Authorization": "Bearer " + "x" * 40}).status_code == 401


def test_bounds_forward_only(monkeypatch):
    c = _client(monkeypatch)
    for d in (0, -3, 91):
        assert c.post(f"/demo/advance?days={d}", headers=H).status_code == 422, d
    assert c.get("/dashboard", headers=H).json()["today"] == "2026-11-08"


def test_advance_is_audited(monkeypatch):
    c = _client(monkeypatch)
    c.post("/demo/advance?days=3", headers=H)
    svc = c.app.state.svc
    assert svc.db.one("SELECT 1 FROM audit WHERE action='demo_clock_advanced'")


def test_missed_plan_end_to_end_via_api(monkeypatch):
    """ההסדר מאושר ⇒ השעון זז מעבר למועד הראשון + ימי החסד ⇒ סבב ⇒ `missed`, progress 0, כרטיס `plan_missed`."""
    c = _client(monkeypatch)
    svc = c.app.state.svc
    cust = next(x for x in c.get("/customers", headers=H).json()
                if x["phone"] and not x["opted_out"] and not x["disputed"] and x["phone"].startswith(("05", "07")))
    c.post("/conversation/inbound", headers=H,
           json={"channel": "sms", "sender": cust["phone"], "text": "אפשר לפרוס את זה לתשלומים?"})
    p = next(x for x in c.get("/plans", headers=H).json() if x["customer_id"] == cust["id"])
    assert c.post(f"/plans/{p['id']}/approve", headers=H).status_code == 200
    first = p["installments"][0]["due"]
    gap = (svc.clock().date().fromisoformat(first) - svc.clock().date()).days + svc.PLAN_GRACE_DAYS + 1
    assert c.post(f"/demo/advance?days={gap}", headers=H).status_code == 200
    assert c.post("/plan", headers=H).status_code == 200
    row = next(x for x in c.get("/plans", headers=H).json() if x["id"] == p["id"])
    assert row["status"] == "missed", row
    assert row["progress"]["done"] == 0 and row["progress"]["next"]["n"] == 1
    assert svc.db.one("SELECT 1 FROM messages WHERE intent='plan_missed' AND customer_id=?", (cust["id"],))


def test_one_day_short_of_grace_is_not_missed(monkeypatch):
    """בקרה: יום לפני סוף החסד ⇒ ההסדר עדיין `approved` (ה-e2e לא «עובר» רק כי כל הזזה מחמיצה)."""
    c = _client(monkeypatch)
    svc = c.app.state.svc
    cust = next(x for x in c.get("/customers", headers=H).json()
                if x["phone"] and not x["opted_out"] and not x["disputed"] and x["phone"].startswith(("05", "07")))
    c.post("/conversation/inbound", headers=H,
           json={"channel": "sms", "sender": cust["phone"], "text": "אפשר לפרוס את זה לתשלומים?"})
    p = next(x for x in c.get("/plans", headers=H).json() if x["customer_id"] == cust["id"])
    c.post(f"/plans/{p['id']}/approve", headers=H)
    first = p["installments"][0]["due"]
    gap = (svc.clock().date().fromisoformat(first) - svc.clock().date()).days + svc.PLAN_GRACE_DAYS
    c.post(f"/demo/advance?days={gap}", headers=H)
    c.post("/plan", headers=H)
    assert next(x for x in c.get("/plans", headers=H).json() if x["id"] == p["id"])["status"] == "approved"


def test_reports_trial_ended(monkeypatch):
    """הזזה מעבר לסוף הניסיון ⇒ `trial_active: false` (הסבב לא ירוץ) — לא «כישלון» שקט של ההסדר."""
    c = _client(monkeypatch)
    assert c.post("/demo/advance?days=40", headers=H).json()["trial_active"] is False

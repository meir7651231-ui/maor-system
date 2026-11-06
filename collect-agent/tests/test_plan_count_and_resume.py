"""מספר תשלומים מתוך תשובת הלקוח + חידוש לקוח מושהה מהדשבורד."""
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.test_flow import first_cycle


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc))


def _approve_first(api):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")


@pytest.mark.parametrize("text,n", [
    ("אפשר לחלק ל-4 תשלומים?", 4),
    ("אפשר בחמישה תשלומים", 5),
    ("אני רוצה פריסה ל 2", 2),
    ("אפשר פריסה?", 3),                 # בלי מספר ⇒ ברירת המחדל
    ("אפשר ב-10 תשלומים?", 6),          # מעל התקרה ⇒ נחתך ל-6
])
def test_plan_uses_requested_installments(api, svc, text, n):
    _approve_first(api)
    res = api.post("/inbound", json={"sender": "050-1234567", "text": text}).json()
    plan = next(p for p in api.get("/plans").json() if p["id"] == res["plan_id"])
    assert len(plan["installments"]) == n
    assert sum(i["amount_agorot"] for i in plan["installments"]) == 120000  # מדויק לאגורה


def test_dashboard_exposes_pause_and_resume_clears_it(api, svc):
    _approve_first(api)
    api.post("/inbound", json={"sender": "050-1234567", "text": "שילמתי כבר"})
    row = next(x for x in api.get("/dashboard").json()["invoices"] if x["number"] == "1001")
    assert row["paused_reason"] == "paid_claim" and row["customer_block"] == "paid_claim"
    assert api.post(f"/customers/{row['customer_id']}/resume").status_code == 200
    row = next(x for x in api.get("/dashboard").json()["invoices"] if x["number"] == "1001")
    assert row["paused_reason"] is None and row["customer_block"] is None


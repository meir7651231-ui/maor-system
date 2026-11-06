"""זרימה מקצה לקצה דרך ה-API: סנכרון sandbox מדומה ⇒ תור ⇒ אישור ⇒ dry-run ⇒ תשובות."""
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.config import SafetyError
from app.main import create_app
from app.policy import TZ
from app.service import CollectService


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc))


def first_cycle(api):
    assert api.post("/sync").json() == {"open": 2, "closed": 0}
    created = api.post("/plan").json()["created"]
    assert len(created) == 2
    return created


def test_health_reports_dry_run(api):
    h = api.get("/health").json()
    assert h == {"status": "ok", "send_mode": "dry_run", "greeninvoice_env": "sandbox",
                 "dry_run": True}


def test_first_message_needs_owner_approval(api, svc):
    ids = first_cycle(api)
    rems = api.get("/reminders").json()
    assert all(r["status"] == "pending_approval" for r in rems)
    # בלי אישור — שום דבר לא יוצא
    assert api.post("/dispatch").json()["sent"] == []
    assert svc.sender.sent == []
    api.post(f"/reminders/{ids[0]}/approve")
    api.post(f"/reminders/{ids[1]}/reject")
    sent = api.post("/dispatch").json()["sent"]
    assert len(sent) == 1 and sent[0]["message_id"].startswith("dryrun.")
    out = api.get("/outbox").json()["messages"]
    assert out[0]["payload"]["to"] == "972501234567"
    params = [p["text"] for p in out[0]["payload"]["template"]["components"][0]["parameters"]]
    assert params == ["דנה כהן", "סטודיו מאיר", "1001", "1,200 ₪", "https://pay.example/x"]


def test_second_reminder_auto_after_first_approved(api, svc, clock):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    # שבוע אחרי — שלב 2 ללקוח שכבר אושר ⇒ לא צריך אישור
    clock.now += timedelta(days=7)
    new = api.post("/plan").json()["created"]
    r = next(x for x in api.get("/reminders").json() if x["id"] in new and x["step"] == 1)
    assert r["status"] == "approved" and r["template_key"] == "second"


def test_72h_gap_and_shabbat(api, svc, clock):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    clock.now = datetime(2026, 11, 14, 10, tzinfo=TZ)  # שבת
    api.post("/plan")
    assert api.post("/dispatch").json()["sent"] == []


def test_final_step_always_needs_approval(api, svc, clock):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    for _ in range(3):
        clock.now += timedelta(days=8)
        api.post("/plan")
        api.post("/dispatch")
    sent_steps = [r["step"] for r in api.get("/reminders?status=sent_dry_run").json()]
    assert sent_steps == [0, 1, 2]
    finals = [r for r in api.get("/reminders").json() if r["template_key"] == "final"]
    assert finals and finals[0]["status"] == "pending_approval"


def test_opt_out_stops_everything(api, svc, clock):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    res = api.post("/inbound", json={"phone": "0501234567", "text": "הסר"}).json()
    assert res["intent"] == "opt_out" and res["auto_reply"]
    clock.now += timedelta(days=10)
    assert api.post("/plan").json()["created"] == []
    api.post("/dispatch")
    assert len(svc.sender.sent) == 2  # התזכורת + אישור-ההסרה, ולא יותר


def test_paid_claim_escalates_and_stops(api, svc):
    first_cycle(api)
    res = api.post("/inbound", json={"phone": "050-1234567", "text": "שילמתי כבר"}).json()
    assert res["escalate"] and res["auto_reply"] is None
    assert api.get("/reminders").json()[0]["status"] == "cancelled"
    assert len(api.get("/owner/inbox").json()) == 1


def test_no_auto_reply_before_first_approval(api, svc):
    first_cycle(api)
    res = api.post("/inbound", json={"phone": "050-1234567", "text": "איך אפשר לשלם?"}).json()
    assert res["intent"] == "how_to_pay" and res["auto_reply"] is None
    assert svc.sender.sent == []


def test_plan_request_flow(api, svc):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    res = api.post("/inbound", json={"phone": "050-1234567", "text": "אפשר פריסה?"}).json()
    plan = api.get("/plans").json()[0]
    assert res["plan_id"] == plan["id"] and plan["status"] == "proposed"
    assert sum(i["amount_agorot"] for i in plan["installments"]) == 120000
    msg = api.post(f"/plans/{plan['id']}/approve").json()
    assert msg["message_id"].startswith("dryrun.") and "ללא תוספת" in msg["text"]


def test_closed_invoice_cancels_reminder(api, svc, fake_gi):
    first_cycle(api)
    fake_gi.docs = [d for d in fake_gi.docs if d["id"] != "doc1"]  # שולמה בחשבונית ירוקה
    assert api.post("/sync").json()["closed"] == 1
    assert api.get("/reminders").json()[0]["status"] == "cancelled"


def test_invalid_phone_cannot_be_approved(api, svc, fake_gi):
    fake_gi.docs[0]["client"]["phone"] = "123"
    ids = first_cycle(api)
    assert api.post(f"/reminders/{ids[0]}/approve").status_code == 409


def test_unknown_sender_goes_to_owner(api):
    first_cycle(api)
    res = api.post("/inbound", json={"phone": "054-0000000", "text": "מי אתם?"}).json()
    assert res["intent"] == "unknown_sender" and res["escalate"]


def test_service_refuses_non_dry_sender(svc):
    class Live:
        mode = "live"
        def send(self, p): ...
    with pytest.raises(SafetyError):
        CollectService(svc.s, svc.db, sender=Live())


def test_audit_trail(api):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    actions = [a["action"] for a in api.get("/audit").json()]
    assert {"sync", "plan", "approve"} <= set(actions)


def test_dispatch_rechecks_window(api, svc, clock):
    """תזכורת שאושרה ביום חול לא יוצאת אם ה-dispatch רץ בשבת."""
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    clock.now = datetime(2026, 11, 14, 10, tzinfo=TZ)  # שבת
    assert api.post("/dispatch").json()["sent"] == []
    clock.now = datetime(2026, 11, 15, 9, 30, tzinfo=TZ)  # ראשון
    assert len(api.post("/dispatch").json()["sent"]) == 1

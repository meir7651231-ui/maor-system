"""הכרעת ראש צוות q21-19 (20.11): הבטחת תשלום מעבר ל-max_defer_days (14) לא נדחית אוטומטית מעבר ל-14 — מקבלים
אותה עד 14 יום, ומעבר לזה כרטיס «בדוק ואשר» לבעל העסק, שמאשר או מסרב לתאריך המבוקש. max_defer_days לא השתנה."""
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.conversation import OwnerPolicy
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

DANA = "050-1234567"          # השעון: 8.11.2026


def _dana(svc):
    return svc.db.one("SELECT * FROM customers WHERE external_id='cl1'")


def _promise_25(svc):
    svc.sync()
    return svc.inbound("sms", DANA, "I'll pay on November 25")   # 17 יום


def _reminders_to_dana(svc, clock, days):
    clock.now += timedelta(days=days)
    svc.inbox.release_expired_pauses()
    ids = svc.plan()
    inv = svc.db.one("SELECT id FROM invoices WHERE customer_id=?", (_dana(svc)["id"],))["id"]
    return [r for r in ids if svc.db.one("SELECT 1 FROM reminders WHERE id=? AND invoice_id=?", (r, inv))]


def test_max_defer_days_unchanged():
    assert OwnerPolicy().max_defer_days == 14


def test_far_promise_accepted_up_to_14_with_owner_card(svc):
    r = _promise_25(svc)
    assert r["intent"] == "promise" and r["escalate"] and "promise_over_limit" in r["tags"]
    assert _dana(svc)["paused_reason"] == "promise:until=2026-11-23"          # 8.11 + 14 + 1
    assert any("בדוק ואשר" in a for a in r["owner_actions"])
    assert "25.11" in r["owner_summary"] and "22.11" in r["owner_summary"]
    body = svc.db.one("SELECT body FROM drafts WHERE id=?", (r["draft_id"],))["body"]
    assert "22.11" in body                       # ללקוח: עד מתי לא נשלח תזכורות — בלי להבטיח את ה-25


def test_without_owner_decision_reminders_resume_after_14(svc, clock):
    _promise_25(svc)
    assert _reminders_to_dana(svc, clock, 10) == []
    assert _reminders_to_dana(svc, clock, 6)        # 24.11 — אחרי 14 יום, לפני ה-25: חוזרות (בלי אישור)


def test_owner_approves_requested_date(svc, clock):
    _promise_25(svc)
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    r = api.post(f"/customers/{_dana(svc)['id']}/promise-request", json={"approve": True})
    assert r.status_code == 200 and r.json()["paused_until"] == "2026-11-26"
    assert _reminders_to_dana(svc, clock, 16) == []                 # 24.11 — עדיין בהשהיה
    assert _reminders_to_dana(svc, clock, 3)                        # 27.11 — אחרי המועד המבוקש


def test_owner_refuses_keeps_14(svc, clock):
    _promise_25(svc)
    out = svc.decide_promise_request(_dana(svc)["id"], False)
    assert out["approved"] is False and _dana(svc)["paused_reason"] == "promise:until=2026-11-23"
    assert svc.db.one("SELECT 1 FROM audit WHERE action='promise_request_refused'")
    assert _reminders_to_dana(svc, clock, 16)


def test_decision_once_and_validation(svc):
    _promise_25(svc)
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    cid = _dana(svc)["id"]
    assert api.post(f"/customers/{cid}/promise-request", json={"approve": "yes"}).status_code == 422
    assert api.post(f"/customers/{cid}/promise-request", json={"approve": False}).status_code == 200
    assert api.post(f"/customers/{cid}/promise-request", json={"approve": True}).status_code == 409
    assert api.post("/customers/2/promise-request", json={"approve": True}).status_code == 404


def test_approve_refused_if_other_pause_took_over(svc):
    """«שילמתי» אחרי ההבטחה ⇒ השהיה אחרת; אישור המועד לא דורס אותה."""
    _promise_25(svc)
    svc.inbound("sms", DANA, "שילמתי כבר")
    with pytest.raises(ValueError):
        svc.decide_promise_request(_dana(svc)["id"], True)
    assert (_dana(svc)["paused_reason"] or "").startswith("paid_claim")


def test_within_limit_unchanged(svc):
    svc.sync()
    r = svc.inbound("sms", DANA, "אשלם ב-20")                    # 12 יום
    assert "promise_over_limit" not in r["tags"] and not r["escalate"]
    assert _dana(svc)["paused_reason"] == "promise:until=2026-11-21"

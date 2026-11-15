"""critic סבב 76 (עמידות — קריסה באמצע): אישור הצעת פריסה תופס `proposed ⇒ approving` (critic סבב 40), ו-`finally`
מחזיר ל-proposed **רק על חריגה**. תהליך שנהרג באמצע (חשמל, OOM, פריסה) משאיר את ההסדר `approving` **לתמיד**:
(1) תקוע — הממשק מציג רק proposed, וכל אישור חוזר מקבל «נמצאת באישור כרגע, המתינו ורעננו»;
(2) בקשת הפריסה של הלקוח לא מקבלת מענה (בדקתי: הלקוח עצמו נשאר מושהה דרך paused_reason=plan_request). התיקון:
התאוששות ב-dispatch (כמו `_recover_stuck_sends`): approving ישן ⇒ אם כבר נוצרה טיוטת הצעה
(האישור עבר את נקודת האל-חזור) — approved; אחרת — חזרה ל-proposed. `claimed_at` חדש מבדיל בין ישן לבין אישור
שרץ עכשיו."""
from __future__ import annotations

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _proposed_plan(api, svc) -> int:
    api.post("/sync")
    rid = next(i for i in api.post("/plan").json()["created"]
               if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1)
    api.post(f"/reminders/{rid}/approve")
    api.post("/dispatch")
    api.post("/inbound", json={"sender": "050-1234567", "text": "אפשר פריסה?"})
    return api.get("/plans").json()[-1]["id"]


def _crash_mid_approve(svc, pid):
    """הדמיית קריסה: התפיסה נכתבה, ושום דבר אחריה (גם לא ה-finally)."""
    svc.db.x("UPDATE plans SET status='approving' WHERE id=?", (pid,))


def test_crash_before_offer_returns_to_proposed_and_customer_stays_protected(api, svc, clock):
    pid = _proposed_plan(api, svc)
    _crash_mid_approve(svc, pid)
    assert svc._customer_block(1) is not None   # מוגן (plan_request ב-paused_reason) — לא הבעיה כאן
    clock.now += timedelta(hours=1)
    api.post("/dispatch")                                   # התאוששות
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == "proposed"
    r = api.post(f"/plans/{pid}/approve")
    assert r.status_code == 200, r.text                      # אפשר לאשר שוב


def test_crash_after_offer_draft_marks_plan_approved(api, svc, clock):
    pid = _proposed_plan(api, svc)
    _crash_mid_approve(svc, pid)
    svc.db.x("INSERT INTO drafts(customer_id,channel,to_addr,body,intent,status,escalate,owner_summary,"
             "owner_actions,plan_id,created_at) VALUES(1,'sms','972501234567','הצעה','plan_offer','approved',"
             "'none','',' []',?,?)", (pid, svc.clock().isoformat()))
    clock.now += timedelta(hours=1)
    api.post("/dispatch")
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == "approved"

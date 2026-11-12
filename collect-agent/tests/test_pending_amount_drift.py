"""הפעלה 153: סכום שהשתנה במקור בזמן שהתזכורת ממתינה לאישור.

הבאג (נמצא ב-web/e2e/rebuild.mjs, בנייה מחדש אמיתית מול ה-mock): אחרי סנכרון, התצוגה המקדימה של תזכורת
**ממתינה** הציגה בכותרת את הסכום החדש (3,600.50 ₪) ובנוסח ההודעה את הישן (3,450.50 ₪), באותו גיבוב. בעל העסק
אישר, השליחה זיהתה את הפער, לא שלחה והחזירה לאישור: שום דבר שגוי לא יצא, אבל האישור התבזבז והמסך סתר את עצמו.
התיקון: הסנכרון בונה מחדש את הנוסח של תזכורת ממתינה שהסכום שלה השתנה (`_rebuild_pending_on_amount_drift`).
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.demo import build_demo_service, run_scenario
from app.demo_data import DEMO_ID, DEMO_SECRET, demo_docs
from app.gi_mock import GreenInvoiceMock
from app.main import create_app
from app.service import AMOUNT_CHECK
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _audits(svc, action):
    return svc.db.q("SELECT * FROM audit WHERE action=?", (action,))


def test_pending_reminder_rebuilt_at_sync_when_amount_rises(api, svc, fake_gi):
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    seen = api.get(f"/reminders/{rid}/preview").json()
    assert seen["total_text"] == "1,200 ₪" and "1,200" in seen["messages"][0]["body"]
    fake_gi.docs[0]["amount"] = "1500.00"            # הסכום עלה במקור; התזכורת עוד לא אושרה
    api.post("/sync")
    fresh = api.get(f"/reminders/{rid}/preview").json()
    # הכותרת והנוסח מציגים אותו סכום, והגיבוב השתנה ⇒ תצוגה שנפתחה קודם כבר לא מאשרת
    assert fresh["total_text"] == "1,500 ₪"
    assert all("1,500" in m["body"] and "1,200" not in m["body"] for m in fresh["messages"])
    assert fresh["body_hash"] != seen["body_hash"]
    assert (fresh["status"], fresh["block_reason"]) == ("pending_approval", "amount_changed")
    stale = api.post(f"/reminders/{rid}/approve", json={"seen_hash": seen["body_hash"]})
    assert stale.status_code == 409 and stale.headers.get("X-Gabi-Stale") == "preview"
    assert api.post("/dispatch").json()["sent"] == [] and svc.sender.sent == []
    assert api.post(f"/reminders/{rid}/approve", json={"seen_hash": fresh["body_hash"]}).status_code == 200
    assert [x["reminder_id"] for x in api.post("/dispatch").json()["sent"]] == [rid]
    assert svc.sender.sent and all("1,500" in m["body"] and "1,200" not in m["body"] for m in svc.sender.sent)


def test_sync_without_amount_change_leaves_pending_reminder_alone(api, svc, fake_gi):
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    seen = api.get(f"/reminders/{rid}/preview").json()
    for _ in range(3):
        api.post("/sync")
    again = api.get(f"/reminders/{rid}/preview").json()
    assert (again["body_hash"], again["block_reason"]) == (seen["body_hash"], seen["block_reason"])
    assert _audits(svc, "amount_changed") == []
    # שינוי אחד ⇒ בנייה אחת; סנכרונים נוספים באותו סכום לא בונים שוב ולא מחליפים גיבוב
    fake_gi.docs[0]["amount"] = "1500.00"
    api.post("/sync")
    h = api.get(f"/reminders/{rid}/preview").json()["body_hash"]
    n = len(_audits(svc, "amount_changed"))
    api.post("/sync")
    api.post("/sync")
    assert api.get(f"/reminders/{rid}/preview").json()["body_hash"] == h
    assert len(_audits(svc, "amount_changed")) == n


def test_sync_does_not_touch_approved_reminder(api, svc, fake_gi):
    """תזכורת מאושרת נשארת מאושרת בסנכרון; הבדיקה מול המקור והחזרה לאישור קורות רגע לפני השליחה (סבב 56)."""
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    seen = api.get(f"/reminders/{rid}/preview").json()
    assert api.post(f"/reminders/{rid}/approve", json={"seen_hash": seen["body_hash"]}).status_code == 200
    fake_gi.docs[0]["amount"] = "1500.00"
    api.post("/sync")
    r = svc._reminder(rid)
    assert r["status"] == "approved" and r["body_hash"] == seen["body_hash"]
    assert api.post("/dispatch").json()["sent"] == [] and svc.sender.sent == []
    assert svc._reminder(rid)["status"] == "pending_approval" and "1,500" in svc._reminder(rid)["body"]


def test_merged_reminder_rebuilt_and_still_needs_amount_confirmation():
    """תזכורת מאוחדת (גל שרון, 3 חשבוניות, סכום חריג): חשבונית אחת משתנה ⇒ הסה״כ בנוסח מתעדכן, והאישור
    המפורש «הסכום נכון» עדיין נדרש (הבנייה מחדש לא מוחקת את בדיקת הסכום החריג)."""
    svc, fake, _ = build_demo_service()
    run_scenario(svc, fake, out=lambda s: None)
    rid = next(r["id"] for r in svc.db.q("SELECT * FROM reminders WHERE block_reason=?", (AMOUNT_CHECK,)))
    before = svc.preview(rid)
    assert before["total_text"] == "2,544.80 ₪" and before["invoice_count"] == 3
    fake.set_amount("demo7", 26.90)                   # 24.90 ⇒ 26.90
    svc.sync()
    after = svc.preview(rid)
    assert after["total_text"] == "2,546.80 ₪" and after["invoice_count"] == 3
    assert any("2,546.80" in m["body"] for m in after["messages"])
    assert not any("2,544.80" in m["body"] for m in after["messages"])
    assert after["body_hash"] != before["body_hash"] and after["amount_check"]
    with pytest.raises(ValueError):
        svc.approve(rid, seen_hash=after["body_hash"])            # בלי «הסכום נכון»
    assert svc._reminder(rid)["status"] == "pending_approval"
    svc.approve(rid, seen_hash=after["body_hash"], confirm_amount=True)
    assert svc._reminder(rid)["status"] == "approved"


def test_mock_amount_route_contract():
    """כלי הבדיקה שמאפשר את כל זה בדפדפן: POST /_mock/documents/{id}/amount (לא חלק מה-API של morning)."""
    events = []
    m = GreenInvoiceMock(api_id=DEMO_ID, api_secret=DEMO_SECRET, docs=demo_docs(),
                         deliver=lambda url, p: events.append(p))
    m.route("POST", "/_mock/webhooks", {}, {"url": "http://127.0.0.1:1/webhooks/greeninvoice?k=s"})
    assert m.route("POST", "/_mock/documents/demo2/partial", {}, {"paid": 100})[0] == 200
    assert "amountDueVat" in m.docs["demo2"]
    st, out = m.route("POST", "/_mock/documents/demo2/amount", {}, {"amount": 3600.5})
    assert (st, out) == (200, {"id": "demo2", "amount": 3600.5})
    assert m.docs["demo2"]["amount"] == 3600.5 and "amountDueVat" not in m.docs["demo2"]
    assert m.docs["demo2"]["status"] == 0 and events[-1]["id"] == "demo2" and events[-1]["total"] == 3600.5
    n = len(events)
    assert m.route("POST", "/_mock/documents/nope/amount", {}, {"amount": 5})[0] == 404
    for bad in ({}, {"amount": "abc"}, {"amount": 0}, {"amount": -5}, {"amount": 1e9}, None):
        assert m.route("POST", "/_mock/documents/demo2/amount", {}, bad)[0] == 400, bad
    m.route("POST", "/_mock/documents/demo5/pay", {}, None)
    assert m.route("POST", "/_mock/documents/demo5/amount", {}, {"amount": 5})[0] == 400   # מסמך סגור
    assert m.docs["demo2"]["amount"] == 3600.5 and len(events) == n + 1                     # רק הקבלה של demo5

"""critic סבב 95 · שער awaiting_owner: בעל העסק סוגר («✓ טופל») כרטיס של הסרה/קטין/מצוקה/מספר שגוי/עו״ד
**בלי** ללחוץ «חידוש» ⇒ האם התזכורות חוזרות? סגירת כרטיס = «ראיתי», לא «תחדש». קטין/מצוקה/עו״ד/מחלוקת
משתחררים רק ב-resume מפורש; הסרה/מספר שגוי — לעולם לא. (גם אחרי שבוע, גם אחרי סנכרון.)"""
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.mark.parametrize("text", ["הסירו אותי בבקשה", "טעות במספר, אני לא דנה", "הילד שלי ענה, הוא בן 9",
                                  "אני רוצה למות", "עורך הדין שלי ייצור איתכם קשר", "לא הזמנתי כלום מכם",
                                  "I am 14", "leave me alone"])
def test_closing_the_card_does_not_resume(svc, clock, text):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    api.post("/inbound", json={"sender": "050-1234567", "text": text})
    for m in api.get("/owner/inbox").json():
        api.post(f"/owner/inbox/{m['id']}/done")
    for d in api.get("/conversation/drafts").json():
        api.post(f"/conversation/drafts/{d['id']}/reject")
    clock.now += timedelta(days=8)
    api.post("/sync")
    mine = [i for i in api.post("/plan").json()["created"]
            if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1]
    for i in mine:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    sent = [m for m in svc.sender.sent if m["to"] in ("972501234567", "c1@example.com")
            and m.get("audience") != "owner"]
    assert sent == [], (text, svc._customer_block(1), [m["body"][:40] for m in sent])


def test_control_without_reply_a_reminder_does_go_out(svc, clock):
    """בקרה: בלי תשובת לקוח אותו מסלול כן שולח — כלומר הבדיקות למעלה לא «ירוקות-ריקות»."""
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    clock.now += timedelta(days=8)
    api.post("/sync")
    for i in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    assert [m for m in svc.sender.sent if m["to"] in ("972501234567", "c1@example.com")]


def test_ambiguous_reply_closed_by_owner_resumes_by_design(svc, clock):
    """«מה?» (לא מגינה) + בעל העסק סגר ⇒ התזכורות ממשיכות — בכוונה: כרטיס רגיל לא נועל לנצח."""
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    api.post("/inbound", json={"sender": "050-1234567", "text": "מה?"})
    for m in api.get("/owner/inbox").json():
        api.post(f"/owner/inbox/{m['id']}/done")
    for d in api.get("/conversation/drafts").json():
        api.post(f"/conversation/drafts/{d['id']}/reject")
    assert svc._customer_block(1) is None

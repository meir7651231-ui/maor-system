"""critic סבב 64: לקוח שכתב («קיבלתי, בודקת עם רואה החשבון ואחזור אליכם») והכרטיס שלו ממתין לבעל העסק ⇒
שבוע אחרי כן התזכורת הבאה הוכנה, אושרה מהתור ויצאה («חשבונית 1001 … פתוחה») — בזמן שאיש לא ענה ללקוח.
כלל שמרני (כללי הבעלים: בלי לחץ, אישור פרטני מתוך תמונה מלאה): כל עוד יש הודעה נכנסת של הלקוח שממתינה
לבעל העסק (טיוטה/כרטיס pending_approval או needs_owner) ⇒ `awaiting_owner`: אין תזכורת חדשה, ומאושרת לא יוצאת.
בעל העסק ענה או סגר ⇒ התזכורות חוזרות מעצמן (אין השהיה שצריך לזכור לשחרר)."""
from __future__ import annotations

from datetime import timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

ROOT = Path(__file__).resolve().parent.parent
TEXT = "קיבלתי, אני בודקת עם רואה החשבון ואחזור אליכם"


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _mine(svc, ids):
    return [i for i in ids if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1]


def _first_sent(api, svc):
    api.post("/sync")
    for i in _mine(svc, api.post("/plan").json()["created"]):
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")


def _to_c1(svc, n0):
    return [m for m in svc.sender.sent[n0:] if m["to"] in ("972501234567", "c1@example.com")]


def test_no_next_reminder_while_customer_message_waits(api, svc, clock):
    _first_sent(api, svc)
    r = api.post("/inbound", json={"sender": "050-1234567", "text": TEXT}).json()
    assert r.get("draft_id"), r
    clock.now += timedelta(days=8)
    assert _mine(svc, api.post("/plan").json()["created"]) == [], "תזכורת הוכנה בזמן שהלקוח מחכה לתשובה"
    row = next(x for x in api.get("/dashboard").json()["invoices"] if x["number"] == "1001")
    assert row["customer_block"] == "awaiting_owner"
    # בעל העסק טיפל בכרטיס ⇒ התזכורות חוזרות לבד
    api.post(f"/conversation/drafts/{r['draft_id']}/reject")
    assert _mine(svc, api.post("/plan").json()["created"]), "אחרי הטיפול התזכורות לא חזרו"


def test_approved_reminder_waits_if_customer_wrote_after_approval(api, svc, clock):
    _first_sent(api, svc)
    clock.now += timedelta(days=8)
    for i in _mine(svc, api.post("/plan").json()["created"]):
        api.post(f"/reminders/{i}/approve")
    api.post("/inbound", json={"sender": "050-1234567", "text": TEXT})   # כתב אחרי האישור, לפני השליחה
    n0 = len(svc.sender.sent)
    api.post("/dispatch")
    assert _to_c1(svc, n0) == [], [m["body"][:50] for m in _to_c1(svc, n0)]


def test_both_uis_label_awaiting_owner():
    api_ts = (ROOT / "web/src/api.ts").read_text(encoding="utf-8")
    ui = (ROOT / "app/ui.html").read_text(encoding="utf-8")
    assert "awaiting_owner:" in api_ts and "awaiting_owner:" in ui

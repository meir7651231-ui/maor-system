"""DLR (דוח מסירה) מ-019 דרך ה-webhook האמיתי ⇒ עדכון ההודעה היוצאת · נכשל ⇒ התראה לבעל העסק.

חוזה ה-DLR של 019 לא מאומת (כמו השליחה) ⇒ פענוח סובלני, וקוד לא מוכר לא מפעיל שום פעולה.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.integrations.sms import parse_019_dlr
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

FORM = {"content-type": "application/x-www-form-urlencoded"}


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _sent_sms(api, svc):
    """מחזור מלא עד SMS יוצא אחד ⇒ השורה שלו ב-messages."""
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    api.post(f"/reminders/{rid}/approve")
    assert api.post("/dispatch").json()["sent"]
    return svc.db.one("SELECT * FROM messages WHERE direction='out' AND channel='sms'")


def _dlr(api, body):
    r = api.post("/webhooks/sms/019?k=whk-test", content=body, headers=FORM)
    assert r.status_code == 200, r.text
    return r.json()


def test_outgoing_sms_records_provider_and_id(api, svc):
    m = _sent_sms(api, svc)
    assert m["provider"] == "019" and m["provider_id"].startswith("dryrun.019.")
    assert m["delivery_status"] == "sent"


def test_delivered(api, svc):
    m = _sent_sms(api, svc)
    out = _dlr(api, f"type=dlr&shipment_id={m['provider_id']}&status=DELIVRD")
    assert out["matched"] and out["status"] == "delivered"
    row = svc.db.one("SELECT delivery_status, delivery_at FROM messages WHERE id=?", (m["id"],))
    assert row["delivery_status"] == "delivered" and row["delivery_at"]


def test_failed_alerts_owner_once_and_final_is_sticky(api, svc):
    m = _sent_sms(api, svc)
    before = len(api.get("/owner/inbox").json())
    assert _dlr(api, f"type=dlr&shipment_id={m['provider_id']}&status=undeliv")["status"] == "failed"
    inbox = api.get("/owner/inbox").json()
    assert len(inbox) == before + 1 and inbox[0]["intent"] == "sms_undelivered"
    assert inbox[0]["customer_id"] == m["customer_id"]
    # דוח מאוחר "נמסר" לא דורס סטטוס סופי, ואין התראה כפולה
    late = _dlr(api, f"type=dlr&shipment_id={m['provider_id']}&status=delivered")
    assert late["final"] and late["status"] == "failed"
    assert len(api.get("/owner/inbox").json()) == before + 1
    # לא הסרה אוטומטית: ההחלטה של בעל העסק
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (m["customer_id"],))[0] == 0


def test_unknown_code_does_nothing(api, svc):
    m = _sent_sms(api, svc)
    before = len(api.get("/owner/inbox").json())
    assert _dlr(api, f"type=dlr&shipment_id={m['provider_id']}&status=17")["status"] == "unknown"
    assert len(api.get("/owner/inbox").json()) == before


def test_unmatched_and_missing_id(api, svc):
    _sent_sms(api, svc)
    assert _dlr(api, "type=dlr&shipment_id=nope&status=delivered")["matched"] is False
    assert _dlr(api, "type=dlr&phone=0501234567&status=2")["ignored"]       # בלי מזהה


def test_duplicate_webhook_is_idempotent(api, svc):
    m = _sent_sms(api, svc)
    body = f"type=dlr&shipment_id={m['provider_id']}&status=failed"
    _dlr(api, body)
    assert _dlr(api, body)["duplicate"]


@pytest.mark.parametrize("fields,expected", [
    ({"shipment_id": "a", "status": "DELIVERED"}, ("a", "delivered")),
    ({"msg_id": "b", "dlr_status": "expired"}, ("b", "failed")),
    ({"id": "c", "status_text": "Rejected"}, ("c", "failed")),
    ({"shipment_id": "d", "status": "accepted"}, ("d", "pending")),
    ({"shipment_id": "e", "status": "2"}, ("e", "unknown")),
    ({"status": "delivered"}, ("", "delivered")),
])
def test_parse_019_dlr_tolerant(fields, expected):
    assert parse_019_dlr(fields) == expected

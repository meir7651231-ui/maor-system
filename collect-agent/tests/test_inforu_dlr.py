"""DLR של InforU (ספק ה-SMS לגיבוי): SMS שיצא בגיבוי ולא נמסר ⇒ התראה לבעל העסק.

הבאג: היה רק webhook של 019. כשההודעה יצאה ב-InforU (019 נפל זמנית), דוח המסירה שלה לא הגיע לשום
מקום ⇒ ההודעה נשארה 'sent' לנצח, ו«לא נמסר» לא הגיע לבעל העסק. חוזה ה-DLR של InforU לא מאומת.
"""
from __future__ import annotations

import httpx
import pytest
from fastapi.testclient import TestClient

from app.channels import DryRunSender
from app.inforu_mock import InforUMock
from app.integrations.email import SmtpEmail
from app.integrations.sms import InforUSms, Sms019, parse_inforu_dlr
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

URL = "/webhooks/sms/inforu?k=whk-test"


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


@pytest.fixture
def via_backup(api, svc):
    """019 נופל (503) ⇒ ה-SMS יוצא ב-InforU (mock). מחזיר את שורת ההודעה היוצאת."""
    mock = InforUMock()
    svc.sender = DryRunSender(
        sms=[Sms019("u", "t", "Gabi", transport=httpx.MockTransport(lambda r: httpx.Response(503))),
             InforUSms(mock.username, mock.token, "Gabi", transport=httpx.MockTransport(mock.handler))],
        email=SmtpEmail("smtp.gabi.example", 587, "", "", "owner@example.com"),
        allow_mock_transport=True)
    api.post("/sync")
    for rid in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{rid}/approve")
    api.post("/dispatch")
    row = svc.db.one("SELECT * FROM messages WHERE direction='out' AND channel='sms' "
                     "AND provider='inforu' ORDER BY id LIMIT 1")
    assert row is not None and row["provider_id"].startswith("inforu-"), "לא יצא SMS בגיבוי"
    return row


def _alerts(svc, cid):
    return svc.db.q("SELECT 1 FROM messages WHERE needs_owner=1 AND intent='sms_undelivered' "
                    "AND customer_id=?", (cid,))


def test_delivered_by_inforu_id(api, svc, via_backup):
    r = api.post(URL, content=InforUMock.dlr(via_backup["provider_id"], "Delivered"))
    assert r.json()["matched"] and r.json()["status"] == "delivered"
    assert svc.db.one("SELECT delivery_status FROM messages WHERE id=?", (via_backup["id"],))[0] \
        == "delivered"


def test_failed_by_our_id_alerts_owner(api, svc, via_backup):
    """InforU מחזיר את ה-CustomerMessageId ששלחנו (המזהה שלנו) — גם זה מתאים."""
    r = api.post(URL, content=InforUMock.dlr(status="Failed",
                                             customer_message_id=via_backup["message_id"]))
    assert r.json()["status"] == "failed"
    assert _alerts(svc, via_backup["customer_id"])


@pytest.mark.parametrize("code", sorted(InforUMock.DLR_STATES))
def test_each_state(api, svc, via_backup, code):
    want, alert = InforUMock.DLR_STATES[code]
    api.post(URL, content=InforUMock.dlr(via_backup["provider_id"], code))
    st = svc.db.one("SELECT delivery_status FROM messages WHERE id=?", (via_backup["id"],))[0]
    assert st == want and bool(_alerts(svc, via_backup["customer_id"])) is alert, code


def test_form_body_duplicate_and_key(api, svc, via_backup):
    body = f"MessageId={via_backup['provider_id']}&Status=Delivered".encode()
    assert api.post(URL, content=body).json()["status"] == "delivered"
    assert api.post(URL, content=body).json()["duplicate"]
    raw = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    for u in ("/webhooks/sms/inforu", "/webhooks/sms/inforu?k=wrong"):
        assert raw.post(u, content=body).status_code == 403


def test_unmatched_and_garbage_are_harmless(api, via_backup):
    assert api.post(URL, content=InforUMock.dlr("nope", "Failed")).json()["matched"] is False
    assert api.post(URL, content=b"{not json").json()["ignored"]


def test_parse_tolerant():
    assert parse_inforu_dlr({"messageid": "a", "STATUS": "DELIVERED"}) == ("a", "", "delivered")
    assert parse_inforu_dlr({"CustomerMessageID": "dryrun.x", "StatusDescription": "Expired"}) == \
        ("", "dryrun.x", "failed")
    assert parse_inforu_dlr({"MessageId": "b", "Status": 7}) == ("b", "", "unknown")

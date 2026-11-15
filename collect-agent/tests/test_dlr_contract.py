"""חוזה ה-DLR של 019 (backlog «גבי חיבורים» #1): כל מצב SMPP 3.4 שה-mock מתעד ⇒ מצב ההודעה
הנכון + התראה לבעל העסק רק בכשל. דרך ה-webhook האמיתי. (שימוש 019 ב-SMPP 3.4 — לא מאומת.)
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.sms019_mock import Sms019Mock
from tests.conftest import AUTH, OWNER_TOKEN

FORM = {"content-type": "application/x-www-form-urlencoded"}


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _sent_sms(api, svc):
    api.post("/sync")
    for rid in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{rid}/approve")
    api.post("/dispatch")
    row = svc.db.one("SELECT * FROM messages WHERE direction='out' AND channel='sms' "
                     "AND provider='019' ORDER BY id LIMIT 1")
    assert row is not None, "אין SMS יוצא ב-019"
    return row


def _inbox(svc, cid):
    return svc.db.q("SELECT * FROM messages WHERE needs_owner=1 AND intent='sms_undelivered' "
                    "AND customer_id=?", (cid,))


@pytest.mark.parametrize("code", sorted(Sms019Mock.DLR_STATES))
def test_each_documented_state(api, svc, code):
    want_state, alert = Sms019Mock.DLR_STATES[code]
    m = _sent_sms(api, svc)
    r = api.post("/webhooks/sms/019?k=whk-test", content=Sms019Mock.dlr(m["provider_id"], code),
                 headers=FORM)
    assert r.status_code == 200, r.text
    st = svc.db.one("SELECT delivery_status FROM messages WHERE id=?", (m["id"],))[0]
    assert st == (want_state if want_state != "unknown" else "unknown"), (code, st)
    assert bool(_inbox(svc, m["customer_id"])) is alert, code


def test_mock_states_cover_smpp34():
    assert set(Sms019Mock.DLR_STATES) == {"DELIVRD", "EXPIRED", "DELETED", "UNDELIV", "ACCEPTD",
                                          "UNKNOWN", "REJECTD", "ENROUTE"}

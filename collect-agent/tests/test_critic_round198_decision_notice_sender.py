"""מבקר סבב 198 — עדכון ההכרעה על הבטחה (מבקר 197, e7d2712d) יוצא ללקוח בלי שם העסק.

רכיב: `app/service.py` → `_promise_decision_notice`: הגוף נבנה כ«שלום דנה, בעל העסק אישר: …» / «שלום דנה, בעל העסק
בדק את בקשתכם: …» ונכנס לטיוטה דרך `_with_footer` בלבד — בלי `frame()`. בכל מקום אחר ההודעה נפתחת בשם העסק
(«שם העסק (פותח כל הודעה)» במסך ההגדרות; `inbox.approve_draft` מוסיף אותו גם לנוסח שבעל העסק ערך —
`if not text.startswith(business_name): text = frame(...)`; תשובת ההבטחה המקורית: «סטודיו מאיר: תודה דנה! …»).
נבדק עד היציאה: «אשר ושלח» ⇒ ההודעה שנשלחה ללקוח מתחילה «שלום דנה, בעל העסק…» — איזה עסק? (4 מסלולים: אישור/סירוב
× לפני/אחרי שהתשובה יצאה). מסע דפדפן: docs/screens/critic-198-promise-refuse-draft.png.
xfail(strict=True); בקרה ירוקה."""
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


def _decide_and_send(svc, approve, sent_first):
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "I'll pay on November 25")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    cid = svc.db.one("SELECT id FROM customers WHERE external_id='cl1'")["id"]
    if sent_first:
        assert api.post(f"/conversation/drafts/{r['draft_id']}/approve", json={}).status_code == 200
    assert api.post(f"/customers/{cid}/promise-request", json={"approve": approve}).status_code == 200
    did = [d for d in api.get("/conversation/drafts").json() if d["customer_id"] == cid][-1]["id"]
    assert api.post(f"/conversation/drafts/{did}/approve", json={}).status_code == 200
    return svc.db.one("SELECT body FROM messages WHERE customer_id=? AND direction='out' ORDER BY id DESC LIMIT 1",
                      (cid,))["body"]


def test_control_original_promise_reply_opens_with_business(svc):
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "I'll pay on November 25")
    body = svc.db.one("SELECT body FROM drafts WHERE id=?", (r["draft_id"],))["body"]
    assert body.startswith(svc.s.business_name)


@pytest.mark.xfail(strict=True, reason="198: עדכון ההכרעה נשלח ללקוח בלי שם העסק («שלום דנה, בעל העסק…»)")
@pytest.mark.parametrize("approve", [True, False])
@pytest.mark.parametrize("sent_first", [True, False])
def test_decision_update_opens_with_business_name(svc, approve, sent_first):
    out = _decide_and_send(svc, approve, sent_first)
    assert out.startswith(svc.s.business_name), out

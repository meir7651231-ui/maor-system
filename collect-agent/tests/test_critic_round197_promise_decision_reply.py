"""מבקר סבב 197 — הכרעת בעל העסק על הבטחה מעבר ל-14 יום (q21-19) לא מגיעה ללקוח.

רכיבים: `app/service.py` → `decide_promise_request` (POST /customers/{cid}/promise-request) + `app/conversation.py` →
`_decide` (ענף promise_over_limit, e653a7a8: «עד 22.11 לא נשלח תזכורות; בעל העסק יאשר את המועד המבוקש ונעדכן אתכם»).
`decide_promise_request` משנה רק את paused_reason ו-audit:
  א. **הטיוטה שממתינה לאישור לא מתעדכנת.** בעל העסק לוחץ «✗ לסרב» — הטיוטה עדיין «רשמנו שהתשלום צפוי עד 25.11 …
     בעל העסק יאשר את המועד המבוקש ונעדכן אתכם», וכפתורי «בדוק ואשר» נשארים (לחיצה שנייה ⇒ 409 «הבקשה כבר הוכרעה»).
     «אשר ושלח» ⇒ הלקוח מקבל הודעה שבעל העסק עוד יחליט, אחרי שכבר סירב.
  ב. **«ונעדכן אתכם» לא קורה.** אם התשובה כבר יצאה לפני ההכרעה — אין טיוטה/הודעה חדשה ללקוח בשום כיוון. אחרי סירוב
     הלקוח, שחושב שהמועד שלו בבדיקה, מקבל ב-23.11 תזכורת תשלום רגילה בלי הסבר (נבדק: «…טרם סומנה כשולמה. לתשלום…»).
הצעה: ההכרעה מעדכנת טיוטה ממתינה לנוסח הסופי, ואם התשובה כבר יצאה — יוצרת טיוטת עדכון («בעל העסק אישר את 25.11» /
«נוכל להמתין עד 22.11») לאישור. xfail(strict=True); בקרה ירוקה."""
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

DANA = "050-1234567"   # השעון: 8.11.2026 ⇒ 25.11 = 17 יום


def _setup(svc):
    svc.sync()
    r = svc.inbound("sms", DANA, "I'll pay on November 25")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    cid = svc.db.one("SELECT id FROM customers WHERE external_id='cl1'")["id"]
    return api, cid, r["draft_id"]


def _draft(api, did):
    return next(d for d in api.get("/conversation/drafts").json() if d["id"] == did)


def test_control_pending_draft_says_owner_will_decide(svc):
    api, _cid, did = _setup(svc)
    d = _draft(api, did)
    assert "יאשר את המועד המבוקש" in d["body"] and any(a.startswith("בדוק ואשר:") for a in d["owner_actions"])


def test_refusal_updates_pending_draft(svc):
    # מנהל 349: הטיוטה לא נכתבת מחדש במקום (מגן send_window_queue) — היא מוחלפת בטיוטה חדשה בנוסח הסופי.
    # הכוונה של הבדיקה נשמרת: בתור של הלקוח אין יותר «בעל העסק יאשר» ואין כפתורי «בדוק ואשר».
    api, cid, did = _setup(svc)
    assert api.post(f"/customers/{cid}/promise-request", json={"approve": False}).status_code == 200
    queue = [d for d in api.get("/conversation/drafts").json() if d["customer_id"] == cid]
    assert queue, "אין טיוטה ללקוח בתור"
    for d in queue:
        assert "יאשר את המועד המבוקש" not in d["body"], d["body"]
        assert not any(a.startswith("בדוק ואשר:") for a in d["owner_actions"]), d["owner_actions"]


@pytest.mark.parametrize("approve", [True, False])
def test_decision_after_reply_sent_creates_update_for_customer(svc, approve):
    api, cid, did = _setup(svc)
    assert api.post(f"/conversation/drafts/{did}/approve", json={}).status_code == 200
    before = svc.db.one("SELECT COUNT(*) AS n FROM drafts WHERE customer_id=?", (cid,))["n"]
    assert api.post(f"/customers/{cid}/promise-request", json={"approve": approve}).status_code == 200
    after = svc.db.one("SELECT COUNT(*) AS n FROM drafts WHERE customer_id=?", (cid,))["n"]
    assert after > before, "אין טיוטת עדכון ללקוח אחרי ההכרעה"

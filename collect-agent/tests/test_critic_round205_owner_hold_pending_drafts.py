"""מבקר סבב 205 · 🔴 — סימון קטין/פטירה/חדלות פירעון לא עוצר תשובה שכבר ממתינה: בקשת תשלום יוצאת אחרי הסימון.

רכיב: `app/service.py` → `set_hold` (POST /customers/{cid}/hold, ר-6 «השהיה קשה: עוצרת הכול») — מבטל תזכורות
(`_cancel_invoice`), אבל **לא** את טיוטות התשובה הממתינות (`pending_approval` / `approved` שממתינה לחלון השליחה).
ההסרה (`_opt_out`) כבר עושה זאת מאז critic סבב 58 (`_stop_pending_drafts`) — הסימון של בעל העסק לא.
נבדק: לקוח שאל «איך משלמים?» / «אפשר בתשלומים?» / «אשלם ב-12» ⇒ טיוטה ממתינה ⇒ בעל העסק מסמן «נפטר/ה — המשפחה
הודיעה» ⇒ «אשר ושלח» (מכל אחד — גם עובד/ת, גם מתור האישורים בבוקר) ⇒ 200 ונשלח: «אפשר לשלם (1,200 ₪) בקישור
המאובטח…» / «הצעה לפריסת 1,200 ₪…» — בקשת תשלום למשפחת נפטר/ת, לקטין/ה, למי שבהליך. אותו דבר ל-minor ול-insolvency.
הצעה: `set_hold` ⇒ `_stop_pending_drafts(cid)` (כמו בהסרה) + `approve_draft` מסרב על OWNER_HOLDS.
xfail(strict=True); בקרה ירוקה."""
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


def _pending_then_hold(svc, msg, hold):
    svc.sync()
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    r = svc.inbound("sms", "050-1234567", msg)
    return api, r["draft_id"]


def _sent_after(svc, n0):
    return svc.db.q("SELECT body FROM messages WHERE customer_id=1 AND direction='out' AND id>?", (n0,))


@pytest.mark.xfail(strict=True, reason="205🔴: טיוטה ממתינה יוצאת אחרי סימון קטין/פטירה/חדלות פירעון")
@pytest.mark.parametrize("hold", ["deceased", "minor", "insolvency"])
@pytest.mark.parametrize("msg", ["איך משלמים?", "קשה לי לשלם הכל, אפשר בתשלומים?"])
def test_owner_hold_stops_pending_reply(svc, hold, msg):
    api, did = _pending_then_hold(svc, msg, hold)
    n0 = svc.db.one("SELECT COALESCE(MAX(id),0) AS n FROM messages")["n"]
    svc.set_hold(1, hold, "המשפחה הודיעה — לא לפנות", "owner")
    api.post(f"/conversation/drafts/{did}/approve", json={"confirm_amount": True})
    sent = _sent_after(svc, n0)
    assert not sent, sent[0]["body"][:80]


@pytest.mark.xfail(strict=True, reason="205🔴: טיוטה שאושרה וממתינה לחלון יוצאת אחרי סימון פטירה")
def test_owner_hold_stops_approved_waiting_for_window(svc):
    _api, did = _pending_then_hold(svc, "איך משלמים?", "deceased")
    svc.db.x("UPDATE drafts SET status='approved' WHERE id=?", (did,))      # אושרה, ממתינה לחלון השליחה
    n0 = svc.db.one("SELECT COALESCE(MAX(id),0) AS n FROM messages")["n"]
    svc.set_hold(1, "deceased", "המשפחה הודיעה — לא לפנות", "owner")
    svc.dispatch()                                                         # ה-cron של השליחה
    sent = _sent_after(svc, n0)
    assert not sent, sent[0]["body"][:80]


def test_control_optout_already_stops_pending(svc):
    api, did = _pending_then_hold(svc, "איך משלמים?", None)
    api.post("/customers/1/opt-out")
    assert api.post(f"/conversation/drafts/{did}/approve", json={}).status_code == 409

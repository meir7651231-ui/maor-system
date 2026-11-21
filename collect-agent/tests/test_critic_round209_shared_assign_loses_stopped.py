"""מבקר סבב 209 · 🟡 — אחרי הכרעה בכרטיס כתובת משותפת, התשובה שנעצרה ללקוח שלא קשור אובדת בשקט.

רכיבים: `app/inbox.py` → `_stop_approved` (מנהל 361: פנייה דחופה מכתובת משותפת עוצרת `approved` של **כל** המקושרים,
`system:protective_reply`) + `assign_shared_card` (POST /owner/shared-cards/{id}/assign) — לא מחזיר/מסמן את מה שנעצר.
נבדק: דנה (1) ויוסי (2) על אותו טלפון; שניהם שאלו «איך משלמים?» והתשובות אושרו וממתינות לחלון ⇒ מאותו טלפון «אני בן
15» ⇒ שתי התשובות superseded, הכרטיס: «עצרנו 2 תשובות שאישרת…» ⇒ בעל העסק בוחר «ההודעה של דנה» ⇒ דנה: minor + כרטיס ✓;
**יוסי:** התשובה שלו נשארת superseded, אין טיוטה חדשה, אין כרטיס, אין השהיה — השאלה שלו לא תיענה ואף אחד לא יודע.
«אף אחד מהם» ⇒ שתיהן אובדות ולא נשאר שום כרטיס. הצעה: בהכרעה — התשובות שנעצרו ללקוחות שלא נבחרו חוזרות לתור
(pending_approval, לאישור מחדש) או כרטיס «התשובה ל-X נעצרה — לשלוח?». תוקן במנהל 364 (החזרה לתור לאישור מחדש)."""
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


def _setup(svc, fake_gi):
    fake_gi.docs[1]["client"]["phone"] = "050-1234567"      # דנה ויוסי על אותו טלפון
    svc.sync()
    ids = {}
    for cid in (1, 2):
        c = svc.db.one("SELECT * FROM customers WHERE id=?", (cid,))
        r = svc.inbox.handle_customer(c, "sms", "איך משלמים?")
        svc.db.x("UPDATE drafts SET status='approved' WHERE id=?", (r["draft_id"],))
        ids[cid] = r["draft_id"]
    card = svc.inbound("sms", "050-1234567", "אני בן 15")["card_id"]
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH), ids, card


def _visible(svc, cid, stopped_id):
    """התשובה שנעצרה חזרה לתור, או שיש טיוטה/כרטיס חדש ללקוח."""
    st = svc.db.one("SELECT status FROM drafts WHERE id=?", (stopped_id,))["status"]
    back = st in ("pending_approval", "approved")
    new = svc.db.one("SELECT 1 FROM drafts WHERE customer_id=? AND id!=? AND status IN "
                     "('pending_approval','needs_owner')", (cid, stopped_id))
    return back or bool(new)


def test_unrelated_customer_stopped_reply_not_lost(svc, fake_gi):
    api, ids, card = _setup(svc, fake_gi)
    assert api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": 1}).status_code == 200
    assert _visible(svc, 2, ids[2])


def test_none_of_them_stopped_replies_not_lost(svc, fake_gi):
    api, ids, card = _setup(svc, fake_gi)
    assert api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": None}).status_code == 200
    assert _visible(svc, 1, ids[1]) and _visible(svc, 2, ids[2])


def test_control_assigned_customer_gets_card(svc, fake_gi):
    api, _ids, card = _setup(svc, fake_gi)
    api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": 1})
    assert svc.db.one("SELECT paused_reason FROM customers WHERE id=1")["paused_reason"] == "minor"

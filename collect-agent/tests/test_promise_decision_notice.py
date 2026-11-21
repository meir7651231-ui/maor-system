"""מבקר 197א+ב (תיקון): הכרעת בעל העסק על הבטחה מעבר ל-14 יום מגיעה ללקוח — בנוסח הנכון, ולא בלי אישור.

השעון: 8.11.2026; «I'll pay on November 25» ⇒ מבוקש 25.11, התקבל עד 22.11."""
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

DANA = "050-1234567"


def _setup(svc):
    svc.sync()
    r = svc.inbound("sms", DANA, "I'll pay on November 25")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    cid = svc.db.one("SELECT id FROM customers WHERE external_id='cl1'")["id"]
    return api, cid, r["draft_id"]


def _draft(svc, did):
    return svc.db.one("SELECT * FROM drafts WHERE id=?", (did,))


def test_pending_draft_rewritten_on_approve(svc):
    api, cid, did = _setup(svc)
    r = api.post(f"/customers/{cid}/promise-request", json={"approve": True}).json()
    assert r["customer_update"]["replaced"] == [did]
    assert _draft(svc, did)["status"] == "superseded"   # לא נכתב מחדש במקום — מה שיוצא = מה שאושר
    d = _draft(svc, r["customer_update"]["draft"])
    assert "בעל העסק אישר" in d["body"] and "25.11" in d["body"] and d["status"] == "pending_approval"
    assert "להפסקה" in d["body"]   # אפשרות הסרה נשמרת


def test_pending_draft_rewritten_on_refuse_names_cap(svc):
    api, cid, did = _setup(svc)
    r = api.post(f"/customers/{cid}/promise-request", json={"approve": False}).json()
    body = _draft(svc, r["customer_update"]["draft"])["body"]
    assert "22.11" in body and "התזכורות יחזרו" in body and "אישר" not in body


def test_update_after_sent_waits_for_owner_and_sends_cleanly(svc):
    api, cid, did = _setup(svc)
    assert api.post(f"/conversation/drafts/{did}/approve", json={}).status_code == 200
    r = api.post(f"/customers/{cid}/promise-request", json={"approve": False}).json()
    new = r["customer_update"]["draft"]
    assert r["customer_update"]["replaced"] == []   # התשובה כבר יצאה — לא נגעו בה
    d = _draft(svc, new)
    assert d["status"] == "pending_approval" and d["sent_at"] is None   # לא יוצא לבד
    assert "22.11" in d["body"]
    # עובר את מסנן הניסוח ויוצא אחרי אישור
    assert api.post(f"/conversation/drafts/{new}/approve", json={}).status_code == 200
    assert _draft(svc, new)["status"] in ("sent_dry_run", "approved")


def test_opted_out_customer_gets_no_update(svc):
    api, cid, did = _setup(svc)
    assert api.post(f"/conversation/drafts/{did}/approve", json={}).status_code == 200
    svc.db.x("UPDATE customers SET opted_out=1 WHERE id=?", (cid,))
    n = svc.db.one("SELECT COUNT(*) n FROM drafts WHERE customer_id=?", (cid,))["n"]
    r = api.post(f"/customers/{cid}/promise-request", json={"approve": True}).json()
    assert r["customer_update"] is None
    assert svc.db.one("SELECT COUNT(*) n FROM drafts WHERE customer_id=?", (cid,))["n"] == n


def test_approved_unsent_draft_is_replaced_and_needs_reapproval(svc):
    """טיוטה שאושרה אבל עוד לא יצאה (מחוץ לחלון) ⇒ לא יוצאת בנוסח הישן; החדשה ממתינה לאישור."""
    api, cid, did = _setup(svc)
    svc.db.x("UPDATE drafts SET status='approved' WHERE id=?", (did,))
    r = api.post(f"/customers/{cid}/promise-request", json={"approve": True}).json()
    assert _draft(svc, did)["status"] == "superseded"
    assert _draft(svc, r["customer_update"]["draft"])["status"] == "pending_approval"


def _long_names(svc):
    """מנהל 351 (מבקר 199): שם עסק 40 תווים (התקרה בהגדרות) + שם פרטי ארוך ⇒ הסירוב יצא 274 תווים (> 268),
    בעל העסק אישר והטיוטה נדחתה בשער — הלקוח לא שמע על ההכרעה."""
    import dataclasses
    svc.s = dataclasses.replace(svc.s, business_name="מספרת הדוגמניות של רחוב הרצל בתל אביב",
                                public_base_url="https://pay.gabi-reminders.co.il")
    api, cid, did = _setup(svc)
    svc.db.x("UPDATE customers SET name='אלכסנדרה-מרגריטה כהן' WHERE id=?", (cid,))
    assert api.post(f"/conversation/drafts/{did}/approve", json={}).status_code == 200
    return api, cid


def test_long_names_refusal_update_fits_and_is_sent(svc):
    from app import compliance
    api, cid = _long_names(svc)
    r = api.post(f"/customers/{cid}/promise-request", json={"approve": False}).json()
    new = r["customer_update"]["draft"]
    body = _draft(svc, new)["body"]
    assert len(body) <= compliance.SMS_REPLY_MAX, (len(body), body)
    assert body.startswith("מספרת הדוגמניות של רחוב הרצל בתל אביב:")
    assert "22.11" in body and "25.11" in body and "התזכורות יחזרו" in body and "להפסקה" in body
    assert api.post(f"/conversation/drafts/{new}/approve", json={}).status_code == 200
    assert _draft(svc, new)["status"] == "sent_dry_run"


def test_long_names_approval_update_fits(svc):
    from app import compliance
    api, cid = _long_names(svc)
    r = api.post(f"/customers/{cid}/promise-request", json={"approve": True}).json()
    body = _draft(svc, r["customer_update"]["draft"])["body"]
    assert len(body) <= compliance.SMS_REPLY_MAX and "בעל העסק אישר" in body and "25.11" in body


def test_short_names_keep_full_wording(svc):
    """בקרה: שם רגיל ⇒ הנוסח המלא (עם שם היום ו«אם יש קושי»)."""
    api, cid, did = _setup(svc)
    r = api.post(f"/customers/{cid}/promise-request", json={"approve": False}).json()
    body = _draft(svc, r["customer_update"]["draft"])["body"]
    assert "יום ראשון 22.11" in body and "אם יש קושי" in body

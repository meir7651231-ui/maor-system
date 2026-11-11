"""הפעלה 123 — סכום חריג מול הרגיל ללקוח (נקודה עשרונית במקום הלא נכון).

באג (לפני התיקון): חשבונית של ₪12,000 ללקוח שמשלם תמיד ₪120–130 (הוקלד 12000 במקום 120.00) נכנסה
לתזכורת כמו כל חוב אחר. האישור הפרטני הציג את הסכום, אבל שום דבר לא הסב את תשומת הלב לחריגה ⇒ אישור
שגרתי ⇒ דרישת תשלום מופרזת פי 100 ללקוח אמיתי.
התיקון: חשבונית שסכומה פי 50 ומעלה מחציון החשבוניות האחרות של הלקוח (אותו מטבע, לפחות 2, וסכום
≥ ₪1,000) ⇒ התראה לבעל העסק + התזכורת מסומנת amount_check ⇒ אישור רק עם confirm_amount מפורש.
הבדיקה נעשית מחדש באישור עצמו (גם אחרי בנייה מחדש של ההודעה).
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app
from app.policy import amount_outlier
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc


def _api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _docs(*amounts):
    return [gi_doc(i + 1, amount=a, client_id="cl-same") for i, a in enumerate(amounts)]


def test_rule_unit():
    assert amount_outlier(1_200_000, [12_000, 13_000]) == 12_500          # פי 96 ⇒ חריג
    assert amount_outlier(1_200_000, [12_000]) is None                    # היסטוריה קצרה ⇒ לא מנחשים
    assert amount_outlier(1_200_000, []) is None                          # לקוח חדש
    assert amount_outlier(500_000, [12_000, 13_000]) is None              # פי 40 ⇒ לא חריג
    assert amount_outlier(90_000, [1_000, 1_000]) is None                 # פי 90 אבל < ₪1,000
    assert amount_outlier(625_000, [12_000, 13_000]) == 12_500            # בדיוק פי 50 ⇒ גבול כולל
    assert amount_outlier(1_200_000, [0, 12_000, 13_000]) == 12_500       # אפס לא נספר


def test_e2e_outlier_needs_explicit_confirm(svc, fake_gi):
    fake_gi.docs = _docs("120.00", "130.00", "12000.00")
    api = _api(svc)
    assert api.post("/sync").json()["open"] == 3
    created = api.post("/plan").json()["created"]
    assert len(created) == 1
    rid = created[0]
    rem = svc.db.one("SELECT block_reason FROM reminders WHERE id=?", (rid,))
    assert rem["block_reason"] == "amount_check"
    notes = svc.db.q("SELECT body FROM messages WHERE intent='amount_check'")
    assert len(notes) == 1 and "1003" in notes[0]["body"] and "נקודה העשרונית" in notes[0]["body"]
    pv = api.get(f"/reminders/{rid}/preview").json()
    assert [x["number"] for x in pv["amount_check"]] == ["1003"]
    assert pv["amount_check"][0]["usual_agorot"] == 12_500
    # אישור רגיל ⇒ נדחה
    r = api.post(f"/reminders/{rid}/approve")
    assert r.status_code >= 400 and "confirm_amount" in r.text
    r = api.post(f"/reminders/{rid}/approve", json={"confirm_amount": "yes"})   # רק true מפורש
    assert r.status_code >= 400
    assert api.post(f"/reminders/{rid}/approve", json={"confirm_amount": True}).status_code == 200
    assert svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))["status"] == "approved"
    # תכנון חוזר לא מוסיף התראה כפולה
    api.post("/plan")
    assert len(svc.db.q("SELECT 1 FROM messages WHERE intent='amount_check'")) == 1


def test_control_normal_amounts_unchanged(svc, fake_gi):
    fake_gi.docs = _docs("120.00", "130.00", "150.00")
    api = _api(svc)
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    assert svc.db.one("SELECT block_reason FROM reminders WHERE id=?", (rid,))["block_reason"] is None
    assert api.get(f"/reminders/{rid}/preview").json()["amount_check"] == []
    assert api.post(f"/reminders/{rid}/approve").status_code == 200
    assert not svc.db.q("SELECT 1 FROM messages WHERE intent='amount_check'")


def test_control_new_customer_big_invoice_not_flagged(svc, fake_gi):
    fake_gi.docs = [gi_doc(1, amount="50000.00")]
    api = _api(svc)
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    assert api.post(f"/reminders/{rid}/approve").status_code == 200


def test_closed_history_counts(svc, fake_gi):
    """לקוח ששילם בעבר ₪120 פעמיים (נסגרו) ועכשיו חשבונית פתוחה אחת של ₪12,000 ⇒ חריג."""
    fake_gi.docs = _docs("120.00", "120.00")
    api = _api(svc)
    api.post("/sync")
    fake_gi.docs = [gi_doc(3, amount="12000.00", client_id="cl-same")]
    api.post("/sync")
    assert svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='closed'")["n"] == 2
    rid = api.post("/plan").json()["created"][0]
    assert svc.db.one("SELECT block_reason FROM reminders WHERE id=?", (rid,))["block_reason"] == "amount_check"
    assert api.post(f"/reminders/{rid}/approve").status_code >= 400

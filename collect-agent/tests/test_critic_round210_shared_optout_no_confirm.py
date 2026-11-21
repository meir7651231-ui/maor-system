"""מבקר סבב 210 · 🟡 — «הסר» מכתובת משותפת: כולם מוסרים, אבל אישור ההסרה לא נוסח אף פעם.

רכיבים: `app/inbox.py` → מסלול כתובת משותפת (`shared_contact_urgent`, `_opt_out` על כל המקושרים) + `assign_shared_card`.
פנייה ישירה: «הסר» ⇒ opt_out + טיוטת אישור «הבקשה התקבלה — לא יישלחו אליכם עוד תזכורות…» (לאישור בעל העסק) ✓.
מכתובת משותפת (דנה ויוסי על אותו טלפון): «הסר» ⇒ שניהם opted_out ✓, כרטיס «פנייה דחופה… בחרו למי» — **אין טיוטת אישור**;
גם אחרי «שייך לדנה» / «אף אחד מהם» — אין. מי שביקש להפסיק לא מקבל אישור שהבקשה נקלטה (ואולי ימשיך לבקש / יתלונן),
וזה ההבדל היחיד בין שני המסלולים. xfail(strict=True); בקרה ירוקה."""
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


def _drafts_with_confirm(api):
    return [d for d in api.get("/conversation/drafts").json() if "הבקשה התקבלה" in (d["body"] or "")]


def test_control_direct_optout_drafts_confirmation(svc):
    svc.sync()
    svc.inbound("sms", "050-1234567", "הסר")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    assert _drafts_with_confirm(api)


# מנהל 366: שיוך ללקוח ⇒ אישור הסרה לאותו לקוח (תוקן). «אף אחד מהם» ⇒ השולח אינו אף לקוח — כלל 19.11
# («ספק ⇒ המחמיר מנצח ⇒ לא שולחים לזר») מול הצורך באישור; ההכרעה למאיר — נשאר xfail.
@pytest.mark.parametrize("assign", [1, pytest.param(None, marks=pytest.mark.xfail(
    strict=True, reason="210🟡 הכרעת מאיר: אישור הסרה לכתובת שאינה של אף לקוח מקושר (זר) — לשלוח או לא"))])
def test_shared_optout_drafts_confirmation(svc, fake_gi, assign):
    fake_gi.docs[1]["client"]["phone"] = "050-1234567"
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "הסר")
    assert [c["opted_out"] for c in svc.db.q("SELECT opted_out FROM customers ORDER BY id")][:2] == [1, 1]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post(f"/owner/shared-cards/{r['card_id']}/assign", json={"customer_id": assign})
    assert _drafts_with_confirm(api)


def test_mgr366_shared_optout_confirm_goes_to_chosen_only(svc, fake_gi):
    """מנהל 366: הטיוטה ללקוח שנבחר בלבד, ההסרה נשארת לשניהם, ולקוח שכבר היה מוסר קודם לא מקבל אישור שני."""
    fake_gi.docs[1]["client"]["phone"] = "050-1234567"
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "הסר")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post(f"/owner/shared-cards/{r['card_id']}/assign", json={"customer_id": 1})
    ds = _drafts_with_confirm(api)
    assert len(ds) == 1
    assert svc.db.one("SELECT customer_id FROM drafts WHERE id=?", (ds[0]["id"],))["customer_id"] == 1
    assert [c["opted_out"] for c in svc.db.q("SELECT opted_out FROM customers ORDER BY id")][:2] == [1, 1]


def test_mgr366_already_opted_out_gets_no_second_confirm(svc, fake_gi):
    fake_gi.docs[1]["client"]["phone"] = "050-1234567"
    svc.sync()
    svc.db.x("UPDATE customers SET opted_out=1 WHERE id=1")
    r = svc.inbound("sms", "050-1234567", "הסר")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post(f"/owner/shared-cards/{r['card_id']}/assign", json={"customer_id": 1})
    assert not _drafts_with_confirm(api)


def test_mgr366_shared_optout_confirm_is_sent_after_approval(svc, fake_gi):
    """האישור לא נתקע ברשימת ההסרה של הכתובת (opt_out_ack) — יוצא אחרי אישור בעל העסק, ורק אליו."""
    fake_gi.docs[1]["client"]["phone"] = "050-1234567"
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "הסר")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post(f"/owner/shared-cards/{r['card_id']}/assign", json={"customer_id": 1})
    did = _drafts_with_confirm(api)[0]["id"]
    n0 = svc.db.one("SELECT COALESCE(MAX(id),0) AS n FROM messages")["n"]
    assert api.post(f"/conversation/drafts/{did}/approve", json={"confirm_amount": True}).status_code == 200
    out = svc.db.q("SELECT customer_id, body FROM messages WHERE direction='out' AND id>?", (n0,))
    assert [o["customer_id"] for o in out] == [1] and "הבקשה התקבלה" in out[0]["body"]

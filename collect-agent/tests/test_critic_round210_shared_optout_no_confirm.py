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


@pytest.mark.xfail(strict=True, reason="210🟡: «הסר» מכתובת משותפת — אין טיוטת אישור הסרה, גם אחרי ההכרעה")
@pytest.mark.parametrize("assign", [1, None])
def test_shared_optout_drafts_confirmation(svc, fake_gi, assign):
    fake_gi.docs[1]["client"]["phone"] = "050-1234567"
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "הסר")
    assert [c["opted_out"] for c in svc.db.q("SELECT opted_out FROM customers ORDER BY id")][:2] == [1, 1]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post(f"/owner/shared-cards/{r['card_id']}/assign", json={"customer_id": assign})
    assert _drafts_with_confirm(api)

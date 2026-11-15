"""שער «אישור רשימת הפתוחות» (גבייה סוכן, 15.11.2026).

מבקר סבב 1 #2: «פתוח בחשבונית ירוקה» ≠ «לא שולם» (ביט/העברה בלי סגירת מסמך). לפני התזכורת הראשונה
בעל העסק מאשר מה עדיין פתוח ומסמן מה כבר שולם. בלי אישור — אין תזכורת.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

pytestmark = pytest.mark.open_review


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def test_gate_is_on_by_default(svc):
    assert svc.s.open_review is True


def test_no_reminder_before_owner_confirms(api, svc):
    api.post("/sync")
    assert api.post("/plan").json()["created"] == []          # היה: תזכורות מיד אחרי sync
    ol = api.get("/open-list").json()
    assert ol["enabled"] and len(ol["pending"]) == 2 and ol["confirmed"] == []


def test_only_confirmed_invoices_get_reminders(api, svc):
    api.post("/sync")
    ids = [x["id"] for x in api.get("/open-list").json()["pending"]]
    r = api.post("/open-list/confirm", json={"still_open": [ids[0]], "paid": [ids[1]]})
    assert r.status_code == 200 and r.json()["pending"] == []
    created = api.post("/plan").json()["created"]
    assert len(created) == 1
    assert svc.reminder_invoice_ids(created[0]) == [ids[0]]


def test_marked_paid_stays_closed_after_resync(api, svc):
    """שולם בביט — המסמך עדיין פתוח בחשבונית ירוקה. סנכרון לא פותח אותו מחדש ולא מתזכר."""
    api.post("/sync")
    paid = api.get("/open-list").json()["pending"][1]["id"]
    api.post("/open-list/confirm", json={"still_open": [], "paid": [paid]})
    api.post("/sync")
    assert svc._invoice(paid)["status"] == "closed"
    assert all(paid not in svc.reminder_invoice_ids(i) for i in api.post("/plan").json()["created"])
    assert any(a["action"] == "open_list_confirmed" for a in api.get("/audit").json())


def test_new_invoice_after_confirm_waits_again(api, svc, fake_gi):
    from tests.conftest import gi_doc
    api.post("/sync")
    api.post("/open-list/confirm",
             json={"still_open": [x["id"] for x in api.get("/open-list").json()["pending"]], "paid": []})
    fake_gi.docs.append(gi_doc(7, phone="052-9998887", name="חדש"))
    api.post("/sync")
    pend = api.get("/open-list").json()["pending"]
    assert [x["number"] for x in pend] == ["1007"]             # רק החדשה ממתינה


@pytest.mark.parametrize("body", [
    {"still_open": [1], "paid": [1]},          # אותה חשבונית בשני הצדדים
    {"still_open": [999]},                      # לא קיימת
    {"still_open": ["1"]}, {"still_open": [True]}, {"other": []}, [1, 2],
])
def test_confirm_validation(api, body):
    api.post("/sync")
    assert api.post("/open-list/confirm", json=body).status_code in (409, 422)


def test_open_list_requires_owner_token(svc):
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert pub.get("/open-list").status_code == 401
    assert pub.post("/open-list/confirm", json={"still_open": []}).status_code == 401


def test_gate_can_be_disabled_explicitly():
    from app.config import load_settings
    assert load_settings({"OPEN_REVIEW": "0"}).open_review is False

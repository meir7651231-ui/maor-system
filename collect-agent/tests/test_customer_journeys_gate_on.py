"""critic סבב 84 · מסלולי הלקוח (test_customer_journeys) רצו עם שער «אישור רשימת הפתוחות» **כבוי** (conftest מכבה
כברירת מחדל), אבל בפרודקשן הוא **דלוק**. כאן אותם מסלולים מרכזיים עם השער דלוק, כמו בעסק אמיתי:
סנכרון ⇒ אין תזכורת ⇒ בעל העסק מאשר ⇒ תזכורת ⇒ מצב סופי; ו«כבר שולם» ברשימה ⇒ אף פעם לא תזכורת."""
import re
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.channels import sent_mark, sent_since
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

pytestmark = pytest.mark.open_review
PHONE = "972501234567"


@pytest.fixture
def env(svc):
    app = create_app(svc, owner_token=OWNER_TOKEN)
    return svc, TestClient(app, headers=AUTH), TestClient(app)


def _mine(svc, ids):
    return [i for i in ids if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1]


def test_day_one_nothing_before_confirm_then_reminder_then_page_stop(env, clock):
    svc, api, pub = env
    api.post("/sync")
    assert api.post("/plan").json()["created"] == []
    assert api.get("/dashboard").json()["totals"]["open_unreviewed"] >= 1
    pend = api.get("/open-list").json()["pending"]
    api.post("/open-list/confirm", json={"still_open": [x["id"] for x in pend], "paid": []})
    assert api.get("/dashboard").json()["totals"]["open_unreviewed"] == 0
    rid = _mine(svc, api.post("/plan").json()["created"])[0]
    assert api.post(f"/reminders/{rid}/approve").status_code == 200
    api.post("/dispatch")
    sms = [m for m in svc.sender.sent if m["to"] == PHONE]
    assert sms
    code = re.search(r"/p/(\w+)", sms[-1]["body"]).group(1)
    pub.post(f"/p/{code}/stop", follow_redirects=False)
    mark = sent_mark(svc.sender.sent)
    clock.now += timedelta(days=8)
    for i in _mine(svc, api.post("/plan").json()["created"]):
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    assert [m for m in sent_since(svc.sender.sent, mark) if m["to"] == PHONE] == []


def test_marked_paid_in_list_is_never_reminded_even_after_resync_and_weeks(env, clock):
    svc, api, _ = env
    api.post("/sync")
    pend = api.get("/open-list").json()["pending"]
    mine = [x["id"] for x in pend if svc._invoice(x["id"])["customer_id"] == 1]
    api.post("/open-list/confirm", json={"still_open": [], "paid": mine})
    for _ in range(3):
        clock.now += timedelta(days=8)
        api.post("/sync")
        for i in _mine(svc, api.post("/plan").json()["created"]):
            api.post(f"/reminders/{i}/approve")
        api.post("/dispatch")
    assert [m for m in svc.sender.sent if m["to"] == PHONE] == []


def test_new_invoice_after_onboarding_waits_and_is_counted(env, clock, fake_gi):
    """אחרי היום הראשון: חשבונית חדשה מהמקור לא מתוזכרת עד אישור — ומופיעה במונה (לא שקטה)."""
    svc, api, _ = env
    api.post("/sync")
    pend = api.get("/open-list").json()["pending"]
    api.post("/open-list/confirm", json={"still_open": [x["id"] for x in pend], "paid": []})
    new = dict(fake_gi.docs[0], id="doc-new", number="7777")
    fake_gi.docs.append(new)
    api.post("/sync")
    assert api.get("/dashboard").json()["totals"]["open_unreviewed"] == 1
    assert [x["number"] for x in api.get("/open-list").json()["pending"]] == ["7777"]

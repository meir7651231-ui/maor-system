"""הכרעת רכז (ממצא גבי שיווק): מועד מוערך (אין dueDate במקור ⇒ **הנפקה+30**) לא מוסתר.

ברירת המחדל לא משתנה (בעל העסק ממילא מאשר), אבל:
  1. due_estimated יוצא ב-/dashboard, ב-/open-list וב-preview של תזכורת.
  2. ברשימת הפתוחות בעל העסק מתקן את המועד לפני «עדיין פתוח» (POST עם due) ⇒ ה«מוערך» מתבטל,
     והסנכרון הבא לא דורס את המועד שקבע.
  3. plan() לא בונה תזכורת על מועד מוערך לפני שבעל העסק אישר את החשבונית ברשימה.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.fixture
def no_due(fake_gi):
    del fake_gi.docs[0]["dueDate"]    # doc1: documentDate 2026-09-15, בלי dueDate ⇒ 2026-10-15 מוערך
    return fake_gi


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _inv(svc, n="1001"):
    return svc.db.one("SELECT * FROM invoices WHERE number=?", (n,))


def test_estimated_persisted_and_exposed_everywhere(svc, no_due, api):
    svc.sync()
    est, real = _inv(svc), _inv(svc, "1002")
    assert est["due"] == "2026-10-15" and est["due_estimated"] == 1     # הנפקה+30, לא «שוטף+30»
    assert real["due_estimated"] == 0
    ol = {x["number"]: x for x in api.get("/open-list").json()["pending"] + []}
    assert ol["1001"]["due_estimated"] is True and ol["1002"]["due_estimated"] is False
    for view in ("", "?view=list"):
        rows = {x["number"]: x for x in api.get("/dashboard" + view).json()["invoices"]}
        assert rows["1001"]["due_estimated"] is True and rows["1002"]["due_estimated"] is False
    rids = svc.plan()           # השער כבוי בבדיקה הזו ⇒ נבנות; ה-preview מסמן את המוערכת
    pv = {tuple(p["numbers"]): p for p in (api.get(f"/reminders/{r}/preview").json() for r in rids)}
    assert pv[("1001",)]["due_estimated"] == ["1001"] and pv[("1002",)]["due_estimated"] == []


@pytest.mark.open_review
def test_plan_skips_estimated_until_confirmed(svc, no_due):
    svc.sync()
    assert svc.plan() == []                     # שום חשבונית לא אושרה ברשימה
    real = _inv(svc, "1002")["id"]
    svc.confirm_open_list([real], [])
    made = [svc.reminder_invoice_ids(r) or [svc._reminder(r)["invoice_id"]] for r in svc.plan()]
    assert made == [[real]]                     # המוערכת (1001) עדיין בלי תזכורת
    est = _inv(svc)["id"]
    svc.confirm_open_list([est], [])            # בעל העסק אישר אותה (גם בלי תיקון) ⇒ עכשיו מותר
    assert [svc._reminder(r)["invoice_id"] for r in svc.plan()] == [est]


@pytest.mark.open_review
def test_owner_corrects_due_and_sync_keeps_it(svc, no_due, api):
    svc.sync()
    est = _inv(svc)["id"]
    r = api.post("/open-list/confirm", json={"still_open": [est], "paid": [], "due": {str(est): "2026-11-01"}})
    assert r.status_code == 200, r.text
    assert r.json()["due_fixed"] == [est]
    row = _inv(svc)
    assert row["due"] == "2026-11-01" and row["due_estimated"] == 0 and row["open_reviewed_at"]
    svc.sync()                                  # המקור עדיין בלי dueDate ⇒ לא חוזר ל-10-15/«מוערך»
    row = _inv(svc)
    assert row["due"] == "2026-11-01" and row["due_estimated"] == 0
    assert any(x["number"] == "1001" and x["due_estimated"] is False
               for x in api.get("/open-list").json()["confirmed"])
    audit = svc.db.one("SELECT detail FROM audit WHERE action='open_list_confirmed' ORDER BY id DESC")
    assert str(est) in audit["detail"]


@pytest.mark.open_review
@pytest.mark.parametrize("body", [
    {"still_open": [], "paid": [], "due": {"1": "2026-11-01"}},          # תיקון בלי «עדיין פתוח»
    {"still_open": [1], "paid": [], "due": {"1": "1.11.2026"}},          # פורמט
    {"still_open": [1], "paid": [], "due": {"1": "2026-02-30"}},         # תאריך לא קיים
])
def test_bad_due_rejected_nothing_changes(svc, no_due, api, body):
    svc.sync()
    before = dict(_inv(svc))
    assert api.post("/open-list/confirm", json=body).status_code == 409   # ValueError ⇒ 409, כמו שאר דחיות האישור
    assert dict(_inv(svc)) == before


@pytest.mark.parametrize("body", [{"still_open": [1], "paid": [], "due": ["2026-11-01"]},
                                  {"still_open": [1], "paid": [], "due": {"x": "2026-11-01"}},
                                  {"still_open": [1], "paid": [], "due": {"1": 20261101}}])
def test_due_shape_422(api, body):
    assert api.post("/open-list/confirm", json=body).status_code == 422


def test_paid_with_due_rejected(svc, no_due):
    svc.sync()
    est = _inv(svc)["id"]
    with pytest.raises(ValueError):
        svc.confirm_open_list([], [est], due={est: "2026-11-01"})
    assert _inv(svc)["status"] == "open"

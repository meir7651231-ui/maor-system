"""מנהל 334 (הבא של עיצוב מ-332/333): בעל העסק לא ראה בכלל הסדר אחרי שאישר אותו — `/plans` החזיר רק את
המצב כמחרוזת, והמסך הציג רק `proposed`. הסדר שהוחמץ (332) נעלם מהמסך חוץ מכרטיס חד-פעמי.
עכשיו: `/plans` מחזיר `progress` (שולם/סה״כ/כמה תשלומים כוסו/התשלום הבא) להסדר שאושר/הוחמץ/הושלם, מאותו חישוב
«שולם» של `_sweep_plans` — והמסך מציג כרטיס «הסדרי תשלומים» עם תג מצב."""
from __future__ import annotations

import json
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _approved(svc):
    svc.sync()
    pid = svc.propose_plan(1, 3)
    svc.approve_plan(pid, confirm_amount=True)
    return pid


def _items(svc, pid):
    return json.loads(svc.db.one("SELECT installments FROM plans WHERE id=?", (pid,))["installments"])


def _row(api, pid):
    return next(p for p in api.get("/plans").json() if p["id"] == pid)


def test_proposed_has_no_progress(svc, api):
    svc.sync()
    pid = svc.propose_plan(1, 3)
    assert _row(api, pid)["progress"] is None


def test_fresh_approved_nothing_paid_next_is_first(svc, api):
    pid = _approved(svc)
    items = _items(svc, pid)
    pr = _row(api, pid)["progress"]
    assert pr["paid_agorot"] == 0 and pr["done"] == 0 and pr["count"] == 3
    assert pr["total_agorot"] == sum(i["amount_agorot"] for i in items)
    assert pr["next"] == {"n": 1, "due": items[0]["due"], "amount_agorot": items[0]["amount_agorot"]}


def test_after_first_payment_next_is_second(svc, api):
    pid = _approved(svc)
    items = _items(svc, pid)
    svc.db.x("UPDATE invoices SET amount_agorot=amount_agorot-? WHERE customer_id=1", (items[0]["amount_agorot"],))
    pr = _row(api, pid)["progress"]
    assert pr["paid_agorot"] == items[0]["amount_agorot"] and pr["done"] == 1
    assert pr["next"]["n"] == 2


def test_partial_payment_does_not_count_installment(svc, api):
    pid = _approved(svc)
    items = _items(svc, pid)
    short = items[0]["amount_agorot"] - 100
    svc.db.x("UPDATE invoices SET amount_agorot=amount_agorot-? WHERE customer_id=1", (short,))
    pr = _row(api, pid)["progress"]
    assert pr["done"] == 0 and pr["next"]["n"] == 1


def test_missed_and_completed_carry_progress(svc, api, clock):
    pid = _approved(svc)
    clock.now += timedelta(days=7 + svc.PLAN_GRACE_DAYS + 1)
    svc._sweep_plans()
    row = _row(api, pid)
    assert row["status"] == "missed" and row["progress"]["next"]["n"] == 1
    svc.db.x("UPDATE invoices SET status='paid' WHERE customer_id=1")
    row = _row(api, pid)
    assert row["progress"]["paid_agorot"] == row["progress"]["total_agorot"]
    assert row["progress"]["done"] == 3 and row["progress"]["next"] is None and row["progress"]["open_agorot"] == 0


def test_progress_matches_sweep_paid(svc, clock):
    """אותו «שולם» כמו הסריקה: אם הסריקה לא מסמנת הוחמץ, `next` לא מועד שעבר מעבר לחסד."""
    pid = _approved(svc)
    items = _items(svc, pid)
    svc.db.x("UPDATE invoices SET amount_agorot=amount_agorot-? WHERE customer_id=1", (items[0]["amount_agorot"],))
    clock.now += timedelta(days=7 + 10 + svc.PLAN_GRACE_DAYS)
    assert svc._sweep_plans()["missed"] == []
    p = svc.db.one("SELECT * FROM plans WHERE id=?", (pid,))
    nxt = svc.plan_progress(p)["next"]
    assert date.fromisoformat(nxt["due"]) >= clock.now.date() - timedelta(days=svc.PLAN_GRACE_DAYS)

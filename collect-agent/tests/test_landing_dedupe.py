"""הפעלה 210 — דדופ בצד השרת לפעולות עמוד החייב (פתוח מ-209).

PRG (209) מונע שליחה כפולה ברענון, אבל לא לחיצה כפולה מהירה, שליחה משני מכשירים או «חזרה» לטופס
ושליחה מחדש. לפני: כל שליחה של «שילמתי» יצרה כרטיס נוסף אצל בעל העסק; כל «פריסה» יצרה הסדר נוסף,
דחתה את הקודם, והכרטיס הקודם נשאר פתוח ומצביע על הסדר שנדחה. אחרי: אותו טקסט, אותו לקוח, תוך 30 דקות,
כשהכרטיס עדיין פתוח ⇒ בלי פעולה חדשה (רק audit `landing_duplicate`).
"""
from __future__ import annotations

from datetime import timedelta

from tests.test_landing_prg import _counts, _setup

FORM = {"content-type": "application/x-www-form-urlencoded"}


def _open_cards(svc):
    return svc.db.one("SELECT COUNT(*) n FROM drafts WHERE status IN ('pending_approval','needs_owner')")["n"]


def test_double_paid_creates_one_card(svc):
    api, code = _setup(svc)
    api.post(f"/p/{code}/paid")
    before = _counts(svc)
    r = api.post(f"/p/{code}/paid", follow_redirects=False)
    assert r.status_code == 303 and r.headers["location"] == f"/p/{code}/done?a=paid"   # החייב רואה «התקבל»
    after = _counts(svc)
    assert after["drafts"] == before["drafts"] and after["messages"] == before["messages"]
    assert _open_cards(svc) == 1
    assert svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='landing_duplicate'")["n"] == 1


def test_double_plan_keeps_one_plan_and_no_stale_card(svc):
    api, code = _setup(svc)
    for _ in range(3):
        api.post(f"/p/{code}/plan", content="n=3", headers=FORM)
    plans = svc.db.q("SELECT status FROM plans")
    assert [p["status"] for p in plans] == ["proposed"]          # לא נוצר הסדר שני שדוחה את הראשון
    assert _open_cards(svc) == 1


def test_different_installments_is_a_new_request(svc):
    api, code = _setup(svc)
    api.post(f"/p/{code}/plan", content="n=3", headers=FORM)
    n = _counts(svc)["drafts"]
    api.post(f"/p/{code}/plan", content="n=4", headers=FORM)
    assert _counts(svc)["drafts"] == n + 1


def test_after_window_or_owner_decision_counts_again(svc, clock):
    api, code = _setup(svc)
    api.post(f"/p/{code}/paid")
    clock.now += timedelta(minutes=31)
    n = _counts(svc)["drafts"]
    api.post(f"/p/{code}/paid")
    assert _counts(svc)["drafts"] == n + 1                      # עבר הזמן ⇒ דיווח חדש
    did = svc.db.one("SELECT MAX(id) m FROM drafts")["m"]
    svc.inbox.reject_draft(did)                                 # בעל העסק סגר את הכרטיס
    api.post(f"/p/{code}/paid")
    assert _counts(svc)["drafts"] == n + 2                      # כרטיס סגור ⇒ דיווח חדש נספר


def test_sms_paid_not_deduped_by_web(svc):
    """הדדופ חל רק על העמוד (channel='web'); «שילמתי» ב-SMS עדיין עובר את מנוע השיחה כרגיל."""
    api, code = _setup(svc)
    api.post(f"/p/{code}/paid")
    n = _counts(svc)["messages"]
    phone = svc.db.one("SELECT phone FROM customers WHERE phone IS NOT NULL LIMIT 1")["phone"]
    svc.inbound("sms", phone, "שילמתי")
    assert _counts(svc)["messages"] > n

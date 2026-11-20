"""מנהל 336 · כרטיס «הסדרי תשלומים» גם בדשבורד הפשוט (/ui) — עד היום רק ב-/app/ (מנהל 334).

החור: בעל עסק שעובד רק ב-/ui (גם demo.sh בלי build) אישר הסדר ⇒ ההסדר נעלם מהמסך; הסדר שהוחמץ (332) החזיר את
התזכורות הרגילות לתור בלי שום הסבר במסך. עכשיו: GET /plans (עם `customer` — אדיטיבי) ⇒ כרטיס קריאה-בלבד: הוחמצו
ראשונים, פעילים לפי מועד התשלום הבא, עד 3 שהושלמו; פס התקדמות, «שולם X מתוך Y», «הבא», בסכום ובמטבע ההסדר.
ההתנהגות בדפדפן מול שרת DEMO=1 אמיתי: web/e2e/ui-plans.mjs (רץ ב-CI). כאן חוזה השרת + הגנות-מקור.
"""
from __future__ import annotations

import re
from datetime import timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

ROOT = Path(__file__).resolve().parent.parent
UI = (ROOT / "app/ui.html").read_text(encoding="utf-8")
WF = (ROOT.parent / ".github/workflows/collect-agent.yml").read_text(encoding="utf-8")


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _row(api, pid):
    return next(p for p in api.get("/plans").json() if p["id"] == pid)


def test_plans_api_carries_customer_name(svc, api):
    svc.sync()
    pid = svc.propose_plan(1, 3)
    name = svc.db.one("SELECT name FROM customers WHERE id=1")["name"]
    assert name and _row(api, pid)["customer"] == name


def test_deleted_customer_name_is_empty_not_crash(svc, api):
    svc.sync()
    pid = svc.propose_plan(1, 3)
    svc.db.x("UPDATE customers SET name='' WHERE id=1")
    assert _row(api, pid)["customer"] == ""
    assert "לקוח שפרטיו נמחקו (#${p.customer_id})" in UI


def test_missed_plan_has_progress_for_card(svc, api, clock):
    """הסדר שהוחמץ — בדיוק מה שהכרטיס צריך: progress עם next בעבר (⇒ «באיחור»)."""
    svc.sync()
    pid = svc.propose_plan(1, 2)
    svc.approve_plan(pid, confirm_amount=True)
    assert _row(api, pid)["progress"]["done"] == 0
    clock.now += timedelta(days=20)
    svc.sync()
    svc.plan()
    r = _row(api, pid)
    assert r["status"] == "missed" and r["progress"]["next"]["due"] < clock.now.date().isoformat()


def test_dashboard_loads_plans_with_today():
    m = re.search(r"async function loadDash\(ask\)\{(.*?)\n\}", UI, re.S)
    assert m and "await loadPlans(d.today)" in m.group(1), "/ui לא טוען את ההסדרים עם הדשבורד"
    assert 'api("/plans",{},false)' in UI


def test_order_and_badges_mirror_app():
    """אותו סדר כמו plansVisible ב-web/src/lib/plans.ts: missed→approved→completed (עד 3 חדשים)."""
    assert "PL_ORD={missed:0,approved:1,completed:2},PL_DONE=3" in UI
    for label in ("פעיל", "תשלום לא התקבל", "הושלם"):
        assert f'"{label}"' in UI
    web = (ROOT / "web/src/lib/plans.ts").read_text(encoding="utf-8")
    for label in ("פעיל", "תשלום לא התקבל", "הושלם"):
        assert f"'{label}'" in web, "התגים ב-/ui וב-/app/ התפצלו"


def test_amounts_in_plan_currency_not_fixed_ils():
    """מבקר 185: כרטיס ההסדר מציג במטבע ההסדר — לא money() הקבוע ב-₪."""
    seg = UI[UI.index("function drawPlans()"):UI.index("async function load(ask=true)")]
    assert "fmtCur(pr.paid_agorot,c)" in seg and "fmtCur(pr.total_agorot,c)" in seg
    assert "money(" not in seg and "money(" not in UI[UI.index("function plNext"):UI.index("const plWho")]


def test_lock_clears_plans():
    m = re.search(r"function lock\(had\)\{(.*?)\n  \$\(\"#lockMsg\"\)", UI, re.S)
    body = m.group(1) if m else ""
    assert '$("#plList").innerHTML=""' in body and "plItems=[]" in body and '$("#pl").hidden=true' in body


def test_escaped_customer_name():
    assert "${esc(plWho(p))}" in UI


def test_browser_check_runs_in_ci():
    assert (ROOT / "web/e2e/ui-plans.mjs").is_file()
    assert "node e2e/ui-plans.mjs" in WF

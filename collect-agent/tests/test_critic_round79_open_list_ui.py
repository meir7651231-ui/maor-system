"""critic סבב 79 · 🔴 שער «אישור רשימת הפתוחות» (986156dc) דלוק כברירת מחדל, אבל לבעל העסק אין שום משטח שמאשר:
ב-web/src וב-/ui אין קריאה ל-/open-list, ו-/dashboard לא מספר כמה ממתינות. רק הדמו מאשר בעצמו (app/demo.py).
⇒ כל חשבונית חדשה (סנכרון/CSV) נשארת ממתינה לנצח, גבי לא שולח כלום, ובעל העסק לא יודע. (זה גם ה-CI האדום
מאז 986156dc: e2e/live.mjs לא מוצא את תזכורת ה-CSV.) תיקון: מונה ב-/dashboard + כרטיס אישור בדשבורד."""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

pytestmark = pytest.mark.open_review
ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def test_dashboard_counts_invoices_waiting_for_owner(api):
    api.post("/sync")
    assert api.get("/dashboard").json()["totals"]["open_unreviewed"] == 2
    ids = [x["id"] for x in api.get("/open-list").json()["pending"]]
    api.post("/open-list/confirm", json={"still_open": ids[:1], "paid": []})
    assert api.get("/dashboard").json()["totals"]["open_unreviewed"] == 1


def test_gate_off_counts_zero(svc):
    import dataclasses
    svc.s = dataclasses.replace(svc.s, open_review=False)
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    assert api.get("/dashboard").json()["totals"]["open_unreviewed"] == 0


def test_owner_app_has_a_surface_for_the_gate():
    """הממשק המעוצב קורא ל-/open-list ול-/open-list/confirm, והדשבורד מציג את הכרטיס."""
    api_ts = (ROOT / "web/src/api.ts").read_text(encoding="utf-8")
    assert "'/open-list'" in api_ts and "'/open-list/confirm'" in api_ts
    dash = (ROOT / "web/src/pages/Dashboard.tsx").read_text(encoding="utf-8")
    assert "OpenListCard" in dash and 'data-testid="open-list"' in (
        ROOT / "web/src/components/OpenListCard.tsx").read_text(encoding="utf-8")

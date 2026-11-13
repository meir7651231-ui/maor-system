"""הפעלה 173 · `/app/` (React) טוען בכל רענון של לוח הבקרה את `/dashboard` המלא ואת
`/reminders?status=pending_approval&view=summary` — שתיהן לא היו דחוסות (`/dashboard` 2.46MB על 5,000 חשבוניות).
עכשיו שתיהן עוברות דרך `gzip_json` כמו תצוגות `view=list` של `/ui` (170): אותו תוכן בדיוק, gzip כשהדפדפן מקבל,
`Vary: Accept-Encoding` תמיד, סירוב (`q=0`/`identity`/`br`) מכובד, ו-`Cache-Control: no-store` (172) נשאר.
התצוגה המלאה של `/reminders` (בלי view) לא נדחסת — רק מה ש-`/app/` מושך בכל רענון.
"""
from __future__ import annotations

import pathlib
import re

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc

APP_PATHS = ["/dashboard", "/reminders?status=pending_approval&view=summary", "/reminders?view=summary"]
API_TS = (pathlib.Path(__file__).parent.parent / "web" / "src" / "api.ts").read_text(encoding="utf-8")


@pytest.fixture
def api(svc, fake_gi):
    fake_gi.docs += [gi_doc(i, phone=f"050-{2000000 + i}", name=f"לקוח {i}", client_id=f"cl{i}")
                     for i in range(10, 70)]
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    c.post("/sync")
    assert c.post("/plan").json()["created"]
    return c


@pytest.mark.parametrize("path", APP_PATHS)
def test_app_views_gzip_same_content(api, path):
    z = api.get(path, headers={"Accept-Encoding": "gzip, deflate, br"})
    plain = api.get(path, headers={"Accept-Encoding": "identity"})
    assert z.status_code == plain.status_code == 200
    assert z.headers["content-encoding"] == "gzip" and "content-encoding" not in plain.headers
    assert "Accept-Encoding" in z.headers["vary"] and "Accept-Encoding" in plain.headers["vary"]
    assert z.headers["content-type"].startswith("application/json")
    assert z.headers["cache-control"] == "no-store" == plain.headers["cache-control"]
    assert z.json() == plain.json() and plain.json()
    assert int(z.headers["content-length"]) * 3 < len(plain.content)


@pytest.mark.parametrize("enc", ["gzip;q=0", "br", "", "identity"])
@pytest.mark.parametrize("path", APP_PATHS)
def test_app_views_refusal_respected(api, path, enc):
    r = api.get(path, headers={"Accept-Encoding": enc})
    assert "content-encoding" not in r.headers and r.json()


def test_summary_status_filter_with_gzip(api):
    rows = api.get("/reminders?status=pending_approval&view=summary", headers={"Accept-Encoding": "gzip"}).json()
    assert rows and all(r["status"] == "pending_approval" for r in rows)
    assert {"id", "invoice_id", "block_reason", "status", "invoice_ids", "amount_drift"} <= set(rows[0])


def test_full_reminders_not_compressed(api):
    """`/reminders` בלי view (גוף + payload) לא מושך בכל רענון — נשאר כמו שהיה."""
    r = api.get("/reminders", headers={"Accept-Encoding": "gzip"})
    assert "content-encoding" not in r.headers and r.json()[0]["payload"] is not None


def test_small_response_not_compressed(svc, fake_gi):
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    r = c.get("/reminders?view=summary", headers={"Accept-Encoding": "gzip"})
    assert r.json() == [] and "content-encoding" not in r.headers and "Accept-Encoding" in r.headers["vary"]


def test_source_guard_app_uses_these_paths():
    """אם `/app/` יעבור לנתיב אחר, הבדיקה הזו נכשלת — שלא נדחוס נתיב שאף אחד לא מושך."""
    assert re.search(r"j<Dashboard>\('/dashboard'\)", API_TS)
    assert "'/reminders?status=pending_approval&view=summary'" in API_TS

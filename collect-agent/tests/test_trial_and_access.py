"""תזכורת סוף ניסיון (הכרעת מאיר) · תיעוד צפייה במידע אישי (תקנות אבטחה) · סנכרון דף הפרטיות.

⚖️ "נאכף בקוד" ≠ "מאושר משפטית" (legal/BETA-GATE.md).
"""
from __future__ import annotations

from datetime import datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import load_settings
from app.db import DB
from app.main import create_app
from app.policy import TZ
from app.service import CollectService
from tests.conftest import AUTH, OWNER_TOKEN

ROOT = Path(__file__).resolve().parents[1]


def _trial_svc(gi_client, clock, start="2026-10-25"):   # ends 8.11
    s = load_settings({"TRIAL_START": start, "SMS_SENDER_ID": "StudioMeir",
                       "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/s"})
    svc = CollectService(s, DB(":memory:"), gi=gi_client, clock=clock)
    return svc, TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _notices(svc):
    return svc.db.q("SELECT * FROM messages WHERE intent='trial_ending' AND needs_owner=1")


# ─────────────── תזכורת סוף ניסיון: 3 ימים לפני, פעם אחת, בלי חיוב ───────────────
@pytest.mark.parametrize("day,left,phrase", [(5, 3, "בעוד 3 ימים"), (6, 2, "בעוד יומיים"),
                                             (7, 1, "מחר")])
def test_trial_notice_window_and_hebrew(gi_client, clock, day, left, phrase):
    svc, api = _trial_svc(gi_client, clock)
    clock.now = datetime(2026, 11, day, 10, 0, tzinfo=TZ)
    assert svc.trial()["days_left"] == left and svc.trial()["ending_soon"]
    api.post("/plan")
    (n,) = _notices(svc)
    assert phrase in n["body"] and "1 ימים" not in n["body"]
    assert "לא יבוצע חיוב אוטומטי" in n["body"]        # הכרעת מאיר: אין חיוב בשלב המוק
    assert n["customer_id"] is None                     # לבעל העסק, לא ללקוח


def test_trial_notice_not_before_window_not_after_end(gi_client, clock):
    svc, api = _trial_svc(gi_client, clock)
    clock.now = datetime(2026, 11, 4, 10, 0, tzinfo=TZ)   # נותרו 4
    api.post("/plan")
    assert _notices(svc) == []
    clock.now = datetime(2026, 11, 8, 10, 0, tzinfo=TZ)   # הסתיים
    assert svc.trial()["active"] is False
    api.post("/plan")
    assert _notices(svc) == []                              # אחרי הסוף: עצירה, לא התראה
    assert svc.dispatch() == []


def test_trial_notice_once_across_days_and_audited(gi_client, clock):
    svc, api = _trial_svc(gi_client, clock)
    for d in (5, 6, 7):
        clock.now = datetime(2026, 11, d, 9, 0, tzinfo=TZ)
        api.post("/plan")
        api.post("/plan")
    assert len(_notices(svc)) == 1
    assert [a["action"] for a in api.get("/audit").json()].count("trial_ending") == 1
    assert api.get("/dashboard").json()["trial"]["ending_soon"] is True


def test_trial_notice_never_reaches_a_customer(gi_client, clock):
    svc, api = _trial_svc(gi_client, clock)
    clock.now = datetime(2026, 11, 5, 10, 0, tzinfo=TZ)
    api.post("/sync")
    api.post("/plan")
    assert all("ניסיון" not in m["body"] for m in svc.sender.sent)


# ─────────────── תיעוד צפייה במידע אישי ───────────────
@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def test_pii_views_are_logged_without_content(api, svc):
    api.post("/sync")
    api.post("/plan")
    for path in ("/dashboard", "/reminders", "/outbox", "/customers"):
        assert api.get(path).status_code == 200
    log = api.get("/access-log").json()
    routes = [r["route"] for r in log]
    for path in ("/dashboard", "/reminders", "/outbox", "/customers", "/access-log"):
        assert path in routes
    assert all(r["actor"] == "owner" and r["at"] for r in log)
    blob = str(log)
    assert "דנה" not in blob and "050" not in blob          # מי ומתי — לא מה
    rid = svc.db.one("SELECT id FROM reminders LIMIT 1")["id"]
    api.get(f"/reminders/{rid}/preview")
    assert api.get("/access-log").json()[1]["path"] == f"/reminders/{rid}/preview"


def test_access_log_not_written_for_rejected_or_non_pii(api, svc):
    api.get("/health")
    TestClient(api.app).get("/dashboard")                   # בלי טוקן ⇒ 401
    assert svc.db.one("SELECT COUNT(*) n FROM access_log")["n"] == 0


def test_access_log_is_append_only(api, svc):
    api.get("/dashboard")
    with pytest.raises(Exception, match="append-only"):
        svc.db.x("DELETE FROM access_log")
    with pytest.raises(Exception, match="append-only"):
        svc.db.x("UPDATE access_log SET actor='x'")


def test_every_pii_read_route_exists():
    from app.main import PII_READ_ROUTES
    app = create_app(CollectService(load_settings({}), DB(":memory:")), owner_token=OWNER_TOKEN)
    paths = {getattr(r, "path", "") for r in app.routes}
    assert PII_READ_ROUTES <= paths, PII_READ_ROUTES - paths   # שינוי שם מסך ⇒ לא נשכח לרשום


# ─────────────── סנכרון דף הפרטיות שהחייב רואה מול legal/PRIVACY.md ───────────────
def test_public_privacy_text_matches_draft_commitments(svc):
    from app import legal
    html = legal.privacy_html("סטודיו מאיר") + legal.draft_footer()
    doc = (ROOT / "legal" / "PRIVACY.md").read_text(encoding="utf-8")
    for commitment in ("טיוטה – לבדיקת עו״ד", "90 יום", "פרסומות", "לשכות אשראי"):
        assert commitment in doc, commitment
        assert commitment in html, commitment               # מה שהחייב רואה = מה שכתוב במדיניות
    assert "placeholder" in html                             # לא ממציאים פרטי חברה

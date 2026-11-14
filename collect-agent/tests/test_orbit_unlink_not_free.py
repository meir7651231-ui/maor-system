"""critic סבב 68: ניתוק מאורביט = חינם לתמיד. עסק מקושר שהמנוי שלו בוטל (או שהניסיון נגמר) לוחץ «ניתוק»
(`/orbit/link/unlink`, טוקן בעל העסק) ⇒ הזכאות נמחקת ⇒ `trial()` חוזר ל«אין TRIAL_START ⇒ active» ⇒ התזכורות
ממשיכות **בלי הגבלה ובלי תשלום**. `.env.example` לא קובע TRIAL_START, כך שבפריסה רגילה זה המצב. אותה משפחה כמו
21.1 (מקושר בלי זכאות). התיקון: עסק **שאי-פעם** היה מקושר — אחרי ניתוק, ניסיון של 14 יום מתאריך הקישור הראשון
(כמו 21.1), לא «פעיל לתמיד». עסק שמעולם לא קושר — כמו היום (PRICING.md). הכרעה הפיכה."""
from __future__ import annotations

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app import orbit_entitlement as oe
from app.main import create_app
from app.orbit_connect import OrbitConnect
from tests.conftest import AUTH, OWNER_TOKEN
from tests.test_orbit_entitlement import ORG, _ent, _ingest, keys  # noqa: F401 (autouse: מפתחות)


def _link(svc):
    return OrbitConnect(svc.db).issue_secret(ORG, at=svc.clock().isoformat())   # כמו בפרודקשן: תאריך אמיתי


@pytest.fixture
def api(svc):
    from app.ratelimit import RateLimiter
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})), headers=AUTH)


def test_unlink_after_cancel_is_not_free_forever(svc, api, clock):
    _link(svc)
    clock.now += timedelta(days=20)                      # הקישור לפני 20 יום (מעבר לניסיון)
    _ingest(svc, _ent(svc, status="cancelled", paid_until=""))
    assert svc.trial()["active"] is False
    assert api.post("/orbit/link/unlink").json() == {"unlinked": True}
    assert oe.current(svc.db) is None
    t = svc.trial()
    assert t["active"] is False, t                       # היה: True ⇒ שליחה בחינם ללא הגבלה
    api.post("/sync")
    assert api.post("/plan").json()["created"] == []


def test_unlink_soon_after_linking_keeps_the_remaining_trial(svc, api, clock):
    _link(svc)
    clock.now += timedelta(days=3)
    api.post("/orbit/link/unlink")
    t = svc.trial()
    assert t["on_trial"] is True and t["active"] is True and t["days_left"] == 11, t


def test_never_linked_is_unchanged(svc):
    t = svc.trial()
    assert t["active"] is True and t["on_trial"] is False      # PRICING.md: כמו היום (TRIAL_START של הפריסה)


def test_invalid_marker_is_conservative(svc, api):
    """סימון פגום לא נותן «ניסיון מהיום» מחדש בכל קריאה (זה היה פעיל-לתמיד בתחפושת)."""
    svc.db.x("INSERT INTO business_settings(key,value,updated_at) VALUES('orbit_first_linked_at','\"x\"','t')")
    assert svc.trial()["active"] is False


def test_marker_is_not_settable_via_settings_api(svc):
    from app.settings_api import overlay
    s2 = overlay(svc.s, {"orbit_first_linked_at": "2000-01-01"})
    assert s2 is svc.s
    assert ORG


def test_relink_does_not_restart_the_trial(svc, api, clock):
    """critic סבב 69: הניסיון של «מקושר בלי זכאות» (21.1) נספר מ-created_at של הקישור **הנוכחי**. ניסיון נגמר ⇒
    «ניתוק» + קישור מחדש (אותו ארגון או אחר) ⇒ created_at = היום ⇒ עוד 14 יום, וכך כל שבועיים = חינם לתמיד.
    הניסיון נספר מהקישור **הראשון** (הסימון של סבב 68), לא מהנוכחי."""
    _link(svc)
    clock.now += timedelta(days=20)
    assert svc.trial()["active"] is False                       # הניסיון נגמר
    api.post("/orbit/link/unlink")
    OrbitConnect(svc.db).issue_secret("other-org", at=svc.clock().isoformat())
    t = svc.trial()
    assert t["active"] is False, t                               # היה: ניסיון חדש של 14 יום
    api.post("/orbit/link/unlink")
    OrbitConnect(svc.db).issue_secret(ORG, at=svc.clock().isoformat())
    assert svc.trial()["active"] is False


def test_paid_business_relinking_is_not_blocked(svc, api, clock):
    """הכיוון ההפוך: עסק משלם שמקושר מחדש ומקבל זכאות פעילה — פעיל (הסימון לא חוסם עסק עם זכאות)."""
    _link(svc)
    clock.now += timedelta(days=40)
    api.post("/orbit/link/unlink")
    _link(svc)
    _ingest(svc, _ent(svc, status="active", paid_until=(clock.now + timedelta(days=20)).date().isoformat()))
    assert svc.trial()["active"] is True and svc.trial()["state"] == "active"

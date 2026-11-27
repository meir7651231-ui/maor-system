"""מבקר סבב 269 (🟡, גבי מנוע): הצטרפות לפני סוף הניסיון — כרטיס «הניסיון מסתיים» לא יורד.

ניסיון אורביט שמסתיים בעוד 3 ימים ⇒ plan() יוצר כרטיס `trial_ending` («תקופת הניסיון של גבי מסתיימת בעוד
3 ימים… לאחריה התזכורות נעצרות… עד שתבחרו להצטרף»). בעל העסק מצטרף באורביט ⇒ זכאות `active` ⇒ השירות
פעיל, אבל הכרטיס נשאר ב«דורש טיפול» ומבקש ממנו להצטרף שוב. מנהל 441 מוריד רק כרטיסי `orbit_billing`.
נבדק תקין [מאומת]: past_due בחסד ⇒ active (גם מעבר monthly⇒yearly) ⇒ כרטיס החסד יורד (441) ✓;
past_due שוב שנה אחר כך ⇒ כרטיס חדש ✓; ניתוק + קישור לארגון אחר עם active ⇒ כרטיסי הארגון הקודם יורדים ✓.
רכיב: app/service.py → _notify_trial_ending / _resolve_orbit_billing_cards (לא כולל intent `trial_ending`).
"""
from __future__ import annotations

from datetime import timedelta

from tests.test_orbit_entitlement import _ent, _ingest, _link, keys  # noqa: F401


def _trial_card(svc):
    return svc.db.q("SELECT needs_owner FROM messages WHERE intent='trial_ending'")


def _trial_then_subscribe(svc, clock):
    _link(svc)
    _ingest(svc, _ent(svc, status="trial", trial_start="2026-10-28", paid_until=""))
    assert svc.trial()["ending_soon"] is True
    svc.plan()
    assert [r["needs_owner"] for r in _trial_card(svc)] == [1]
    clock.now += timedelta(hours=1)
    _ingest(svc, _ent(svc, status="active", trial_start="2026-10-28", paid_until="2026-12-08"))
    svc.plan()


def test_subscribed_service_active_control(svc, clock):
    _trial_then_subscribe(svc, clock)
    assert svc.trial()["state"] == "active" and svc.trial()["active"] is True


def test_trial_ending_card_resolves_after_subscribe(svc, clock):
    _trial_then_subscribe(svc, clock)
    assert [r["needs_owner"] for r in _trial_card(svc)] == [0]

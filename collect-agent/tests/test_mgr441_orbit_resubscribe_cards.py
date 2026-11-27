"""מנהל 441 (מבקר 268א+ב🟡): כרטיסי `orbit_billing` אחרי חידוש מנוי באורביט.

ratchet: (1) ביטול שנשלח שוב בלי חידוש באמצע ⇒ אין כרטיס כפול (המפתח נשמר עד החידוש).
(2) חסד (past_due) ואז תשלום ⇒ גם כרטיס החסד יורד. (3) audit `orbit_billing_resolved` בלי PII.
"""
from __future__ import annotations

import json
from datetime import timedelta

from tests.test_orbit_entitlement import _ent, _ingest, _link, keys  # noqa: F401


def _cards(svc):
    return svc.db.q("SELECT id, message_id, needs_owner FROM messages WHERE intent='orbit_billing' ORDER BY id")


def test_repeated_cancel_without_resume_no_duplicate(svc, clock):
    _link(svc)
    _ingest(svc, _ent(svc, status="active", paid_until="2026-12-08"))
    clock.now += timedelta(minutes=5)
    _ingest(svc, _ent(svc, status="cancelled", paid_until=""))
    svc.plan()
    svc.owner_message_done(_cards(svc)[0]["id"], "owner")
    clock.now += timedelta(days=1)
    _ingest(svc, _ent(svc, status="cancelled", paid_until=""))
    svc.plan()
    svc.plan()
    assert len(_cards(svc)) == 1 and _cards(svc)[0]["needs_owner"] == 0


def test_grace_card_resolves_when_paid(svc, clock):
    _link(svc)
    _ingest(svc, _ent(svc, status="past_due", paid_until=(clock.now.date() - timedelta(days=1)).isoformat()))
    svc.plan()
    assert [c["needs_owner"] for c in _cards(svc)] == [1]
    clock.now += timedelta(minutes=5)
    _ingest(svc, _ent(svc, status="active", paid_until=(clock.now.date() + timedelta(days=30)).isoformat()))
    svc.plan()
    assert [c["needs_owner"] for c in _cards(svc)] == [0]
    a = svc.db.one("SELECT detail FROM audit WHERE action='orbit_billing_resolved'")
    d = json.loads(a["detail"])
    assert d["state"] == "active" and d["open"] == 1 and len(d["cards"]) == 1
    svc.plan()   # אידמפוטנטי — אין audit נוסף
    assert len(svc.db.q("SELECT 1 FROM audit WHERE action='orbit_billing_resolved'")) == 1

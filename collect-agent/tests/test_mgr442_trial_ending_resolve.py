"""מנהל 442 (מבקר 269🟡): הצטרפות לפני סוף הניסיון ⇒ כרטיס «הניסיון מסתיים» יורד מ«דורש טיפול».

שימור: בזמן הניסיון הכרטיס נשאר; ירידה אידמפוטנטית (audit אחד); ההודעה נשמרת בהיסטוריה (לא נמחקת).
"""
from __future__ import annotations

from datetime import timedelta

from tests.test_orbit_entitlement import _ent, _ingest, _link, keys  # noqa: F401


def _cards(svc):
    return svc.db.q("SELECT needs_owner FROM messages WHERE intent='trial_ending'")


def _audits(svc):
    return svc.db.q("SELECT detail FROM audit WHERE action='trial_ending_resolved'")


def test_card_stays_while_still_on_trial(svc, clock):
    _link(svc)
    _ingest(svc, _ent(svc, status="trial", trial_start="2026-10-28", paid_until=""))
    svc.plan()
    clock.now += timedelta(hours=1)
    svc.plan()
    assert [r["needs_owner"] for r in _cards(svc)] == [1]
    assert _audits(svc) == []


def test_resolve_once_and_message_kept(svc, clock):
    _link(svc)
    _ingest(svc, _ent(svc, status="trial", trial_start="2026-10-28", paid_until=""))
    svc.plan()
    clock.now += timedelta(hours=1)
    _ingest(svc, _ent(svc, status="active", trial_start="2026-10-28", paid_until="2026-12-08"))
    svc.plan()
    svc.plan()
    assert [r["needs_owner"] for r in _cards(svc)] == [0]   # נשמרה בהיסטוריה, לא נמחקה
    assert len(_audits(svc)) == 1                           # אידמפוטנטי

"""מבקר סבב 268 (🟡 ×2, גבי מנוע): הרשמה מחדש לגבי דרך אורביט אחרי ביטול מנוי.

נבדק [מאומת]: בזמן ביטול — plan() ו-dispatch() לא מתכננים ולא שולחים ✓; תזכורת שאושרה לפני הביטול
ונשארה 60 יום — אחרי החידוש `approval_expired` ⇒ חוזרת ל«ממתין לאישור», לא נשלחת בשקט ✓ (critic 31).

268א: כרטיס `orbit_billing` («המנוי לגבי דרך אורביט בוטל. תזכורות חדשות לא מתוכננות ולא נשלחות…»)
נשאר ב«דורש טיפול» גם אחרי שאורביט שלח זכאות `active` חדשה והתזכורות חזרו לפעול — בעל העסק רואה
שהשירות עצור כשהוא פועל. אין מסלול שמוריד את הכרטיס (בניגוד ל-227/237).
268ב: המפתח החד-פעמי של ההודעה = `orbit_billing:cancelled:{paid_until}`. ביטול בלי paid_until (מותר
בחוזה) ⇒ המפתח `orbit_billing:cancelled:` זהה בכל ביטול ⇒ ביטול שני, אחרי חידוש, לא מייצר הודעה
(הראשונה כבר סומנה «טופל») — התזכורות נעצרות בשקט.
רכיב: app/orbit_entitlement.py → notice (המפתח) · app/service.py → _notify_orbit_billing (אין פתרון
כרטיסים כשהמצב חוזר ל-active/trial פעיל).
"""
from __future__ import annotations

from datetime import timedelta

import pytest

from tests.test_orbit_entitlement import _ent, _ingest, _link, keys  # noqa: F401


def _cards(svc):
    return svc.db.q("SELECT id, message_id, needs_owner FROM messages WHERE intent='orbit_billing' ORDER BY id")


def _cancel_then_resubscribe(svc, clock):
    _link(svc)
    _ingest(svc, _ent(svc, status="active", paid_until="2026-12-08"))
    clock.now += timedelta(minutes=5)
    _ingest(svc, _ent(svc, status="cancelled", paid_until=""))
    assert svc.plan() == []
    assert [c["needs_owner"] for c in _cards(svc)] == [1]
    clock.now += timedelta(days=30)
    _ingest(svc, _ent(svc, status="active", paid_until="2027-02-08"))


def test_cancel_stops_and_resubscribe_resumes_control(svc, clock):
    _cancel_then_resubscribe(svc, clock)
    assert svc.trial()["active"] is True and svc.trial()["state"] == "active"
    svc.plan()
    assert svc.dispatch() is not None


@pytest.mark.xfail(strict=True, reason="מבקר 268א🟡: כרטיס «המנוי בוטל» נשאר ב«דורש טיפול» אחרי חידוש")
def test_cancelled_card_resolves_after_resubscribe(svc, clock):
    _cancel_then_resubscribe(svc, clock)
    svc.plan()
    assert [c["needs_owner"] for c in _cards(svc)] == [0]


@pytest.mark.xfail(strict=True, reason="מבקר 268ב🟡: ביטול שני בלי paid_until — אותו מפתח, אין הודעה")
def test_second_cancellation_notifies_again(svc, clock):
    _cancel_then_resubscribe(svc, clock)
    first = _cards(svc)[0]["id"]
    svc.owner_message_done(first, "owner")
    svc.plan()
    clock.now += timedelta(days=10)
    _ingest(svc, _ent(svc, status="cancelled", paid_until=""))
    assert svc.plan() == []
    assert [c["needs_owner"] for c in _cards(svc) if c["id"] != first] == [1]

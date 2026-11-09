"""critic סבב 21 (שוחזר): עסק **מקושר** לאורביט (חיוב דרך אורביט, הכרעת מאיר 8.11) שלא קיבל אף זכאות
מאומתת, ובלי TRIAL_START ⇒ trial() מחזיר active לתמיד, כלומר שימוש חינם ללא הגבלה. הזכאות מגיעה ב-fragment
דרך הדפדפן של הלקוח, כך שמספיק להסיר את `&e=` (או שחסר ORBIT_ENTITLEMENT_KEY בשרת).
עכשיו: מקושר בלי זכאות ⇒ ניסיון של trial_days מתאריך הקישור, ואז עצירה."""
from __future__ import annotations

import base64
from datetime import timedelta


def test_linked_without_entitlement_gets_trial_from_link_date_then_stops(svc, clock, monkeypatch):
    from app.orbit_connect import OrbitConnect
    monkeypatch.setenv("COLLECT_MASTER_KEYS", "k1:" + base64.b64encode(b"k" * 32).decode())
    OrbitConnect(svc.db).issue_secret("acme-studio", at=clock.now.isoformat())
    t = svc.trial()
    assert t["on_trial"] is True and t["active"] is True and t["days_left"] == svc.s.trial_days
    clock.now += timedelta(days=svc.s.trial_days + 1)
    t = svc.trial()
    assert t["active"] is False, "עסק מקושר בלי זכאות קיבל שימוש חינם ללא הגבלה"
    svc.sync()
    assert svc.plan() == []


def test_unlinked_business_unchanged(svc, clock):
    clock.now += timedelta(days=400)
    assert svc.trial()["active"] is True     # לא מקושר, בלי TRIAL_START ⇒ כמו היום

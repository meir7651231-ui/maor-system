"""מבקר סבב 274 (שמירה, ללא ממצא): תזכורת שאושרה ונשארה בתור (שירות עצור) — שום מצב לא מתקדם לפני שליחה.

[מאומת] ניסיון פג ⇒ approve ⇒ dispatch ריק: התזכורת `approved` בלי sent_at · `customers.last_sent_at` ריק ·
`reminders_sent`=0 ו-`last_sent`=None ב-/dashboard (הטבלה לא מציגה «נשלחה») · episode_sent=0 (שלב 2 לא מתקדם).
חידוש אחרי 9 ימים ⇒ `approval_expired` ⇒ חוזרת ל«ממתין לאישור» עם התווית «האישור הקודם פג… לאשר מחדש»; plan()
לא בונה תזכורת שנייה. ℹ️ (BACKLOG גבייה עיצוב): בטבלת החשבוניות אין סימן «אושרה וממתינה» לתזכורת שבתור בזמן
עצירה (כמו שנוסף לתשובות ב-443 ולהסדרים ב-447) — הבעלים רואה רק את באנר העצירה.
רכיב: app/service.py → dispatch / episode_sent / _plan_customer.
"""
from __future__ import annotations

from dataclasses import replace
from datetime import timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from app.ratelimit import RateLimiter
from tests.conftest import AUTH, OWNER_TOKEN


def test_queued_reminder_advances_nothing_until_sent(svc, clock):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})), headers=AUTH)
    svc.sync()
    ids = svc.plan()
    assert ids
    svc.s = replace(svc.s, trial_start=(svc.clock().date() - timedelta(days=30)).isoformat())
    for rid in ids:
        assert svc.approve(rid, confirm_open=True)["status"] == "approved"
    assert svc.dispatch() == []
    assert all(r["sent_at"] is None for r in svc.db.q("SELECT sent_at FROM reminders"))
    assert all(c["last_sent_at"] is None for c in svc.db.q("SELECT last_sent_at FROM customers"))
    rows = api.get("/dashboard").json()["invoices"]
    assert all(r["reminders_sent"] == 0 and not r.get("last_sent") for r in rows)
    assert all(svc.episode_sent(c["id"]) == [] for c in svc.db.q("SELECT id FROM customers"))
    clock.now += timedelta(days=9)
    svc.s = replace(svc.s, trial_start="")
    svc.dispatch()
    st = {(r["status"], r["block_reason"]) for r in svc.db.q("SELECT status, block_reason FROM reminders")}
    assert st == {("pending_approval", "approval_expired")}
    assert svc.plan() == []

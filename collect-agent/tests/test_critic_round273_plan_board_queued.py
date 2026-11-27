"""מבקר סבב 273 (🟡, גבייה עיצוב + גבי מנוע): לוח «הסדרי תשלומים» — הסדר שההצעה שלו עדיין בתור מוצג «פעיל».

אחרי מנהל 444/446 הטוסט והשיחה נכונים, אבל `GET /plans` מחזיר להסדר `status: 'approved'` בלי שום סימן שההצעה
לא יצאה, ו-`web/src/lib/plans.ts` מציג אותו «פעיל» + «גבי לא שולח תזכורות על החוב הזה כל עוד משלמים לפי הלוח»
+ «תשלום 1 מתוך 3 · 15.11.2026» — כשהלקוח לא קיבל כלום (שירות עצור / מחוץ לחלון / עצירת שחזור), ואם ההצעה
תידחה כישנה ההסדר פשוט ייעלם מהלוח. [מאומת בדפדפן, ניסיון פג, 390px]
`docs/screens/critic-273-plan-board-queued-390.png`.
מצופה: התשובה מסמנת שההצעה ממתינה (למשל `offer_queued`/`queued_reason`), והלוח מציג «ממתין לשליחה» במקום «פעיל».
רכיב: app/main.py → list_plans · web/src/lib/plans.ts (תווית approved).
"""
from __future__ import annotations

from dataclasses import replace
from datetime import timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from app.ratelimit import RateLimiter
from tests.conftest import AUTH, OWNER_TOKEN


def _queued_plan(svc):
    svc.sync()
    cid = svc.db.one("SELECT customer_id FROM invoices WHERE status='open' ORDER BY id")["customer_id"]
    pid = svc.propose_plan(cid, 3)
    svc.s = replace(svc.s, trial_start=(svc.clock().date() - timedelta(days=30)).isoformat())
    assert svc.approve_plan(pid)["queued"] is True
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})), headers=AUTH)
    return pid, next(p for p in api.get("/plans").json() if p["id"] == pid)


def test_plan_listed_with_progress_control(svc):
    _, p = _queued_plan(svc)
    assert p["status"] == "approved" and p["progress"] is not None


def test_plan_board_marks_offer_not_sent(svc):
    _, p = _queued_plan(svc)
    assert p.get("offer_queued") or p.get("queued_reason") or p["status"] != "approved", p

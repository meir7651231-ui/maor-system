"""critic סבב 66 (טבלת מנגנוני העצירה): כל מנגנון שמגן על **אדם** חל לפי כתובת — הסרה (59), החזקת awaiting_owner
(65) — חוץ ממרווח 72 השעות בין תזכורות, שנאכף רק לפי רשומת לקוח. דנה ורון חולקים נייד ⇒ בכל סבב **שני SMS
גבייה באותה שנייה לאותו נייד** (6 בסך הכול). התיקון: המרווח לפי כתובת. הסה״כ לא משתנה (כל חשבונית מקבלת את
3 התזכורות שלה), אבל שתי תזכורות לא יוצאות לאותו טלפון/מייל בפחות מ-72 שעות."""
from __future__ import annotations

from datetime import timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc

PHONE = "972501234567"


def test_two_customers_on_one_phone_are_spaced(svc, fake_gi, clock):
    fake_gi.docs = [gi_doc(1, phone="050-1234567", name="דנה כהן"),
                    gi_doc(2, phone="050-1234567", name="רון כהן", client_id="cl2")]
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    times = []
    for _ in range(40):                               # 40 סבבים × 12 שעות = 20 יום
        for i in api.post("/plan").json()["created"]:
            api.post(f"/reminders/{i}/approve")
        n0 = len(svc.sender.sent)
        api.post("/dispatch")
        times += [clock.now for m in svc.sender.sent[n0:] if m["to"] == PHONE]
        clock.now += timedelta(hours=12)
    assert len(times) >= 2, times
    gaps = [b - a for a, b in zip(times, times[1:], strict=False)]
    assert all(g >= timedelta(hours=72) for g in gaps), [str(g) for g in gaps]

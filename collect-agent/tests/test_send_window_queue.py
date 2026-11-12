"""critic סבב 57: מגן חלון השליחה *בזמן התור* (לא רק בתבנית/ב-gate בודד): תזכורת שאושרה בתוך החלון
וחיכתה בתור לא יוצאת ברגע שהחלון נסגר — חמישי 20:01, שישי 14:00, שבת, ערב חג אחרי 12:00, החג עצמו —
ויוצאת בפתיחה הבאה (בקרה חיובית: אחרת «לא יצא» היה עובר גם כשהכול שבור).
ועוד מגן-מקור שסגר את שאלת סבב 57: הפער של seen_hash (סבב 56) לא קיים בטיוטות ובהסדרים — גוף טיוטה
ותשלומי הסדר לא משתנים *במקום* (שינוי ⇒ superseded ורשומה חדשה עם מזהה חדש). המגן ננעל על זה."""
from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.policy import TZ
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc

ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _approve_at(api, svc, clock, when: datetime) -> int:
    clock.now = when
    api.post("/sync")
    rid = next(i for i in api.post("/plan").json()["created"]
               if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1)
    assert api.post(f"/reminders/{rid}/approve").status_code == 200
    return rid


def _dispatch_at(api, clock, when: datetime) -> list:
    clock.now = when
    return api.post("/dispatch").json()["sent"]


def test_thursday_evening_and_friday_afternoon_and_shabbat(api, svc, clock, fake_gi):
    fake_gi.docs = [gi_doc(1, due="2026-11-01")]
    # חמישי 12.11.2026 19:55 — אישור בתוך החלון, השליחה מתעכבת (נניח שה-dispatch רץ רק ב-20:01)
    _approve_at(api, svc, clock, datetime(2026, 11, 12, 19, 55, tzinfo=TZ))
    assert _dispatch_at(api, clock, datetime(2026, 11, 12, 20, 1, tzinfo=TZ)) == []
    assert _dispatch_at(api, clock, datetime(2026, 11, 13, 14, 0, tzinfo=TZ)) == []   # שישי אחה״צ
    assert _dispatch_at(api, clock, datetime(2026, 11, 14, 10, 0, tzinfo=TZ)) == []   # שבת
    assert _dispatch_at(api, clock, datetime(2026, 11, 14, 21, 0, tzinfo=TZ)) == []   # מוצ״ש בלילה
    sent = _dispatch_at(api, clock, datetime(2026, 11, 15, 8, 0, tzinfo=TZ))          # ראשון 08:00
    assert len(sent) == 1, "בקרה חיובית: בפתיחת החלון התזכורת צריכה לצאת"
    for m in svc.db.q("SELECT created_at FROM messages WHERE direction='out'"):
        assert svc.policy.can_send_at(datetime.fromisoformat(m["created_at"])), m["created_at"]


def test_holiday_eve_after_noon_and_the_holiday(api, svc, clock, fake_gi):
    fake_gi.docs = [gi_doc(1, due="2027-04-12")]
    # ערב פסח תשפ״ז = רביעי 21.4.2027 (חלון מקוצר עד 12:00), פסח = חמישי 22.4
    _approve_at(api, svc, clock, datetime(2027, 4, 21, 11, 0, tzinfo=TZ))
    svc.db.x("UPDATE reminders SET scheduled_for=? WHERE status='approved'",
             (datetime(2027, 4, 21, 12, 30, tzinfo=TZ).isoformat(),))   # התור מגיע לתורו אחרי 12:00
    assert _dispatch_at(api, clock, datetime(2027, 4, 21, 12, 30, tzinfo=TZ)) == []
    assert _dispatch_at(api, clock, datetime(2027, 4, 22, 10, 0, tzinfo=TZ)) == []    # החג עצמו
    sent = _dispatch_at(api, clock, datetime(2027, 4, 23, 9, 0, tzinfo=TZ))           # שישי חוה״מ בבוקר
    assert len(sent) == 1, "בקרה חיובית: אחרי החג, בחלון, התזכורת יוצאת"


def test_drafts_and_plans_are_not_rewritten_in_place():
    """מה שמאפשר לוותר על seen_hash בטיוטות/הסדרים — ננעל במגן-מקור."""
    src = "\n".join(p.read_text(encoding="utf-8") for p in (ROOT / "app").glob("*.py"))
    stmts = re.findall(r'"(UPDATE drafts SET [^"]*)"', src)
    body_writes = [w for w in stmts if re.search(r"\bbody=", w)]
    # מותר רק: אישור (status='approved', body=? — מה שבעל העסק ראה/ערך) ומחיקת מידע אישי (body='')
    allowed = [w for w in body_writes if "status='approved'" in w or "to_addr=NULL" in w]
    assert len(body_writes) == len(allowed) == 2, body_writes
    plans = re.findall(r'"(UPDATE plans SET [^"]*)"', src)
    assert plans, "המגן לא מצא אף עדכון של plans (הביטוי שבור)"
    sets = [w.split(" WHERE ")[0] for w in plans]   # רק חלק ה-SET (customer_id= ב-WHERE מותר)
    assert not [w for w in sets if re.search(r"\b(installments|invoice_ids|customer_id)\s*=", w)], sets

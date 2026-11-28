"""מבקר סבב 285 (שמירה, ללא ממצא): בקשות עיון/מחיקה בהיקף ובמצבי נתונים מורכבים.

✓ אימות ℹ️ 284 (28008723): «שולם מחוץ למערכת» מוריד מיד את כרטיס «שילמתי».
[מאומת]
  · ייצוא (customer_data_export) אחרי שחשבונית עברה מדנה למיכל (CSV) — הייצוא של מיכל לא מכיל את שם/טלפון דנה;
    הייצוא של דנה כולל את התזכורת שנשלחה אליה על 9001 ולא את מיכל.
  · טלפון משותף (דויד+שרה), «שילמתי» שויך לדויד ⇒ ההודעה רק בייצוא של דויד; אף ייצוא לא מכיל את שם השני.
  · 200 לקוחות, 200 בקשות (עיון/מחיקה לסירוגין): פתיחה 0.8 שנ׳, GET /dsr 9ms (200 שורות, לפי מועד), 200 ייצואים
    0.67 שנ׳, plan 0.24 שנ׳. בדפדפן (390px): 200 שורות, 0 גלילה אופקית, 0 שגיאות; גובה הדף 56,508px.
  · «תמחקו את המידע שלי» ⇒ בקשת מחיקה נרשמת + הלקוח מוסר ⇒ אחרי סגירת הבקשה לא נבנות לו תזכורות.
ℹ️ (BACKLOG גבי משפט): בסגירת בקשת מחיקה הממשק אומר «סגירת בקשת מחיקה מאשרת שהמידע נמחק», אבל בגבי אין מחיקה
   פרטנית (DPA 9.1ב, שאלה 35 פתוחה) — השם/הטלפון/ההודעות נשמרים עד התממה (90 יום מסגירה).
ℹ️ (BACKLOG גבייה עיצוב): מרשם עם 200 בקשות פתוחות במובייל = 56,508px בלי סינון/קיבוץ.
רכיב: app/service.py → customer_data_export · app/dsr.py → open_request / listing / close_request.
"""
from __future__ import annotations

import json
from dataclasses import replace

from fastapi.testclient import TestClient

from app import dsr
from app.main import create_app
from app.ratelimit import RateLimiter
from tests.conftest import AUTH, OWNER_TOKEN
from tests.test_critic_round233_shared_phone_promise import _split
from tests.test_critic_round239_inherited_optout import DANA, MICHAL, _row, _sent_to_dana

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def test_export_after_invoice_move_has_no_other_customer(svc, clock):
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "שילמתי אתמול")
    svc.import_csv(_row("מיכל לוי", MICHAL))
    ids = {c["name"]: c["id"] for c in svc.db.q("SELECT id, name FROM customers")}
    em = json.dumps(svc.customer_data_export(ids["מיכל לוי"]), ensure_ascii=False)
    ed = json.dumps(svc.customer_data_export(ids["דנה כהן"]), ensure_ascii=False)
    assert "דנה" not in em and "972501234567" not in em
    assert "9001" in ed and "מיכל" not in ed


def test_shared_phone_export_only_assigned(svc):
    _split(svc)
    svc.inbound("sms", "050-0000111", "שילמתי אתמול בהעברה")
    card = svc.db.one("SELECT id FROM messages WHERE needs_owner=1 AND intent IN (SELECT value FROM json_each(?))",
                      (json.dumps(svc.inbox.SHARED_CARDS),))["id"]
    ids = [c["id"] for c in svc.db.q("SELECT id FROM customers WHERE phone='050-0000111' ORDER BY id")]
    svc.inbox.assign_shared_card(card, ids[0])
    e0 = json.dumps(svc.customer_data_export(ids[0]), ensure_ascii=False)
    e1 = json.dumps(svc.customer_data_export(ids[1]), ensure_ascii=False)
    assert "שילמתי" in e0 and "שילמתי" not in e1
    assert "שרה" not in e0 and "דויד" not in e1


def test_two_hundred_requests_listed_by_due(svc):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    rows = "".join(f"{5000 + i},לקוח {i},050-{3000000 + i:07d},,{100 + i},פתוח,01/10/26,15/10/26\n" for i in range(200))
    svc.import_csv((H + rows).encode())
    for k, c in enumerate(svc.db.q("SELECT id FROM customers ORDER BY id")):
        dsr.open_request(svc, c["id"], "deletion" if k % 2 else "access", "sms", actor="owner")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})), headers=AUTH)
    rows = api.get("/dsr").json()
    assert len(rows) == 200
    assert [r["due_at"] for r in rows] == sorted(r["due_at"] for r in rows)

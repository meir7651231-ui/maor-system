"""critic סבב 186 · 🔴 לתיקון בונה (המשך 185, אותו שורש — להסדר אין מטבע) — רכיבים: `app/main.py` → `list_plans`
(GET /plans בלי `currency`) + `web/src/pages/Dashboard.tsx` (כרטיס אישור ההסדר והכרטיס «הסדרי תשלומים» מ-`831ad2f4`
מציגים כל סכום ב-`fmtIls`).

הסדר על חשבונית $500 ⇒ GET /plans מחזיר installments באגורות **בלי מטבע** ⇒ בעל העסק רואה בכרטיס האישור «2 תשלומים…
סה״כ 500 ₪ · 1. 15.11 — 250 ₪» ומאשר — ואז (185) גם ההודעה ללקוח יוצאת בשקלים. [מאומת: התשובה של /plans בלי שדה
currency; ב-Dashboard.tsx שורות 410–412 ו-234 משתמשות ב-fmtIls בלבד.] הצעה: `currency` לכל הסדר ב-/plans (מטבע
החשבוניות שלו), ו-`fmtMoney(amount, currency)` בשני הכרטיסים. xfail(strict=True); הבקרה (שקל) נשארת ירוקה."""
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.mark.xfail(strict=True, reason="critic 186: GET /plans בלי מטבע ⇒ הסדר בדולר מוצג לבעל העסק בשקלים")
def test_plans_api_carries_currency(svc, fake_gi):
    fake_gi.docs[0]["currency"] = "USD"
    fake_gi.docs[0]["amount"] = "500.00"
    svc.sync()
    svc.propose_plan(1, 2)
    row = TestClient(create_app(svc, owner_token=OWNER_TOKEN)).get("/plans", headers=AUTH).json()[0]
    assert row.get("currency") == "USD", row


def test_control_plans_api_lists_ils_plan(svc):
    svc.sync()
    svc.propose_plan(1, 3)
    rows = TestClient(create_app(svc, owner_token=OWNER_TOKEN)).get("/plans", headers=AUTH).json()
    assert rows and sum(i["amount_agorot"] for i in rows[0]["installments"]) == 120000

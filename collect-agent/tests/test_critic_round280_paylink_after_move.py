"""מבקר סבב 280 (🟠, גבי מנוע): קישור /p/ ישן אחרי שהחשבונית עברה ללקוח אחר — הפעולה נרשמת על הלקוח החדש.

[מאומת] תזכורת על 9001 יצאה לדנה (050-1234567) עם `https://…/p/<short_code>`. קובץ CSV מעביר את 9001 למיכל
(219א/239). דנה לוחצת בקישור שבהודעה שלה:
  · «הפסיקו לשלוח לי» ⇒ `_opt_out(**מיכל**, 'landing')` — מיכל מוסרת לצמיתות בלי שביקשה (audit opt_out customer=2).
  · «כבר שילמתי» ⇒ מיכל מושהית `paid_claim` — התזכורות של מיכל נעצרות לפי טענה של דנה.
`service.landing(code)` מוצא את החשבונית לפי short_code ולוקח את **הלקוח הנוכחי** שלה; הקוד לא קשור למי שקיבל את
הקישור. אותה משפחה כמו 265 (DLR 201 חסם את הטלפון החדש) — תוקן שם, לא כאן.
מצופה: פעולה מקישור שנשלח ללקוח קודם ⇒ לא משנה את הלקוח הנוכחי (נרשמת לנמען המקורי / כרטיס לבעל העסק).
✓ נבדק בלי ממצא: GET /p/<code> לא מציג שם לקוח (לא דנה ולא מיכל); PRG + דדופ 30 דק׳ (209/210) תקינים.
רכיב: app/service.py → landing / landing_action (short_code ⇒ customer_id הנוכחי).
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.ratelimit import RateLimiter
from tests.conftest import OWNER_TOKEN
from tests.test_critic_round239_inherited_optout import MICHAL, _row, _sent_to_dana


def _moved(svc, clock):
    _sent_to_dana(svc, clock)
    code = svc.db.one("SELECT short_code FROM invoices WHERE number='9001'")["short_code"]
    svc.import_csv(_row("מיכל לוי", MICHAL))
    michal = svc.db.one("SELECT id FROM customers WHERE phone=?", (MICHAL,))["id"]
    assert svc.db.one("SELECT customer_id FROM invoices WHERE number='9001'")["customer_id"] == michal
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})))
    return api, code, michal


def test_landing_page_shows_no_name_control(svc, clock):
    api, code, _ = _moved(svc, clock)
    page = api.get(f"/p/{code}").text
    assert "מיכל" not in page and "דנה" not in page


@pytest.mark.xfail(strict=True, reason="מבקר 280🟠: «הפסיקו» מקישור של דנה מסיר את מיכל (החשבונית עברה)")
def test_old_link_stop_does_not_opt_out_new_customer(svc, clock):
    api, code, michal = _moved(svc, clock)
    api.post(f"/p/{code}/stop", data={}, follow_redirects=False)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (michal,))["opted_out"] == 0


@pytest.mark.xfail(strict=True, reason="מבקר 280🟠: «שילמתי» מקישור של דנה משהה את מיכל")
def test_old_link_paid_does_not_pause_new_customer(svc, clock):
    api, code, michal = _moved(svc, clock)
    api.post(f"/p/{code}/paid", data={}, follow_redirects=False)
    assert svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (michal,))["paused_reason"] is None

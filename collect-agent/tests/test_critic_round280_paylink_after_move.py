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


def test_old_link_stop_does_not_opt_out_new_customer(svc, clock):
    api, code, michal = _moved(svc, clock)
    api.post(f"/p/{code}/stop", data={}, follow_redirects=False)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (michal,))["opted_out"] == 0


def test_old_link_paid_does_not_pause_new_customer(svc, clock):
    api, code, michal = _moved(svc, clock)
    api.post(f"/p/{code}/paid", data={}, follow_redirects=False)
    assert svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (michal,))["paused_reason"] is None


def _dana(svc):
    return svc.db.one("SELECT id FROM customers WHERE phone='050-1234567'")["id"]


def test_old_link_stop_opts_out_the_recipient(svc, clock):
    """גבי מנוע 280: «הפסיקו» מהקישור הישן = בקשה של דנה (מי שקיבלה ולחצה) ⇒ דנה מוסרת, מיכל לא."""
    api, code, michal = _moved(svc, clock)
    r = api.post(f"/p/{code}/stop", data={}, follow_redirects=False)
    assert r.status_code == 303
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (_dana(svc),))["opted_out"] == 1
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (michal,))["opted_out"] == 0
    assert api.get(r.headers["location"]).status_code == 200


def test_old_link_paid_makes_owner_card_on_recipient(svc, clock):
    api, code, michal = _moved(svc, clock)
    assert api.post(f"/p/{code}/paid", data={}, follow_redirects=False).status_code == 400
    api.post(f"/p/{code}/paid", data={}, follow_redirects=False)   # לחיצה כפולה ⇒ כרטיס אחד
    cards = svc.db.q("SELECT customer_id FROM messages WHERE intent='landing_moved' AND needs_owner=1")
    assert [c["customer_id"] for c in cards] == [_dana(svc)]
    assert not svc.db.q("SELECT 1 FROM messages WHERE customer_id=? AND direction='in'", (michal,))


def test_old_link_page_offers_no_payment(svc, clock):
    api, code, _ = _moved(svc, clock)
    assert api.get(f"/p/{code}").status_code == 200
    assert api.get(f"/p/{code}/pay", follow_redirects=False).status_code == 409


def test_moved_invoice_gets_new_code_for_new_customer(svc, clock):
    api, code, michal = _moved(svc, clock)
    inv = svc.db.one("SELECT * FROM invoices WHERE number='9001'")
    new = svc._short_code(inv)
    assert new != code
    api.post(f"/p/{new}/paid", data={}, follow_redirects=False)
    assert svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (michal,))["paused_reason"] == "paid_claim"
    assert api.get("/p/nonexistent").status_code == 404


def test_audit_keeps_only_code_hash(svc, clock):
    _, code, _ = _moved(svc, clock)
    assert not svc.db.q("SELECT 1 FROM audit WHERE detail LIKE ?", (f"%{code}%",))

"""מנהל 313 · תיקון critic 166 — עמוד החייב (/p/, /pay/) ללקוח בהשהיה מגינה.

לקוח שסומן קטין / מצוקה / פטירה / חדלות פירעון (מהשיחה או מסימון בעל העסק) — קישור שכבר נשלח לא מציע תשלום,
פריסה או «שילמתי» (ברוח 153: אין בקשת כסף בלי עין אנושית). «הפסקת תזכורות» נשארת תמיד.
בקרות: לקוח רגיל, השהיה רכה (הבטחה) ושחרור בעל העסק (resume) ⇒ הכפתורים חוזרים."""
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import OWNER_TOKEN


def _code(svc):
    svc.sync()
    return svc._short_code(svc._invoice(svc.db.one("SELECT id FROM invoices WHERE customer_id=1")["id"]))


@pytest.mark.parametrize("reason", ["minor", "deceased", "insolvency"])
def test_owner_hold_hides_pay(svc, reason):
    code = _code(svc)
    svc.set_hold(1, reason)
    info = svc.landing(code)
    assert info["held"] and info["pay_url"] is None and not info["pay_shared"]
    assert not any(i["can_pay"] for i in info["invoices"])
    v = svc.payer_view(code)
    assert v["held"] and not v["can_pay"] and v["methods"] == [] and v["plan_options"] == []


def test_distress_hides_pay(svc):
    code = _code(svc)
    svc.inbound("sms", "0501234567", "אני במצב קשה מאוד, אין לי כוח לחיות")
    assert svc.landing(code)["pay_url"] is None


@pytest.mark.parametrize("action", ["paid", "plan"])
def test_held_actions_refused_without_draft(svc, action):
    code = _code(svc)
    svc.set_hold(1, "minor")
    with pytest.raises(ValueError):
        svc.landing_action(code, action, 3)
    assert svc.db.one("SELECT COUNT(*) n FROM messages WHERE channel='web'")["n"] == 0
    assert svc.db.one("SELECT COUNT(*) n FROM plans")["n"] == 0
    with pytest.raises(ValueError):
        svc.payer_go(code, "page")


def test_held_stop_still_allowed(svc):
    code = _code(svc)
    svc.set_hold(1, "minor")
    assert svc.landing_action(code, "stop")["ok"]
    assert svc.landing(code)["opted_out"]


def test_http_pages_held(svc):
    code = _code(svc)
    svc.set_hold(1, "minor")
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    html = c.get(f"/p/{code}").text
    assert 'data-testid="landing-held"' in html
    assert f"/p/{code}/pay" not in html and "/paid" not in html and "/plan" not in html
    assert "/stop" in html
    assert c.get(f"/p/{code}/pay", follow_redirects=False).status_code == 409
    assert c.post(f"/p/{code}/paid", follow_redirects=False).status_code == 400
    api = c.get(f"/api/pay/{code}").json()
    assert api["held"] is True and api["can_pay"] is False
    assert c.post(f"/api/pay/{code}/plan", json={"installments": 3}).status_code == 400


def test_control_resume_restores_pay(svc):
    code = _code(svc)
    svc.set_hold(1, "minor")
    svc.resume_customer(1)
    info = svc.landing(code)
    assert not info["held"] and info["pay_url"]


def test_control_soft_pause_keeps_pay(svc):
    code = _code(svc)
    svc.inbound("sms", "0501234567", "אשלם ביום חמישי")
    info = svc.landing(code)
    assert not info["held"] and info["pay_url"]

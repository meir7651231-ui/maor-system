"""מנהל 330 (פתוח מ-328/329 — «e2e לא מכסה את הכפתורים, בדמו עובד יחיד»): עובדת דמו שנייה `DEMO_STAFF_EMAIL`
כדי שמסע הדפדפן `web/e2e/team.mjs` ילחץ על מינוי/הורדה/השבתה/הפעלה מחדש. אותם שומרים כמו עובד הדמו (critic סבב 8):
שירות הדמו בלבד, אף פעם לא בבטא אמיתית, תמיד staff (לא הופכת לבעלים ראשונה), ובלי קריסה בעלייה חוזרת."""

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import OWNER_TOKEN

H = {"Authorization": f"Bearer {OWNER_TOKEN}"}


def _demo_env(monkeypatch, owner=True, staff=True):
    monkeypatch.setenv("DEMO", "1")
    if owner:
        monkeypatch.setenv("DEMO_USER_EMAIL", "demo-owner@biz.example")
        monkeypatch.setenv("DEMO_USER_PASSWORD", "demo-owner-pass-1")
    if staff:
        monkeypatch.setenv("DEMO_STAFF_EMAIL", "Demo-Staff@biz.example")
        monkeypatch.setenv("DEMO_STAFF_PASSWORD", "demo-staff-pass-1")


def _team(app):
    r = TestClient(app).get("/team", headers=H)
    assert r.status_code == 200, r.text
    return {u["email"]: u for u in r.json()["users"]}


def test_demo_staff_created_as_staff_next_to_owner(monkeypatch):
    _demo_env(monkeypatch)
    t = _team(create_app(owner_token=OWNER_TOKEN))
    assert t["demo-owner@biz.example"]["role"] == "owner"
    assert t["demo-staff@biz.example"]["role"] == "staff" and t["demo-staff@biz.example"]["active"]


def test_demo_staff_never_becomes_first_owner(monkeypatch):
    """בלי עובד-דמו בעלים — לא נוצרת (אחרת `create` היה הופך אותה לבעלים הראשון)."""
    _demo_env(monkeypatch, owner=False)
    assert _team(create_app(owner_token=OWNER_TOKEN)) == {}


def test_demo_staff_not_created_in_real_beta(monkeypatch):
    _demo_env(monkeypatch)
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    app = create_app(owner_token=OWNER_TOKEN)
    assert app.state.svc.db.one("SELECT COUNT(*) c FROM users")["c"] == 0


def test_demo_staff_never_on_injected_real_service(svc, monkeypatch):
    _demo_env(monkeypatch)
    create_app(svc, owner_token=OWNER_TOKEN)
    create_app(svc, owner_token=OWNER_TOKEN)   # עלייה חוזרת לא קורסת
    assert svc.db.one("SELECT COUNT(*) c FROM users")["c"] == 0

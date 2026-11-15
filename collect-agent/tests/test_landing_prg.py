"""הפעלה 209 — Post/Redirect/Get לפעולות עמוד החייב `/p/{code}/{action}` (פתוח מ-208).

לפני: ה-POST החזיר את עמוד «התקבל» ישירות. רענון (או «חזרה» ואז «קדימה») בדפדפן הנייד שולח את הטופס
שוב ⇒ «שילמתי» או «בקשת פריסה» נוספים מגיעים לבעל העסק. אחרי: POST ⇒ 303 ⇒ `GET /p/{code}/done?a=…`,
עמוד שלא משנה כלום. «הופסקו» מוצג רק אם הלקוח באמת הוסר, כדי שקישור מפוברק לא יטעה.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

FORM = {"content-type": "application/x-www-form-urlencoded"}


def _setup(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    svc.sync()
    svc.plan()
    code = svc.db.one("SELECT short_code FROM invoices WHERE short_code IS NOT NULL LIMIT 1")[0]
    return api, code


def _counts(svc):
    q = "SELECT COUNT(*) n FROM "  # שמות טבלה קבועים בלבד
    return {t: svc.db.one(q + t)["n"] for t in ("drafts", "messages", "audit")}


def test_post_redirects_303_to_done(svc):
    api, code = _setup(svc)
    for action in ("plan", "paid", "stop"):
        r = api.post(f"/p/{code}/{action}", content="n=3" if action == "plan" else "", headers=FORM,
                     follow_redirects=False)
        assert r.status_code == 303, action
        assert r.headers["location"] == f"/p/{code}/done?a={action}", action


def test_refresh_of_done_page_does_not_repeat_action(svc):
    api, code = _setup(svc)
    r = api.post(f"/p/{code}/paid", follow_redirects=False)
    done = r.headers["location"]
    before = _counts(svc)
    for _ in range(3):                                   # «רענון» = GET על כתובת התוצאה
        page = api.get(done)
        assert page.status_code == 200 and "<h1>תודה, הדיווח התקבל</h1>" in page.text
        assert "סטודיו מאיר" in page.text
    assert _counts(svc) == before                         # אף טיוטה/הודעה/רשומת audit לא נוספה


def test_done_stop_only_when_really_opted_out(svc):
    api, code = _setup(svc)
    # קישור מפוברק לפני הסרה ⇒ לא מציגים «הופסקו»; חוזרים לעמוד החשבונית
    r = api.get(f"/p/{code}/done?a=stop", follow_redirects=False)
    assert r.status_code == 303 and r.headers["location"] == f"/p/{code}"
    api.post(f"/p/{code}/stop")
    r = api.get(f"/p/{code}/done?a=stop")
    assert r.status_code == 200 and "<h1>התזכורות הופסקו</h1>" in r.text


def test_done_unknown_action_and_unknown_code(svc):
    api, code = _setup(svc)
    r = api.get(f"/p/{code}/done?a=hack", follow_redirects=False)
    assert r.status_code == 303 and r.headers["location"] == f"/p/{code}"
    r = api.get(f"/p/{code}/done", follow_redirects=False)
    assert r.status_code == 303
    assert api.get("/p/nope123/done?a=paid").status_code == 404


def test_done_page_is_strict_csp_and_noindex(svc):
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    _, code = _setup(svc)
    r = pub.post(f"/p/{code}/plan")                       # עוקב אחרי ה-303
    assert r.status_code == 200 and str(r.url).endswith(f"/p/{code}/done?a=plan")
    assert "script-src" not in r.headers["content-security-policy"]
    assert "<script" not in r.text.lower()

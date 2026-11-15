"""הפעלה 213 — Post/Redirect/Get לכפתור ההסרה `POST /u/{token}` (פתוח מ-209/211, «לפי הביקורת»).

לפני: ה-POST מהדפדפן החזיר את עמוד «הוסרתם» ישירות. רענון (או «חזרה» ואז «קדימה») בנייד ⇒ «לשלוח שוב
את הטופס?» ⇒ POST נוסף ⇒ audit opt_out כפול ועוד סבב של עצירת טיוטות. אחרי: POST עם Accept של HTML ⇒
303 ⇒ `GET /u/{token}/done`, עמוד שלא משנה כלום. RFC 8058 (One-Click, בלי Accept של HTML) לא השתנה:
200 + JSON. «הוסרתם» מוצג רק אם הלקוח באמת מוסר, כדי שקישור מפוברק או ישן לא יטעה.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import OWNER_TOKEN

HTML = {"accept": "text/html"}


def _setup(svc):
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    svc.sync()
    return pub, svc.new_unsub_token(1)


def _opt_out_audits(svc):
    return svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='opt_out'")["n"]


def test_browser_post_redirects_303_to_done(svc):
    pub, tok = _setup(svc)
    r = pub.post(f"/u/{tok}", headers=HTML, follow_redirects=False)
    assert r.status_code == 303 and r.headers["location"] == f"/u/{tok}/done"
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1


def test_refresh_of_done_page_does_not_repeat_unsubscribe(svc):
    pub, tok = _setup(svc)
    pub.post(f"/u/{tok}", headers=HTML, follow_redirects=False)
    before = _opt_out_audits(svc)
    assert before == 1
    for _ in range(3):                                   # «רענון» = GET על כתובת התוצאה
        page = pub.get(f"/u/{tok}/done", headers=HTML)
        assert page.status_code == 200 and "הוסרתם" in page.text and "מטעם סטודיו מאיר" in page.text
    assert _opt_out_audits(svc) == before                # שום הסרה נוספת לא נרשמה


def test_rfc8058_one_click_unchanged(svc):
    pub, tok = _setup(svc)
    r = pub.post(f"/u/{tok}", follow_redirects=False)    # שרת דואר: בלי Accept של HTML
    assert r.status_code == 200 and r.json() == {"unsubscribed": True}


def test_done_only_when_really_opted_out(svc):
    pub, tok = _setup(svc)
    r = pub.get(f"/u/{tok}/done", follow_redirects=False)     # לפני הסרה ⇒ לא «הוסרתם»
    assert r.status_code == 303 and r.headers["location"] == f"/u/{tok}"
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 0
    assert pub.get("/u/" + "x" * 24 + "/done").status_code == 404
    assert pub.post("/u/" + "x" * 24, headers=HTML).status_code == 404


def test_done_page_strict_csp_noindex_no_store(svc):
    pub, tok = _setup(svc)
    r = pub.post(f"/u/{tok}", headers=HTML)               # עוקב אחרי ה-303
    assert r.status_code == 200 and str(r.url).endswith(f"/u/{tok}/done")
    assert "script-src" not in r.headers["content-security-policy"]
    assert "<script" not in r.text.lower()
    assert r.headers["cache-control"] == "no-store" and "noindex" in r.headers["x-robots-tag"]

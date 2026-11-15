"""הפעלה 208 — בדיקת עין לעמוד ההסרה `/u/<טוקן>` ולעמוד «התקבל» (`landing_done`), המשך ל-207 (/p).

רונדר ב-390/320. שלושה ממצאים:
1. עמוד «התקבל» אחרי לחיצה ב-/p: כותרת «התקבל» בלבד ובלי שם העסק — החייב לא יודע מול מי ומה קרה.
   עכשיו: כותרת לפי הפעולה + שם העסק (כמו ב-/p) + משפט «מה הלאה».
2. קישור /u לא תקף: משפט בודד בלי כותרת ובלי מה עושים. עכשיו כותרת כמו /p לא-תקף + הכוונה («הסר» / בעל העסק).
3. «הוסרתם»: «מ-סטודיו מאיר» נשבר אחרי המקף ב-390 («מ-» בסוף שורה). עכשיו «מטעם {עסק}».
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app, landing_done
from tests.conftest import AUTH, OWNER_TOKEN


def test_done_pages_name_business_and_say_what_happened():
    heads = {"plan": "בקשת הפריסה התקבלה", "paid": "תודה, הדיווח התקבל", "stop": "התזכורות הופסקו"}
    for action, head in heads.items():
        html = landing_done(action, {}, "סטודיו <מאיר>")
        assert f"<h1>{head}</h1>" in html
        assert '<div class="m">סטודיו &lt;מאיר&gt;</div>' in html     # שם העסק, מוסתר-HTML
        assert "<h1>התקבל</h1>" not in html                           # מוטציה: הכותרת הגנרית הישנה
        assert f"<title>{head} · סטודיו &lt;מאיר&gt;</title>" in html


def test_done_page_without_business_still_renders():
    html = landing_done("stop", {})
    assert "<h1>התזכורות הופסקו</h1>" in html and 'class="m"></div>' not in html


def test_done_page_via_route_shows_business(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    svc.sync()
    svc.plan()                                    # הקוד הקצר נוצר עם התזכורת
    code = svc.db.one("SELECT short_code FROM invoices WHERE short_code IS NOT NULL LIMIT 1")[0]
    r = api.post(f"/p/{code}/stop")
    assert r.status_code == 200 and "סטודיו מאיר" in r.text and "<h1>התזכורות הופסקו</h1>" in r.text


def test_invalid_unsub_link_has_heading_and_guidance(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    r = api.get("/u/" + "x" * 24)
    assert r.status_code == 404
    assert "<h1>הקישור אינו תקף</h1>" in r.text
    assert "«הסר»" in r.text and "בעל העסק" in r.text


def test_unsubscribed_page_no_hyphen_break_before_business(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    svc.sync()
    tok = svc.new_unsub_token(1)
    html = api.post(f"/u/{tok}", headers={"accept": "text/html"}).text
    assert "הוסרתם" in html and "מטעם סטודיו מאיר" in html
    assert "מ-סטודיו" not in html                                    # מוטציה: הניסוח הישן

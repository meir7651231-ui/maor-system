"""critic סבב 74 (מגן חוצה-משטחים): תקנות אבטחת מידע — כל צפייה במידע אישי נרשמת ב-access_log (שער בטא 6).
הרישום תלוי ברשימה ידנית `PII_READ_ROUTES`. נתיב GET חדש שמחזיר שם/טלפון/מייל ושכחו להוסיף לרשימה ⇒ צפייה
במידע אישי **בלי תיעוד**, בלי שאף בדיקה תיכשל. המגן: כל נתיב GET מאומת, על DB עם ערכים ייחודיים, ⇒ אם התשובה
מכילה PII אז הנתיב ברשימה **וגם** נוצרה שורה ב-access_log. (היום: כולם מכוסים. המגן נועל את זה.)"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import PII_READ_ROUTES, create_app
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc

NAME, PHONE_TAIL, MAIL = "זוהרית־ייחודית", "9876543", "zz-unique@example.com"
PUBLIC = ("/p/", "/u/", "/pay/", "/api/pay/", "/landing", "/health", "/app", "/connect/", "/privacy")


def test_every_authenticated_get_with_pii_is_access_logged(svc, fake_gi):
    d = gi_doc(1, phone="050-9876543", name=NAME)
    d["client"]["emails"] = [MAIL]
    fake_gi.docs = [d]
    app = create_app(svc, owner_token=OWNER_TOKEN)
    api = TestClient(app, headers=AUTH)
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    api.post("/inbound", json={"sender": "050-9876543", "text": "שילמתי כבר"})
    checked, missing = [], []
    for r in app.routes:
        if "GET" not in getattr(r, "methods", set()) or r.path.startswith(PUBLIC):
            continue
        url = r.path.replace("{rid}", str(ids[0])).replace("{pid}", "1").replace("{cid}", "1")
        if "{" in url:
            continue
        before = svc.db.one("SELECT COUNT(*) n FROM access_log")["n"]
        body = api.get(url).text
        if not any(x in body for x in (NAME, PHONE_TAIL, MAIL)):
            continue
        checked.append(r.path)
        logged = svc.db.one("SELECT COUNT(*) n FROM access_log")["n"] > before
        if r.path not in PII_READ_ROUTES or not logged:
            missing.append(r.path)
    assert len(checked) >= 5, checked                  # המגן באמת בדק משהו
    assert not missing, f"נתיבים שמחזירים מידע אישי בלי access_log: {missing}"

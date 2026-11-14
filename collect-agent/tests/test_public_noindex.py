"""critic סבב 70: עמוד החייב `/p/{code}` (שם העסק + סכום + מספר חשבונית) ו-`/api/pay/{code}` נשלחו **בלי noindex**
(לא כותרת ולא meta), בזמן ש-`/u/` כבר שולח `X-Robots-Tag: noindex`. קישור שהועבר/פורסם (קבוצת וואטסאפ, פורום) ⇒
מנוע חיפוש רשאי לאנדקס חוב. התיקון: `X-Robots-Tag: noindex, nofollow` כברירת מחדל לכל תשובה (גבי אינו אתר תוכן)."""
from __future__ import annotations

import re

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


def test_debtor_pages_are_noindex(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    code = re.search(r"/p/(\w+)", svc._reminder(rid)["body"]).group(1)
    for path in (f"/p/{code}", "/p/zzzzzzz", f"/api/pay/{code}", f"/u/{svc.new_unsub_token(1)}", "/health"):
        r = pub.get(path)
        assert "noindex" in (r.headers.get("x-robots-tag") or ""), (path, r.status_code, dict(r.headers))

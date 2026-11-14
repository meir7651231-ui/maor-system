"""critic סבב 72 (הרשאות): אין תפקידים — כל עובד מחובר שווה לבעלים, ובבטא אמיתית (REQUIRE_USER_LOGIN=1) הטוקן
המשותף סגור, כלומר **כולם** «עובדים». כל עובד (או סשן גנוב של עובד) יכול להחליף את **קישור התשלום** לעמוד שלו אצל
אותו ספק (הדומיין מותר) ⇒ חייבים משלמים לחשבון שלו; או את כתובת Reply-To ⇒ תשובות הלקוחות מגיעות אליו. ה-audit
רשם רק את **שמות** השדות (בלי ישן/חדש) ובעל העסק לא קיבל שום הודעה. תפקידים = הכרעת בעלים; רשת הביטחון כאן:
שינוי שדה רגיש ⇒ audit עם ישן→חדש ומי, **והודעה לבעל העסק** (`settings_changed`)."""
from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

NEW_LINK = "https://www.greeninvoice.co.il/pay/someone-else"


def test_payment_link_change_is_audited_with_values_and_owner_is_told(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    old = svc.s.payment_link
    r = api.put("/api/settings", json={"payment_link": NEW_LINK, "email_reply_to": "x@evil.example"})
    assert r.status_code == 200, r.text
    rows = [json.loads(a["detail"]) for a in svc.db.q("SELECT * FROM audit WHERE action='settings_sensitive_changed'")]
    by = {d["field"]: d for d in rows}
    assert by["payment_link"]["from"] == old and by["payment_link"]["to"] == NEW_LINK, rows
    assert by["email_reply_to"]["to"] == "x@evil.example"
    notes = [m for m in api.get("/owner/inbox").json() if m["intent"] == "settings_changed"]
    assert len(notes) == 1, api.get("/owner/inbox").json()
    assert "קישור התשלום" in notes[0]["body"] and NEW_LINK in notes[0]["body"] and "owner" in notes[0]["body"]


def test_harmless_change_does_not_notify(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.put("/api/settings", json={"extra_holidays": ["2026-12-25"]})
    assert not [m for m in api.get("/owner/inbox").json() if m["intent"] == "settings_changed"]

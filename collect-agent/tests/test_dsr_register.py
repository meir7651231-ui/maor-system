"""מרשם בקשות עיון/תיקון/מחיקה (חוק הגנת הפרטיות §13–14): פתיחה, מועד 30 יום, התראות, סגירה מתועדת.

⚖️ 30 יום = לפי תקנות העיון (🟡, שאלה 37 לעו״ד). גבי מתעד ומתריע; העסק עונה.
"""
from __future__ import annotations

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app import dsr
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _ready(api):
    api.post("/sync")
    api.post("/plan")


def _says(api, text, sender="0501234567"):
    return api.post("/inbound", json={"channel": "sms", "sender": sender, "text": text})


@pytest.mark.parametrize("text,kinds", [
    ("לפי סעיף 13 לחוק הגנת הפרטיות אני מבקש לעיין בכל המידע שיש לכם עליי", ["access"]),
    ("מה המידע שיש לכם עליי?", ["access"]),
    ("I want a copy of my personal data", ["access"]),
    ("נא לתקן את הפרטים שלי, הכתובת שגויה", ["correction"]),
    ("תמחקו את כל הפרטים שלי מהמאגר", ["deletion"]),
    ("please delete my data", ["deletion"]),
])
def test_detects_explicit_requests(text, kinds):
    assert dsr.detect(text) == kinds


@pytest.mark.parametrize("text", ["הסר", "מי אתם?", "שילמתי", "תפסיקו לשלוח", "אפשר העתק של החשבונית?",
                                  "איך משלמים", "תודה רבה"])
def test_everyday_messages_do_not_open_requests(text):
    assert dsr.detect(text) == []


def test_inbound_request_opens_once_with_30_day_due_and_owner_alert(api, svc):
    _ready(api)
    _says(api, "לפי סעיף 13 אני מבקש לעיין בכל המידע שיש לכם עליי")
    _says(api, "שוב: אני רוצה לעיין במידע שלי")                 # אותו סוג, עדיין פתוחה ⇒ לא כפולה
    (r,) = api.get("/dsr").json()
    assert r["kind"] == "access" and r["status"] == "open" and r["days_left"] in (29, 30)
    assert r["due_at"][:10] == (svc.clock() + timedelta(days=30)).date().isoformat()
    alerts = [m for m in api.get("/owner/inbox").json() if m["intent"] == "dsr"]
    assert len(alerts) == 1 and "30 יום" in alerts[0]["body"] and "לא עונה ללקוח" in alerts[0]["body"]
    assert "dsr_opened" in [a["action"] for a in api.get("/audit").json()]
    assert "/dsr" in [x["route"] for x in api.get("/access-log").json()]   # צפייה במרשם = מתועדת


def test_warning_5_days_before_and_when_late_once_each(api, svc, clock):
    _ready(api)
    _says(api, "תמחקו את כל הפרטים שלי מהמאגר")
    alerts = lambda: [m for m in api.get("/owner/inbox").json() if m["intent"] == "dsr"]  # noqa: E731
    clock.now += timedelta(days=20)
    api.post("/plan")
    assert len(alerts()) == 1                                    # עוד מוקדם
    clock.now += timedelta(days=6)                               # נותרו 4
    api.post("/plan")
    api.post("/plan")
    assert len(alerts()) == 2 and "נותרו" in alerts()[0]["body"]
    clock.now += timedelta(days=5)                               # איחור
    api.post("/plan")
    api.post("/plan")
    assert len(alerts()) == 3 and "עברה את המועד" in alerts()[0]["body"]
    assert api.get("/dsr").json()[0]["overdue"] is True


def test_close_requires_note_and_stops_alerts(api, svc, clock):
    _ready(api)
    _says(api, "נא לתקן את הפרטים שלי")
    rid = api.get("/dsr").json()[0]["id"]
    assert api.post(f"/dsr/{rid}/done", json={"note": "x"}).status_code == 422
    with pytest.raises(ValueError):                          # גם בשירות, לא רק ב-API
        dsr.close_request(svc, rid, "    ok  ")
    r = api.post(f"/dsr/{rid}/done", json={"note": "תוקנה כתובת המייל בחשבונית ירוקה, נמסר בטלפון"})
    assert r.status_code == 200 and r.json()["status"] == "done"
    assert api.post(f"/dsr/{rid}/done", json={"note": "שוב סוגרים"}).status_code == 409
    clock.now += timedelta(days=40)
    api.post("/plan")
    assert len([m for m in api.get("/owner/inbox").json() if m["intent"] == "dsr"]) == 1
    _says(api, "נא לתקן את הפרטים שלי")                          # אחרי סגירה ⇒ בקשה חדשה
    assert len(api.get("/dsr").json()) == 2


def test_owner_can_log_phone_request_and_bad_input_refused(api, svc):
    _ready(api)
    cid = svc.db.one("SELECT id FROM customers LIMIT 1")["id"]
    assert api.post(f"/customers/{cid}/dsr", json={"kind": "access", "note": "התקשרה 19.11"}).status_code == 200
    assert api.post(f"/customers/{cid}/dsr", json={"kind": "access"}).status_code == 409
    assert api.post(f"/customers/{cid}/dsr", json={"kind": "sell"}).status_code == 422
    assert api.post("/customers/999/dsr", json={"kind": "access"}).status_code == 404
    assert TestClient(api.app).get("/dsr").status_code == 401   # מרשם = מידע אישי ⇒ רק בעלים


def test_stranger_wrong_number_does_not_open_request_on_debtor(api, svc):
    _ready(api)
    text = "טעות במספר, אני לא דנה. ותמחקו את הפרטים שלי מהמאגר"
    assert dsr.detect(text) == ["deletion"]                  # הזיהוי עצמו עובד…
    _says(api, text)
    assert api.get("/dsr").json() == []                      # …אבל זר לא פותח בקשה על שם החייבת

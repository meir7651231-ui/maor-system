"""מנהל 309 · זכות עיון (סעיף 13 לחוק הגנת הפרטיות; DPA 9.1): בקשת עיון של לקוח מועברת לעסק — אבל לבעל העסק
לא היה איך לענות בלי לחפש בכמה מסכים. `GET /customers/{cid}/data` = ייצוא קריאה-בלבד של מה שגבי מחזיקה
על לקוח אחד. נועל: התוכן המלא (חשבוניות/תזכורות/הודעות), בלי מפתחות גישה, בלי מידע של לקוח אחר (גם לא
מכרטיס «כתובת משותפת»), תיעוד ב-access_log + audit, 404 ללקוח לא קיים, ובלי שינוי מצב."""
import json

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _cid(svc, name):
    return svc.db.one("SELECT id FROM customers WHERE name=?", (name,))["id"]


def _flow(api, svc):
    api.post("/sync")
    for rid in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{rid}/approve")
    api.post("/dispatch")


def test_export_contains_the_customers_data(api, svc):
    _flow(api, svc)
    phone = svc.db.one("SELECT phone FROM customers WHERE name='יוסי לוי'")["phone"]
    api.post("/inbound", json={"sender": phone, "text": "שילמתי כבר"})
    cid = _cid(svc, "יוסי לוי")
    r = api.get(f"/customers/{cid}/data")
    assert r.status_code == 200
    d = r.json()
    assert d["customer"]["name"] == "יוסי לוי" and d["customer"]["id"] == cid
    assert d["invoices"] and all(i["amount_agorot"] > 0 for i in d["invoices"])
    assert d["reminders"] and all(x["body"] for x in d["reminders"])
    assert any(m["direction"] == "in" and "שילמתי" in m["body"] for m in d["messages"])
    assert d["generated_at"]


def test_export_hides_access_tokens(api, svc):
    _flow(api, svc)
    cid = _cid(svc, "יוסי לוי")
    tok = svc.db.one("SELECT unsub_token FROM customers WHERE id=?", (cid,))["unsub_token"]
    body = api.get(f"/customers/{cid}/data").text
    assert "unsub_token" not in body
    if tok:
        assert tok not in body


def test_export_never_includes_another_customer(api, svc):
    _flow(api, svc)
    a, b = _cid(svc, "יוסי לוי"), _cid(svc, "דנה כהן")
    body = api.get(f"/customers/{a}/data").text
    assert "דנה כהן" not in body
    other = svc.db.one("SELECT phone,email FROM customers WHERE id=?", (b,))
    for v in (other["phone"], other["email"]):
        if v:
            assert v not in body


def test_shared_contact_card_with_other_names_not_exported(api, svc, fake_gi):
    fake_gi.docs[1]["client"]["phone"] = "050-1234567"          # יוסי ודנה על אותו טלפון
    svc.sync()
    api.post("/inbound", json={"channel": "sms", "sender": "0501234567", "text": "אני בן 15"})
    card = svc.db.one("SELECT payload FROM messages WHERE intent='shared_contact_urgent'")
    assert "דנה כהן" in json.loads(card["payload"])["linked_customers"].__repr__()   # הבקרה: הכרטיס קיים
    body = api.get(f"/customers/{_cid(svc, 'יוסי לוי')}/data").text
    assert "דנה כהן" not in body
    assert "אני בן 15" not in body        # לא ידוע מי מהשניים כתב ⇒ לא מיוחס לאף אחד עד שיוך


def test_export_is_logged_and_audited_without_content(api, svc):
    _flow(api, svc)
    cid = _cid(svc, "יוסי לוי")
    api.get(f"/customers/{cid}/data")
    log = svc.db.q("SELECT route,path FROM access_log WHERE route='/customers/{cid}/data'")
    assert [r["path"] for r in log] == [f"/customers/{cid}/data"]
    aud = svc.db.q("SELECT actor,detail FROM audit WHERE action='customer_data_export'")
    assert len(aud) == 1 and json.loads(aud[0]["detail"]) == {"customer": cid}
    assert "יוסי" not in aud[0]["detail"]


def test_export_unknown_customer_404_and_requires_auth(api, svc):
    _flow(api, svc)
    assert api.get("/customers/99999/data").status_code == 404
    anon = TestClient(api.app)
    assert anon.get(f"/customers/{_cid(svc, 'יוסי לוי')}/data").status_code == 401


def test_export_is_read_only(api, svc):
    _flow(api, svc)
    cid = _cid(svc, "יוסי לוי")
    snap = lambda: [dict(r) for t in ("customers", "invoices", "reminders", "messages", "plans")  # noqa: E731
                    for r in svc.db.q(f"SELECT * FROM {t} ORDER BY id")]  # noqa: S608
    before = snap()
    api.get(f"/customers/{cid}/data")
    assert snap() == before

"""API הגדרות עסק: מאומת, מסונן מסודות, ולידציה, נשמר ב-DB (תיאום עם web/)."""
import json

import pytest
from fastapi.testclient import TestClient

from app.config import load_settings
from app.db import DB
from app.main import create_app
from app.service import CollectService
from tests.conftest import AUTH, OWNER_TOKEN

SECRETS = ("test-secret", "whk-test", "ewk-test", "supersecret")


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def test_requires_owner_token(svc):
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert pub.get("/api/settings").status_code == 401
    assert pub.put("/api/settings", json={"business_name": "x y"}).status_code == 401


def test_view_has_no_secret_values(svc):
    import dataclasses
    svc.s = dataclasses.replace(svc.s, sms_token="supersecret")
    v = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH).get("/api/settings").json()
    flat = json.dumps(v, ensure_ascii=False)
    for sec in SECRETS + (OWNER_TOKEN,):
        assert sec not in flat, sec
    assert v["secrets"]["sms_token"] == "set" and v["secrets"]["sms_webhook_key"] == "set"
    assert v["pricing"] == {"month_ils": 119, "year_ils": 1190, "vat_included": True,
                            "trial_days": 14, "card_required": False, "editable": False}
    assert v["sending_rules"]["max_reminders_per_invoice"] == 3
    assert v["sending_rules"]["hours"]["sun_thu"] == "08:00–20:00"
    assert v["channels"]["whatsapp"] is False and v["payment"]["we_hold_money"] is False
    assert v["mode"]["dry_run"] is True


def test_update_persists_and_applies(api, svc):
    r = api.put("/api/settings", json={"business_name": "מרפאת שקד", "sms_sender_id": "Shaked",
                                       "payment_provider": "meshulam",
                                       "payment_link": "https://meshulam.example/pay/shaked",
                                       "extra_holidays": ["2026-12-25", "2026-12-25"]})
    assert r.status_code == 200, r.text
    v = r.json()
    assert v["business"]["name"] == "מרפאת שקד" and v["business"]["extra_holidays"] == ["2026-12-25"]
    assert v["payment"]["provider"] == "meshulam" and v["payment"]["is_mock"] is False
    assert svc.s.business_name == "מרפאת שקד" and "2026-12-25" in svc.policy.holidays
    # נשמר: שירות חדש על אותו DB טוען את ההגדרות
    again = CollectService(load_settings({}), svc.db)
    assert again.s.business_name == "מרפאת שקד" and again.s.sms_sender_id == "Shaked"
    assert any(a["action"] == "settings_updated" for a in api.get("/audit").json())


@pytest.mark.parametrize("body", [
    {"sms_token": "x"}, {"greeninvoice_api_secret": "x"}, {"owner_api_key": "x"},
    {"password": "x"}])
def test_secret_fields_refused(api, body):
    r = api.put("/api/settings", json=body)
    assert r.status_code == 422 and "סודות" in r.text


@pytest.mark.parametrize("body", [
    {"unknown_field": 1},
    {"sms_sender_id": "שם בעברית"},
    {"business_name": "גבייה דחוף"},                      # מסנן הניסוח (ר-1)
    {"business_name": "<script>"},
    {"payment_link": "https://evil.example/pay"},          # לא בדומיין הספק
    {"payment_link": "http://greeninvoice.co.il/pay/x"},   # לא https
    {"payment_provider": "paypal"},
    {"extra_holidays": ["2026-13-40"]},
    {"email_reply_to": "not-an-email"},
])
def test_invalid_values_rejected_and_nothing_changes(api, svc, body):
    before = svc.s
    assert api.put("/api/settings", json=body).status_code == 422
    assert svc.s == before and svc.db.q("SELECT * FROM business_settings") == []


def test_sending_rules_and_pricing_not_editable(api):
    for body in ({"max_reminders": 5}, {"price_ils_month": 49}, {"trial_days": 30}):
        assert api.put("/api/settings", json=body).status_code == 422


def test_new_name_used_in_next_reminder(api, svc):
    api.put("/api/settings", json={"business_name": "מרפאת שקד"})
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    body = api.get(f"/reminders/{rid}/preview").json()["messages"][0]["body"]
    assert body.startswith("מרפאת שקד:")


def test_db_without_settings_table_rows_is_default():
    s = CollectService(load_settings({"BUSINESS_NAME": "ברירת מחדל"}), DB(":memory:"))
    assert s.s.business_name == "ברירת מחדל"


# ---------- חוזה העיצוב (DESIGN.md §3ב) ----------
def test_design_contract_shape(api):
    v = api.get("/settings").json()
    assert set(v) >= {"business_name", "owner_name", "vat_id", "reply_email", "sms", "pay",
                      "source", "cadence_days", "rules"}
    assert v["sms"] == {"primary": "019", "backup": "inforu", "sender": "StudioMeir"}
    assert v["cadence_days"] == [1, 7, 14] and v["rules"]["max_reminders"] == 3
    assert v["rules"]["window"] == "08:00-20:00" and v["source"]["api_connected"] is True


def test_design_put_partial_and_validation(api, svc):
    r = api.put("/settings", json={"owner_name": "מאיר", "vat_id": "000000018",
                                   "sms": {"sender": "Meir"},
                                   "pay": {"provider": "bit", "page_url": "https://bit.example/p/m"}})
    assert r.status_code == 200, r.text
    v = r.json()
    assert v["owner_name"] == "מאיר" and v["sms"]["sender"] == "Meir" and v["pay"]["provider"] == "bit"
    assert CollectService(load_settings({}), svc.db).design_settings()["owner_name"] == "מאיר"
    for body in ({"vat_id": "123456789"},                       # ספרת ביקורת שגויה
                 {"sms": {"sender": "שם עברי"}},
                 {"sms": {"primary": "twilio"}},                # ספק קבוע
                 {"pay": {"page_url": "http://bit.example/x"}},  # לא https
                 {"cadence_days": [1, 2, 3]}, {"rules": {"max_reminders": 9}},
                 {"api_key": "x"}, {"whatever": 1}):
        assert api.put("/settings", json=body).status_code == 422, body


def test_source_key_is_write_only_and_not_stored_in_phase1(api, svc):
    r = api.post("/settings/source/key", json={"id": "real-id", "secret": "real-secret"})
    assert r.status_code == 501
    import sqlite3
    try:
        rows = svc.db.q("SELECT * FROM business_secrets")
    except sqlite3.OperationalError:
        rows = []
    assert rows == [] and "real-secret" not in json.dumps(api.get("/settings").json())


def test_source_csv_contract(api):
    csv_body = "number,client,phone,amount\n5,A,0501234567,10\n6,B,,20\n"
    r = api.post("/settings/source/csv", content=csv_body.encode()).json()
    assert r == {"imported": 1, "credits": 0, "date_order": "dmy", "amount_check": [],   # critic 35 · הפעלה 124
                 "rejected": [{"row": 3, "reason": "אין טלפון ואין מייל"}]}

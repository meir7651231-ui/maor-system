"""שער בטא 4 (legal/BETA-GATE.md): REAL_DATA_ALLOWED כבוי כברירת מחדל ⇒ ייבוא CSV רק לנתוני דמו מסומנים."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.config import load_settings
from app.db import DB
from app.main import create_app
from app.service import CollectService, is_synthetic_contact
from tests.conftest import AUTH, OWNER_TOKEN

HDR = "מספר מסמך,שם לקוח,טלפון,מייל,יתרה לתשלום,תאריך,תאריך לתשלום\n"
DEMO = HDR + "3001,דנה (דמו),050-0000001,dana@example.com,500,2026-09-01,2026-10-01\n"
REAL = HDR + "3002,אדם אמיתי,050-1234567,real@gmail.com,500,2026-09-01,2026-10-01\n"
MIXED = DEMO + "3003,עוד אחד,052-7654321,,300,2026-09-01,2026-10-01\n"


def _client(gi_client, clock, allowed: str):
    env = {"BUSINESS_NAME": "סטודיו מאיר", "SMS_SENDER_ID": "StudioMeir"}
    if allowed != "":
        env["REAL_DATA_ALLOWED"] = allowed
    svc = CollectService(load_settings(env), DB(":memory:"), gi=gi_client, clock=clock)
    return svc, TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def test_default_is_off():
    assert load_settings({}).real_data_allowed is False
    assert load_settings({"REAL_DATA_ALLOWED": "1"}).real_data_allowed is True


@pytest.mark.parametrize("url", ["/import/csv", "/settings/source/csv"])
def test_real_data_blocked_by_default_403_nothing_saved(gi_client, clock, url):
    svc, c = _client(gi_client, clock, "")
    r = c.post(url, content=REAL.encode())
    assert r.status_code == 403 and "BETA-GATE" in r.json()["detail"]
    assert svc.db.one("SELECT COUNT(*) n FROM invoices")["n"] == 0
    assert svc.db.one("SELECT COUNT(*) n FROM customers")["n"] == 0


def test_mixed_file_rejected_whole(gi_client, clock):
    svc, c = _client(gi_client, clock, "")
    assert c.post("/import/csv", content=MIXED.encode()).status_code == 403
    assert svc.db.one("SELECT COUNT(*) n FROM invoices")["n"] == 0   # אין ייבוא חלקי של דמו+אמיתי


def test_synthetic_demo_csv_allowed_when_off(gi_client, clock):
    svc, c = _client(gi_client, clock, "")
    r = c.post("/import/csv", content=DEMO.encode())
    assert r.status_code == 200 and r.json()["imported"] == 1


def test_switch_on_allows_real(gi_client, clock):
    _, c = _client(gi_client, clock, "1")
    assert c.post("/import/csv", content=REAL.encode()).status_code == 200


def test_blocked_attempt_audited_without_content(gi_client, clock):
    svc, c = _client(gi_client, clock, "")
    c.post("/import/csv", content=REAL.encode())
    rows = [dict(r) for r in svc.db.q("SELECT * FROM audit WHERE action='csv_import_blocked'")]
    assert len(rows) == 1 and "1234567" not in str(rows) and "real@gmail" not in str(rows)


@pytest.mark.parametrize("phone,email,ok", [
    ("050-0000001", "a@example.com", True), ("+972500000123", "", True), ("", "x@mail.example.org", True),
    ("050-1234567", "", False), ("", "a@gmail.com", False), ("050-0000001", "a@gmail.com", False),
    ("050-0001234", "", False), ("0521234567", "a@example.com", False),
    ("", "a@example.com.evil.com", False), ("", "a@notexample.com", False),
])
def test_is_synthetic_contact(phone, email, ok):
    assert is_synthetic_contact(phone, email) is ok

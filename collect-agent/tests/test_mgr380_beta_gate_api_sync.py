"""מנהל 380 (מבקר 222🟡): שער בטא 4 חל גם על סנכרון API, לא רק על ייבוא CSV.

legal/BETA-GATE.md שער 4: «ייבוא CSV וחיבור API מקבלים רק נתוני דמו מסומנים». לפני התיקון `sync()` בתוך
sandbox/mock שמר «050-1234567» כש-REAL_DATA_ALLOWED כבוי (חשבון sandbox של עסק בבטא יכול להכיל לקוחות
אמיתיים). עכשיו: כל מסמך (חשבונית וזיכוי לבדיקה) נבדק לפני ingest — fail-closed, בלי שמירה חלקית,
הניסיון ב-audit בלי תוכן; POST /sync ⇒ 403; webhooks ועבודת הבוקר לא קורסים."""
from __future__ import annotations

import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import load_settings
from app.db import DB
from app.greeninvoice import GreenInvoiceClient
from app.main import create_app
from app.service import CollectService, RealDataBlocked
from tests.conftest import AUTH, OWNER_TOKEN, SANDBOX, FakeGreenInvoice, gi_doc

SYN = dict(phone="050-0000001")


def _doc(i, phone, email):
    d = gi_doc(i, phone=phone)
    d["client"]["emails"] = [email] if email else []
    return d


def _svc(docs, clock, allowed: str = ""):
    gi = GreenInvoiceClient(SANDBOX, "test-id", "test-secret",
                            transport=httpx.MockTransport(FakeGreenInvoice(docs).handler))
    env = {"BUSINESS_NAME": "סטודיו מאיר", "SMS_SENDER_ID": "StudioMeir", "GI_WEBHOOK_KEY": "gwk",
           "SOURCE_WEBHOOK_KEY": "swk"}
    if allowed:
        env["REAL_DATA_ALLOWED"] = allowed
    return CollectService(load_settings(env), DB(":memory:"), gi=gi, clock=clock)


def _counts(svc):
    return (svc.db.one("SELECT COUNT(*) n FROM customers")["n"],
            svc.db.one("SELECT COUNT(*) n FROM invoices")["n"])


def test_real_phone_blocked_nothing_saved_audited(clock):
    svc = _svc([gi_doc(1)], clock)                       # 050-1234567 — לא בטווח הדמו
    with pytest.raises(RealDataBlocked):
        svc.sync()
    assert _counts(svc) == (0, 0)
    row = svc.db.one("SELECT * FROM audit WHERE action='api_sync_blocked'")
    assert row is not None
    assert "1234567" not in (row["detail"] or "") and "דנה" not in (row["detail"] or "")


def test_mixed_sync_rejected_whole(clock):
    svc = _svc([gi_doc(1, **SYN), gi_doc(2, phone="052-7654321")], clock)
    with pytest.raises(RealDataBlocked):
        svc.sync()
    assert _counts(svc) == (0, 0)                        # אין שמירה חלקית של הדמו


def test_synthetic_sync_allowed_when_off(clock):
    svc = _svc([gi_doc(1, **SYN), gi_doc(2, phone="054-0000002")], clock)
    svc.sync()
    assert _counts(svc)[1] == 2


@pytest.mark.parametrize("phone", ["03-0000003", "123", ""])
def test_demo_landline_and_junk_phone_pass(clock, phone):
    """נתוני ה-mock של הדמו: קווי בטווח הדמו ו-«123» (מקרה קצה מכוון) — לא חוסמים את הדמו."""
    svc = _svc([_doc(1, phone, "c@example.com")], clock)
    svc.sync()
    assert _counts(svc)[1] == 1


@pytest.mark.parametrize("phone,email", [("03-5551234", "c@example.com"), ("1234567", ""),
                                         ("050-0000001", "real@gmail.com")])
def test_real_landline_or_email_still_blocked(clock, phone, email):
    svc = _svc([_doc(1, phone, email)], clock)
    with pytest.raises(RealDataBlocked):
        svc.sync()
    assert _counts(svc) == (0, 0)


def test_switch_on_allows_real(clock):
    svc = _svc([gi_doc(1)], clock, "1")
    svc.sync()
    assert _counts(svc)[1] == 1


def test_post_sync_403_not_500(clock):
    svc = _svc([gi_doc(1)], clock)
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    r = c.post("/sync")
    assert r.status_code == 403 and "BETA-GATE" in r.json()["detail"]
    assert _counts(svc) == (0, 0)


def test_webhook_sync_blocked_quietly(clock):
    svc = _svc([gi_doc(1)], clock)
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    r = c.post("/webhooks/greeninvoice?k=gwk", content=json.dumps({"id": "x1"}).encode())
    assert r.status_code == 200 and r.json() == {"ok": False}
    assert _counts(svc) == (0, 0)


def test_morning_reports_sync_failed(clock):
    from app import morning
    svc = _svc([gi_doc(1)], clock)
    out = morning.run_morning(svc)
    assert out["status"] in ("sync_failed", "closed_day")
    if out["status"] == "sync_failed":
        assert "RealDataBlocked" in out["sync_error"]
    assert _counts(svc) == (0, 0)


def test_mutation_guard_source_has_gate():
    """הגנת-מקור: אם השער ב-sync יוסר, הבדיקות למעלה ייכשלו; כאן נועלים גם שהוא לפני ingest."""
    import inspect
    src = inspect.getsource(CollectService.sync)
    assert src.index("_api_gate_ok") < src.index("self.ingest(")

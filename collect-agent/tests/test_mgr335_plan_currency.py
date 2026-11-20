"""מנהל 335 (מבקר 185 🔴): הסדר על חשבונית בדולר יצא ללקוח כ-«2 תשלומים של 250 ₪» — כל `fmt_amount` במסלולי ההסדר
נפל לברירת המחדל ILS. בנוסף, בדשבורד: כרטיס ההצעה וכרטיס «הסדרי תשלומים» הציגו ₪ קבוע ⇒ בעל העסק אישר הודעה שגויה
מתוך כרטיס שמציג אותו סכום שגוי. התיקון: `plan_currency(p)` (מטבע חשבונית העוגן; הסדר תמיד חד-מטבעי) מועבר לכל
נוסח ההסדר, ל-`plan_progress` ול-`/plans` (`currency`)."""
from __future__ import annotations

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _cur(fake_gi, currency, amount="500.00"):
    fake_gi.docs[0]["currency"] = currency
    fake_gi.docs[0]["amount"] = amount


@pytest.mark.parametrize("cur,sym", [("USD", "$"), ("EUR", "€")])
def test_sms_offer_in_plan_currency(svc, fake_gi, cur, sym):
    _cur(fake_gi, cur)
    svc.sync()
    svc.approve_plan(svc.propose_plan(1, 2), confirm_amount=True)
    sent = svc.sender.sent[-1]
    assert sent["body"].count(sym) >= 1 and "₪" not in sent["body"], sent
    assert f"{sym}250" in sent["body"]


def test_email_offer_lines_in_plan_currency(svc, fake_gi):
    """לקוח בלי נייד ⇒ מייל עם הלוח המלא — כל שורה בדולר."""
    _cur(fake_gi, "USD")
    fake_gi.docs[0]["client"]["phone"] = ""
    fake_gi.docs[0]["client"]["emails"] = ["a@example.com"]
    svc.sync()
    r = svc.approve_plan(svc.propose_plan(1, 2), confirm_amount=True)
    assert r["text"].count("$250") == 2 and "₪" not in r["text"], r["text"]


def test_plans_api_and_progress_carry_currency(svc, fake_gi, api):
    _cur(fake_gi, "USD")
    svc.sync()
    pid = svc.propose_plan(1, 2)
    row = next(p for p in api.get("/plans").json() if p["id"] == pid)
    assert row["currency"] == "USD" and row["progress"] is None   # ההצעה — הכרטיס צריך את המטבע כבר כאן
    svc.approve_plan(pid, confirm_amount=True)
    row = next(p for p in api.get("/plans").json() if p["id"] == pid)
    assert row["currency"] == "USD" and row["progress"]["currency"] == "USD"


def test_missed_card_in_plan_currency(svc, fake_gi, clock):
    _cur(fake_gi, "USD")
    svc.sync()
    svc.approve_plan(svc.propose_plan(1, 2), confirm_amount=True)
    clock.now += timedelta(days=20)
    svc.sync()
    svc.plan()
    body = svc.db.one("SELECT body FROM messages WHERE intent='plan_missed'")["body"]
    assert "$250" in body and "$500" in body and "₪" not in body, body


def test_control_ils_unchanged(svc, api):
    svc.sync()
    pid = svc.propose_plan(1, 3)
    r = svc.approve_plan(pid, confirm_amount=True)
    assert "400 ₪" in r["text"] and "$" not in r["text"]
    row = next(p for p in api.get("/plans").json() if p["id"] == pid)
    assert row["currency"] == "ILS" and row["progress"]["currency"] == "ILS"

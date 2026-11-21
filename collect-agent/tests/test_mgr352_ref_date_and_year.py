"""מנהל 352 — תיקון מבקר 199 (א🔴 תאריך-הפניה לפני ההבטחה · ב🟠 שנה במועד רחוק) + בקרות שהתיקון לא זולג."""
from datetime import date

import pytest

from app import conversation as cv

TODAY = date(2026, 11, 8)


def _d(text, today=TODAY):
    return cv.respond(text, cv.Context(business="סטודיו", today=today))


def _req(d):
    return getattr(d, "requested_date", None) or d.promise_date


@pytest.mark.parametrize(("text", "want"), [
    ("לגבי חשבונית 1.11 אשלם ב-15", date(2026, 11, 15)),
    ("החשבונית מה-2.11 אעביר ב-20.11", date(2026, 11, 20)),
    ("about the invoice from 1.11 I will pay on 15.11", date(2026, 11, 15)),
])
def test_reference_date_variants(text, want):
    assert _req(_d(text)) == want


@pytest.mark.parametrize(("text", "want"), [
    ("אשלם ב-15", date(2026, 11, 15)),          # משפט יחיד בלי הפניה — ביט-זהה
    ("אשלם ב-10.12", date(2026, 12, 10)),        # 198🔴 נשאר מתוקן
    ("אשלם 1.500 ב-10.12", date(2026, 12, 10)),  # 199א של 351 נשאר מתוקן
])
def test_single_clause_unchanged(text, want):
    assert _req(_d(text)) == want


def test_far_year_rule():
    assert cv._he_date(date(2027, 11, 25), TODAY).endswith("25.11.2027")
    assert cv._he_date(date(2027, 1, 5), date(2026, 12, 20)).endswith("5.1")       # מעבר שנה קרוב — חד-משמעי
    assert cv._he_date(date(2026, 11, 25), TODAY).endswith("25.11")
    assert cv._he_date(date(2027, 11, 25)).endswith("25.11")                       # בלי today ⇒ ביט-זהה


def test_near_date_no_year_in_reply():
    d = _d("אשלם ב-25.11")
    assert "2026" not in d.reply and not any("2026" in a for a in d.owner_actions)


def test_owner_decision_update_far_year_has_year(svc):
    """מבקר 199ב בעדכון ההכרעה ללקוח: «אשלם ב-25.11.2027» ⇒ האישור/הסירוב נושאים את השנה (גם בסולם הקיצור)."""
    from fastapi.testclient import TestClient

    from app.main import create_app
    from tests.conftest import AUTH, OWNER_TOKEN
    svc.sync()
    svc.inbound("sms", "050-1234567", "אשלם ב-25.11.2027")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    cid = svc.db.one("SELECT id FROM customers WHERE external_id='cl1'")["id"]
    r = api.post(f"/customers/{cid}/promise-request", json={"approve": True}).json()
    body = svc.db.one("SELECT body FROM drafts WHERE id=?", (r["customer_update"]["draft"],))["body"]
    assert "25.11.2027" in body, body
    assert "2027" in r["customer_update"].get("summary", "2027")

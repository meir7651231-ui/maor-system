"""הפעלה 137 — עמודת «תזכורות» בעמוד החשבוניות הציגה תאריך וערוץ שגויים.

`/dashboard` החזיר רק את `last_reminder` (השלב הגבוה ביותר, גם אם הוא טיוטה שממתינה לאישור), והממשק
גזר ממנו את «אחרונה <תאריך>»: כשהשלב הבא כבר בתור, `sent_at` שלו ריק ⇒ הממשק הציג את התאריך של היום,
כאילו התזכורת יצאה היום. בנוסף הערוץ הוצג תמיד 📱, גם ללקוח שקיבל מייל בלבד.
התיקון: שדה חדש `last_sent` (מתי ובאיזה ערוצים יצאה התזכורת האחרונה שבאמת נשלחה), והממשק קורא אותו.
`last_reminder` לא השתנה.
"""
from __future__ import annotations

from datetime import timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

ROOT = Path(__file__).resolve().parent.parent
API = (ROOT / "web/src/api.ts").read_text(encoding="utf-8")
PAGE = (ROOT / "web/src/pages/Invoices.tsx").read_text(encoding="utf-8")


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _row(api, number="1001"):
    return next(x for x in api.get("/dashboard").json()["invoices"] if x["number"] == number)


def _send_first(api):
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    assert api.post(f"/reminders/{ids[0]}/approve").status_code == 200
    api.post("/dispatch")
    return ids


def test_nothing_sent_yet_means_no_last_sent(api):
    api.post("/sync")
    api.post("/plan")
    row = _row(api)
    assert row["reminders_sent"] == 0 and row["last_sent"] is None
    assert row["last_reminder"]["status"] == "pending_approval"


def test_last_sent_has_date_and_real_channels(api):
    _send_first(api)
    row = _row(api)
    assert row["last_sent"] == {"sent_at": row["last_reminder"]["sent_at"], "channels": ["email", "sms"]}


def test_pending_next_step_does_not_hide_when_the_last_one_went_out(api, clock):
    """הבאג: שלב 2 בתור (sent_at ריק) הסתיר את מועד השליחה של שלב 1."""
    _send_first(api)
    sent_at = _row(api)["last_sent"]["sent_at"]
    clock.now += timedelta(days=7)
    api.post("/plan")
    row = _row(api)
    assert row["last_reminder"]["status"] == "pending_approval" and row["last_reminder"]["sent_at"] is None
    assert row["reminders_sent"] == 1
    assert row["last_sent"]["sent_at"] == sent_at
    assert row["last_sent"]["sent_at"][:10] != api.get("/dashboard").json()["today"]


def test_email_only_customer_is_not_reported_as_sms(api, fake_gi):
    fake_gi.docs[0]["client"]["phone"] = "03-1234567"   # קווי ⇒ אין SMS
    _send_first(api)
    assert _row(api)["last_sent"]["channels"] == ["email"]


def test_merged_reminder_counts_on_every_invoice_it_covers(api):
    """«הבא (3)» מ-136: חשבונית נלווית של תזכורת מאוחדת שנשלחה לא מוצגת «טרם נשלחה»."""
    head = "מספר מסמך,שם לקוח,טלפון,יתרה לתשלום,תאריך,תאריך לתשלום\n"
    csv = head + "".join(f"{3001 + k},דנה כהן,050-1234567,{a},01/09/2026,01/10/2026\n"
                         for k, a in enumerate(("120", "130.50", "140")))
    api.post("/sync")
    assert api.post("/settings/source/csv", content=csv.encode()).status_code == 200
    api.post("/plan")
    m = next(r for r in api.get("/reminders", params={"view": "summary"}).json() if r["invoice_count"] > 1)
    assert api.post(f"/reminders/{m['id']}/approve", json={"confirm_open": True}).status_code == 200
    api.post("/dispatch")
    rows = [_row(api, n) for n in ("3001", "3002", "3003")]
    assert [r["reminders_sent"] for r in rows] == [1, 1, 1]
    assert len({r["last_sent"]["sent_at"] for r in rows}) == 1 and rows[0]["last_sent"]["channels"] == ["sms"]


def test_web_reads_last_sent_and_not_the_pending_step():
    assert "r.last_sent" in API and "lastSent" in API
    # הנפילה ל«היום» כשאין sent_at היא הבאג: מותרת רק כשאין last_sent (שרת ישן)
    assert "(r.last_reminder?.sent_at ?? d.today)" not in API
    assert "last.channel === 'sms' ? '📱' : '✉️'" not in PAGE
    assert "sentChannels" in PAGE

"""תלונת ספאם (ARF, RFC 5965) על מייל תזכורת ⇒ המייל לכתובת הזו נעצר + התראה לבעל העסק.

הבאג: דוח feedback (Feedback-Type: abuse) מספק דואר נכנס למסלול תשובת-לקוח ⇒ כרטיס «שולח לא מוכר»,
והמיילים ללקוח שסימן «ספאם» המשיכו לצאת. לפי סעיף 30א סימון ספאם = סירוב ⇒ חייבים לעצור.
SMS לא נעצר אוטומטית (התלונה על המייל) — בעל העסק מקבל התראה ומחליט.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.channels import parse_complaint
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


@pytest.fixture
def sent_mail(api, svc):
    api.post("/sync")
    for rid in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{rid}/approve")
    api.post("/dispatch")
    row = svc.db.one("SELECT m.*, c.email AS cemail, c.phone AS cphone FROM messages m JOIN customers c "
                     "ON c.id=m.customer_id WHERE m.direction='out' AND m.channel='email' ORDER BY m.id LIMIT 1")
    assert row is not None, "לא יצא מייל"
    return row


def _arf(to: str, msgid: str = "") -> str:
    mid = f"\nMessage-ID: {msgid}" if msgid else ""
    return ("This is an email abuse report for an email message received from IP 10.0.0.1.\n\n"
            "Feedback-Type: abuse\nUser-Agent: SomeISP-FBL/1.0\nVersion: 1\n"
            f"Original-Rcpt-To: {to}\nArrival-Date: Thu, 19 Nov 2026 08:00:00 +0200{mid}")


def _alerts(svc, cid):
    return svc.db.q("SELECT * FROM messages WHERE needs_owner=1 AND intent='email_complaint' "
                    "AND customer_id=?", (cid,))


def test_complaint_suppresses_email_and_alerts_owner(svc, sent_mail):
    unknown_before = svc.db.one("SELECT COUNT(*) FROM messages WHERE intent='unknown_sender'")[0]
    r = svc.email_webhook("fbl@isp.example", _arf(sent_mail["cemail"]), "arf-1",
                          subject="Email Abuse Report")
    assert r.get("complaint") == "suppressed", r
    assert svc.suppressed("email", sent_mail["cemail"])
    assert not svc.suppressed("sms", sent_mail["cphone"])           # SMS — החלטת בעל העסק
    assert len(_alerts(svc, sent_mail["customer_id"])) == 1
    assert svc.db.one("SELECT COUNT(*) FROM messages WHERE intent='unknown_sender'")[0] == unknown_before


def test_after_complaint_no_more_email_to_that_address(svc, sent_mail):
    svc.email_webhook("fbl@isp.example", _arf(sent_mail["cemail"]), "arf-2", subject="Abuse report")
    cust = svc.db.one("SELECT * FROM customers WHERE id=?", (sent_mail["customer_id"],))
    assert svc.gate(cust, "email", sent_mail["cemail"]) is not None   # השער חוסם


def test_matches_by_original_message_id_when_rcpt_missing(svc, sent_mail):
    if not sent_mail["provider_id"]:
        pytest.skip("אין Message-ID שמור")
    body = _arf("", msgid=sent_mail["provider_id"]).replace("Original-Rcpt-To: \n", "")
    r = svc.email_webhook("fbl@isp.example", body, "arf-3", subject="Email Abuse Report")
    assert r.get("complaint") == "suppressed" and svc.suppressed("email", sent_mail["cemail"])


def test_duplicate_report_alerts_once(svc, sent_mail):
    for _ in range(2):
        svc.email_webhook("fbl@isp.example", _arf(sent_mail["cemail"]), "arf-4", subject="Abuse")
    assert len(_alerts(svc, sent_mail["customer_id"])) == 1


def test_customer_writing_feedback_word_is_not_a_complaint():
    assert parse_complaint("dana@example.com", "תודה! feedback: הכול טוב", "Re: תזכורת") is None
    assert parse_complaint("dana@example.com", "Feedback-Type: not-spam\nOriginal-Rcpt-To: a@b.example",
                           "x") is None


@pytest.mark.parametrize("ftype", ["abuse", "Abuse", "fraud", "other"])
def test_parse_complaint_types(ftype):
    c = parse_complaint("fbl@isp.example", f"Feedback-Type: {ftype}\nOriginal-Rcpt-To: <A@B.example>", "")
    assert c == {"recipient": "a@b.example", "message_ids": [], "type": ftype.lower()}

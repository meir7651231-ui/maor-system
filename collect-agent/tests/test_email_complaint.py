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
    r = svc.email_webhook("fbl@isp.example", _arf(sent_mail["cemail"], sent_mail["provider_id"]), "arf-1",
                          subject="Email Abuse Report")
    assert r.get("complaint") == "suppressed", r
    assert svc.suppressed("email", sent_mail["cemail"])
    assert not svc.suppressed("sms", sent_mail["cphone"])           # SMS — החלטת בעל העסק
    assert len(_alerts(svc, sent_mail["customer_id"])) == 1
    assert svc.db.one("SELECT COUNT(*) FROM messages WHERE intent='unknown_sender'")[0] == unknown_before


def test_after_complaint_no_more_email_to_that_address(svc, sent_mail):
    svc.email_webhook("fbl@isp.example", _arf(sent_mail["cemail"], sent_mail["provider_id"]), "arf-2",
                      subject="Abuse report")
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
        svc.email_webhook("fbl@isp.example", _arf(sent_mail["cemail"], sent_mail["provider_id"]), "arf-4",
                          subject="Abuse")
    assert len(_alerts(svc, sent_mail["customer_id"])) == 1


def test_customer_writing_feedback_word_is_not_a_complaint():
    assert parse_complaint("dana@example.com", "תודה! feedback: הכול טוב", "Re: תזכורת") is None
    assert parse_complaint("dana@example.com", "Feedback-Type: not-spam\nOriginal-Rcpt-To: a@b.example",
                           "x") is None


@pytest.mark.parametrize("ftype", ["abuse", "Abuse", "fraud", "other"])
def test_parse_complaint_types(ftype):
    c = parse_complaint("fbl@isp.example", f"Feedback-Type: {ftype}\nOriginal-Rcpt-To: <A@B.example>", "")
    assert c == {"recipient": "a@b.example", "message_ids": [], "type": ftype.lower()}


# ── critic 189 + הכרעת ראש צוות: תלונה נקלטת רק כשהיא על מייל ששלחנו, לנמען שאליו שלחנו ─────────────────────
FAIL = "mx.example; spf=fail; dkim=fail; dmarc=fail"


def _not_suppressed(svc, sent_mail, r, reason):
    assert r.get("complaint") == "unverified" and r.get("reason") == reason, r
    assert not svc.suppressed("email", sent_mail["cemail"])
    assert _alerts(svc, sent_mail["customer_id"]) == []
    a = svc.db.one("SELECT detail FROM audit WHERE action='email_complaint_unverified' ORDER BY id DESC LIMIT 1")
    assert a and reason in a["detail"] and "@" not in a["detail"]          # audit בלי כתובות


def test_foreign_sender_forged_rcpt_without_message_id(svc, sent_mail):
    r = svc.email_webhook("attacker@evil.example", f"Feedback-Type: abuse\nOriginal-Rcpt-To: {sent_mail['cemail']}\n",
                          "forge-1", auth_results=FAIL)
    _not_suppressed(svc, sent_mail, r, "no_message_id")


def test_foreign_sender_invented_message_id(svc, sent_mail):
    r = svc.email_webhook("attacker@evil.example", _arf(sent_mail["cemail"], "<made.up.123@evil.example>"),
                          "forge-2", auth_results=FAIL)
    _not_suppressed(svc, sent_mail, r, "not_our_message")


def test_real_message_id_but_other_customers_address(svc, sent_mail):
    """מי שקיבל מייל אמיתי משלנו (יש לו Message-ID) לא יכול לנצל אותו כדי להסיר כתובת של לקוח אחר."""
    other = svc.db.one("SELECT email FROM customers WHERE id!=? AND email IS NOT NULL", (sent_mail["customer_id"],))
    r = svc.email_webhook("attacker@evil.example", _arf(other["email"], sent_mail["provider_id"]), "forge-3")
    assert r.get("complaint") == "unverified" and r.get("reason") == "recipient_mismatch", r
    assert not svc.suppressed("email", other["email"]) and not svc.suppressed("email", sent_mail["cemail"])


def test_message_id_of_sms_is_not_ours_for_email(svc, sent_mail):
    sms = svc.db.one("SELECT provider_id FROM messages WHERE direction='out' AND channel='sms' LIMIT 1")
    r = svc.email_webhook("fbl@isp.example", _arf(sent_mail["cemail"], f"<{sms['provider_id']}@x.example>"), "forge-4")
    assert r.get("complaint") == "unverified" and not svc.suppressed("email", sent_mail["cemail"])


def test_message_id_without_or_with_double_brackets_still_matches(svc, sent_mail):
    bare = sent_mail["provider_id"].strip("<>")
    r = svc.email_webhook("fbl@isp.example", _arf(sent_mail["cemail"], f"<<{bare}>>"), "fbl-ok")
    assert r.get("complaint") == "suppressed", r

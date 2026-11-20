"""מייל שחזר (bounce/DSN) ⇒ ההודעה מסומנת «לא נמסר» + התראה לבעל העסק, ולא כרטיס «שולח לא מוכר».

הבאג: הודעת MAILER-DAEMON נכנסה למסלול תשובת-לקוח: «שולח לא מוכר» לבעל העסק (רעש), והמייל
המקורי נשאר 'sent' לנצח — בעל העסק לא ידע שכתובת הלקוח שגויה (כמו DLR ב-SMS, רק במייל).
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.channels import parse_bounce
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
    row = svc.db.one("SELECT m.*, c.email AS cemail FROM messages m JOIN customers c ON c.id=m.customer_id "
                     "WHERE m.direction='out' AND m.channel='email' ORDER BY m.id LIMIT 1")
    assert row is not None, "לא יצא מייל"
    return row


def _dsn(to: str, status: str = "5.1.1", msgid: str = "") -> str:
    mid = f"\nMessage-ID: {msgid}" if msgid else ""
    return (f"This is the mail system at host mx.example.com.\nYour message could not be delivered.\n"
            f"Final-Recipient: rfc822; {to}\nAction: failed\nStatus: {status}\n"
            f"Diagnostic-Code: smtp; 550 {status} User unknown{mid}")


def _bounce_alerts(svc, cid):
    return svc.db.q("SELECT * FROM messages WHERE needs_owner=1 AND intent='email_bounced' "
                    "AND customer_id=?", (cid,))


def test_hard_bounce_marks_failed_and_alerts_owner(svc, sent_mail):
    before_unknown = svc.db.one("SELECT COUNT(*) FROM messages WHERE intent='unknown_sender'")[0]
    r = svc.email_webhook("MAILER-DAEMON@mx.example.com", _dsn(sent_mail["cemail"], msgid=sent_mail["provider_id"]),
                          "dsn-1",
                          subject="Undelivered Mail Returned to Sender")
    assert r.get("bounce") == "failed", r
    assert svc.db.one("SELECT delivery_status FROM messages WHERE id=?", (sent_mail["id"],))[0] == "failed"
    assert len(_bounce_alerts(svc, sent_mail["customer_id"])) == 1
    after_unknown = svc.db.one("SELECT COUNT(*) FROM messages WHERE intent='unknown_sender'")[0]
    assert after_unknown == before_unknown                         # לא כרטיס «שולח לא מוכר»
    # לא הסרה אוטומטית — ההחלטה של בעל העסק
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (sent_mail["customer_id"],))[0] == 0


def test_matches_by_original_message_id(svc, sent_mail):
    """ה-Message-ID המקורי מצביע על המייל שלנו; Final-Recipient של כתובת אחרת ⇒ לא מקבלים (critic 190)."""
    ok = svc.email_webhook("postmaster@other.example", _dsn(sent_mail["cemail"], msgid=sent_mail["provider_id"]),
                           "dsn-2", subject="Delivery Status Notification (Failure)")
    assert ok.get("bounce") == "failed" and _bounce_alerts(svc, sent_mail["customer_id"])


def test_recipient_mismatch_is_rejected(svc, sent_mail):
    r = svc.email_webhook("postmaster@other.example", _dsn("someone-else@x.example", msgid=sent_mail["provider_id"]),
                          "dsn-2b", subject="Delivery Status Notification (Failure)")
    assert r == {"ok": True, "bounce": "unverified", "reason": "recipient_mismatch"}
    assert not svc.email_bounced(sent_mail["cemail"])


def test_soft_bounce_is_not_failure(svc, sent_mail):
    r = svc.email_webhook("MAILER-DAEMON@mx.example.com",
                          _dsn(sent_mail["cemail"], "4.2.2", msgid=sent_mail["provider_id"]), "dsn-3",
                          subject="Delivery Status Notification (Delay)")
    assert r.get("bounce") == "delayed"
    assert svc.db.one("SELECT delivery_status FROM messages WHERE id=?", (sent_mail["id"],))[0] != "failed"
    assert not _bounce_alerts(svc, sent_mail["customer_id"])


def test_duplicate_dsn_alerts_once(svc, sent_mail):
    for _ in range(2):
        svc.email_webhook("MAILER-DAEMON@mx.example.com", _dsn(sent_mail["cemail"], msgid=sent_mail["provider_id"]),
                          "dsn-4",
                          subject="Undelivered Mail Returned to Sender")
    assert len(_bounce_alerts(svc, sent_mail["customer_id"])) == 1


def test_customer_reply_is_not_a_bounce():
    assert parse_bounce("dana@example.com", "תודה, אשלם מחר", "Re: תזכורת") is None
    assert parse_bounce("dana@example.com", "Final-Recipient: x@y.z\nStatus: 5.1.1", "שאלה") is None


@pytest.mark.parametrize("sender,subject", [
    ("MAILER-DAEMON@mx.example.com", "Undelivered Mail Returned to Sender"),
    ("postmaster@mail.example.com", "Delivery Status Notification (Failure)"),
    ("Mail Delivery Subsystem <mailer-daemon@googlemail.com>", "Delivery Status Notification (Failure)"),
    ("noreply@x.example", "Undeliverable: תזכורת תשלום"),
])
def test_parse_bounce_variants(sender, subject):
    b = parse_bounce(sender, "Final-Recipient: rfc822; a@b.example\nStatus: 5.1.1", subject)
    assert {k: b[k] for k in ("recipient", "permanent", "message_ids")} == \
        {"recipient": "a@b.example", "permanent": True, "message_ids": []}
    assert b["code"] == "5.1.1" and b["address_invalid"] is True

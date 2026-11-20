"""DSN נקלט רק כשהוא אמיתי ומתייחס למייל שלנו (QA סט #22 / critic 190, אותו דפוס כמו ARF ב-189).

החור: DSN מ-MAILER-DAEMON@<כל דומיין> עם Final-Recipient של לקוחה סימן את הכתובת «מתה» (בלי Message-ID
שלנו, בלי אימות) ⇒ אפשר היה להשתיק כל לקוחה. עכשיו: Message-ID של מייל ששלחנו + נמען תואם + אין כשל
אימות מפורש ⇒ נקלט. אחרת ⇒ audit בלבד, שום מצב לא משתנה.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

PASS = "mx.gabi.example; spf=pass smtp.helo=mx.example.com; dkim=pass header.d=example.com; dmarc=pass"
FAIL = "mx.gabi.example; spf=fail; dkim=fail; dmarc=fail"


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


@pytest.fixture
def sent(api, svc):
    api.post("/sync")
    for rid in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{rid}/approve")
    api.post("/dispatch")
    row = svc.db.one("SELECT m.*, c.email cemail FROM messages m JOIN customers c ON c.id=m.customer_id "
                     "WHERE m.direction='out' AND m.channel='email' ORDER BY m.id LIMIT 1")
    assert row is not None and row["provider_id"]
    return row


def _dsn(to, msgid="", header="Message-ID"):
    tail = f"\n\n--- original headers ---\n{header}: {msgid}\n" if msgid else ""
    return f"Final-Recipient: rfc822; {to}\nAction: failed\nStatus: 5.1.1\n{tail}"


def _state(svc, sent):
    return (svc.email_bounced(sent["cemail"]),
            svc.db.one("SELECT delivery_status FROM messages WHERE id=?", (sent["id"],))[0],
            len(svc.db.q("SELECT 1 FROM messages WHERE intent='email_bounced'")))


@pytest.mark.parametrize("name,msgid_of,to_of,auth,reason", [
    ("forged: no message-id", None, "customer", PASS, "no_message_id"),
    ("forged: foreign message-id", "<x123@evil.example>", "customer", PASS, "not_our_message"),
    ("forged: ours but other recipient", "ours", "other", PASS, "recipient_mismatch"),
    ("forged: ours but auth failed", "ours", "customer", FAIL, "auth_failed"),
])
def test_forged_dsn_changes_nothing(svc, sent, name, msgid_of, to_of, auth, reason):
    before = _state(svc, sent)
    mid = sent["provider_id"] if msgid_of == "ours" else (msgid_of or "")
    to = sent["cemail"] if to_of == "customer" else "someone@else.example"
    r = svc.email_webhook("MAILER-DAEMON@evil.example", _dsn(to, mid), f"f-{reason}",
                          subject="Undelivered Mail Returned to Sender", auth_results=auth)
    assert r["bounce"] == "unverified" and r["reason"] == reason, name
    assert _state(svc, sent) == before, name                        # שום שינוי מצב
    assert svc.db.one("SELECT 1 FROM audit WHERE action='email_bounce_unverified'")


def test_genuine_dsn_for_our_message_marks_address(svc, sent):
    r = svc.email_webhook("MAILER-DAEMON@mx.example.com", _dsn(sent["cemail"], sent["provider_id"]), "g1",
                          subject="Undelivered Mail Returned to Sender", auth_results=PASS)
    assert r["bounce"] == "failed"
    assert _state(svc, sent)[:2] == (True, "failed")


def test_original_message_id_header_and_double_brackets(svc, sent):
    """Original-Message-ID / <<id>> (כמו ב-control של critic 190) מזוהים כמו Message-ID."""
    r = svc.email_webhook("MAILER-DAEMON@mx.example.com",
                          _dsn(sent["cemail"], f"<{sent['provider_id']}>", header="Original-Message-ID"), "g2",
                          subject="Undelivered Mail Returned to Sender", auth_results=PASS)
    assert r["bounce"] == "failed" and svc.email_bounced(sent["cemail"])


def test_no_auth_header_is_accepted_but_recorded(svc, sent):
    """ספקי inbound שלא מעבירים Authentication-Results: ה-Message-ID האקראי הוא ההגנה; נרשם auth_missing."""
    r = svc.email_webhook("MAILER-DAEMON@mx.example.com", _dsn(sent["cemail"], sent["provider_id"]), "g3",
                          subject="Undelivered Mail Returned to Sender")
    assert r["bounce"] == "failed"
    assert svc.db.one("SELECT 1 FROM audit WHERE action='email_bounce_auth_missing'")

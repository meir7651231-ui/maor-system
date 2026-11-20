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
    return (svc.email_bounce_confirmed(sent["cemail"]),
            svc.db.one("SELECT delivery_status FROM messages WHERE id=?", (sent["id"],))[0],
            len(svc.db.q("SELECT 1 FROM messages WHERE intent='email_bounced'")))


@pytest.mark.parametrize("name,msgid_of,to_of,auth,reason,review", [
    ("forged: no message-id", None, "customer", PASS, "no_message_id", True),
    ("forged: foreign message-id", "<x123@evil.example>", "customer", PASS, "not_our_message", True),
    ("forged: ours but other recipient", "ours", "other", PASS, "recipient_mismatch", False),
    ("forged: ours but auth failed", "ours", "customer", FAIL, "auth_failed", True),
])
def test_forged_dsn_never_blocks_permanently(svc, sent, name, msgid_of, to_of, auth, reason, review):
    """DSN שלא אומת לא משנה שום דבר קבוע. אם Final-Recipient של לקוח קיים ⇒ השהיית מייל + כרטיס «בדוק ואשר»
    (הכרעת מקשר, q22-04) — לא email_bounces. נמען שאינו לקוח ⇒ שום דבר."""
    before = _state(svc, sent)
    mid = sent["provider_id"] if msgid_of == "ours" else (msgid_of or "")
    to = sent["cemail"] if to_of == "customer" else "someone@else.example"
    r = svc.email_webhook("MAILER-DAEMON@evil.example", _dsn(to, mid), f"f-{reason}",
                          subject="Undelivered Mail Returned to Sender", auth_results=auth)
    assert r["bounce"] == "unverified" and r["reason"] == reason, name
    assert _state(svc, sent) == before, name                        # אין חסימה קבועה / failed / כרטיס bounced
    assert svc.email_bounce_pending(sent["cemail"]) is review, name
    cards = svc.db.q("SELECT 1 FROM messages WHERE intent='email_bounce_review' AND needs_owner=1")
    assert len(cards) == (1 if review else 0), name


def test_owner_dismisses_forged_review_mail_resumes(api, svc, sent):
    svc.email_webhook("MAILER-DAEMON@evil.example", _dsn(sent["cemail"]), "fr1",
                      subject="Undelivered Mail Returned to Sender")
    cust = svc.db.one("SELECT * FROM customers WHERE id=?", (sent["customer_id"],))
    assert svc.gate(cust, "email", sent["cemail"]) == "email_bounced"      # מושהה בינתיים
    r = api.post(f"/customers/{sent['customer_id']}/email-bounce", json={"confirm": False})
    assert r.status_code == 200 and r.json()["email"] == "resumed"
    assert not svc.email_bounced(sent["cemail"]) and svc.gate(cust, "email", sent["cemail"]) is None
    assert not svc.db.q("SELECT 1 FROM messages WHERE intent='email_bounce_review' AND needs_owner=1")


def test_owner_confirms_real_unreferenced_dsn(api, svc, sent):
    """DSN אמיתי בלי Message-ID שלנו (q22-04): בעל העסק מאשר ⇒ הכתובת חסומה למייל לצמיתות (עד שמשתנה)."""
    svc.email_webhook("MAILER-DAEMON@mx.example.com", _dsn(sent["cemail"]), "fr2",
                      subject="Undelivered Mail Returned to Sender")
    r = api.post(f"/customers/{sent['customer_id']}/email-bounce", json={"confirm": True})
    assert r.json()["email"] == "blocked" and svc.email_bounce_confirmed(sent["cemail"])
    assert api.post(f"/customers/{sent['customer_id']}/email-bounce", json={"confirm": True}).status_code >= 400


def test_review_card_once_per_address(svc, sent):
    for i in range(3):
        svc.email_webhook("MAILER-DAEMON@evil.example", _dsn(sent["cemail"]), f"fr3-{i}",
                          subject="Undelivered Mail Returned to Sender")
    assert len(svc.db.q("SELECT 1 FROM messages WHERE intent='email_bounce_review'")) == 1


def test_soft_unverified_dsn_does_not_hold(svc, sent):
    body = _dsn(sent["cemail"]).replace("Status: 5.1.1", "Status: 4.2.2")
    svc.email_webhook("MAILER-DAEMON@mx.example.com", body, "fr4", subject="Delivery Status Notification (Delay)")
    assert not svc.email_bounce_pending(sent["cemail"])


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

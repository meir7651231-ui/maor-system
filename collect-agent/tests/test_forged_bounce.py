"""גבייה סוכן · אותו חור כמו critic 189, ב-bounce (20.11): מנהל 339 (critic 188) הוסיף «אחרי bounce קבוע לא שולחים
עוד מייל לכתובת». הזיהוי דרש רק שם-משתמש של מערכת דואר (`mailer-daemon@` **בכל דומיין**) + `Final-Recipient`, ובלי
Message-ID נפל ל«המייל האחרון לנמען» ⇒ כל אחד יכול היה לכבות את ערוץ המייל של לקוח + כרטיס כוזב «המייל חזר».
עכשיו (באנלוגיה להכרעת ראש הצוות ל-189; מאוחד עם ceb012d): bounce נקלט רק כשה-Message-ID המקורי (Message-ID /
Original-Message-ID) תואם מייל ששלחנו, Final-Recipient (כשמופיע) תואם לכתובת שאליה שלחנו, ואין כשל אימות מפורש."""
from datetime import timedelta

FAIL = "mx.example; spf=fail; dkim=fail; dmarc=fail"
DANA = "c1@example.com"


def _sent(svc, clock):
    svc.sync()
    clock.now += timedelta(days=3)
    for rid in svc.plan():
        try:
            svc.approve(rid, confirm_open=True)
        except (ValueError, PermissionError):
            pass
    svc.dispatch()
    return [m for m in svc.sender.sent if m["to"] == DANA][0]["provider_message_id"]


def _dsn(to, mid_line=""):
    return f"Final-Recipient: rfc822; {to}\nAction: failed\nStatus: 5.1.1\n{mid_line}"


def _blocked(svc):
    return svc.db.one("SELECT 1 FROM email_bounces WHERE hash=?", (svc.addr_hash("email", DANA),)) is not None


def test_forged_bounce_without_message_id_does_not_block(svc, clock):
    _sent(svc, clock)
    r = svc.email_webhook("MAILER-DAEMON@evil.example", _dsn(DANA), "fb-1",
                          subject="Undelivered Mail Returned to Sender", auth_results=FAIL)
    assert r.get("bounce") == "unverified", r
    assert not _blocked(svc)
    assert not svc.db.one("SELECT 1 FROM messages WHERE intent='email_bounced'")
    a = svc.db.one("SELECT detail FROM audit WHERE action='email_bounce_unverified'")
    assert a and "@" not in a["detail"]


def test_forged_bounce_with_invented_message_id(svc, clock):
    _sent(svc, clock)
    r = svc.email_webhook("postmaster@evil.example", _dsn(DANA, "Message-ID: <x.1@evil.example>"), "fb-2",
                          subject="Delivery Status Notification (Failure)")
    assert r.get("bounce") == "unverified" and not _blocked(svc)


def test_real_bounce_with_original_message_id_blocks(svc, clock):
    mid = _sent(svc, clock)
    r = svc.email_webhook("MAILER-DAEMON@mx.example", _dsn(DANA, f"Original-Message-ID: {mid}"), "rb-1",
                          subject="Undelivered Mail Returned to Sender")
    assert r.get("bounce") == "failed" and _blocked(svc)


def test_real_bounce_double_brackets(svc, clock):
    mid = _sent(svc, clock).strip("<>")
    r = svc.email_webhook("MAILER-DAEMON@mx.example", _dsn(DANA, f"Message-ID: <<{mid}>>"),
                          "rb-2", subject="Undelivered Mail Returned to Sender")
    assert r.get("bounce") == "failed" and _blocked(svc)


def test_final_recipient_must_match_sent_address(svc, clock):
    """אחרי האיחוד עם ceb012d (מחמיר): Final-Recipient שונה מהכתובת ששלחנו אליה ⇒ unverified (לא נחסם)."""
    mid = _sent(svc, clock)
    r = svc.email_webhook("MAILER-DAEMON@mx.example", _dsn("forwarded@elsewhere.example", f"Message-ID: {mid}"),
                          "rb-3", subject="Undelivered Mail Returned to Sender")
    assert r.get("bounce") == "unverified" and not _blocked(svc)

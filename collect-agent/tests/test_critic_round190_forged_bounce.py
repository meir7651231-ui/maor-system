"""critic סבב 190 · 🟠 לתיקון בונה — רכיב: `app/service.py` → `_email_bounce` (תיקון 188 ב-`7bf26923`).

סימון `email_bounces` נעשה גם כשה-DSN **לא** מתאים ל-Message-ID של מייל שגבי שלחה (נפילה ל«המייל האחרון
לנמען» לפי `Final-Recipient`), ובלי בדיקת אימות שולח (`parse_bounce` מקבל `MAILER-DAEMON@<כל דומיין>`).

[מאומת] מייל מ-`MAILER-DAEMON@evil.example` עם `spf/dkim/dmarc=fail`, נושא «Undelivered…», וגוף
`Final-Recipient: … c1@example.com` + `Status: 5.1.1` — **בלי** Message-ID שלנו ⇒ `bounce: failed, matched: True`
⇒ המייל של דנה נחסם, ובסבב הבא 0 מיילים אליה. משתחרר רק אם דנה עצמה תשלח מייל מאומת. אותה חולשה כמו 189
(תלונה מזויפת), בגרסה הפיכה. הצעה: סימון `email_bounces` רק כשה-DSN מצביע על Message-ID של מייל שנשלח
לאותה כתובת (ו/או מאומת); אחרת — כרטיס בלי חסימה. xfail(strict=True); הבקרה (DSN שמצביע על המייל שלנו) ירוקה."""
from datetime import timedelta

FAIL = "mx.example; spf=fail; dkim=fail; dmarc=fail"


def _send_first(svc, clock):
    svc.sync()
    clock.now += timedelta(days=3)
    for rid in svc.plan():
        try:
            svc.approve(rid, confirm_open=True)
        except (ValueError, PermissionError):
            pass
    svc.dispatch()


# תוקן (גבי חיבורים, 20.11): DSN נקלט רק עם Message-ID של מייל שלנו + נמען תואם + בלי כשל אימות מפורש
def test_forged_dsn_without_our_message_id_does_not_block(svc, clock):
    _send_first(svc, clock)
    svc.email_webhook("MAILER-DAEMON@evil.example", "Final-Recipient: rfc822; c1@example.com\nStatus: 5.1.1\n", "fb1",
                      subject="Undelivered Mail Returned to Sender", auth_results=FAIL)
    # הכרעת מקשר (q22-04, 20.11): זיוף לא חוסם **לצמיתות** — לכל היותר השהיית מייל + כרטיס עד הכרעת בעל העסק
    assert not svc.email_bounce_confirmed("c1@example.com")
    assert svc.db.q("SELECT 1 FROM messages WHERE intent='email_bounce_review' AND needs_owner=1")



def test_control_dsn_with_our_message_id_blocks(svc, clock):
    _send_first(svc, clock)
    mid = [m for m in svc.sender.sent if m["to"] == "c1@example.com"][0]["provider_message_id"]
    svc.email_webhook("MAILER-DAEMON@mx.example",
                      f"Final-Recipient: rfc822; c1@example.com\nStatus: 5.1.1\nOriginal-Message-ID: <{mid}>\n", "b1",
                      subject="Undelivered Mail Returned to Sender")
    assert svc.email_bounced("c1@example.com")

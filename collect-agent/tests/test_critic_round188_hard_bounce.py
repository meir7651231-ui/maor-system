"""critic סבב 188 · 🟠 לתיקון בונה — רכיב: `app/service.py` → `_email_bounce` («בלי הסרה אוטומטית») מול `gate()` / בניית
ההודעות: אחרי **bounce קבוע** (Status 5.1.1 — הכתובת לא קיימת) ההודעה מסומנת failed ונפתח כרטיס לבעל העסק, אבל
הכתובת **ממשיכה לקבל** מיילים בכל שלב: [מאומת] תזכורת ⇒ DSN 5.1.1 ⇒ 3 סבבים ⇒ עוד 2 מיילים לאותה כתובת מתה.
שליחה חוזרת לכתובות שחזרו פוגעת במוניטין השליחה של העסק (שיעור bounce ⇒ רשימות חסימה), ואם הכתובת תוקצה מחדש
— פרטי חוב מגיעים לזר. הצעה: bounce קבוע ⇒ דגל «מייל לא תקין» לכתובת (לא הסרה משפטית — לא suppressions), שמדלג
על ערוץ המייל עד שהכתובת משתנה במקור/בעל העסק מאשר; SMS ממשיך. xfail(strict=True); הבקרה (bounce זמני 4.x ⇒
ממשיכים) נשארת ירוקה."""
from datetime import timedelta

import pytest

DANA_MAIL = "c1@example.com"


def _cycle(svc):
    for rid in svc.plan():
        try:
            svc.approve(rid, confirm_open=True)
        except (ValueError, PermissionError):
            pass
    svc.dispatch()


def _first_mail_and_bounce(svc, clock, status):
    svc.sync()
    clock.now += timedelta(days=3)
    _cycle(svc)
    mid = [m for m in svc.sender.sent if m["to"] == DANA_MAIL][0]["provider_message_id"]
    dsn = f"Final-Recipient: rfc822; {DANA_MAIL}\nStatus: {status}\nOriginal-Message-ID: <{mid}>\n"
    svc.email_webhook("MAILER-DAEMON@mx.example", dsn, f"b-{status}", subject="Undelivered Mail Returned to Sender")
    before = len([m for m in svc.sender.sent if m["to"] == DANA_MAIL])
    for _ in range(3):
        clock.now += timedelta(days=8)
        svc.sync()
        _cycle(svc)
    return before, len([m for m in svc.sender.sent if m["to"] == DANA_MAIL])


@pytest.mark.xfail(strict=True, reason="critic 188: אחרי bounce קבוע ממשיכים לשלוח מייל לכתובת שלא קיימת (לתיקון בונה)")
def test_no_more_email_after_hard_bounce(svc, clock):
    before, after = _first_mail_and_bounce(svc, clock, "5.1.1")
    assert after == before, (before, after)


def test_control_soft_bounce_keeps_sending(svc, clock):
    before, after = _first_mail_and_bounce(svc, clock, "4.2.2")
    assert after > before

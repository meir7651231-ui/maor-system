"""גבי עיצוב: מצב כתובת המייל בטבלת החובות (/dashboard, גם view=list ל-/ui) — 'bounced' אחרי bounce קבוע,
'spam' אחרי תלונת ספאם (ARF), אחרת None. בלי הכתובת עצמה ב-view=list. bounce זמני (4.x) ⇒ None."""
from datetime import timedelta

DANA_MAIL = "c1@example.com"


def _send_one(svc, clock):
    svc.sync()
    clock.now += timedelta(days=3)
    for rid in svc.plan():
        try:
            svc.approve(rid, confirm_open=True)
        except (ValueError, PermissionError):
            pass
    svc.dispatch()
    return [m for m in svc.sender.sent if m["to"] == DANA_MAIL][0]["provider_message_id"]


def _states(svc, view=None):
    return {r["email_state"] for r in svc.dashboard(view)["invoices"] if r["customer"] and r.get("customer_id")
            and svc.db.one("SELECT email FROM customers WHERE id=?", (r["customer_id"],))["email"] == DANA_MAIL}


def _bounce(svc, mid, status):
    dsn = f"Final-Recipient: rfc822; {DANA_MAIL}\nStatus: {status}\nOriginal-Message-ID: <{mid}>\n"
    svc.email_webhook("MAILER-DAEMON@mx.example", dsn, f"b-{status}", subject="Undelivered Mail Returned to Sender")


def test_no_state_by_default(svc, clock):
    _send_one(svc, clock)
    assert _states(svc) == {None}
    assert all("email_state" in r for r in svc.dashboard("list")["invoices"])


def test_hard_bounce_marks_bounced_in_both_views(svc, clock):
    _bounce(svc, _send_one(svc, clock), "5.1.1")
    assert _states(svc) == {"bounced"}
    assert _states(svc, "list") == {"bounced"}
    assert all("email" not in r for r in svc.dashboard("list")["invoices"])   # /ui בלי הכתובת עצמה


def test_soft_bounce_is_not_bounced(svc, clock):
    _bounce(svc, _send_one(svc, clock), "4.2.2")
    assert _states(svc) == {None}


def test_spam_complaint_marks_spam_and_wins_over_bounce(svc, clock):
    mid = _send_one(svc, clock)
    _bounce(svc, mid, "5.1.1")
    # critic 189: תלונה נקלטת רק עם Message-ID של מייל ששלחנו לאותה כתובת
    arf = ("Feedback-Type: abuse\nUser-Agent: ISP-FBL/1.0\nVersion: 1\n"
           f"Original-Rcpt-To: {DANA_MAIL}\nArrival-Date: Thu, 19 Nov 2026 08:00:00 +0200\nMessage-ID: <{mid}>")
    svc.email_webhook("fbl@isp.example", arf, "arf-x", subject="Email Abuse Report")
    assert _states(svc) == {"spam"}        # ספאם = סירוב (סעיף 30א) — גובר על «חזר»


def test_verified_inbound_from_address_clears_bounced(svc, clock):
    _bounce(svc, _send_one(svc, clock), "5.1.1")
    svc.email_webhook(DANA_MAIL, "שלום, קיבלתי", "in-1", subject="Re: חשבונית",
                      auth_results="mx.example; spf=pass; dkim=pass header.d=example.com; dmarc=pass")
    assert _states(svc) == {None}

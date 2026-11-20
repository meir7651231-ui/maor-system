"""critic סבב 193 · 🟡 לתיקון בונה — רכיב: `app/service.py` → `_hold_unverified_bounce`
(גוף כרטיס `email_bounce_review`)
מול `web/src/pages/Dashboard.tsx` (כפתורי `notice-bounce-keep` / `notice-bounce-block`, `326491bc`).

גוף הכרטיס מסביר «"אישור" = הכתובת תיחסם למייל · "דחייה" = המיילים חוזרים» — אבל בכרטיס **אין** כפתורים כאלה; הכפתורים
הם «הכתובת תקינה — החזר מיילים» / «המייל באמת חזר — חסום» (מאומת במסע דפדפן, צילום critic-193-bounce-review-mobile.png).
בעל עסק מחפש «אישור» ולא מוצא; גרוע מזה, «אישור» נשמע כמו «הכתובת תקינה». הצעה: הגוף מצטט את שמות הכפתורים בפועל.
xfail(strict=True)."""
from datetime import timedelta

import pytest


@pytest.mark.xfail(strict=True, reason="critic 193: גוף הכרטיס מפנה ל«אישור»/«דחייה» שאין בכרטיס")
def test_bounce_card_text_matches_buttons(svc, clock):
    svc.sync()
    clock.now += timedelta(days=3)
    for rid in svc.plan():
        try:
            svc.approve(rid, confirm_open=True)
        except (ValueError, PermissionError):
            pass
    svc.dispatch()
    svc.email_webhook("MAILER-DAEMON@x.example", "Final-Recipient: rfc822; c1@example.com\nStatus: 5.1.1\n", "d1",
                      subject="Undelivered Mail Returned to Sender", auth_results="mx; dmarc=fail")
    body = svc.db.one("SELECT body FROM messages WHERE intent='email_bounce_review'")["body"]
    assert "«אישור»" not in body and "«דחייה»" not in body, body

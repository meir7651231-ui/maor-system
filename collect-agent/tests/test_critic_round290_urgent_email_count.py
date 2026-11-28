"""מבקר סבב 290 (🟡, גבי חיבורים): מייל דחוף לבעל העסק על «הסר» אומר «כרטיסים דחופים שממתינים לכם עכשיו: 0».

✓ אימות 289 (מנהל 467, cust_hold ביומן השלילות): קטין/פטירה/מחלוקת/עצירה משפטית שורדים שחזור (קבצי 289 בלי xfail).
   השהיה שהוצבה **לפני** הגיבוי ובוטלה («חידוש») אחריו ⇒ חוזרת בשחזור (שמרני — בעל העסק מחדש שוב); הוצבה ובוטלה
   שתיהן אחרי הגיבוי ⇒ לא חוזרת ✓.
✓ נוסח ההודעות (SMS/מייל/טיוטות, ₪/$, שם באנגלית, «פריסה/תשלום»): 19 הודעות — אף קישור לא צמוד לסימן פיסוק.
[מאומת] לקוחה כותבת «הסר» ⇒ `email_owner_urgent('opt_out')` שולח לבעל העסק «מחכה פנייה דחופה של לקוח (בקשת הסרה).
כרטיסים דחופים שממתינים לכם עכשיו: 0. … התשובה ממתינה לכם». המונה (`_open_urgent_count`) סופר רק טיוטות
`escalate='urgent'`, וטיוטת אישור ההסרה היא `escalate='none'` ⇒ המייל סותר את עצמו. בשאר הכוונות הדחופות (מחלוקת,
קטין, משפטי, מצוקה) המונה = 1 ✓.
רכיב: app/service.py → email_owner_urgent / _open_urgent_count.
"""
from __future__ import annotations

import re

import pytest


def _urgent_mail_count(svc, text):
    svc.sync()
    svc.inbound("sms", "050-1234567", text)
    mails = [m for m in svc.sender.sent if m["channel"] == "email" and "פנייה דחופה" in (m.get("body") or "")]
    assert mails
    return int(re.search(r"עכשיו: (\d+)", mails[-1]["body"]).group(1))


def test_dispute_mail_counts_its_card_control(svc):
    assert _urgent_mail_count(svc, "אני לא חייבת את זה, יש טעות") == 1


@pytest.mark.xfail(strict=True, reason="מבקר 290🟡: מייל דחוף על «הסר» אומר «כרטיסים דחופים: 0»")
def test_optout_mail_counts_its_card(svc):
    assert _urgent_mail_count(svc, "הסר") >= 1

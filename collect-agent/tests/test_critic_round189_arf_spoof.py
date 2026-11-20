"""critic סבב 189 · 🟠 לתיקון בונה — רכיב: `app/channels.py` → `parse_complaint` (זיהוי לפי שורת `Feedback-Type:` בגוף
**בלבד**, מכל שולח) + `app/service.py` → `_email_complaint` (suppress לפי `Original-Rcpt-To`
גם בלי התאמה ל-Message-ID שלנו).

כל מי שיכול לשלוח מייל לכתובת התשובות של העסק — גם עם `spf/dkim/dmarc=fail` — כותב בגוף שתי שורות:
`Feedback-Type: abuse` / `Original-Rcpt-To: <כתובת של לקוח אחר>` ⇒ **[מאומת]** `complaint: suppressed` ⇒ המייל של דנה
נכנס ל-`suppressions` (הסרה משפטית קבועה, נרשמת גם ביומן ההסרות ושורדת שחזור), ולבעל העסק נפתח כרטיס «הלקוח סימן את
מייל התזכורת כספאם» — ייחוס כוזב. כך אפשר לכבות את ערוץ המייל לכל לקוח, בשקט ולתמיד. (ב-bounce לעומת זאת נדרש שולח
מערכת-דואר + DSN.)
הצעה: תלונה רק כשהיא מבנית (multipart/report; report-type=feedback-report) **וגם** מתאימה ל-Message-ID של מייל שגבי שלחה
לאותו נמען; אחרת — כרטיס «דיווח לא מאומת» בלי הסרה. xfail(strict=True); הבקרה (תלונה שמצביעה על מייל שנשלח) ירוקה."""
from datetime import timedelta

FAIL = "mx.example; spf=fail; dkim=fail; dmarc=fail"


def test_forged_complaint_does_not_suppress_other_customer(svc):
    svc.sync()
    svc.email_webhook("yossi@example.net", "Feedback-Type: abuse\nOriginal-Rcpt-To: c1@example.com\n", "",
                      auth_results=FAIL)
    assert not svc.suppressed("email", "c1@example.com")


def test_control_complaint_on_our_message_suppresses(svc, clock):
    svc.sync()
    clock.now += timedelta(days=3)
    for rid in svc.plan():
        try:
            svc.approve(rid, confirm_open=True)
        except (ValueError, PermissionError):
            pass
    svc.dispatch()
    mid = [m for m in svc.sender.sent if m["to"] == "c1@example.com"][0]["provider_message_id"]
    svc.email_webhook("fbl@mailbox-provider.example",
                      f"Feedback-Type: abuse\nOriginal-Rcpt-To: c1@example.com\nMessage-ID: <{mid}>\n", "fbl-1")
    assert svc.suppressed("email", "c1@example.com")

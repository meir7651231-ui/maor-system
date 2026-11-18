"""critic סבב 152 · המייל הדחוף לבעל העסק אומר תמיד «התשובה ממתינה לכם, ואף הודעה לא נשלחת בלי אישורכם». במצב
`approval_mode="safe_auto"` אישור ההסרה ללקוח **נשלח אוטומטית** (SAFE_AUTO) — המייל מתאר משהו שלא קרה. עכשיו: כשתשובה
יצאה אוטומטית, המייל אומר זאת. במצב ברירת המחדל («all») — ללא שינוי."""
import dataclasses

from tests.conftest import customer_sent
from tests.test_urgent_owner_email import _owner_mails


def test_safe_auto_opt_out_email_says_reply_was_sent(svc):
    svc.sync()
    svc.inbox.policy = dataclasses.replace(svc.inbox.policy, approval_mode="safe_auto")
    before = len(customer_sent(svc))
    svc.inbound("sms", "0501234567", "הסר")
    assert len(customer_sent(svc)) == before + 1          # האישור יצא ללקוח
    body = _owner_mails(svc)[0]["body"]
    assert "אף הודעה לא נשלחת בלי אישורכם" not in body, body
    assert "נשלח ללקוח אוטומטית" in body, body


def test_default_mode_email_unchanged(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", "הסר")
    assert "אף הודעה לא נשלחת בלי אישורכם" in _owner_mails(svc)[0]["body"]

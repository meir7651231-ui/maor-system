"""מבקר סבב 99 🟡: כרטיס דחוף (הסרה/קטין/מצוקה/מחלוקת/משפטי) ⇒ מייל קצר לבעל העסק מחוץ לאפליקציה.
dry-run בלבד (DryRunSender), בלי טקסט הלקוח, עם throttle."""
from datetime import timedelta

import pytest

OWNER = "owner@studio.example"          # EMAIL_REPLY_TO של ה-svc ב-conftest
SECRET_TEXT = "הילד שלי בבית חולים ואני לא מסוגלת יותר"


def _owner_mails(svc):
    return [m for m in svc.sender.sent if m["channel"] == "email" and m["to"] == OWNER]


@pytest.mark.parametrize("text,intent", [
    (SECRET_TEXT, None),                        # מצוקה / קושי
    ("אני בן 15, זה הטלפון של אמא", "minor"),
    ("לא הזמנתי את זה, זו טעות", "dispute"),
    ("הסר", "opt_out"),
    ("העברתי את זה לעורך הדין שלי", "legal"),
])
def test_urgent_card_emails_owner(svc, text, intent):
    svc.sync()
    r = svc.inbound("sms", "0501234567", text)
    if intent:
        assert r["intent"] == intent
    mails = _owner_mails(svc)
    assert len(mails) == 1, (text, r["intent"])
    m = mails[0]
    assert "פנייה דחופה" in m["subject"] and "/ui" in m["body"]


def test_email_has_no_customer_text_name_phone_or_amount(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", SECRET_TEXT)
    m = _owner_mails(svc)[0]
    blob = m["subject"] + m["body"] + m.get("html", "")
    for leak in ("בית חולים", "מסוגלת", "דנה", "כהן", "050", "972", "1,200", "1001", "c1@example"):
        assert leak not in blob, leak
    assert m.get("audience") == "owner"          # לא נספר כ«מייל שנשלח ללקוח»


def test_normal_reply_does_not_email_owner(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", "איך משלמים?")
    assert _owner_mails(svc) == []


def test_throttle_30_minutes_then_counts_waiting(svc, clock):
    svc.sync()
    svc.inbound("sms", "0501234567", "הסר")
    svc.inbound("sms", "0527654321", "לא הזמנתי את זה, זו טעות")      # 5 דק׳ אחרי? אותו רגע
    assert len(_owner_mails(svc)) == 1
    assert any(a["action"] == "urgent_owner_email_throttled"
               for a in svc.db.q("SELECT action FROM audit"))
    clock.now += timedelta(minutes=31)
    svc.inbound("sms", "0527654321", "אני בן 15")
    mails = _owner_mails(svc)
    assert len(mails) == 2 and "שממתינים לכם עכשיו:" in mails[1]["body"]


def test_daily_cap(svc, clock):
    svc.sync()
    for _ in range(12):
        svc.inbound("sms", "0501234567", "לא הזמנתי את זה, זו טעות")
        clock.now += timedelta(minutes=31)
    assert len(_owner_mails(svc)) == svc.URGENT_EMAIL_DAY_MAX


def test_no_owner_address_skips_without_failing(svc):
    import dataclasses
    svc.s = dataclasses.replace(svc.s, email_reply_to="")
    svc.sync()
    r = svc.inbound("sms", "0501234567", "הסר")
    assert r["intent"] == "opt_out" and _owner_mails(svc) == []
    assert svc.db.one("SELECT 1 FROM audit WHERE action='urgent_owner_email_skipped'")


def test_provider_failure_is_audited_not_raised(svc, monkeypatch):
    from app.integrations.base import IntegrationError
    svc.sync()

    def boom(msg):
        raise IntegrationError("SMTP down")
    monkeypatch.setattr(svc.sender, "send_owner", boom, raising=False)
    r = svc.inbound("sms", "0501234567", "הסר")
    assert r["intent"] == "opt_out"                                  # ההסרה עצמה לא נפגעה
    assert svc.db.one("SELECT 1 FROM audit WHERE action='urgent_owner_email_failed'")
    assert svc.db.one("SELECT opted_out FROM customers WHERE phone LIKE '%1234567'")["opted_out"] == 1

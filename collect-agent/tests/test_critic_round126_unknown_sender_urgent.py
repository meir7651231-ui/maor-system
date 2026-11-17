"""critic סבב 126 · פער: פנייה דחופה מכתובת/מספר **שאינם משויכים ללקוח** (בן/בת זוג, מייל מהעבודה, הורה של קטין)
— «I want to die», «הבן שלי בן 14 וזה המייל שלו», «my lawyer will sue you», «לא הזמנתי את זה» ⇒ נרשמה רק כ-
`unknown_sender` עם escalation=normal ו**בלי מייל דחוף לבעל העסק**. אצל לקוח מזוהה אותו טקסט ⇒ מייל דחוף.
התיקון: מצוקה/קטין/משפטי/מחלוקת משולח לא מזוהה ⇒ escalation=urgent + מייל דחוף, בנוסח שלא טוען שהתזכורות
נעצרו (אין למי לעצור) ואומר שהשולח לא משויך. הסרה משולח לא מזוהה — כמו קודם (רשימת הסרה לפי הכתובת)."""
import pytest

from tests.test_urgent_owner_email import _owner_mails


@pytest.mark.parametrize("channel,sender,text", [
    ("email", "spouse@else.example", "I want to die, please stop"),
    ("email", "work@corp.example", "הבן שלי בן 14 וזה המייל שלו"),
    ("email", "x@else.example", "my lawyer will sue you"),
    ("sms", "0549998877", "אני רוצה למות"),
    ("sms", "0549998877", "לא הזמנתי את זה, זו טעות"),
])
def test_unknown_sender_urgent_content_emails_owner(svc, channel, sender, text):
    svc.sync()
    r = svc.inbound(channel, sender, text)
    assert r["intent"] == "unknown_sender"
    assert r["escalation"] == "urgent", r
    mails = _owner_mails(svc)
    assert len(mails) == 1, mails
    body = mails[0]["body"]
    assert "כבר נעצרו" not in body and "לא משויכים" in body, body
    assert "עכשיו: 0." not in body, body   # הפנייה עצמה נספרת
    for leak in ("die", "למות", "lawyer", "spouse", "054"):
        assert leak not in mails[0]["subject"] + body, leak


@pytest.mark.parametrize("text", ["איך משלמים?", "שילמתי אתמול", "תודה"])
def test_unknown_sender_routine_stays_normal(svc, text):
    svc.sync()
    r = svc.inbound("email", "stranger@else.example", text)
    assert r["escalation"] == "normal" and _owner_mails(svc) == []


# ═══ critic סבב 127: מה בעל העסק רואה ═══
# המייל הדחוף מקשר ל-/ui — אבל /ui לא מציג בכלל הודעות משולח לא משויך (רק טיוטות), ו-/app/ מציג אותן כ«הודעה
# ממספר/כתובת לא מוכרים» רגילה, בלי סימון דחיפות, ממוינת לפי זמן. ⇒ בעל העסק נכנס מהמייל הדחוף ולא מוצא כלום.
def test_unmatched_urgent_is_marked_and_links_to_app(svc):
    svc.sync()
    svc.inbound("email", "spouse@else.example", "I want to die, please stop")
    row = svc.db.one("SELECT intent FROM messages WHERE direction='in' AND customer_id IS NULL ORDER BY id DESC")
    assert row["intent"] == "unknown_sender_urgent", row["intent"]
    body = _owner_mails(svc)[0]["body"]
    assert "/app/" in body and "/ui" not in body, body


def test_unmatched_routine_keeps_old_intent(svc):
    svc.sync()
    svc.inbound("email", "stranger@else.example", "איך משלמים?")
    row = svc.db.one("SELECT intent FROM messages WHERE direction='in' AND customer_id IS NULL ORDER BY id DESC")
    assert row["intent"] == "unknown_sender"

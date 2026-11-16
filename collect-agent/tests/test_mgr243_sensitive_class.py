"""מנהל הפעלה 243 · מחלקת «מצוקה / חדלות פירעון» (qa2-14/19/20, qa3-09/31).

הסטים המוחזקים qa2/qa3 מצפים ל-distress/legal, אבל 14 מקרים בסטים אחרים (dev, holdout1-3, critic, legal-heldout
של התפקיד המשפטי, frozen) מצפים לאותה מחלקה בדיוק ל-cant_pay + תג (insolvency / deceased / sensitive). זו
סתירת תוויות, לא באג: שינוי התווית שובר 14 כדי לתקן 4. ההכרעה: התווית נשארת, ונועלים כאן את **ההתנהגות**:
  · דחוף + השהיה, אין קישור תשלום / הצעת פריסה / סכום בתשובה, אין שליחה אוטומטית;
  · השהיה לא משתחררת כשאותו לקוח כותב אחר כך «אשלם בחמישי»;
  · **הבאג שתוקן:** המייל הדחוף לבעל העסק אמר «הודעה דחופה» כללי (הסוג נקבע לפי הכוונה cant_pay). עכשיו
    הוא נקבע לפי התג: «הליך חדלות פירעון», «דיווח על פטירה», «מצב רגיש». עדיין בלי פרטי לקוח.
הניסוחים כאן שונים מהסטים המוחזקים (לא מאמנים עליהם)."""
from __future__ import annotations

from datetime import timedelta

import pytest

from app.conversation import Escalation, Intent, Stop, respond
from app.inbox import _alert_kind
from evals.harness import build_ctx
from tests.test_urgent_owner_email import _owner_mails

INSOLVENCY = [
    "רציתי לעדכן שנפתח לי תיק חדלות פירעון, הכל מוקפא",
    "אני בפשיטת רגל, כל פנייה דרך הנאמן בבקשה",
    "יש לי צו כינוס נכסים, אסור לי לשלם ישירות",
]
DECEASED = [
    "אמא שלי נפטרה בשבוע שעבר והחשבון רשום עליה",
    "בעלי הלך לעולמו, אני מנסה להבין את כל החשבונות",
]
ILLNESS = [
    "אני מאושפז עכשיו בבית החולים, לא יכול לטפל בזה",
    "אני בטיפול נמרץ, תפנו אליי אחר כך",
]
ALL = [(t, "insolvency") for t in INSOLVENCY] + [(t, "deceased") for t in DECEASED] + \
      [(t, "sensitive") for t in ILLNESS]


@pytest.mark.parametrize("channel", ["sms", "email"])
@pytest.mark.parametrize("text,kind", ALL)
def test_behavior_is_urgent_pause_and_no_money_in_reply(text, kind, channel):
    d = respond(text, build_ctx({"channel": channel}))
    assert d.intent in (Intent.CANT_PAY, Intent.DISTRESS, Intent.LEGAL), d.intent
    assert d.escalate == Escalation.URGENT, (text, d.escalate)
    assert d.stop == Stop.PAUSE, (text, d.stop)
    assert not d.auto_send
    assert not d.plan
    reply = d.reply or ""
    for money in ("pay.example", "₪", "1,200", "תשלומים", "פריסה"):
        assert money not in reply, (text, money, reply)
    assert _alert_kind(d) == kind, (text, d.tags)


@pytest.mark.parametrize("text,kind,label", [
    (INSOLVENCY[0], "insolvency", "חדלות פירעון"),
    (DECEASED[0], "deceased", "פטירה"),
    (ILLNESS[0], "sensitive", "מצב רגיש"),
])
def test_owner_email_names_the_situation_without_customer_details(svc, text, kind, label):
    svc.sync()
    svc.inbound("sms", "0501234567", text)
    mails = _owner_mails(svc)
    assert len(mails) == 1
    m = mails[0]
    assert label in m["body"], m["body"]
    assert "הודעה דחופה)" not in m["body"]
    blob = m["subject"] + m["body"] + m.get("html", "")
    for leak in ("נפטרה", "מאושפז", "נאמן", "דנה", "כהן", "050", "972", "1,200", "1001"):
        assert leak not in blob, leak
    row = svc.db.one("SELECT detail FROM audit WHERE action='urgent_owner_email_sent'")
    assert kind in row["detail"]


def test_plain_categories_unchanged(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", "העברתי את זה לעורך הדין שלי")
    assert "פנייה משפטית" in _owner_mails(svc)[0]["body"]


@pytest.mark.parametrize("text", [INSOLVENCY[1], DECEASED[1], ILLNESS[0]])
def test_later_promise_does_not_resume_reminders(svc, clock, text):
    svc.sync()
    svc.inbound("sms", "0501234567", text)
    cid = 1                                            # 0501234567 = לקוח 1 ב-conftest
    first = svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))["paused_reason"]
    assert first
    clock.now += timedelta(days=1)
    svc.inbound("sms", "0501234567", "אשלם ביום חמישי")
    clock.now += timedelta(days=40)
    svc.dispatch()
    now = svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))["paused_reason"]
    assert now == first, (text, first, now)

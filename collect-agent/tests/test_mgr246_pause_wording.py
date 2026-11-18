"""מנהל הפעלה 246 · נוסח ההשהיה במילואים / מחלה / אבל (פתוח מהפעלה 243).

הבאג: הסיכום לבעל העסק אמר «התזכורות הושהו ל-30 יום», אבל ההשהיה (paused_reason) **לא משתחררת לבד** —
רק הבטחה עם תאריך משתחררת (inbox.release_expired_pauses). בעל העסק היה מצפה שהתזכורות יחזרו בעוד חודש,
והן לא חוזרות לעולם בלי resume ידני.
ההכרעה: **לא** מוסיפים שחרור אוטומטי (שליחת תזכורת חוב אוטומטית למי שדיווח על אבל/אשפוז/מילואים מסוכנת
יותר מהשהיה ארוכה). מתקנים את הנוסח: «הושהו ולא יתחדשו לבד», עם תאריך מוצע לבדיקה, ופעולה «לחדש ידנית».
ננעל כאן גם שההתנהגות תואמת את הנוסח: גם אחרי 60 יום ו-dispatch ההשהיה נשארת ולא יוצאת תזכורת."""
from __future__ import annotations

from datetime import timedelta

import pytest

from app.conversation import Stop, respond
from evals.harness import build_ctx
from tests.conftest import customer_sent

RESERVIST = ["אני במילואים כבר חודש, נדבר כשאשתחרר", "גויסתי למילואים, אין לי איך לטפל בזה עכשיו"]
SENSITIVE = ["אני מאושפז עכשיו בבית החולים, לא יכול לטפל בזה", "אנחנו יושבים שבעה על אבא"]


@pytest.mark.parametrize("channel", ["sms", "email"])
@pytest.mark.parametrize("text", RESERVIST + SENSITIVE)
def test_summary_does_not_promise_auto_resume(text, channel):
    d = respond(text, build_ctx({"channel": channel}))
    assert d.stop == Stop.PAUSE, (text, d.stop, d.intent)
    assert "30 יום" not in d.owner_summary, d.owner_summary
    if "deceased" in d.tags:          # לפטירה סיכום משלו ("לא פונים שוב")
        return
    assert "לא יתחדשו לבד" in d.owner_summary, d.owner_summary
    assert "מוצע לבדוק שוב סביב" in d.owner_summary, d.owner_summary
    assert any("לחדש תזכורות ידנית" in a for a in d.owner_actions), d.owner_actions


@pytest.mark.parametrize("text", [RESERVIST[0], SENSITIVE[0]])
def test_pause_really_does_not_release_after_60_days(svc, clock, text):
    svc.sync()
    svc.inbound("sms", "0501234567", text)
    cid = 1                                            # 0501234567 = לקוח 1 ב-conftest
    reason = svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))["paused_reason"]
    assert reason and ":until=" not in reason, reason
    before = len(customer_sent(svc))
    for _ in range(4):                                 # 60 יום, dispatch כל 15
        clock.now += timedelta(days=15)
        svc.dispatch()
    after = svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))["paused_reason"]
    assert after == reason, (reason, after)
    new = [m for m in customer_sent(svc)[before:] if "0501234567" in str(m) or "972501234567" in str(m)]
    assert not new, new

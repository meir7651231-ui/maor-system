"""סט #21 (qa21, ריצה עיוורת 20.11 על 1016ae1: 25/30, קריטיים 20/24, 1 מזיק) — תיקון לפי מחלקות, בניסוחים חדשים."""
from datetime import timedelta

import pytest

from app.conversation import Escalation, Intent, State, respond
from evals.harness import TODAY, build_ctx


def _d(t, **spec):
    return respond(t, build_ctx({"channel": "email", **spec}))


# q21-30 🔴: «היום» של היעדרות נקבע כמועד ההבטחה ⇒ תזכורת לפני המועד שהובטח
@pytest.mark.parametrize("text,days", [("Away at a conference today, but I'll transfer it on the 19th.", 11),
                                       ("אני בחופש היום, אעביר את התשלום ב-19 בנובמבר", 11),
                                       ("I'm sick today. Will pay on Monday.", 1)])
def test_absence_today_is_not_promise_date(text, days):
    d = _d(text)
    assert d.intent == Intent.PROMISE and d.promise_date != TODAY
    if days is not None:
        assert d.promise_date == TODAY + timedelta(days=days)


@pytest.mark.parametrize("text", ["I'll pay today", "אשלם היום בערב", "I'm off today so I'll pay it today"])
def test_real_today_promise_unchanged(text):
    assert _d(text).promise_date == TODAY


# q21-14/16/17: מענה אוטומטי בתוך הצעת הסדר / אחרי הבטחה ⇒ המצב נשמר, בלי כרטיס
AUTO = ["Automatic response: I'm currently away until Monday and will reply when I return.",
        "This is an auto-reply. Thanks, I received your message and will get back to you soon.",
        "הודעה אוטומטית: אני נוהגת כרגע ואחזור אלייך כשאגיע",
        "תודה, קיבלתי את הודעתך ואחזור בהקדם."]


@pytest.mark.parametrize("text", AUTO)
@pytest.mark.parametrize("state", ["awaiting_plan_reply", "promised"])
def test_auto_reply_keeps_state(text, state):
    d = _d(text, state=state)
    assert d.next_state == State(state) and d.escalate == Escalation.NONE and d.reply is None
    assert d.promise_date is None   # מועד ההבטחה המקורי לא נדרס במועד החזרה של המענה האוטומטי


# כלל-צמצום: מענה אוטומטי עם הסרה/תשלום/מחלוקת ⇒ הכוונה המגינה מנצחת; ומחוץ לזרימה ⇒ כמו קודם (בעל העסק)
@pytest.mark.parametrize("text,intent", [
    ("Automatic reply: I'm out of the office. Also please stop emailing me.", Intent.OPT_OUT),
    ("תשובה אוטומטית: אני מחוץ למשרד. אגב, כבר שילמתי בהעברה אתמול", Intent.PAID_CLAIM)])
def test_protective_inside_auto_reply_wins(text, intent):
    d = _d(text, state="awaiting_plan_reply")
    assert intent in d.all_intents and "auto_reply_state_kept" not in d.tags


def test_auto_reply_outside_flow_unchanged():
    d = _d(AUTO[0], state="idle")
    assert "auto_reply_state_kept" not in d.tags


# המשך (20.11 צהריים): אחרי «עד מתי?» / בהמתנה לבעלים — מענה אוטומטי «away until 30 November» הפך
# להבטחה ל-30.11 מתוך מכונה. עכשיו: בלי הבטחה, המצב נשמר.
@pytest.mark.parametrize("text", ["Automatic reply: I'm away until 30 November 2026. I will respond on my return.",
                                  "Out of office until December 3. I will reply when I am back.",
                                  "הודעה אוטומטית: אני בחופשה עד 2.12, אחזור לאחר מכן"])
@pytest.mark.parametrize("state", ["awaiting_date", "awaiting_owner"])
def test_auto_reply_return_date_is_not_promise(text, state):
    d = _d(text, state=state)
    assert d.intent != Intent.PROMISE and d.promise_date is None and d.next_state == State(state)


# «עד <תאריך>» של היעדרות ≠ מועד תשלום כשיש מועד אחר; התאריך היחיד ⇒ נשמר
@pytest.mark.parametrize("text,days", [("Auto-reply: away until Dec 1. Payment will be sent on the 20th.", 12),
                                       ("אני בחופשה עד 15.11. אשלם ב-20 לחודש", 12),
                                       ("I'll be off until the 20th, I'll pay then", 12)])
def test_absence_until_vs_payment_date(text, days):
    d = _d(text, state="awaiting_date")
    assert d.intent == Intent.PROMISE and d.promise_date == TODAY + timedelta(days=days)

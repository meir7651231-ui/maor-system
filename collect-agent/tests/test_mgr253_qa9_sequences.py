"""מנהל הפעלה 253 · סט מוחזק #9 — רצפים רב-הודעתיים דרך השירות (`svc.inbound`), עם תאריכים בשם חודש.

ריצה יחידה (evals/sequences.py): 21/28 רצפים (75%), קריטיים 10/11. הבאגים, לפי מחלקה:
1. «בשבוע הבא» ⇒ PROMISED, ואז «ביום שלישי ה-17 בנובמבר» (דיוק המועד) ⇒ «לא ברור» + כרטיס. תאריך לבד הוכר רק
   במצב AWAITING_DATE ⇒ עכשיו גם PROMISED (עדכון מועד).
2. «אפשר לשלם ב-18 בנובמבר?», «Can I pay on the 18th / next week?» ⇒ «לא ברור» / «איך משלמים» (נשלח קישור!).
   בקשת דחייה עם מועד ⇒ הבטחה. «בביט/בכרטיס/how/by card» נשארים «איך משלמים».
3. «לא, אשלם הכל ב-15 בדצמבר» אחרי הצעת פריסה ⇒ plan_reject, והמועד נבלע — בעל העסק ראה רק «דחה». נשאר כרטיס
   (לא משנים כוונה — הכרעה 251), עם המועד בסיכום ובפעולות.
4. «בעשרים ושלושה בנובמבר» ⇒ אין תאריך (רק «עשרים» לבד הוכר). מספרים מורכבים 13–31, זכר ונקבה.
5. «אחרי חנוכה» כתשובה ל«עד מתי?» ⇒ «לא ברור». עכשיו הבטחה מעורפלת ⇒ «עד איזה תאריך בערך?».
6. «May 10» כהודעה שלמה ⇒ «לא ברור» (מלכודת «may»). רק הודעה שכולה «May N» ⇒ תאריך.
🔴 קריטי (q9-20): «Thanks, I'll pay in May» ⇒ «May 10» ⇒ כרטיס «לא ברור» במקום מועד. בלי עצירה שגויה.
"""
from __future__ import annotations

from datetime import date

import pytest

from app.conversation import Intent, State, respond
from evals.harness import TODAY, build_ctx


def _d(text, state="idle", channel="sms", **kw):
    spec = {"state": state, "channel": channel, **kw}
    if state == "awaiting_plan_reply":
        spec.setdefault("offered_n", 3)
    return respond(text, build_ctx(spec))


# 1 — עדכון מועד במצב PROMISED
@pytest.mark.parametrize("channel", ["sms", "email"])
@pytest.mark.parametrize("text,want", [("ביום שלישי ה-17 בנובמבר", date(2026, 11, 17)),
                                       ("ב-12 בנובמבר", date(2026, 11, 12)),
                                       ("on November 13th", date(2026, 11, 13))])
def test_promised_state_date_refines(text, want, channel):
    d = _d(text, "promised", channel)
    assert d.intent == Intent.PROMISE and \
            (d.requested_date or d.promise_date) == want, (d.intent, d.requested_date or d.promise_date)


def test_promised_state_no_date_unchanged():
    assert _d("אוקיי תודה", "promised").intent == Intent.THANKS


# 2 — בקשת דחייה עם מועד
@pytest.mark.parametrize("text,channel,want", [
    ("אפשר לשלם ב-18 בנובמבר?", "sms", date(2026, 11, 18)),
    ("אפשר לשלם ביום חמישי?", "sms", date(2026, 11, 12)),
    ("Can I pay on the 18th?", "email", date(2026, 11, 18)),
    ("Can I pay next week?", "email", date(2026, 11, 15)),
    ("Could I pay on November 18th?", "email", date(2026, 11, 18)),
])
def test_can_i_pay_on_date_is_promise(text, channel, want):
    d = _d(text, channel=channel)
    assert d.intent == Intent.PROMISE, (text, d.intent)
    assert Intent.HOW_TO_PAY not in d.all_intents
    assert (d.requested_date or d.promise_date) == want


def test_can_i_pay_on_date_while_plan_offered():
    d = _d("Could I pay on November 18th?", "awaiting_plan_reply", "email")
    assert d.intent == Intent.PROMISE and (d.requested_date or d.promise_date) == date(2026, 11, 18)


@pytest.mark.parametrize("text", ["אפשר לשלם בביט מחר?", "אפשר לשלם באשראי?", "Can I pay by card next week?",
                                  "How can I pay tomorrow?", "Can I pay online?", "איך אפשר לשלם עד מחר?"])
def test_how_to_pay_traps_stay(text):
    d = _d(text, channel="email" if text.isascii() else "sms")
    assert d.intent == Intent.HOW_TO_PAY, (text, d.intent)


# 3 — דחיית פריסה עם מועד
@pytest.mark.parametrize("text,want", [("לא, זה יותר מדי. אני אשלם הכל ב-15 בדצמבר", date(2026, 12, 15)),
                                       ("לא, אני אשלם הכל ביום חמישי", date(2026, 11, 12)),
                                       ("No, I'll pay it all on Thursday", date(2026, 11, 12))])
def test_plan_reject_keeps_date(text, want):
    d = _d(text, "awaiting_plan_reply", "email" if text.isascii() else "sms")
    # מנהל 278 (q10-02/q17-42): «הכל» + מועד על הצעה פתוחה ⇒ הבטחה עיקרית, הדחייה משנית (ההצעה בוטלה).
    # מעל max_defer_days (15 בדצמבר) ⇒ עדיין כרטיס לבעלים עם המועד.
    assert d.intent == Intent.PROMISE and Intent.PLAN_REJECT in d.all_intents
    assert (d.requested_date or d.promise_date) == want
    assert "דחה/תה את הצעת הפריסה" in d.owner_summary
    if (want - date(2026, 11, 8)).days > 14:   # הכרעת q21-19: promised עד 14 + «בדוק ואשר»
        assert d.next_state == State.PROMISED and any("בדוק ואשר" in a for a in d.owner_actions)
    else:
        assert d.next_state == State.PROMISED


def test_plan_reject_without_date_unchanged():
    d = _d("לא תודה", "awaiting_plan_reply")
    assert d.intent == Intent.PLAN_REJECT and d.promise_date is None
    assert "מציע/ה במקום" not in d.owner_summary


# 4 — מספרים מורכבים
@pytest.mark.parametrize("text,want", [("בעשרים ושלושה בנובמבר", date(2026, 11, 23)),
                                       ("בעשרים ואחד בנובמבר", date(2026, 11, 21)),
                                       ("בעשרים ותשעה בנובמבר", date(2026, 11, 29)),
                                       ("בשלושים ואחד בדצמבר", date(2026, 12, 31)),
                                       ("בשלושה עשר בדצמבר", date(2026, 12, 13)),
                                       ("בשמונה עשרה בדצמבר", date(2026, 12, 18)),
                                       ("בשבע עשרה בדצמבר", date(2026, 12, 17)),
                                       ("בעשרה בדצמבר", date(2026, 12, 10)),
                                       ("עד העשרים ושניים לנובמבר", date(2026, 11, 22))])
def test_compound_hebrew_days(text, want):
    d = _d(text, "awaiting_date")
    assert d.intent == Intent.PROMISE and \
            (d.requested_date or d.promise_date) == want, (text, d.requested_date or d.promise_date)


@pytest.mark.parametrize("text", ["500 בדצמבר", "שלחתי 3 חשבוניות"])
def test_compound_traps(text):
    assert _d(text, "awaiting_date").promise_date is None


# 5 — חג כמועד מעורפל
@pytest.mark.parametrize("text", ["אחרי חנוכה", "לפני פסח", "אחרי החגים", "אחרי ראש השנה"])
def test_holiday_answer_is_vague_promise(text):
    d = _d(text, "awaiting_date")
    assert d.intent == Intent.PROMISE and d.promise_date is None, (text, d.intent)
    assert d.next_state == State.AWAITING_DATE and "vague_date" in d.tags


def test_holiday_without_context_not_promise():
    assert _d("שמח לקראת חנוכה").intent != Intent.PROMISE


# 6 — «May 10» כהודעה שלמה
@pytest.mark.parametrize("text", ["May 10", "may 10.", "May 10!"])
def test_bare_may_day(text):
    d = _d(text, "awaiting_date", "email")
    assert d.intent == Intent.PROMISE and (d.requested_date or d.promise_date) == date(2027, 5, 10)


@pytest.mark.parametrize("text", ["I may 10 times", "you may 10", "May I pay 10 days later?"])
def test_may_traps(text):
    d = _d(text, "awaiting_date", "email")
    assert d.promise_date != date(2027, 5, 10), (text, d.requested_date or d.promise_date)


# מקצה לקצה — הרצפים דרך השירות (svc.inbound): ההקשר נבנה מה-DB בין ההודעות
def _seq(svc, channel, texts):
    addr = {"sms": "0501234567", "email": "c1@example.com"}[channel]
    return [svc.inbound(channel, addr, t) for t in texts]


def _state(svc):
    return svc.db.one("SELECT state FROM conversations WHERE customer_id=1")["state"]


@pytest.mark.parametrize("channel", ["sms", "email"])
def test_e2e_promise_then_refine(svc, channel):
    svc.sync()
    out = _seq(svc, channel, ["אני אשלם", "בשבוע הבא", "ביום שלישי ה-17 בנובמבר"])
    assert [o["intent"] for o in out] == ["promise"] * 3
    assert out[-1]["pause_until"] == "2026-11-18" and _state(svc) == "promised"


@pytest.mark.parametrize("channel", ["sms", "email"])
def test_e2e_compound_day_answer(svc, channel):
    svc.sync()
    out = _seq(svc, channel, ["אשלם", "בעשרים ואחד בנובמבר"])
    assert out[-1]["intent"] == "promise" and out[-1]["pause_until"] == "2026-11-22"


def test_e2e_plan_reject_with_date_card_has_date(svc):
    svc.sync()
    out = _seq(svc, "sms", ["אפשר בתשלומים?", "לא, זה יותר מדי. אני אשלם הכל ב-15 בדצמבר"])
    assert out[-1]["intent"] == "promise" and "15" in out[-1]["owner_summary"]   # מנהל 278


def test_e2e_english_may(svc):
    svc.sync()
    out = _seq(svc, "email", ["Thanks, I'll pay in May", "May 10"])
    assert [o["intent"] for o in out] == ["promise", "promise"]
    assert out[-1]["stop"] != "permanent" and out[-1]["escalation"] == "normal"   # 182 ימים ⇒ כרטיס עם המועד
    assert "10" in out[-1]["owner_summary"]


def test_sequence_runner_smoke():
    """evals/sequences.py עצמו (בלי הסט המוחזק — הוא מחוץ לשער)."""
    from evals.sequences import run_seq
    assert run_seq({"id": "t", "channel": "sms", "turns": [
        {"text": "אפשר לפרוס את זה?", "expect": {"intent": "plan_request", "state": "awaiting_plan_reply"}},
        {"text": "כן, מתאים לי", "expect": {"intent": "plan_accept", "state": "plan_pending_owner"}}]}) == []
    assert run_seq({"id": "t", "channel": "sms", "turns": [
        {"text": "אשלם", "expect": {"intent": "thanks"}}]}) == ["#1 intent promise≠thanks"]


def test_today_anchor():
    assert TODAY == date(2026, 11, 8)

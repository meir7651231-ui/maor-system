"""מנהל 256 — סט QA #10 (רצפים ארוכים): יום בחודש בתוך משפט הבטחה, בכל מצב; «עדיף לי לשלם…»;
בקשת העתק באנגלית; ומריץ הרצפים עם בעל העסק באמצע (approve_plan/approve_draft/reject_draft, advance_days).

באג: «קיבלתי תודה. אשלם ב-15», «סליחה, לא הספקתי. אשלם ב-20», «לא, זה לא מתאים לי. אשלם הכל ב-20»
(אחרי הצעת פריסה) ⇒ אין מועד — יום בחודש לבד נתפס רק כשכל ההודעה היא התאריך ורק ב-AWAITING_DATE/PROMISED.
«אשלם ב-12» כהודעה ראשונה ⇒ «עד מתי?» אף שהמועד נאמר.
"""
from datetime import date

import pytest

from app.conversation import Context, Intent, State, detect, extract_date_ctx, normalize
from evals.sequences import run_seq

T = date(2026, 11, 8)


def _d(text, state=State.IDLE):
    return extract_date_ctx(normalize(text), Context(today=T, business="x", state=state))[0]


@pytest.mark.parametrize("text,want", [
    ("קיבלתי תודה. אשלם ב-15", date(2026, 11, 15)),
    ("סליחה, לא הספקתי. אשלם ב-20", date(2026, 11, 20)),
    ("לא, זה לא מתאים לי. אשלם הכל ב-20", date(2026, 11, 20)),
    ("אני אשלם הכל ב-30", date(2026, 11, 30)),
    ("אשלם ב-12", date(2026, 11, 12)),
    ("אעביר את היתרה עד ה-3", date(2026, 12, 3)),          # עבר ⇒ החודש הבא
    ("נסדר את זה ב-5 לחודש הבא", date(2026, 12, 5)),
])
@pytest.mark.parametrize("state", [State.IDLE, State.AWAITING_PLAN_REPLY, State.AWAITING_OWNER])
def test_promise_clause_day_any_state(text, want, state):
    assert _d(text, state) == want


@pytest.mark.parametrize("text", [
    "אשלם ב-3 תשלומים", "תתקשרו אליי ב-5", "שילמתי 17 שקל", "אשלם ב-500", "אשלם 1,200 ב-12",
    "ב-5", "תתקשרו ב-5. אשלם", "17 שקל",
])
def test_no_promise_verb_or_not_a_day_no_date(text):
    assert _d(text) is None


def test_prefer_to_pay_is_promise():
    assert Intent.PROMISE in detect(normalize("עדיף לי בעצם לשלם הכל לחודש הבא"))
    assert Intent.PROMISE in detect(normalize("נוח לי לשלם בסוף החודש"))
    assert Intent.PROMISE not in detect(normalize("אני מעדיף לשלם בתשלומים, כמה אפשר?"))  # xq27
    assert Intent.PROMISE not in detect(normalize("עדיף לי לשלם ב-3 תשלומים"))


@pytest.mark.parametrize("text", ["Can I get a copy of the invoice?", "Please resend the invoice",
                                  "Could you send me a duplicate of the bill?"])
def test_english_copy_request(text):
    assert detect(normalize(text))[0] == Intent.COPY_REQUEST


def _seq(turns, ch="sms"):
    return run_seq({"id": "t", "channel": ch, "turns": turns})


def test_runner_owner_approves_plan_mid_sequence():
    assert _seq([
        {"text": "אפשר בתשלומים?", "expect": {"intent": "plan_request", "state": "awaiting_plan_reply"}},
        {"owner": "approve_plan", "expect": {"ok": True, "plan_status": "approved"}},
        {"text": "מאשר", "expect": {"intent": "plan_accept", "state": "plan_pending_owner"}},
        {"owner": "approve_draft", "expect": {"ok": True}},
    ]) == []


def test_runner_owner_failure_is_reported_not_crash():
    f = _seq([{"owner": "approve_plan", "expect": {"ok": True}}])
    assert f and "ok=False" in f[0]
    assert _seq([{"owner": "reject_draft", "expect": {"ok": False}}]) == []


def test_runner_advance_days_moves_clock():
    # 11.11: «ב-10» כבר עבר ⇒ 10.12 (29 ימים ⇒ לבעל העסק)
    assert _seq([
        {"text": "אני אשלם", "expect": {"state": "awaiting_date"}},
        {"text": "ב-10", "advance_days": 3, "expect": {"promise": "2026-12-10", "state": "awaiting_owner"}},
    ]) == []


def test_runner_draft_status_expectation():
    assert _seq([{"text": "מי זה?", "expect": {"draft": "pending_approval"}}]) == []
    assert _seq([{"text": "מי זה?", "expect": {"draft": "needs_owner"}}]) != []

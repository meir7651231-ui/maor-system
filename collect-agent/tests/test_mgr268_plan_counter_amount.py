"""מנהל הפעלה 268 · «הבא» AI מ-267: הצעה נגדית בסכום החודשי (אחרי שהלקוח אישר הסדר, וגם באמצע הצעה).

היה:
  · PLAN_PENDING_OWNER «300 בחודש זה הרבה, אולי 200?» ⇒ הצעה *זהה* (הסכום הראשון בהודעה = ההסדר הקיים),
    «ביקש/ה פריסה» — בעל העסק לא ידע שזה שינוי בהסדר שכבר אושר.
  · «can we do 200 a month?» / «what about 200 per month?» / «I can pay 200 a month» ⇒ «לא ברור».
  · AWAITING_PLAN_REPLY «אולי 200 בחודש?» ⇒ «ביקש/ה 20 תשלומים ⚠️ מעל התקרה» (ספרות מתוך 200).
  · AWAITING «אפשר ב-20 לחודש?» ⇒ «ביקש/ה 20» (ואחרי תיקון חלקי: ₪20 לחודש ⇒ «60 תשלומים»); מועד, לא סכום.
עכשיו: `plan_counter_amount` — הסכום שאחרי הסמן, רק עם עוגן חודשי ⇒ הצעה מעודכנת + ההסדר הקודם בכרטיס (🔁).
"""
from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

import pytest

from app.conversation import (
    Intent,
    State,
    extract_monthly_amount,
    normalize,
    plan_counter_amount,
    plan_retract,
    respond,
)
from evals.harness import build_ctx
from evals.sequences import run_seq

CH = pytest.mark.parametrize("ch", ["sms", "email"])

# סך 1,200 ₪, הסדר נוכחי 4×300
COUNTER = [("300 בחודש זה הרבה, אולי 200?", 200), ("אולי 200 בחודש?", 200), ("אפשר 200 לחודש?", 200),
           ("can we do 200 a month?", 200), ("what about 200 per month?", 200), ("200 a month instead", 200),
           ("maybe 200 monthly?", 200), ("300 a month is too much, can we do 150?", 150),
           ("אולי 200 ש\"ח לחודש?", 200), ("how about ₪240 a month?", 240), ("אפשר 100 לחודש?", 100)]
NOT_COUNTER = ["אולי 200?", "אולי 300?", "אפשר ב-20 לחודש?", "אולי 6 תשלומים בחודש?", "אולי 300 בחודש?",
               "maybe 20 days?", "אולי 20 ימים, 300 בחודש", "אפשר 6?"]


def _ctx(state="plan_pending_owner", ch="sms", approved=True, n=4):
    return replace(build_ctx({"state": state, "channel": ch, "offered_n": n}), plan_approved=approved)


@pytest.mark.parametrize(("text", "ils"), COUNTER)
def test_counter_amount_extracted(text, ils):
    assert plan_counter_amount(normalize(text), 30000) == ils * 100


@pytest.mark.parametrize("text", NOT_COUNTER)
def test_not_counter_amount(text):
    assert plan_counter_amount(normalize(text), 30000) is None


@pytest.mark.parametrize(("text", "ils"), COUNTER)
def test_counter_amount_is_not_retract(text, ils):
    assert not plan_retract(normalize(text))


@CH
@pytest.mark.parametrize("approved", [True, False])
@pytest.mark.parametrize(("text", "ils"), COUNTER)
def test_pending_counter_amount_is_updated_offer(text, ils, approved, ch):
    d = respond(text, _ctx(ch=ch, approved=approved))
    assert d.intent == Intent.PLAN_REQUEST, d
    assert "plan_change" in d.tags and "plan_retract" not in d.tags
    n = -(-120000 // (ils * 100))
    assert len(d.plan) == min(n, 6)
    if n <= 6:
        assert max(i.amount_agorot for i in d.plan) <= ils * 100
    assert d.next_state == State.AWAITING_PLAN_REPLY and d.reply and "מאשר" in d.reply
    assert "ההסדר שהלקוח/ה אישר/ה קודם" in d.owner_summary and "4 תשלומים" in d.owner_summary
    assert ("נשאר בתוקף" if approved else "ממתין לאישורך") in d.owner_summary


@pytest.mark.parametrize("text", ["I can pay 200 a month", "אשלם 200 לחודש"])
def test_pending_new_monthly_without_marker_is_change(text):
    d = respond(text, _ctx())
    assert d.intent == Intent.PLAN_REQUEST and "plan_change" in d.tags and len(d.plan) == 6
    assert "ההסדר שהלקוח/ה אישר/ה קודם" in d.owner_summary


@pytest.mark.parametrize(("text", "n"), [("אולי 200 בחודש?", 6), ("אפשר 200 לחודש?", 6),
                                         ("can we do 200 a month?", 6), ("300 בחודש זה הרבה, אולי 200?", 6),
                                         ("maybe 250 monthly?", 5)])
def test_awaiting_counter_amount_no_false_installments(text, n):
    """היה: «ביקש/ה 20 תשלומים ⚠️ מעל התקרה» — הספרות הראשונות מתוך 200 נקראו מספר תשלומים."""
    d = respond(text, _ctx(state="awaiting_plan_reply", approved=False, n=3))
    assert len(d.plan) == n
    assert "מעל התקרה" not in d.owner_summary and "ל-20 תשלומים" not in d.owner_summary


def test_awaiting_day_of_month_is_date_not_amount():
    """«אפשר ב-20 לחודש?» = מועד; מספר התשלומים שהוצע נשמר (היה: «20 תשלומים ⚠️» / ₪20 לחודש)."""
    d = respond("אפשר ב-20 לחודש?", _ctx(state="awaiting_plan_reply", approved=False, n=4))
    assert len(d.plan) == 4 and d.plan[0].due.day == 20
    assert "מעל התקרה" not in d.owner_summary
    assert extract_monthly_amount(normalize("אפשר ב-20 לחודש?")) is None
    assert extract_monthly_amount(normalize("אשלם 20 ש\"ח לחודש")) == 2000


@pytest.mark.parametrize(("text", "agorot"), [("I can pay 200 a month", 20000), ("$150 per month", 15000),
                                              ("300/month", 30000), ("250 monthly", 25000),
                                              ("1,200 nis a month", 120000)])
def test_english_monthly_amount(text, agorot):
    assert extract_monthly_amount(normalize(text)) == agorot


@pytest.mark.parametrize("text", ["I paid 200 last month", "200 months", "every month I get 2 reminders"])
def test_english_monthly_amount_negatives(text):
    assert extract_monthly_amount(normalize(text)) is None


@pytest.mark.parametrize("text", ["אולי 200?", "אולי 300?", "אפשר ב-20 לחודש?", "maybe 20 days?"])
def test_pending_non_counter_no_change_tag(text):
    d = respond(text, _ctx())
    assert "plan_change" not in d.tags


@pytest.mark.parametrize(("text", "intent"), [("הסר אותי, אולי 200 בחודש", Intent.OPT_OUT),
                                              ("כבר שילמתי, אולי 200 בחודש?", Intent.PAID_CLAIM),
                                              ("אני לא חייבת כלום, אולי 200 בחודש?", Intent.DISPUTE)])
def test_protective_intents_win(text, intent):
    assert respond(text, _ctx()).intent == intent


def test_regression_sequences_pass():
    p = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr268.jsonl"
    for line in p.read_text(encoding="utf-8").splitlines():
        seq = json.loads(line)
        assert run_seq(seq) == [], seq["id"]

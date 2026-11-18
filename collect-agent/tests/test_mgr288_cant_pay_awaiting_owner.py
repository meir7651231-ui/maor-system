"""מנהל הפעלה 288 · cant_pay כשהשיחה כבר אצל בעל העסק אחרי הסדר (AWAITING_OWNER + offered_plan) — «הבא» פיתוח מ-287.

היה: אחרי כרטיס קושי (287), דחיית הצעה, או חזרה מהסדר (266) — הודעה נוספת «אין לי כסף» / «קשה לי לשלם» /
«I can't afford it» ⇒ cant_pay ⇒ המנוע הציע ללקוח **שוב את אותו הסדר** (גם הסדר שהלקוח דחה, וגם ליד הסדר שבתוקף),
החזיר את השיחה ל-AWAITING_PLAN_REPLY, וב-inbox נרשם proposed שני (plans=2). «אין לי כסף, אשלם ב-1 לחודש הבא» ⇒
אותה הצעה, והמועד נבלע.
עכשיו: בלי הסדר חדש, נשארים ב-AWAITING_OWNER, כרטיס «💬 כותב/ת שוב על קושי» עם ההסדר וההודעה, טיוטה אמפתית.
בקשת פריסה מפורשת, מצב רגיש, ו-AWAITING_OWNER בלי הסדר בשיחה — ללא שינוי.
"""
from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

import pytest

from app.conversation import Escalation, Intent, State, respond
from evals.harness import build_ctx
from evals.sequences import run_seq

HARDSHIP = ["אין לי כסף", "אין לי כסף לשלם את זה עכשיו", "אין לי כרגע איך לשלם", "אני מובטלת ואין לי כסף",
            "קשה לי לשלם", "I can't pay", "I can't afford it", "אין לי כסף, אפשר ב-6?"]


def _d(text, approved=False, offered=3):
    ctx = build_ctx({"state": "awaiting_owner", "channel": "sms", "total": 120000, "offered_n": offered})
    if approved:
        ctx = replace(ctx, plan_approved=True)
    return respond(text, ctx)


@pytest.mark.parametrize("approved", [False, True])
@pytest.mark.parametrize("text", HARDSHIP)
def test_repeat_hardship_is_card_not_same_offer(text, approved):
    d = _d(text, approved)
    assert d.intent is Intent.CANT_PAY
    assert not d.plan                                   # אין הסדר חדש/זהה
    assert d.next_state is State.AWAITING_OWNER         # לא חוזרים ל«ממתין לתשובה על הצעה»
    assert d.escalate is Escalation.NORMAL
    assert "אפשר לפרוס" not in (d.reply or "")
    assert "תודה ששיתפתם" in (d.reply or "") and "בעל העסק יבדוק" in (d.reply or "")
    assert "plan_hardship" in d.tags
    assert "שוב על קושי" in d.owner_summary and "לא נשלחה הצעה חדשה" in d.owner_summary
    assert ("שבתוקף" in d.owner_summary) is approved


def test_hardship_with_date_keeps_promise_in_card():
    d = _d("אין לי כסף, אשלם ב-1 לחודש הבא")
    assert d.intent is Intent.CANT_PAY and Intent.PROMISE in d.all_intents
    assert d.promise_date is not None and "מציע/ה לשלם עד" in d.owner_summary
    assert not d.plan and d.next_state is State.AWAITING_OWNER


@pytest.mark.parametrize("text", ["אני בבית חולים ואין לי כסף", "פשטתי רגל, אין לי איך לשלם",
                                  "אני במילואים ואין לי כסף"])
def test_sensitive_unchanged(text):
    d = _d(text)
    assert d.intent is Intent.CANT_PAY and not d.plan
    assert "plan_hardship" not in d.tags


def test_explicit_plan_request_unchanged():
    d = _d("אין לי כסף, אפשר 6 תשלומים?")
    assert d.intent is Intent.PLAN_REQUEST and len(d.plan) == 6


def test_awaiting_owner_without_plan_unchanged():
    """בלי הסדר בשיחה (למשל אחרי «לא ברור») — ההתנהגות הקודמת: הצעת פריסה."""
    d = _d("אין לי כסף", offered=0)
    assert d.intent is Intent.CANT_PAY and d.plan
    assert d.next_state is State.AWAITING_PLAN_REPLY


@pytest.mark.parametrize("text", ["תודה", "שילמתי", "מאשרת"])
def test_non_hardship_no_card(text):
    assert "plan_hardship" not in _d(text).tags


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr288.jsonl"


@pytest.mark.parametrize("seq", [json.loads(x) for x in SEQ.read_text(encoding="utf-8").splitlines() if x.strip()],
                         ids=lambda s: s["id"])
def test_sequences(seq):
    assert run_seq(seq) == []

"""מנהל הפעלה 287 · cant_pay אחרי שהלקוח כבר אישר הסדר (PLAN_PENDING_OWNER) — «הבא» פיתוח מ-285/286.

היה: «אין לי כסף» / «I can't pay» / «אין לי כסף אבל מאשרת» אחרי «מאשרת» (גם אחרי שבעל העסק אישר ושלח) ⇒ cant_pay
ראשי ⇒ המנוע הציע ללקוח **שוב את אותו הסדר** («אפשר לפרוס… 3 תשלומים של 400») והחזיר את השיחה ל-AWAITING_PLAN_REPLY;
ב-inbox נרשם proposed זהה שהחליף את ההסדר שממתין לבעל העסק (וסגר את הכרטיס שלו), או נרשם ליד ה-approved.
«אין לי כסף, אשלם ב-1 לחודש הבא» ⇒ אותה הצעה, והמועד נבלע.
עכשיו: מסלול 266 — כרטיס לבעל העסק עם ההסדר וההודעה, ההסדר לא מבוטל אוטומטית, cant_pay משני, וללקוח טיוטה
אמפתית («תודה ששיתפתם… בעל העסק יבדוק ויחזור אליכם»). הצעה נגדית מזוהה ומצב רגיש — ללא שינוי.
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
            "קשה לי לשלם", "I can't pay", "I can't afford it", "אין לי כסף אבל מאשרת", "אין לי כסף, אפשר ב-6?"]


def _d(text, approved=False):
    ctx = build_ctx({"state": "plan_pending_owner", "channel": "sms", "total": 120000, "offered_n": 3})
    if approved:
        ctx = replace(ctx, plan_approved=True)
    return respond(text, ctx)


@pytest.mark.parametrize("approved", [False, True])
@pytest.mark.parametrize("text", HARDSHIP)
def test_hardship_after_accept_is_card_not_same_offer(text, approved):
    d = _d(text, approved)
    assert d.intent is Intent.PLAN_REJECT
    assert Intent.CANT_PAY in d.all_intents
    assert Intent.PLAN_ACCEPT not in d.all_intents
    assert not d.plan                                  # אין הסדר חדש/זהה
    assert d.next_state is State.AWAITING_OWNER        # לא חוזרים ל«ממתין לתשובה על הצעה»
    assert d.escalate is Escalation.NORMAL
    assert "אפשר לפרוס" not in (d.reply or "")
    assert "תודה ששיתפתם" in (d.reply or "")
    assert "plan_hardship" in d.tags
    assert "קושי" in d.owner_summary and "לא בוטל" in d.owner_summary
    assert "ייתכן שחוזר" not in d.owner_summary


def test_hardship_with_date_keeps_promise_in_card():
    d = _d("אין לי כסף, אשלם ב-1 לחודש הבא")
    assert d.intent is Intent.PLAN_REJECT and Intent.PROMISE in d.all_intents
    assert d.promise_date is not None and "מציע/ה במקום לשלם" in d.owner_summary


def test_explicit_retract_unchanged():
    d = _d("פוטרתי מהעבודה, לא אוכל לעמוד בתשלומים")
    assert d.intent is Intent.PLAN_REJECT and "plan_hardship" not in d.tags
    assert "קיבלנו את ההודעה לגבי ההסדר" in (d.reply or "")


@pytest.mark.parametrize("text", ["קשה לי, אולי 6 תשלומים?", "אין לי כסף, אפשר 200 בחודש?",
                                  "I can't afford it, can we do 6?"])
def test_counter_offer_still_counter(text):
    d = _d(text)
    assert d.intent is Intent.PLAN_REQUEST and len(d.plan) == 6


@pytest.mark.parametrize("approved", [False, True])
@pytest.mark.parametrize("text", ["אני בבית חולים ואין לי כסף", "פשטתי רגל, אין לי איך לשלם",
                                  "אני במילואים ואין לי כסף"])
def test_sensitive_unchanged(text, approved):
    d = _d(text, approved)
    assert d.intent is Intent.CANT_PAY and Intent.PLAN_REJECT not in d.all_intents
    assert not d.plan


@pytest.mark.parametrize("text", ["מאשרת", "תודה", "שילמתי"])
def test_non_hardship_unchanged(text):
    assert Intent.CANT_PAY not in _d(text).all_intents


def test_awaiting_reply_unchanged():
    d = respond("אין לי כסף", build_ctx({"state": "awaiting_plan_reply", "total": 120000, "offered_n": 3}))
    assert d.intent is Intent.PLAN_REJECT and "plan_hardship" not in d.tags


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr287.jsonl"


@pytest.mark.parametrize("seq", [json.loads(line) for line in SEQ.read_text(encoding="utf-8").splitlines()
                                 if line.strip()], ids=lambda s: s["id"])
def test_regress_sequences(seq):
    assert run_seq(seq) == []

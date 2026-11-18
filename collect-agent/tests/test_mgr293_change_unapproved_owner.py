"""מנהל הפעלה 293 · בקשת שינוי כשהשיחה אצל בעל העסק וההסדר שבשיחה **לא אושר** («הבא» פיתוח מ-292).

היה: הלקוח דחה את ההצעה («אין לי כסף» / «לא מתאים לי») ⇒ AWAITING_OWNER עם ההסדר שהוצע. אחר כך «אפשר להזיז את
התשלום הראשון ל-20?» / «can we move…» / «אפשר להוריד את התשלום החודשי ל-200?» ⇒ «❓ הודעה שלא זיהיתי».
«אפשר שהתשלום השני יהיה בתחילת החודש?» ⇒ הבטחה ⇒ «עד איזה תאריך?» (AWAITING_DATE). «אפשר לדחות את התשלומים
בחודש?» ⇒ הצעה חדשה שמתחילה **באותו מועד** (הדחייה לא כובדה) ושוחררה מבעל העסק ל-AWAITING_PLAN_REPLY.
עכשיו: כמו 291 — כרטיס «🔁 מבקש/ת שינוי בהסדר שהוצע ולא אושר (…)», ללקוח «קיבלנו את הבקשה לשינוי בהסדר», בלי
לוח מחושב, השיחה נשארת אצל בעל העסק. מספר תשלומים אחר ⇒ הצעה מעודכנת (כמו קודם, עם plan_change).
"""
from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

import pytest

from app.conversation import Intent, State, respond
from evals.harness import build_ctx
from evals.sequences import run_seq

CHANGE = ["אפשר להזיז את התשלום הראשון ל-20?", "can we move the first payment to the 20th?",
          "אפשר להוריד את התשלום החודשי ל-200?", "אפשר שהתשלום השני יהיה בתחילת החודש?",
          "להזיז את התשלום הראשון", "אפשר לדחות את התשלומים בחודש?", "אפשר לשלם את התשלום הראשון ב-20?"]


def _d(text, state="awaiting_owner", approved=False):
    ctx = build_ctx({"state": state, "channel": "sms", "total": 120000, "offered_n": 3})
    if approved:
        ctx = replace(ctx, plan_approved=True)
    return respond(text, ctx)


@pytest.mark.parametrize("text", CHANGE)
def test_change_next_to_unapproved_is_card(text):
    d = _d(text)
    assert d.intent is Intent.PLAN_REQUEST and "plan_change" in d.tags
    assert not d.plan                                   # לא מנחשים לוח חדש
    assert d.next_state is State.AWAITING_OWNER         # נשאר אצל בעל העסק
    assert "קיבלנו את הבקשה לשינוי בהסדר" in d.reply
    assert "עד איזה תאריך" not in d.reply
    assert "🔁" in d.owner_summary and "שהוצע ולא אושר (3 תשלומים" in d.owner_summary
    assert "שבתוקף" not in d.owner_summary and "אושר על ידך" not in d.owner_summary
    assert "לא זיהיתי" not in d.owner_summary


@pytest.mark.parametrize("text", CHANGE)
def test_approved_wording_unchanged_291(text):
    d = _d(text, approved=True)
    assert "שבתוקף (אושר על ידך; 3 תשלומים" in d.owner_summary and "שהוצע ולא אושר" not in d.owner_summary


def test_count_change_updated_offer():
    d = _d("אפשר לשנות ל-6 תשלומים?")
    assert len(d.plan) == 6 and "plan_change" in d.tags and "הצעה מעודכנת" in d.reply


@pytest.mark.parametrize("text,tag", [("אני בבית חולים, אפשר להזיז את התשלום הראשון?", "sensitive"),
                                      ("אני במילואים, אפשר להזיז את התשלום הראשון?", "reservist")])
def test_sensitive_wins(text, tag):
    d = _d(text)
    assert tag in d.tags and not d.plan and "קיבלנו את הבקשה לשינוי" not in (d.reply or "")


def test_protective_wins():
    assert _d("תפסיקו, אל תזיזו כלום ואל תשלחו לי יותר").intent is Intent.OPT_OUT


@pytest.mark.parametrize("text", ["תודה", "שילמתי את התשלום הראשון", "בעצם ב-25"])
def test_non_change_unchanged(text):
    assert "plan_change" not in _d(text).tags


def test_no_plan_in_conversation_unchanged():
    """AWAITING_OWNER בלי הסדר בשיחה ⇒ אין «שינוי בהסדר» (אין מה לשנות)."""
    ctx = build_ctx({"state": "awaiting_owner", "channel": "sms", "total": 120000})
    d = respond("אפשר להזיז את התשלום הראשון ל-20?", ctx)
    assert "plan_change" not in d.tags and "קיבלנו את הבקשה לשינוי בהסדר" not in (d.reply or "")


def test_plan_reply_state_unchanged_264():
    d = _d("אפשר להזיז את התשלום הראשון ל-20?", state="awaiting_plan_reply")
    assert d.plan and "plan_change" in d.tags


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr293.jsonl"


@pytest.mark.parametrize("seq", [json.loads(x) for x in SEQ.read_text(encoding="utf-8").splitlines() if x.strip()],
                         ids=lambda s: s["id"])
def test_sequences(seq):
    assert run_seq(seq) == []

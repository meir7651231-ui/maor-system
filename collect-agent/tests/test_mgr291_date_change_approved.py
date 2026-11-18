"""מנהל הפעלה 291 · בקשת שינוי (מועד/סכום/תשלום מסוים) כשהשיחה אצל בעל העסק וההסדר שבשיחה כבר אושר («הבא» פיתוח מ-290).

היה: AWAITING_OWNER + הסדר מאושר ⇒ «אפשר להזיז את התשלום הראשון ל-20?» / «can we move the first payment to the 20th?»
/ «אפשר להוריד את התשלום החודשי ל-200?» ⇒ unknown («❓ הודעה שלא זיהיתי», בלי ההסדר). «אפשר שהתשלום השני יהיה
בתחילת החודש?» ⇒ הבטחה ⇒ ללקוח שיש לו הסדר בתוקף: «עד איזה תאריך?» (AWAITING_DATE). «אפשר לדחות את התשלומים
בחודש?» ⇒ «הצעה מעודכנת» זהה לגמרי להסדר שבתוקף.
עכשיו: כרטיס «🔁 מבקש/ת שינוי בהסדר שבתוקף (אושר על ידך; …)… ההסדר נשאר בתוקף עד שתעדכן/י», ללקוח «קיבלנו את
הבקשה לשינוי בהסדר», בלי לוח חדש מחושב (ייתכן שחלק מהתשלומים כבר עברו). מספר תשלומים אחר ⇒ מסלול 290 כמו קודם.
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


def _d(text, approved=True, state="awaiting_owner"):
    ctx = build_ctx({"state": state, "channel": "sms", "total": 120000, "offered_n": 3})
    if approved:
        ctx = replace(ctx, plan_approved=True)
    return respond(text, ctx)


@pytest.mark.parametrize("text", CHANGE)
def test_change_next_to_approved_is_card(text):
    d = _d(text)
    assert d.intent is Intent.PLAN_REQUEST and "plan_change" in d.tags
    assert not d.plan                                   # לא מחשבים לוח חדש מעל הסדר שבתוקף
    assert d.next_state is State.AWAITING_OWNER
    assert "קיבלנו את הבקשה לשינוי בהסדר" in d.reply
    assert "עד איזה תאריך" not in d.reply
    assert "🔁" in d.owner_summary and "שבתוקף (אושר על ידך; 3 תשלומים" in d.owner_summary
    assert "ההסדר נשאר בתוקף עד שתעדכן/י" in d.owner_summary
    assert "לא זיהיתי" not in d.owner_summary


def test_count_change_still_updated_offer_290():
    d = _d("אפשר לשנות ל-6 תשלומים?")
    assert len(d.plan) == 6 and "plan_change" in d.tags and "הצעה מעודכנת" in d.reply
    assert "🔁 ההסדר שבתוקף" in d.owner_summary


@pytest.mark.parametrize("text,tag", [("אני בבית חולים, אפשר להזיז את התשלום הראשון?", "sensitive"),
                                      ("אני במילואים, אפשר להזיז את התשלום הראשון?", "reservist")])
def test_sensitive_wins(text, tag):
    d = _d(text)
    assert tag in d.tags and not d.plan and "קיבלנו את הבקשה לשינוי" not in (d.reply or "")


def test_protective_wins():
    d = _d("תפסיקו, אל תזיזו כלום ואל תשלחו לי יותר")
    assert d.intent is Intent.OPT_OUT


@pytest.mark.parametrize("text", ["תודה", "שילמתי את התשלום הראשון"])
def test_non_change_unchanged(text):
    assert "plan_change" not in _d(text).tags


def test_not_approved_unchanged():
    """AWAITING_OWNER עם הסדר שלא אושר — מחוץ להיקף, נשאר כמו קודם (unknown)."""
    d = _d("אפשר להזיז את התשלום הראשון ל-20?", approved=False)
    assert "plan_change" not in d.tags


def test_plan_reply_state_unchanged_264():
    """AWAITING_PLAN_REPLY (264): הזזת הראשון בתוך הגבולות ⇒ עדיין הצעה מחושבת."""
    d = _d("אפשר להזיז את התשלום הראשון ל-20?", approved=False, state="awaiting_plan_reply")
    assert d.plan and "plan_change" in d.tags


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr291.jsonl"


@pytest.mark.parametrize("seq", [json.loads(x) for x in SEQ.read_text(encoding="utf-8").splitlines() if x.strip()],
                         ids=lambda s: s["id"])
def test_sequences(seq):
    assert run_seq(seq) == []

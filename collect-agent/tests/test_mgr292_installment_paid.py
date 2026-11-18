"""מנהל הפעלה 292 · «שילמתי את התשלום הראשון» כשיש הסדר שבעל העסק אישר («הבא» פיתוח מ-291 (א)).

היה: הסדר מאושר 3×400 ₪ ⇒ «שילמתי את התשלום הראשון» / «העברתי את התשלום השני» / «I paid the first installment»
⇒ כרטיס «טוען/ת ששילם/ה 1,200 ₪» — כל החוב, ובעל העסק עלול לסגור את כל החשבונית אחרי תשלום אחד.
עכשיו: כרטיס «שילם/ה את תשלום 1 מתוך 3 בהסדר שבתוקף (400 ₪, מועד 15.11). יתרת החוב 1,200 ₪», paid_agorot=40000,
וללקוח «רשמנו שהעברתם את תשלום 1 מתוך 3 בהסדר … וההסדר ממשיך כרגיל». בלי הסדר מאושר / כמה תשלומים / «הבא» /
סכום מפורש אחר ⇒ בדיוק כמו קודם.
"""
from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

import pytest

from app.conversation import Intent, paid_installment, respond
from evals.harness import build_ctx
from evals.sequences import run_seq


def _d(text, approved=True, state="awaiting_owner", n=3):
    ctx = build_ctx({"state": state, "channel": "sms", "total": 120000, "offered_n": n})
    if approved:
        ctx = replace(ctx, plan_approved=True)
    return respond(text, ctx)


@pytest.mark.parametrize("text,n", [
    ("שילמתי את התשלום הראשון", 1), ("העברתי את התשלום השני", 2), ("שילמתי את התשלום השלישי", 3),
    ("שילמתי את התשלום האחרון", 3), ("I paid the first installment", 1), ("i paid the second payment", 2),
    ("I paid installment 2", 2), ("שילמתי את תשלום מספר 2", 2), ("שילמתי 400 את התשלום הראשון", 1),
])
def test_installment_card(text, n):
    d = _d(text)
    assert d.intent is Intent.PAID_CLAIM and "plan_installment_paid" in d.tags
    assert "partial" not in d.tags
    assert d.paid_agorot == 40000
    assert f"תשלום {n} מתוך 3 בהסדר שבתוקף (400 ₪" in d.owner_summary
    assert "ששילם/ה 1,200 ₪" not in d.owner_summary
    assert "יתרת החוב 1,200 ₪" in d.owner_summary and "התזכורות הושהו" in d.owner_summary
    assert f"תשלום {n} מתוך 3 בהסדר" in d.reply and "ההסדר ממשיך כרגיל" in d.reply
    assert "חלק מהסכום" not in d.reply


@pytest.mark.parametrize("state", ["idle", "promised", "awaiting_owner"])
def test_any_state_with_approved_plan(state):
    assert "plan_installment_paid" in _d("שילמתי את התשלום הראשון", state=state).tags


@pytest.mark.parametrize("text", [
    "שילמתי", "שילמתי הכל", "שילמתי את שני התשלומים הראשונים", "I paid both installments",
    "שילמתי את התשלום השישי",  # 6 > 3 תשלומים (מנהל 294: «הבא»/«החודשי» ⇒ plan_installment_paid_unspecified)
])
def test_unchanged_without_single_installment(text):
    d = _d(text)
    assert "plan_installment_paid" not in d.tags


def test_not_approved_unchanged():
    d = _d("שילמתי את התשלום הראשון", approved=False)
    assert "plan_installment_paid" not in d.tags


def test_explicit_other_amount_stays_partial():
    d = _d("שילמתי 300 על התשלום הראשון")
    assert "plan_installment_paid" not in d.tags and "partial" in d.tags and d.paid_agorot == 30000


@pytest.mark.parametrize("text", ["לא שילמתי את התשלום הראשון", "עוד לא העברתי את התשלום השני"])
def test_negation_not_paid_claim(text):
    d = _d(text)
    assert d.intent is not Intent.PAID_CLAIM and "plan_installment_paid" not in d.tags


def test_paid_installment_pure():
    plan = build_ctx({"state": "idle", "total": 120000, "offered_n": 3}).offered_plan
    assert paid_installment("תשלומ השני", plan) is plan[1]
    assert paid_installment("תשלומ הראשונ", ()) is None


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr292.jsonl"


@pytest.mark.parametrize("seq", [json.loads(x) for x in SEQ.read_text(encoding="utf-8").splitlines() if x.strip()],
                         ids=lambda s: s["id"])
def test_sequences(seq):
    assert run_seq(seq) == []

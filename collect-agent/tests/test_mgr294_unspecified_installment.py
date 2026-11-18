"""מנהל הפעלה 294 · «שילמתי את התשלום הבא» / «של החודש» ליד הסדר בתוקף («הבא» פיתוח מ-292 (א)).

היה: הסדר מאושר 3×400 ₪. «שילמתי את התשלום הבא», «העברתי את התשלום החודשי», «I paid the next installment» ⇒
כרטיס «טוען/ת ששילם/ה 1,200 ₪» (כל החוב) — בעל העסק עלול לסגור את כל החשבונית אחרי תשלום אחד.
עכשיו: תג `plan_installment_paid_unspecified`, כרטיס «תשלום אחד מההסדר שבתוקף, בלי לציין איזה» — **איזה** תשלום לא
מנחשים (בעל העסק מכריע). הסכום רק כשהוא חד-משמעי: כל התשלומים שווים, או שהלקוח אמר סכום שהוא אחד מסכומי ההסדר.
"""
from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

import pytest

from app.conversation import Intent, paid_unspecified_installment, respond
from evals.harness import build_ctx
from evals.sequences import run_seq

TAG = "plan_installment_paid_unspecified"
TEXTS = ["שילמתי את התשלום הבא", "שילמתי את התשלום של החודש", "העברתי את התשלום החודשי",
         "שילמתי את התשלום הקרוב", "העברתי את התשלום של החודש הזה", "I paid the next installment",
         "paid this month's payment", "I've paid my monthly installment"]


def _d(text, approved=True, total=120000, state="idle"):
    ctx = build_ctx({"state": state, "channel": "sms", "total": total, "offered_n": 3})
    if approved:
        ctx = replace(ctx, plan_approved=True)
    return respond(text, ctx)


@pytest.mark.parametrize("text", TEXTS)
def test_unspecified_is_one_installment_not_whole_debt(text):
    d = _d(text)
    assert d.intent is Intent.PAID_CLAIM and TAG in d.tags
    assert d.paid_agorot == 40000                       # כל התשלומים 400 ₪ ⇒ הסכום ידוע בלי ניחוש
    assert "ששילם/ה 1,200 ₪" not in d.owner_summary
    assert "בלי לציין איזה מתוך 3" in d.owner_summary and "יתרת החוב 1,200 ₪" in d.owner_summary
    assert "תשלום 1 מתוך" not in d.owner_summary        # לא מנחשים איזה
    assert "רשמנו שהעברתם תשלום מההסדר (400 ₪)" in d.reply and "ההסדר ממשיך כרגיל" in d.reply


@pytest.mark.parametrize("state", ["idle", "promised", "awaiting_owner"])
def test_any_state(state):
    assert TAG in _d("שילמתי את התשלום הבא", state=state).tags


def test_unequal_amounts_no_amount_guess():
    d = _d("שילמתי את התשלום הבא", total=100000)        # 333.34 + 333.33 + 333.33
    assert TAG in d.tags and d.paid_agorot is None
    assert "1,000 ₪)" not in d.owner_summary.split("יתרת")[0] and "בלי לציין איזה" in d.owner_summary


def test_explicit_matching_amount_kept():
    d = _d("שילמתי 400 על התשלום הבא")
    assert TAG in d.tags and d.paid_agorot == 40000


def test_explicit_other_amount_stays_partial():
    d = _d("שילמתי 300 על התשלום הבא")
    assert TAG not in d.tags and "partial" in d.tags and d.paid_agorot == 30000


@pytest.mark.parametrize("text", ["שילמתי את התשלום הראשון", "I paid the first installment"])
def test_specific_installment_still_292(text):
    d = _d(text)
    assert "plan_installment_paid" in d.tags and TAG not in d.tags


@pytest.mark.parametrize("text", ["שילמתי", "שילמתי הכל", "שילמתי את התשלומים", "I paid both installments",
                                  "שילמתי את שני התשלומים הבאים"])
def test_not_single_unspecified(text):
    assert TAG not in _d(text).tags


def test_not_approved_unchanged():
    d = _d("שילמתי את התשלום הבא", approved=False)
    assert TAG not in d.tags and "ששילם/ה 1,200 ₪" in d.owner_summary


@pytest.mark.parametrize("text", ["לא שילמתי את התשלום הבא", "עוד לא העברתי את התשלום החודשי"])
def test_negation(text):
    d = _d(text)
    assert d.intent is not Intent.PAID_CLAIM and TAG not in d.tags


def test_pure():
    plan = build_ctx({"state": "idle", "total": 120000, "offered_n": 3}).offered_plan
    assert paid_unspecified_installment("שילמתי את התשלומ הבא", plan)
    assert not paid_unspecified_installment("שילמתי את התשלומ הבא", ())
    assert not paid_unspecified_installment("שילמתי את התשלומימ", plan)


def test_sequences_through_service():
    p = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr294.jsonl"
    for line in p.read_text(encoding="utf-8").splitlines():
        assert run_seq(json.loads(line)) == []

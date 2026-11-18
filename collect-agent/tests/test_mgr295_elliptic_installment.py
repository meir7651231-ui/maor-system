"""מנהל הפעלה 295 · «שילמתי את של החודש» / «שילמתי לחודש הזה» — בלי המילה «תשלום» (AI «הבא» מ-294).

היה: הסדר מאושר 3×400 ₪. «שילמתי את של החודש», «שילמתי לחודש הזה», «העברתי את הבא», «שילמתי החודש»,
«I paid this month», «I paid the next one» ⇒ כרטיס «טוען/ת ששילם/ה 1,200 ₪» (כל החוב) — אותו באג של 294,
רק בלי המילה «תשלום». בעל העסק עלול לסגור את כל החשבונית אחרי תשלום אחד.
עכשיו: אותו מסלול של 294 (`plan_installment_paid_unspecified`). «הכל» / «היתרה» / «everything» ⇒ כל החוב, כמו קודם.
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
TEXTS = ["שילמתי את של החודש", "שילמתי לחודש הזה", "שילמתי את החודשי", "שילמתי את הבא", "העברתי את הקרוב",
         "העברתי את של החודש הזה", "שילמתי את החודש", "שילמתי החודש", "שילמתי כבר החודש",
         "I paid this month", "paid for this month", "I paid the next one", "I paid this month's"]


def _d(text, approved=True, total=120000, state="idle"):
    ctx = build_ctx({"state": state, "channel": "sms", "total": total, "offered_n": 3})
    if approved:
        ctx = replace(ctx, plan_approved=True)
    return respond(text, ctx)


@pytest.mark.parametrize("text", TEXTS)
def test_elliptic_is_one_installment(text):
    d = _d(text)
    assert d.intent is Intent.PAID_CLAIM and TAG in d.tags
    assert d.paid_agorot == 40000
    assert "ששילם/ה 1,200 ₪" not in d.owner_summary
    assert "בלי לציין איזה מתוך 3" in d.owner_summary


@pytest.mark.parametrize("text", ["שילמתי את הכל החודש", "שילמתי החודש הכל", "שילמתי החודש את הכל",
                                  "I paid everything this month", "שילמתי את היתרה החודש", "שילמתי"])
def test_whole_debt_unchanged(text):
    d = _d(text)
    assert TAG not in d.tags


@pytest.mark.parametrize("text", ["שילמתי את של החודש", "שילמתי לחודש הזה", "I paid the next one"])
def test_no_approved_plan_unchanged(text):
    d = _d(text, approved=False)
    assert TAG not in d.tags and "ששילם/ה 1,200 ₪" in d.owner_summary


@pytest.mark.parametrize("text", ["לא שילמתי את של החודש", "עוד לא שילמתי לחודש הזה"])
def test_negation(text):
    d = _d(text)
    assert d.intent is not Intent.PAID_CLAIM and TAG not in d.tags


def test_month_word_alone_is_not_installment():
    plan = build_ctx({"state": "idle", "total": 120000, "offered_n": 3}).offered_plan
    assert not paid_unspecified_installment("החודש קשה לי, שילמתי חלק", plan)
    assert paid_unspecified_installment("שילמתי החודש", plan)
    assert not paid_unspecified_installment("שילמתי את של החודש", ())
    # «הכל» / «היתרה» באותה הודעה ⇒ כל החוב, גם ברמת הפונקציה (לא רק דרך הסכום שחולץ)
    for t in ("שילמתי החודש את הכל", "שילמתי החודש את היתרה", "i paid this month, everything"):
        assert not paid_unspecified_installment(t, plan), t


def test_sequences_through_service():
    p = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr295.jsonl"
    for line in p.read_text(encoding="utf-8").splitlines():
        assert run_seq(json.loads(line)) == []

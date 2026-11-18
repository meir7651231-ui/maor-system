"""מנהל הפעלה 296 · «שילמתי לחודש נובמבר» — שם חודש ליד הסדר בתוקף (נמצא ב-295 ולא תוקן).

היה: הסדר מאושר 3×400 ₪. «שילמתי לחודש נובמבר», «שילמתי את של נובמבר», «I paid for November» ⇒ כרטיס
«טוען/ת ששילם/ה 1,200 ₪» (כל החוב). בעל העסק עלול לסגור את כל החשבונית אחרי תשלום אחד.
עכשיו: מסלול 294 «תשלום אחד מההסדר, בלי לציין איזה» — שם החודש לא ממופה לתשלום (ניחוש; איזה = בעל העסק).
«שילמתי בנובמבר» (זמן, לא מושא) / «הכל» / «היתרה» / בלי הסדר מאושר / שלילה ⇒ כמו קודם.
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
TEXTS = ["שילמתי לחודש נובמבר", "שילמתי את של נובמבר", "שילמתי את נובמבר", "העברתי לנובמבר", "העברתי ל-מרץ",
         "שילמתי את חודש נובמבר", "שילמתי עבור דצמבר", "שילמתי את התשלום של נובמבר", "שילמתי את תשלום ינואר",
         "שילמתי את חודש אב", "שילמתי לחודש חשוון", "I paid for November", "I paid November's",
         "paid the november payment", "i paid the december one"]


def _d(text, approved=True, total=120000):
    ctx = build_ctx({"state": "idle", "channel": "sms", "total": total, "offered_n": 3})
    if approved:
        ctx = replace(ctx, plan_approved=True)
    return respond(text, ctx)


@pytest.mark.parametrize("text", TEXTS)
def test_month_name_is_one_installment(text):
    d = _d(text)
    assert d.intent is Intent.PAID_CLAIM and TAG in d.tags, text
    assert d.paid_agorot == 40000
    assert "ששילם/ה 1,200 ₪" not in d.owner_summary
    assert "בלי לציין איזה מתוך 3" in d.owner_summary


@pytest.mark.parametrize("text", ["שילמתי בנובמבר", "שילמתי בנובמבר את הכל", "שילמתי לנובמבר את כל היתרה",
                                  "I paid everything for November", "שילמתי"])
def test_whole_debt_unchanged(text):
    d = _d(text)
    assert TAG not in d.tags


@pytest.mark.parametrize("text", ["שילמתי לחודש נובמבר", "I paid for November"])
def test_no_approved_plan_unchanged(text):
    d = _d(text, approved=False)
    assert TAG not in d.tags and "ששילם/ה 1,200 ₪" in d.owner_summary


@pytest.mark.parametrize("text", ["לא שילמתי לחודש נובמבר", "עוד לא העברתי את של דצמבר"])
def test_negation(text):
    d = _d(text)
    assert d.intent is not Intent.PAID_CLAIM and TAG not in d.tags


def test_function_level():
    plan = build_ctx({"state": "idle", "total": 120000, "offered_n": 3}).offered_plan
    assert paid_unspecified_installment("שילמתי לחודש נובמבר", plan)
    assert not paid_unspecified_installment("שילמתי לחודש נובמבר", ())
    # «אב» לבד הוא גם «אבא» ⇒ רק עם «חודש»; «בנובמבר» = זמן
    assert not paid_unspecified_installment("שילמתי לאב שלי", plan)
    assert not paid_unspecified_installment("שילמתי בנובמבר", plan)
    assert not paid_unspecified_installment("שילמתי לחודש נובמבר את הכל", plan)


def test_sequences_through_service():
    p = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr296.jsonl"
    for line in p.read_text(encoding="utf-8").splitlines():
        assert run_seq(json.loads(line)) == []

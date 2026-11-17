"""מנהל הפעלה 277 · סריקת שינויי `plans.status` לפי כוונה משנית (הבא 2 של 276).

סריקה: 64 הודעות × 2 מצבים (הצעה ממתינה / הצעה שבעל העסק כבר שלח) דרך השירות האמיתי, ובדיקה שמצב ההסדר ב-DB תואם
את מה שנאמר ללקוח. נמצא:
  · 🔴 סירוב לפריסה — «לא צריך פריסה, אשלם הכל ביום חמישי», «אשלם הכל מחר, בלי תשלומים», «no need for installments» ⇒
    המילה «פריסה/תשלומים» נקראה PLAN_REQUEST ⇒ ללקוח נשלחה **הצעת פריסה חדשה** («בשמחה. הצעה לפריסת 1,200 ₪…»),
    נרשם הסדר proposed חדש, והמצב plan_pending_owner. גם בלי הצעה קודמת (idle) ⇒ הצעה במקום רישום ההבטחה.
  · כל שאר המסלולים (paid/promise/dispute משניים, cant_pay על הסדר שנשלח, הצעה נגדית) תואמים.
עכשיו: שלילה צמודה למילת הפריסה ⇒ לא בקשה; על הצעה פתוחה ⇒ דחייה (המסלול הקיים, עם המועד בכרטיס). מספר תשלומים,
סכום חודשי או שינוי בהסדר באותה הודעה ⇒ נשאר בקשה. diff על 1,665 טקסטי eval × 3 מצבים: ריק.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.conversation import Intent, respond
from evals.harness import build_ctx
from evals.sequences import run_seq


def _d(text, state="idle"):
    return respond(text, build_ctx({"state": state, "channel": "sms", "total": 120000}))


@pytest.mark.parametrize("text", [
    "לא צריך פריסה, אשלם הכל ביום חמישי", "אני אשלם הכל מחר, בלי תשלומים", "אין צורך בפריסה, אעביר מחר",
    "לא מעוניינת בהסדר, אשלם בחמישי", "no need for installments, I will pay it all Thursday",
    "I don't want installments, will pay in full tomorrow"])
def test_decline_with_date_is_promise_not_plan(text):
    d = _d(text)
    assert d.intent is Intent.PROMISE
    assert Intent.PLAN_REQUEST not in d.all_intents
    assert not d.plan and d.promise_date is not None


@pytest.mark.parametrize("text", ["לא צריך פריסה", "בלי תשלומים", "no payment plan"])
def test_decline_alone_no_offer(text):
    d = _d(text)
    assert Intent.PLAN_REQUEST not in d.all_intents
    assert not d.plan


@pytest.mark.parametrize("text,n", [("בלי ריבית, אפשר ב-3 תשלומים?", 3), ("אפשר בתשלומים?", None),
                                    ("למה לא בתשלומים?", None),
                                    ("לא צריך את כל הסכום עכשיו, אפשר בתשלומים?", None),
                                    ("בלי תשלומים, 200 לחודש", None), ("no, 4 installments please", 4)])
def test_traps_stay_plan_request(text, n):
    d = _d(text)
    assert d.intent is Intent.PLAN_REQUEST
    assert d.plan
    if n:
        assert len(d.plan) == n


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr277.jsonl"


@pytest.mark.parametrize("seq", [json.loads(line) for line in SEQ.read_text(encoding="utf-8").splitlines()
                                 if line.strip()], ids=lambda s: s["id"])
def test_regress_sequences(seq):
    assert run_seq(seq) == []

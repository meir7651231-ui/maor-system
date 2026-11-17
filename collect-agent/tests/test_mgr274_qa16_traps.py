"""מנהל הפעלה 274 · סט מוחזק #16 (QA עיוור) — שלוש טעויות שהמנוע עשה בביטחון מלא:

  · 🔴 «הבן שלי בקורס עורך דין צעיר אצלכם, אפשר ב-3 תשלומים?» / «החוג של המשטרה הקהילתית היה מעולה! אשלם ביום שלישי»
    ⇒ legal (השהיה + כרטיס «עו״ד/משטרה»), בלי הצעת פריסה ובלי רישום ההבטחה. תיקון 269 לשמות חוגים לא תפס «עורך» לבד,
    כי הטקסט המנורמל הוא «עורכ דינ», ומשטרה לא הייתה ברשימה. עכשיו: `_strip_class_names` (חוג/קורס/שיעור/סדנה/הרצאה
    + עו״ד/משטרה/שוטרים/משפטים/חובות), ו-_KEEPS_LEGAL נבדק על הטקסט **אחרי** המחיקה (משטרה אחרת בהודעה ⇒ נשאר legal).
  · 🔴 «שיעור על חובות ונכסים היה מעניין. אשלם ביום רביעי» ⇒ cant_pay + הצעת פריסה למי שהבטיח תאריך.
  · 🔴 מלכודת «I paid a hundred percent attention in class lol» ⇒ paid_claim ⇒ התזכורות הושהו.
diff על 1,560 טקסטי eval × 3 מצבים × 2 סכומים: השתנו רק שלושת הטקסטים האלה.
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


NOT_LEGAL = ["הבן שלי בקורס עורך דין צעיר אצלכם, אפשר לשלם ב-3 תשלומים?",
             "החוג של המשטרה הקהילתית היה מעולה! אני אשלם ביום שלישי",
             "החוג של עורכי הדין הצעירים היה מהמם",
             "הבת שלי בחוג משפטים, אפשר בתשלומים?",
             "the police class was fun, i'll pay thursday",
             "the young lawyers workshop was great, can I pay in 3 payments?"]

STILL_LEGAL = ["החוג של המשטרה הקהילתית היה מעולה, אבל אני אפנה למשטרה",
               "אני אתבע אתכם, החוג של עורכי הדין גרוע",
               "העברתי את זה לעורך דין שלי",
               "אגיש תלונה במשטרה"]


@pytest.mark.parametrize("text", NOT_LEGAL)
def test_class_name_not_legal(text):
    assert _d(text).intent is not Intent.LEGAL


@pytest.mark.parametrize("text", STILL_LEGAL)
def test_real_legal_stays(text):
    assert _d(text).intent is Intent.LEGAL


def test_promise_kept_after_scary_class_name():
    d = _d("החוג של המשטרה הקהילתית היה מעולה! אני אשלם ביום שלישי")
    assert d.intent is Intent.PROMISE and d.promise_date.isoformat() == "2026-11-10"


def test_debts_topic_is_not_cant_pay():
    d = _d("שיעור על חובות ונכסים היה מעניין. אשלם ביום רביעי")
    assert d.intent is Intent.PROMISE and d.promise_date.isoformat() == "2026-11-11"


@pytest.mark.parametrize("text", ["יש לי חובות, אין לי ממה לשלם", "אני בחובות עד הצוואר", "אין לי ממה לשלם עכשיו"])
def test_real_cant_pay_stays(text):
    assert _d(text).intent is Intent.CANT_PAY


@pytest.mark.parametrize("text", ["I paid a hundred percent attention in class lol", "I paid attention in class",
                                  "she paid close attention", "please pay attention to the schedule"])
def test_paid_attention_is_not_paid_claim(text):
    d = _d(text)
    assert d.intent is not Intent.PAID_CLAIM and d.paid_agorot is None


@pytest.mark.parametrize(("text", "paid"), [("I paid attention to your email and I paid 500 yesterday", 50000),
                                             ("I paid already, pay attention to your records", None)])
def test_real_paid_claim_with_attention_stays(text, paid):
    d = _d(text)
    assert d.intent is Intent.PAID_CLAIM and d.paid_agorot == paid


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr274.jsonl"


@pytest.mark.parametrize("seq", [json.loads(x) for x in SEQ.read_text(encoding="utf-8").splitlines() if x.strip()],
                         ids=lambda s: s["id"])
def test_regress_sequences(seq):
    assert run_seq(seq) == []

"""מנהל הפעלה 275 · «הבא» AI מ-274: הפספוסים הבטוחים שנותרו בסט המוחזק #16 (QA עיוור) — תיקון לפי מחלקה:

  · cant_pay באנגלית: «I have no way to pay right now» / «I have nothing to pay with» ⇒ היה «לא ברור»
    (כרטיס לבעלים, בלי תשובה אמפתית ובלי הצעת פריסה). «no way to pay online/by card» = שאלת אמצעי, לא קושי;
    «nothing to pay» בלי with = כבר שולם/מחלוקת ⇒ לא cant_pay.
  · «I sent you a deposit of four hundred» כהודעה ראשונה ⇒ היה «לא ברור» והתזכורות המשיכו למי ששילם מקדמה.
    עכשיו paid_claim (+ «I made a deposit/down payment»). «I will send a deposit» (עתיד) ו-«deposit request» ⇒ לא.
  · «שילמתי היום 1200 בביט» — תואר-זמן בין הפועל לסכום ⇒ הסכום לא חולץ. עכשיו: היום/אתמול/הבוקר/שלשום/עכשיו,
    today/yesterday/this morning/earlier — גם בצורת המילים («שילמתי אתמול שש מאות» = «…600»).
  · 🔴 באג שנחשף בדרך (q16-09 תור 2): אחרי הצעת פריסה, «אפשר ב-3 תשלומים?» = בדיוק מה שהוצע ⇒ התשובה «זה בדיוק מה
    שהצענו… מתאים?», אבל ההצעה סומנה rejected ⇒ «מאשרת» ⇒ plan_pending_owner, ובעל העסק קיבל «אין הסדר מוצע».
    עכשיו בקשה זהה (plan_same) לא דוחה את ההצעה (`app/inbox.py`). rm275-10/11.
diff על 1,566 טקסטי eval: השתנו רק ארבעת טקסטי qa16 האלה.
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


@pytest.mark.parametrize("text", ["I have no way to pay right now, sorry.", "I have nothing to pay with right now",
                                  "honestly I have no means to pay this month",
                                  "We don't have the money to pay right now",
                                  "I've got nothing left to pay you with", "I don't have enough money to pay"])
def test_english_cant_pay(text):
    assert _d(text).intent is Intent.CANT_PAY


@pytest.mark.parametrize("text", ["Is there no way to pay online?", "no way to pay by card on your site?",
                                  "I have nothing to pay, I already paid"])
def test_english_cant_pay_traps(text):
    assert _d(text).intent is not Intent.CANT_PAY


@pytest.mark.parametrize(("text", "paid"), [("I sent you a deposit of four hundred", 40000),
                                             ("I made a deposit of five hundred", 50000),
                                             ("We already sent you a down payment of 300 last week", 30000),
                                             ("I made the down payment, 300", 30000)])
def test_deposit_first_message_is_paid_claim(text, paid):
    d = _d(text)
    assert d.intent is Intent.PAID_CLAIM and d.paid_agorot == paid


@pytest.mark.parametrize("text", ["I will send a deposit tomorrow", "I sent you a deposit request",
                                  "I made a mistake of 500", "I made five hundred this month"])
def test_deposit_traps(text):
    assert _d(text).intent is not Intent.PAID_CLAIM


@pytest.mark.parametrize(("text", "paid"), [("שילמתי היום 1200 בביט", 120000), ("העברתי אתמול 800 בהעברה", 80000),
                                             ("שילמתי הבוקר 500", 50000), ("שילמתי אתמול שש מאות", 60000),
                                             ("I paid yesterday 700 by bit", 70000),
                                             ("I paid today six hundred", 60000)])
def test_time_adverb_between_verb_and_amount(text, paid):
    d = _d(text)
    assert d.intent is Intent.PAID_CLAIM and d.paid_agorot == paid


@pytest.mark.parametrize("text", ["שילמתי אתמול 3 תשלומים", "שילמתי היום 10/11"])
def test_time_adverb_not_an_amount(text):
    assert _d(text).paid_agorot is None


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr275.jsonl"


@pytest.mark.parametrize("seq", [json.loads(x) for x in SEQ.read_text(encoding="utf-8").splitlines() if x.strip()],
                         ids=lambda s: s["id"])
def test_regress_sequences(seq):
    assert run_seq(seq) == []

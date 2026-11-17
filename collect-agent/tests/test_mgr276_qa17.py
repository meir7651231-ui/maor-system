"""מנהל הפעלה 276 · QA סט #17 (עיוור, נעול e42854be): מיילים ארוכים, זרימות פריסה מלאות עם בעלים.

  · מדידה: רצפי המייל ב-`evals.sequences` קראו `svc.inbound` ישירות, לא את מסלול הפרודקשן (`email_webhook` ⇒
    strip_reply). «להסרה השיבו הסר» שבציטוט התזכורת נמדד כ-opt_out (פרודקשן מסיר את הציטוט). עכשיו מייל עובר את
    ה-webhook. רק qa17 השתנה; כל שאר הסטים זהים.
  · paid בהסדר: «שילמתי את התשלום הראשון, 400 ₪», «paid the first 200 today» ⇒ הסכום לא חולץ (paid=None).
    «התשלום הראשון מתוך 3», «the first 2 payments», «400 נשאר» ⇒ לא סכום.
  · אנגלית: «can I split it into 3?», «instalmnts» (שגיאת הקלדה), «Accepted, thank you.», «Ok I'm in».
  · 🔴 «So 400 a month for 3 months, right? Ok I'm in» ⇒ plan_accept + plan_request משני ⇒ ההצעה סומנה rejected לפני
    שהאישור נקשר ⇒ בעל העסק: «אין הסדר מוצע» (אותו דפוס כמו 275). אישור לא דוחה את ההצעה (`app/inbox.py`).
  · מחלוקת: «I froze my membership… classes I didn't take», «הקפאתי את המנוי» ⇒ היה «לא ברור».
diff על 1,649 טקסטי eval (detect/paid/installments): השתנו רק 6 טקסטי qa17.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.conversation import Intent, extract_installments, extract_paid_amount, normalize, respond
from evals.harness import build_ctx
from evals.sequences import run_seq


def _d(text, state="idle"):
    return respond(text, build_ctx({"state": state, "channel": "sms", "total": 120000}))


@pytest.mark.parametrize("text,paid", [("שילמתי את התשלום הראשון, 400 ₪", 40000),
                                       ("שילמתי היום את התשלום השני, 400 ש״ח", 40000),
                                       ("Hi, paid the first 200 today via bank transfer.", 20000),
                                       ("I paid the second installment of 400", 40000),
                                       ("paid my monthly payment, 200 nis", 20000)])
def test_installment_paid_amount(text, paid):
    assert extract_paid_amount(normalize(text)) == paid


@pytest.mark.parametrize("text", ["שילמתי את התשלום הראשון מתוך 3", "I paid the first 2 payments",
                                  "שילמתי את התשלום הראשון, 400 נשאר", "שילמתי את התשלום של החודש",
                                  "paid the next 300 next week", "paid the first 200 days ago? no"])
def test_installment_paid_traps(text):
    assert extract_paid_amount(normalize(text)) is None


@pytest.mark.parametrize("text,n", [("can I split it into 3?", 3), ("can we split into three?", 3),
                                    ("can i pay in 3 instalmnts pls", 3)])
def test_english_split_and_typo(text, n):
    t = normalize(text)
    assert extract_installments(t) == n
    assert _d(text).intent is Intent.PLAN_REQUEST


@pytest.mark.parametrize("text", ["split the bill into 2 ways with my sister", "we split it 50/50"])
def test_split_traps(text):
    assert extract_installments(normalize(text)) is None


@pytest.mark.parametrize("text", ["I froze my membership for October",
                                  "I'm not paying 1,200 for classes I didn't take.",
                                  "הקפאתי את המנוי לאוקטובר", "אני לא משלמת על שיעורים שלא הייתי בהם"])
def test_frozen_membership_dispute(text):
    assert _d(text).intent is Intent.DISPUTE


@pytest.mark.parametrize("text", ["I want to freeze my membership next month, will pay Thursday",
                                  "אפשר להקפיא את המנוי? אשלם ביום חמישי"])
def test_freeze_request_not_dispute(text):
    assert _d(text).intent is not Intent.DISPUTE


def test_email_sequences_go_through_webhook():
    """ציטוט התזכורת («להסרה השיבו הסר») לא מגיע למנוע — כמו בפרודקשן."""
    src = (Path(__file__).resolve().parents[1] / "evals" / "sequences.py").read_text(encoding="utf-8")
    assert "svc.email_webhook(" in src


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr276.jsonl"


@pytest.mark.parametrize("seq", [json.loads(x) for x in SEQ.read_text(encoding="utf-8").splitlines() if x.strip()],
                         ids=lambda s: s["id"])
def test_regress_sequences(seq):
    assert run_seq(seq) == []

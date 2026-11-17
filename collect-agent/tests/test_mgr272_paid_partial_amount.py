"""מנהל הפעלה 272 · «הבא» AI מ-271: סכום ששולם אחרי מילת חלקיות.

היה:
  · «I paid half, 600 nis» / «שילמתי חצי, 600» / «העברתי מקדמה של 500» / «I paid a deposit of 500»
    ⇒ «שילם/ה חלק מתוך 1,200 ₪» בלי הסכום (הסכום נקרא רק צמוד לפועל).
  · 🔴 «paid 2 of the 4 payments» ⇒ «שילם/ה חלק (2 ₪)» — מספר התשלומים נקרא כסכום.
  · 🔴 «העברתי את החצי» / «שילמתי את המקדמה» (ה׳ הידיעה) ⇒ «שילם/ה 1,200 ₪» — מלוא החוב, בלי «חלקי».
  · «שילמתי 2 תשלומים מתוך 4» ⇒ מלוא החוב, בלי «חלקי».
עכשיו: `_PAID_PARTIAL_AMOUNT_RX` (פועל ⇒ מילת חלקיות ⇒ סכום). יתרה («600 נשאר», «600 left», «600 next week»),
דולר, יום בחודש ועד 2 ספרות בלי מטבע ⇒ לא מחולץ. «X of Y payments» ⇒ חלקי בלי סכום.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.conversation import Intent, extract_paid_amount, normalize, respond
from evals.harness import build_ctx
from evals.sequences import run_seq


def _d(text, total=120000, state="idle"):
    return respond(text, build_ctx({"state": state, "channel": "sms", "total": total}))


EXTRACT = [("I paid half, 600 nis", 60000), ("I paid half - 600", 60000), ("שילמתי חצי, 600", 60000),
           ('שילמתי חצי 600 ש"ח', 60000), ("שילמתי חלק, 400 שקל", 40000), ("העברתי מקדמה של 500", 50000),
           ("שילמתי מקדמה 300", 30000), ("I paid a deposit of 500", 50000), ("I paid part of it, 700 nis", 70000),
           ("שילמתי חלק מהתשלום 300", 30000), ("העברתי את החצי 600 ₪", 60000), ("שילמתי את המקדמה של 300", 30000),
           ("I paid about half, around 600", 60000), ("שילמתי חצי, 600 שח, ב-12/11", 60000),
           ("paid 600 of the 1200", 60000), ("שילמתי 600 מתוך 1200", 60000)]

NOT_EXTRACTED = ["שילמתי חצי", "I paid half", "paid 2 of the 4 payments", "I paid 2 out of 4 payments",
                 "שילמתי 2 תשלומים מתוך 4", "שילמתי חצי, את השאר אשלם ב-15", "שילמתי חצי. 600 נשאר",
                 "I paid half, 600 left", "שילמתי חצי, נשאר 600", "שילמתי חצי לפני 3 ימים", "I paid half on the 3rd",
                 "שילמתי חצי, 600 דולר", "I paid half, $600", "שילמתי חצי, 600 אשלם מחר", "I paid half, 600 next week",
                 "I paid half in 2025", "שילמתי חצי, 15 בחודש", "I paid half, the rest on the 15th"]


@pytest.mark.parametrize(("text", "agorot"), EXTRACT)
def test_extract(text, agorot):
    assert extract_paid_amount(normalize(text)) == agorot


@pytest.mark.parametrize("text", NOT_EXTRACTED)
def test_not_extracted(text):
    assert extract_paid_amount(normalize(text)) is None


@pytest.mark.parametrize("state", ["idle", "awaiting_plan_reply", "plan_pending_owner"])
@pytest.mark.parametrize(("text", "agorot"), [("I paid half, 600 nis", 60000), ("שילמתי חצי, 600", 60000),
                                              ("העברתי מקדמה של 500", 50000)])
def test_summary_shows_amount(text, agorot, state):
    d = _d(text, state=state)
    assert d.intent == Intent.PAID_CLAIM and d.paid_agorot == agorot and "partial" in d.tags
    assert f"חלק ({agorot // 100:,} ₪)" in d.owner_summary


@pytest.mark.parametrize("text", ["העברתי את החצי", "שילמתי את המקדמה", "שילמתי את מחצית הסכום",
                                  "paid 2 of the 4 payments", "שילמתי 2 תשלומים מתוך 4"])
def test_marked_partial_not_full(text):
    """🔴 היה: «טוען/ת ששילם/ה 1,200 ₪» (מלוא החוב) או «חלק (2 ₪)»."""
    d = _d(text)
    assert d.intent == Intent.PAID_CLAIM and "partial" in d.tags
    assert "ששילם/ה 1,200" not in d.owner_summary and "(2 ₪)" not in d.owner_summary


@pytest.mark.parametrize("text", ["I paid half, 600 left", "שילמתי חצי, נשאר 600", "I paid half, 600 next week"])
def test_remaining_not_reported_as_paid(text):
    d = _d(text)
    assert d.intent == Intent.PAID_CLAIM and "partial" in d.tags and d.paid_agorot is None
    assert "600" not in d.owner_summary.split("ההודעה")[0]


def test_full_amount_still_full():
    d = _d("שילמתי 1200")
    assert d.intent == Intent.PAID_CLAIM and "partial" not in d.tags


SEQ = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr272.jsonl"


@pytest.mark.parametrize("seq", [json.loads(x) for x in SEQ.read_text(encoding="utf-8").splitlines() if x.strip()],
                         ids=lambda s: s["id"])
def test_regression_sequences(seq):
    assert run_seq(seq) == [], seq["id"]

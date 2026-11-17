"""מנהל הפעלה 271 · «הבא» AI מ-270: סכום ששולם באנגלית.

היה:
  · 🔴 «I paid 1000» / «I paid 1500 nis» (חוב 5,000) ⇒ «טוען/ת ששילם/ה 5,000 ₪» — מלוא החוב, בלי «חלקי».
    בעל העסק עלול לסגור חשבונית שנשארה בה יתרה של 4,000 ₪.
  · 🔴 «I transferred 2000 yesterday» / «I sent 500 via bit» ⇒ «לא ברור» ⇒ התזכורות ממשיכות למי שטוען ששילם.
  · «I paid half» ⇒ לא סומן חלקי (מילות החלקיות היו בעברית בלבד).
עכשיו: `_PAID_AMOUNT_EN_RX` (paid/transferred/wired/deposited/sent + סכום, מטבע שקלי אופציונלי) ⇒ חלקי עם הסכום.
לא מחולץ: «paid 2 payments», «3 days ago», «200 a month», «in 2025», «12/11», «10:30», דולר מפורש (לא ממירים מטבע).
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.conversation import Intent, extract_paid_amount, normalize, respond
from evals.harness import build_ctx
from evals.sequences import run_seq


def _d(text, total=500000):
    return respond(text, build_ctx({"state": "idle", "channel": "sms", "total": total}))


EXTRACT = [("I paid 1000", 100000), ("I paid 1500 nis", 150000), ("I already paid 1000 nis", 100000),
           ("I transferred 2000 yesterday", 200000), ("I sent 500 via bit", 50000), ("paid 300 already", 30000),
           ("I paid 1,200 shekels", 120000), ("I've paid ₪800", 80000), ("I paid via bit 700", 70000),
           ("I paid 1000 on the 3rd", 100000), ("we wired 2,500 ils", 250000), ("I paid 99.50", 9950),
           ("I paid 1000 last week, the rest next month", 100000)]

NOT_EXTRACTED = ["I paid 2 payments", "I paid 3 days ago", "I paid in 2025", "i paid 400$", "I paid 400 dollars",
                 "I paid 200 a month", "I paid 12/11", "I paid at 10:30", "I paid it", "I already paid",
                 "I paid two hundred", "I sent 3 emails"]


@pytest.mark.parametrize(("text", "agorot"), EXTRACT)
def test_extract(text, agorot):
    assert extract_paid_amount(normalize(text)) == agorot


@pytest.mark.parametrize("text", NOT_EXTRACTED)
def test_not_extracted(text):
    assert extract_paid_amount(normalize(text)) is None


@pytest.mark.parametrize(("text", "agorot"), [("I paid 1000", 100000), ("I paid 1500 nis", 150000),
                                              ("I transferred 2000 yesterday", 200000)])
def test_partial_summary_shows_amount(text, agorot):
    """🔴 היה: «טוען/ת ששילם/ה 5,000 ₪» (מלוא החוב)."""
    d = _d(text)
    assert d.intent == Intent.PAID_CLAIM and d.paid_agorot == agorot
    assert "partial" in d.tags and f"({agorot // 100:,} ₪)" in d.owner_summary
    assert "ששילם/ה 5,000" not in d.owner_summary


def test_full_amount_not_partial():
    d = _d("I paid 5000")
    assert d.intent == Intent.PAID_CLAIM and "partial" not in d.tags


@pytest.mark.parametrize("text", ["I transferred 2000 yesterday", "I sent 500 via bit", "we deposited 1,000 nis",
                                  "I sent you 800 this morning", "I just paid with bit"])
def test_transfer_with_amount_is_paid_claim(text):
    """🔴 היה: «לא ברור» ⇒ התזכורות ממשיכות."""
    assert _d(text).intent == Intent.PAID_CLAIM


@pytest.mark.parametrize("text", ["I sent 3 emails", "I sent 10 messages about this", "I haven't transferred 2000 yet",
                                  "should I transfer 2000?", "did I send 500?"])
def test_not_paid_claim(text):
    assert _d(text).intent != Intent.PAID_CLAIM


@pytest.mark.parametrize("text", ["I paid half", "I paid part of it", "paid a deposit", "I paid some of it"])
def test_english_partial_words(text):
    d = _d(text)
    assert d.intent == Intent.PAID_CLAIM and "partial" in d.tags


@pytest.mark.parametrize("text", ["stop texting me, I paid 1000", "my lawyer says I paid 1000"])
def test_protective_intents_still_win(text):
    assert _d(text).intent in (Intent.OPT_OUT, Intent.LEGAL)


def test_hebrew_unchanged():
    assert extract_paid_amount(normalize("שילמתי 1000 ש\"ח")) == 100000
    assert extract_paid_amount(normalize("שילמתי 2 תשלומים")) is None


def test_regression_sequences_pass():
    p = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr271.jsonl"
    for line in p.read_text(encoding="utf-8").splitlines():
        seq = json.loads(line)
        assert run_seq(seq) == [], seq["id"]

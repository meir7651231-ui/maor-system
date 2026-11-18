"""מנהל הפעלה 273 · «הבא» AI מ-272: סכום ששולם במילים.

היה:
  · 🔴 «שילמתי שש מאות» / «I paid six hundred» / «I paid a thousand» (חוב 1,200) ⇒ «טוען/ת ששילם/ה 1,200 ₪»,
    כלומר מלוא החוב ובלי «חלקי». בעל העסק עלול לסגור חשבונית שנשארה בה יתרה.
  · 🔴 «I sent you five hundred via bit» / «I transferred two thousand yesterday» ⇒ «לא ברור», בלי השהיה ⇒
    התזכורות ממשיכות למי שטוען ששילם.
  · «שילמתי חצי, שש מאות» / «I paid a deposit of five hundred» ⇒ חלקי בלי הסכום.
עכשיו: `normalize` ממיר רצף מילות-מספר לספרות **רק** צמוד לפועל-תשלום (ואחרי מילות מילוי / ביט / חצי-מקדמה),
ורק ≥100 או עם מטבע ⇒ ההחלטה זהה לצורה בספרות. תשלומים/פעמים/אחוז/ימים/הודעות אחרי המספר ⇒ לא מומר.
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


EXTRACT = [("שילמתי שש מאות", 60000), ("I paid six hundred", 60000), ("I paid a thousand", 100000),
           ("I paid one thousand", 100000), ("שילמתי אלף", 100000), ("העברתי לך אלף וחמש מאות שקל", 150000),
           ("העברתי אלף ומאתיים", 120000), ("הפקדתי אלפיים", 200000), ("שילמתי שלושת אלפים", 300000),
           ("שילמתי מאתיים וחמישים", 25000), ("I paid two hundred and fifty", 25000), ("I paid twelve hundred", 120000),
           ("I paid two hundred fifty nis", 25000), ("I paid seven hundred shekels", 70000),
           ("I sent you five hundred via bit", 50000), ("I paid via bit five hundred", 50000),
           ("I transferred two thousand yesterday", 200000), ("שילמתי חמש מאות בביט אתמול", 50000),
           ("שילמתי כבר שש מאות", 60000), ("העברתי בביט שלוש מאות", 30000),
           ("I paid half, six hundred nis", 60000), ("שילמתי חצי, שש מאות", 60000),
           ("I paid a deposit of five hundred", 50000), ("העברתי מקדמה של חמש מאות", 50000),
           ("שילמתי עשרים שקל", 2000), ("שילמתי חמש מאות, השאר אשלם מחר", 50000)]

NOT_EXTRACTED = ["I paid two payments", "שילמתי שני תשלומים", "שילמתי מאה אחוז", "I paid a hundred percent",
                 "I sent a hundred emails", "שלחתי מאה הודעות", "I paid two hundred dollars", "I paid one fifty",
                 "I paid twenty", "שילמתי עשרים", "שילמתי אלף פעמים", "I paid a thousand times over",
                 "I paid two of them", "paid it", "I paid all of it", "שילמתי את הכל", "paid a lot",
                 "שילמתי חצי", "I paid half", "I paid three days ago", "שילמתי לפני שלושה ימים",
                 "I paid half, six hundred left"]


@pytest.mark.parametrize(("text", "agorot"), EXTRACT)
def test_extract(text, agorot):
    assert extract_paid_amount(normalize(text)) == agorot


@pytest.mark.parametrize("text", NOT_EXTRACTED)
def test_not_extracted(text):
    assert extract_paid_amount(normalize(text)) is None


DIGITS = [("שילמתי שש מאות", "שילמתי 600"), ("I paid six hundred", "I paid 600"),
          ("I sent you five hundred via bit", "I sent you 500 via bit"),
          ("העברתי אלף ומאתיים", "העברתי 1200"), ("I paid half, six hundred nis", "I paid half, 600 nis"),
          ("I transferred two thousand yesterday", "I transferred 2000 yesterday")]


@pytest.mark.parametrize("state", ["idle", "awaiting_plan_reply", "plan_pending_owner", "awaiting_owner"])
@pytest.mark.parametrize(("words", "digits"), DIGITS)
def test_same_decision_as_digits(words, digits, state):
    a, b = _d(words, state=state), _d(digits, state=state)
    assert (a.intent, a.paid_agorot, sorted(a.tags), a.next_state, a.stop) == \
           (b.intent, b.paid_agorot, sorted(b.tags), b.next_state, b.stop)


@pytest.mark.parametrize("state", ["idle", "awaiting_plan_reply", "plan_pending_owner"])
@pytest.mark.parametrize(("text", "agorot"), [("שילמתי שש מאות", 60000), ("I paid six hundred", 60000),
                                              ("I sent you five hundred via bit", 50000)])
def test_summary_shows_partial_amount(text, agorot, state):
    d = _d(text, state=state)
    assert d.intent == Intent.PAID_CLAIM and d.paid_agorot == agorot and "partial" in d.tags
    assert f"חלק ({agorot // 100:,} ₪)" in d.owner_summary


@pytest.mark.parametrize("text", ["עוד לא שילמתי אלף", "I haven't paid a thousand yet", "אשלם שש מאות מחר"])
def test_not_a_paid_claim_unchanged(text):
    assert _d(text).intent != Intent.PAID_CLAIM


def test_regress_seq_file():
    p = Path(__file__).resolve().parents[1] / "evals" / "seq" / "regress-mgr273.jsonl"
    seqs = [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip()]
    assert len(seqs) >= 8
    for s in seqs:
        fails = run_seq(s)
        assert not fails, (s["id"], fails)

"""critic סבב 131 · באג: סכום ששולם בכתיבה ישראלית נפוצה נקרא שגוי (חוב 1,200 ₪):
  · «שילמתי 1.200» (נקודה כמפריד אלפים) ⇒ 1.20 ₪ ⇒ «שילם/ה חלק (1.20 ₪) מתוך 1,200 ₪», ובטיוטה ללקוח:
    «רשמנו שהעברתם חלק מהסכום (1.20 ₪)» — לקוח ששילם הכול מקבל (אחרי אישור) הודעה שהוא שילם 1.20 ₪.
  · «שילמתי 1 200» (רווח כמפריד) ⇒ 1 ₪ · «שילמתי 1K» ⇒ 1 ₪ · «paid 1.200» ⇒ 1.20.
התיקון: מפריד אלפים נקודה/רווח (בדיוק 3 ספרות בכל קבוצה; רווח רק לפני מטבע/סוף משפט), K/k = אלפים.
מלכודות: «שילמתי 1.20» / «שילמתי 12.50 ₪» נשארים עשרוניים; «שילמתי 2 תשלומים» — לא סכום."""
import pytest

from app.conversation import extract_paid_amount, normalize, respond
from evals.harness import build_ctx


def _pa(t):
    return extract_paid_amount(normalize(t))


@pytest.mark.parametrize("t,agorot", [
    ("שילמתי 1.200", 120000), ("שילמתי 1.200 ש\"ח", 120000), ("שילמתי 12.500", 1250000),
    ("שילמתי 1 200", 120000), ("שילמתי 1 200 ₪", 120000),
    ("שילמתי 1K", 100000), ("שילמתי 1.5K", 150000), ("העברתי 2k", 200000),
    ("paid 1.200", 120000), ("I paid 1 200 nis", 120000), ("I paid 1k", 100000),
])
def test_thousands_formats(t, agorot):
    assert _pa(t) == agorot, (t, _pa(t))


@pytest.mark.parametrize("t,agorot", [
    ("שילמתי 1.20", 120), ("שילמתי 12.50 ₪", 1250), ("שילמתי 1,200.50", 120050), ("שילמתי 500", 50000),
    ("paid 1,200", 120000),
])
def test_existing_formats_unchanged(t, agorot):
    assert _pa(t) == agorot, (t, _pa(t))


@pytest.mark.parametrize("t", ["שילמתי 2 תשלומים", "שילמתי 3 500 נשאר"])
def test_traps_no_bogus_amount(t):
    v = _pa(t)
    assert v not in (350000, 200000 * 0 + 2), (t, v)


def test_full_payment_with_dot_thousands_is_not_partial():
    d = respond("שילמתי 1.200", build_ctx({"channel": "sms"}))
    assert "partial" not in d.tags and "1.20 ₪" not in (d.reply or "") + (d.owner_summary or ""), (d.tags, d.reply)

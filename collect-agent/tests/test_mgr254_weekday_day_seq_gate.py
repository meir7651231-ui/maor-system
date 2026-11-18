"""מנהל 254 — סט רצפי רגרסיה (evals/seq/) כשער CI, ושני באגים שהוא חשף.

🔴 «אשלם בשבוע הבא» ⇒ «בעצם ביום שלישי ה-17» נרשם כ-**10.11** (שלישי הקרוב), לא 17.11: כלל היום-בשבוע רץ לפני
היום-בחודש ⇒ טעות בטוחה-בעצמה, התזכורת יוצאת שבוע לפני מה שהלקוח ביקש. אותו דבר באנגלית («Tuesday the 17th»).
יום בשבוע שלא מתאים ליום בחודש («שלישי ה-18», 18.11 = רביעי) ⇒ מעורפל, לא מנחשים.
«I haven't transferred it yet, will do Thursday» ⇒ «לא ברור» (אין פועל תשלום) ⇒ עכשיו הבטחה ל-12.11, לא טענת תשלום.
"""
from datetime import date

import pytest

from app.conversation import Intent, detect, extract_date, normalize

TODAY = date(2026, 11, 8)  # יום ראשון


@pytest.mark.parametrize("text,want", [
    ("בעצם ביום שלישי ה-17", date(2026, 11, 17)),
    ("ביום שלישי ה-17", date(2026, 11, 17)),
    ("שלישי 17", date(2026, 11, 17)),
    ("שלישי, ה-17", date(2026, 11, 17)),
    ("Tuesday the 17th", date(2026, 11, 17)),
    ("by Tuesday 17th", date(2026, 11, 17)),
    ("on Tuesday, 17", date(2026, 11, 17)),
    ("ביום שלישי ה-1", date(2026, 12, 1)),        # היום בחודש עבר ⇒ החודש הבא, ושם הוא שלישי
    ("ביום שלישי ה-15 בדצמבר", date(2026, 12, 15)),  # שם חודש — הכלל הקיים
])
def test_weekday_with_day_of_month(text, want):
    assert extract_date(normalize(text), TODAY) == (want, False)


@pytest.mark.parametrize("text", ["ביום שלישי ה-18", "Tuesday the 18th", "ביום שלישי ה-31", "ביום שלישי ה-40"])
def test_weekday_day_mismatch_is_vague_not_guess(text):
    assert extract_date(normalize(text), TODAY) == (None, True)


@pytest.mark.parametrize("text,want", [
    ("ביום שלישי", date(2026, 11, 10)),
    ("Tuesday", date(2026, 11, 10)),
    ("ביום שני 3 תשלומים", date(2026, 11, 9)),      # «3 תשלומים» ≠ יום בחודש
    ("on Thursday 2 payments", date(2026, 11, 12)),
])
def test_weekday_alone_unchanged(text, want):
    assert extract_date(normalize(text), TODAY) == (want, False)


@pytest.mark.parametrize("text", ["I haven't transferred it yet, will do Thursday", "I'll do it tomorrow",
                                  "will do it on Friday"])
def test_will_do_with_date_is_promise(text):
    got = detect(text)
    assert Intent.PROMISE in got and Intent.PAID_CLAIM not in got


def test_regression_sequences_gate():
    """כל סטי evals/seq/ עוברים במלואם (אותו שער כמו בצעד ה-CI)."""
    from evals.sequences import main
    assert main([]) == 0


def test_harness_does_not_load_sequence_sets():
    """evals.harness טוען evals/*.jsonl בפורמט מקרים — סטי הרצפים חייבים לשבת בתת-תיקייה."""
    from pathlib import Path
    ev = Path(__file__).resolve().parents[1] / "evals"
    assert not [p for p in ev.glob("*.jsonl") if '"turns"' in p.read_text(encoding="utf-8")]
    assert list((ev / "seq").glob("*.jsonl"))

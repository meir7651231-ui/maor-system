"""המסמכים המשפטיים אומרים את מה שהקוד עושה. שינוי כלל בקוד בלי עדכון המסמכים ⇒ הבדיקה נכשלת.

רקע: בביקורת העוינת נמצאו מחיר וכללים שונים במסמכים שונים (הטעיה לפי ס׳ 2 לחוק הגנת הצרכן).
המחרוזות כאן נגזרות מהקבועים בקוד, לא מועתקות.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from app import legal, policy
from app.config import load_settings

LEGAL = Path(__file__).resolve().parents[1] / "legal"
S = load_settings({})
DOCS = {n: (LEGAL / n).read_text("utf-8") for n in
        ("TERMS.md", "PRIVACY.md", "DPA.md", "LAWYER-BRIEF.md")}
PUBLIC = legal.privacy_html("עסק") + legal.draft_footer()   # מה שהחייב רואה ב-/u
RETENTION = getattr(policy, "RETENTION_DAYS", 90)


def _hhmm(t) -> str:
    return t.strftime("%H:%M")


def _days_by_name(n: int) -> str:
    return f"{n} יום"


CLAIMS = [
    # (מה, מחרוזת שנגזרת מהקוד, באילו מסמכים חייבת להופיע)
    ("מקסימום תזכורות", f"{policy.MAX_REMINDERS_PER_INVOICE} תזכורות", ("TERMS.md", "LAWYER-BRIEF.md")),
    ("חלון שליחה", f"{_hhmm(policy.DAY[0])}–{_hhmm(policy.DAY[1])}", ("TERMS.md", "LAWYER-BRIEF.md")),
    ("שישי", _hhmm(policy.SHORT[1]), ("TERMS.md", "LAWYER-BRIEF.md")),
    ("רווח בין הודעות", f"{int(policy.MIN_GAP.total_seconds() // 3600)} שעות", ("TERMS.md",)),
    ("טיפול ידני בחשבונית ישנה", f"{policy.MANUAL_ONLY_AFTER_DAYS // 365} שנים",
     ("TERMS.md", "LAWYER-BRIEF.md")),
    ("מחיקה אחרי סגירה", _days_by_name(RETENTION), ("PRIVACY.md", "DPA.md", "LAWYER-BRIEF.md")),
    ("ניסיון", f"{S.trial_days} יום", ("TERMS.md",)),
    ("מחיר חודשי", f"₪{S.price_ils_month}", ("TERMS.md", "LAWYER-BRIEF.md")),
    ("מחיר שנתי", f"₪{S.price_ils_year:,}", ("TERMS.md", "LAWYER-BRIEF.md")),
]


@pytest.mark.parametrize("what,text,docs", CLAIMS, ids=[c[0] for c in CLAIMS])
def test_doc_states_what_code_does(what, text, docs):
    for d in docs:
        assert text in DOCS[d], f"{d}: חסר «{text}» ({what}) — הקוד והמסמך לא מתאימים"


def test_public_privacy_page_matches_retention():
    assert _days_by_name(RETENTION) in PUBLIC


@pytest.mark.parametrize("stale", ["4 תזכורות", "09:00–19:00", "+ מע״מ", "+ מע\"מ", "לפני מע",
                                   "₪79", "₪49", "₪249", "₪349", "חריגה מהמכסה"])
def test_no_stale_rules_or_prices(stale):
    for name, text in {**DOCS, "public /u": PUBLIC}.items():
        assert stale not in text, f"{name}: נשאר «{stale}» (כלל או מחיר ישן)"

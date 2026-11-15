"""כל מספר בחומרי השיווק = הערך שהקוד אוכף. שינוי בקוד (או טעות בטקסט) ⇒ הבדיקה נופלת.

מכסה: עד כמה תזכורות · חלון השעות · שישי · מרווח בין הודעות · ימי ניסיון · מחיר חודשי/שנתי ·
כמה ימים לפני סוף הניסיון מגיעה ההתראה. הטענות נמצאות בכל הנכסים ב-marketing/ ובדף המסרים.
"""
import re
from pathlib import Path

import pytest

from app import policy
from app.config import Settings
from app.service import STEP_OFFSETS_DAYS, TRIAL_WARN_DAYS

ROOT = Path(__file__).resolve().parents[1]
FILES = sorted({*ROOT.glob("marketing/**/*.md"), *ROOT.glob("marketing/**/*.html"),
                ROOT / "team/messaging.md", ROOT / "web/src/pages/Landing.tsx"}
               - {*ROOT.glob("marketing/video/compose/**/*")})
F = Settings.__dataclass_fields__
CODE = {
    "max": policy.MAX_REMINDERS_PER_INVOICE,
    "start": f"{policy.DAY[0]:%H:%M}", "end": f"{policy.DAY[1]:%H:%M}",
    "short_end": f"{policy.SHORT[1]:%H:%M}",
    "gap_h": int(policy.MIN_GAP.total_seconds() // 3600),
    "trial": F["trial_days"].default, "month": F["price_ils_month"].default,
    "year": F["price_ils_year"].default, "warn": TRIAL_WARN_DAYS, "ladder": STEP_OFFSETS_DAYS,
}

# (תבנית בטקסט, איך לחלץ מספר/מחרוזת, מפתח בקוד)
CLAIMS = [
    (r"(?:עד|לכל היותר)\s+(\d+)\s+תזכורות", int, "max"),
    (r"בין\s+(\d\d:\d\d)\s+ל-\d\d:\d\d", str, "start"),
    (r"בין\s+\d\d:\d\d\s+ל-(\d\d:\d\d)", str, "end"),
    (r"(\d+)\s+שעות\s+בין", int, "gap_h"),
    (r"(\d+)\s+ימי ניסיון", int, "trial"),
    (r"₪(\d[\d,]*)\s*(?:לחודש|</span>\s*<span[^>]*>\s*לחודש)", lambda s: int(s.replace(",", "")), "month"),
    (r"₪(\d[\d,]*)\s*(?:</b>\s*)?לשנה", lambda s: int(s.replace(",", "")), "year"),
    (r"(\d+)\s+ימים לפני (?:ה)?סוף", int, "warn"),
]


@pytest.mark.parametrize("p", FILES, ids=lambda p: p.relative_to(ROOT).as_posix())
def test_numbers_in_marketing_match_code(p):
    text = p.read_text(encoding="utf-8")
    wrong = []
    for pat, conv, key in CLAIMS:
        for m in re.finditer(pat, text):
            v = conv(m.group(1))
            if v != CODE[key]:
                wrong.append(f"{key}: בטקסט {v!r}, בקוד {CODE[key]!r} · «{m.group(0)}»")
    assert not wrong, wrong


def test_claims_are_actually_present():
    """שלא נעבור "בירוק" כי הדפוסים לא תופסים כלום: כל טענה מופיעה לפחות פעם אחת בנכסים."""
    allt = "\n".join(p.read_text(encoding="utf-8") for p in FILES)
    for pat, _, key in CLAIMS:
        assert re.search(pat, allt), f"הטענה {key} לא נמצאה באף נכס — הדפוס לא תופס"
    assert CODE["ladder"] == (1, 7, 14) and CODE["short_end"] == "12:00"

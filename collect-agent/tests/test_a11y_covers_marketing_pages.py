"""כל דף HTML ציבורי בשיווק נבדק ב-web/e2e/a11y.mjs.

הבאג: SIGN-OFF כתב «נגישות AA לכל 12 הדפים» כשהסוויטה בודקת 15, ואין שום דבר שמונע מדף שיווק חדש
להיכנס לחבילה בלי בדיקת נגישות. נועל: כל קובץ marketing/**/*.html מופיע ב-a11y.mjs, חוץ מרשימת
פטורים מנומקת (מסמכי עבודה פנימיים שלא מתפרסמים), ו-SIGN-OFF לא נוקב במספר דפים שיתיישן.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
A11Y = (ROOT / "web/e2e/a11y.mjs").read_text(encoding="utf-8")
SIGNOFF = (ROOT / "marketing/SIGN-OFF.md").read_text(encoding="utf-8")
# פטור = מסמך עבודה פנימי לצוות (noindex, לא נכס לפרסום)
EXEMPT = {"marketing/video/storyboard.html": "סטוריבורד פנימי לצוות, לא מתפרסם"}


def _covered(rel: str) -> bool:
    sub = rel.removeprefix("marketing/")
    if sub in A11Y:
        return True
    m = re.fullmatch(r"landing/for/([a-z-]+)\.html", sub)
    return bool(m) and "landing/for/${s}.html" in A11Y and f"'{m.group(1)}'" in A11Y


def test_every_public_marketing_page_is_in_a11y_suite():
    pages = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "marketing").rglob("*.html"))
    assert len(pages) >= 10
    missing = [p for p in pages if p not in EXEMPT and not _covered(p)]
    assert not missing, f"דפי שיווק בלי בדיקת נגישות ב-a11y.mjs: {missing}"


def test_exemptions_are_internal_and_still_exist():
    for rel in EXEMPT:
        t = (ROOT / rel).read_text(encoding="utf-8")
        assert 'name="robots" content="noindex' in t, rel


def test_signoff_does_not_hardcode_page_count():
    assert not re.search(r"לכל \d+ הדפים", SIGNOFF), "מספר דפים קשיח ב-SIGN-OFF מתיישן; לנסח בלי מספר"

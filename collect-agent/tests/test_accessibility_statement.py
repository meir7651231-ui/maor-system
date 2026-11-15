"""הצהרת נגישות (תקנות שוויון זכויות לאנשים עם מוגבלות, תקנה 35) — כל התחתיות הפנו אליה והיא לא הייתה קיימת.

נועל: הדף קיים, עותק זהה מוגש מ-/app/ · כל דף שיווק מקשר אליו בנתיב שבאמת מגיע לקובץ · יש בו את רכיבי
החובה (רמת התאמה, תאריך בדיקה, מגבלות ידועות, דרכי פנייה לרכז) · טיוטה + noindex · בלי טענות שלא נבדקו.
הנגישות של הדף עצמו נבדקת ב-web/e2e/a11y.mjs.
"""
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "marketing/accessibility.html"
COPY = ROOT / "web/public/accessibility.html"
LINKERS = [ROOT / "marketing/landing/index.html", *sorted((ROOT / "marketing/landing/for").glob("*.html")),
           ROOT / "marketing/library/index.html"]


def test_statement_exists_and_app_copy_identical():
    assert SRC.is_file() and COPY.is_file()
    assert SRC.read_bytes() == COPY.read_bytes(), "העותק ב-web/public שונה מהמקור"


def test_statement_has_required_parts_and_no_unverified_claims():
    t = SRC.read_text(encoding="utf-8")
    for part in ("5568", "WCAG 2.1", "AA", "תאריך הבדיקה", "מגבלות ידועות", "רכז הנגישות", "טלפון", "מייל"):
        assert part in t, part
    assert "טיוטה – לבדיקת עו״ד" in t and 'name="robots" content="noindex' in t
    prose = re.sub(r"<style>.*?</style>", "", t, flags=re.S)   # CSS (width:100%) אינו טענה
    for bad in ("נגיש לחלוטין", "100%", "מלאה", "ניווט מלא"):
        assert bad not in prose, bad


@pytest.mark.parametrize("page", LINKERS, ids=lambda p: p.relative_to(ROOT).as_posix())
def test_marketing_page_links_to_existing_statement(page):
    hrefs = re.findall(r'href="([^"]*accessibility\.html)"', page.read_text(encoding="utf-8"))
    assert hrefs, "אין קישור להצהרת הנגישות"
    target = (page.parent / hrefs[0]).resolve()
    assert target == SRC.resolve() and target.is_file(), hrefs[0]


def test_app_landing_links_to_statement():
    t = (ROOT / "web/src/pages/Landing.tsx").read_text(encoding="utf-8")
    assert 'href="accessibility.html"' in t       # יחסי ל-/app/ ⇒ /app/accessibility.html (vite public)

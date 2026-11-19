"""אתר השיווק מחובר: אין דף יתום, אין קישור שבור, ודף השאלות הנפוצות נגיש מכל דף שמוכר.

הבאג: דף «שאלות נפוצות» (marketing/faq) קושר רק מדף הנחיתה הסטטי. מי שנחת בדף ענף (מספרות, מוסכים…)
או בספריית הנוסחים — שם יש מחיר וכפתור — לא הגיע לתשובות להתנגדויות. נועל: (1) כל קישור יחסי בכל דף
שיווק מוביל לקובץ קיים · (2) כל דף HTML ציבורי נגיש מדף הנחיתה (חיפוש ברוחב על הקישורים) · (3) כל דף
מכירה (מחיר + כפתור: דף הנחיתה, דפי הענף, ספריית הנוסחים) מקשר לשאלות הנפוצות.
"""
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
MK = ROOT / "marketing"
START = MK / "landing/index.html"
FAQ = (MK / "faq/index.html").resolve()
EXEMPT = {MK / "video/storyboard.html"}   # מסמך עבודה פנימי (noindex), כמו ב-test_a11y_covers_marketing_pages
HREF = re.compile(r'href="([^"#:?]+\.html)(?:#[^"]*)?"')
PAGES = sorted(p for p in MK.rglob("*.html") if p not in EXEMPT)


def _links(page: Path) -> set[Path]:
    return {(page.parent / h).resolve() for h in HREF.findall(page.read_text(encoding="utf-8"))}


@pytest.mark.parametrize("page", PAGES, ids=lambda p: p.relative_to(MK).as_posix())
def test_no_broken_relative_links(page):
    broken = [p for p in _links(page) if not p.is_file()]
    assert not broken, f"{page.relative_to(ROOT)}: קישורים שבורים {broken}"


def test_every_public_page_reachable_from_landing():
    seen, todo = {START.resolve()}, [START.resolve()]
    while todo:
        for nxt in _links(todo.pop()):
            if nxt.is_file() and nxt.suffix == ".html" and nxt not in seen:
                seen.add(nxt)
                todo.append(nxt)
    orphans = [p.relative_to(ROOT).as_posix() for p in PAGES if p.resolve() not in seen]
    assert not orphans, f"דפים שלא נגישים מדף הנחיתה: {orphans}"


SELLING = [START, *sorted((MK / "landing/for").glob("*.html")), MK / "library/index.html"]


def test_selling_list_is_every_page_with_a_price_and_a_cta():
    """דפי מכירה = מחיר + כפתור. מסמכים (תנאים, תמליל) מזכירים מחיר אבל אינם דף מכירה."""
    for page in SELLING:
        t = page.read_text(encoding="utf-8")
        assert re.search(r"₪\s?119", t) and 'class="btn primary"' in t, page


@pytest.mark.parametrize("page", SELLING, ids=lambda p: p.relative_to(MK).as_posix())
def test_selling_pages_link_to_faq(page):
    assert FAQ in _links(page), f"{page.relative_to(ROOT)} מציג מחיר בלי קישור לשאלות הנפוצות"

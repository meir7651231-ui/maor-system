"""התחתיות בדפי השיווק הזכירו «תנאי שימוש · מדיניות פרטיות» כטקסט בלי דף (גבי שיווק, 15.11).

נועל: כל דף שיווק מקשר לתנאים, לפרטיות ולהצהרת הנגישות, וכל קישור מגיע לקובץ שקיים · דפי התנאים/הפרטיות
נבנים מ-legal/*.md של המשפטי (לא נכתבים ידנית) ומעודכנים מולו · עותק זהה מוגש מ-/app/.
"""
import importlib.util
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
MK = ROOT / "marketing"
PAGES = [MK / "landing/index.html", *sorted((MK / "landing/for").glob("*.html")), MK / "library/index.html",
         MK / "accessibility.html", MK / "terms.html", MK / "privacy.html"]
spec = importlib.util.spec_from_file_location("legalpages", MK / "legal-pages/build.py")
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


def test_legal_pages_built_from_legal_sources_and_fresh():
    assert build.main(["--check"]) == 0
    for key, (src, _) in build.PAGES.items():
        t = (MK / f"{key}.html").read_text(encoding="utf-8")
        assert f"המקור: {src}" in t and "טיוטה – לבדיקת עו״ד" in t and 'content="noindex' in t
        assert (MK / f"{key}.html").read_bytes() == (ROOT / "web/public" / f"{key}.html").read_bytes()


@pytest.mark.parametrize("page", PAGES, ids=lambda p: p.relative_to(ROOT).as_posix())
def test_footer_links_resolve(page):
    t = page.read_text(encoding="utf-8")
    for target in ("terms.html", "privacy.html", "accessibility.html"):
        if page.name == target:
            continue
        hrefs = re.findall(rf'href="([^"]*{target})"', t)
        assert hrefs, f"אין קישור ל-{target}"
        assert (page.parent / hrefs[0]).resolve().is_file(), hrefs[0]


def test_app_landing_links_legal_pages():
    t = (ROOT / "web/src/pages/Landing.tsx").read_text(encoding="utf-8")
    for target in ("terms.html", "privacy.html", "accessibility.html"):
        assert f'href="{target}"' in t, target


def test_static_landing_links_every_vertical_page_and_library():
    """דפי הענף וספריית הנוסחים לא יתומים: הדף הסטטי מקשר לכל אחד, והקישור מגיע לקובץ קיים (15.11)."""
    page = MK / "landing/index.html"
    hrefs = set(re.findall(r'href="([^"#]+\.html)"', page.read_text(encoding="utf-8")))
    targets = {*(p.resolve() for p in (MK / "landing/for").glob("*.html")), (MK / "library/index.html").resolve()}
    linked = {(page.parent / h).resolve() for h in hrefs}
    assert targets <= linked, sorted(str(t.relative_to(ROOT)) for t in targets - linked)
    assert all(t.is_file() for t in linked if "marketing" in str(t))

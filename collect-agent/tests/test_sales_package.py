"""חבילת המכירות (sales/PACKAGE.md) שלמה ונשענת על הקוד:

1. כל טענה בטבלת הטענות מצביעה על בדיקה **שקיימת** (קובץ + פונקציה). בדיקה שנמחקה או ששמה השתנה ⇒
   הטבלה נכשלת, והטענה יוצאת מהתסריט עד שיש לה גיבוי. וגם: הבדיקה **רצה באמת**, בלי xfail/skip
   (על הפונקציה, ברמת המודול או בגוף הבדיקה). בדיקה כבויה לא מוכיחה את הטענה.
2. כל טיוטה ב-outreach-drafts.md (D1…Dn) רשומה בחבילה, ולהפך.
3. כל קובץ ב-sales/ מופיע בחבילה.
4. בחבילה ובטיוטות אין "נשלח" / "פורסם" כעובדה. הן טיוטות שממתינות לחתימה.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PKG = (ROOT / "sales/PACKAGE.md").read_text(encoding="utf-8")
DRAFTS = (ROOT / "sales/outreach-drafts.md").read_text(encoding="utf-8")
CLAIM_REF = re.compile(r"`(tests/[\w/]+\.py)::(test_\w+)`")


def test_every_claim_points_at_an_existing_test():
    refs = CLAIM_REF.findall(PKG)
    assert len(refs) >= 12, "טבלת הטענות התרוקנה"
    missing = []
    for path, name in refs:
        f = ROOT / path
        if not f.exists() or not re.search(rf"^def {name}\(", f.read_text(encoding="utf-8"), re.M):
            missing.append(f"{path}::{name}")
    assert not missing, f"טענות בלי בדיקה: {missing}"


def test_every_draft_listed_both_ways():
    in_drafts = set(re.findall(r"^### (D\d+) ·", DRAFTS, re.M))
    in_pkg = set(re.findall(r"^\| (D\d+) \|", PKG, re.M))
    assert in_drafts, "לא נמצאו טיוטות"
    assert in_drafts == in_pkg, (sorted(in_drafts - in_pkg), sorted(in_pkg - in_drafts))


def test_every_sales_file_in_package():
    files = {p.name for p in (ROOT / "sales").glob("*.md")} - {"PACKAGE.md", "README.md"}
    assert files, "sales/ ריק"
    assert all(f"`{f}`" in PKG for f in files), sorted(f for f in files if f"`{f}`" not in PKG)


def test_package_is_drafts_only_and_lists_owner_signatures():
    assert "שום דבר לא נשלח" in PKG and "טיוטה – לבדיקת עו״ד" in PKG
    sigs = re.findall(r"^\| (S\d+) \|", PKG, re.M)
    assert sigs and len(sigs) == len(set(sigs)), sigs
    # הכרעות סגורות לא מוצגות כפתוחות
    assert "20% לפני מע״מ" in PKG and "₪1,190" in PKG and "כולל מע״מ ככל שחל" in PKG


def _disabled(src: str, name: str) -> str | None:
    """למה הבדיקה `name` לא רצה באמת: xfail/skip/skipif על הפונקציה או ברמת המודול (pytestmark). None ⇒ רצה."""
    import ast
    tree = ast.parse(src)

    def marks(nodes) -> list[str]:
        out = []
        for n in nodes:
            for sub in ast.walk(n):
                if isinstance(sub, ast.Attribute) and sub.attr in ("xfail", "skip", "skipif"):
                    out.append(sub.attr)
        return out

    for node in tree.body:
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "pytestmark" for t in node.targets):
            if m := marks([node.value]):
                return f"pytestmark: {m[0]}"
        if isinstance(node, ast.FunctionDef) and node.name == name:
            if m := marks(node.decorator_list):
                return m[0]
            body = [s for s in ast.walk(node) if isinstance(s, ast.Call) and isinstance(s.func, ast.Attribute)
                    and s.func.attr in ("skip", "xfail") and isinstance(s.func.value, ast.Name)
                    and s.func.value.id == "pytest"]
            if body:
                return f"pytest.{body[0].func.attr}() בגוף הבדיקה"
    return None


def test_disabled_detector_catches_xfail_skip_and_module_marks():
    assert _disabled("import pytest\n@pytest.mark.xfail(strict=True)\ndef test_a(): pass\n", "test_a") == "xfail"
    skipif = "import pytest\n@pytest.mark.skipif(True, reason='x')\ndef test_a(): pass\n"
    assert _disabled(skipif, "test_a") == "skipif"
    module_skip = "import pytest\npytestmark = pytest.mark.skip\ndef test_a(): pass\n"
    assert _disabled(module_skip, "test_a") == "pytestmark: skip"
    assert _disabled("import pytest\ndef test_a():\n    pytest.skip('no')\n", "test_a").startswith("pytest.skip")
    assert _disabled("import pytest\n@pytest.mark.parametrize('x', [1])\ndef test_a(x): pass\n", "test_a") is None


def test_no_claim_rests_on_an_xfail_or_skipped_test():
    """בדיקה שסומנה xfail/skip לא מוכיחה כלום. טענה שנשענת עליה = טענה בלי גיבוי, ויוצאת מהחבילה."""
    bad = []
    for path, name in CLAIM_REF.findall(PKG):
        f = ROOT / path
        if f.exists() and (why := _disabled(f.read_text(encoding="utf-8"), name)):
            bad.append(f"{path}::{name} ({why})")
    assert not bad, f"טענות שנשענות על בדיקה כבויה: {bad}"

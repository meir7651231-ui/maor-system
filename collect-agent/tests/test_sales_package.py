"""חבילת המכירות (sales/PACKAGE.md) שלמה ונשענת על הקוד:

1. כל טענה בטבלת הטענות מצביעה על בדיקה **שקיימת** (קובץ + פונקציה). בדיקה שנמחקה או ששמה השתנה ⇒
   הטבלה נכשלת, והטענה יוצאת מהתסריט עד שיש לה גיבוי.
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

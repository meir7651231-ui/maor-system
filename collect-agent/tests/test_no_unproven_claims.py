"""critic סבב 14 (ושוב מסבב 2, ר-11): team/marketing.md טען על המידע של הלקוחות «נשמר מוצפן», אבל ה-DB החי
לא מוצפן במנוחה (docs/ADR-encryption-at-rest.md ממתין לאישור). טענה כזו בחומר שיווקי = הטעיה.
מגן: כל עוד ה-ADR לא מומש (אין sqlcipher ב-app/db.py), אסור לטעון שמידע הלקוחות מוצפן."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLAIM = re.compile(r"(?:המידע|הנתונים|מידע הלקוחות|הלקוחות שלי)[^.\n]{0,40}(?<!לא )נשמר(?:ים)? מוצפ[ןנ]")
DOCS = [*ROOT.glob("team/*.md"), *ROOT.glob("marketing/**/*.md"), *ROOT.glob("web/src/**/*.tsx"),
        *ROOT.glob("app/*.html"), *ROOT.glob("legal/*.md")]


def test_no_customer_data_encrypted_claim_until_db_encryption_ships():
    db_encrypted = "sqlcipher" in (ROOT / "app/db.py").read_text(encoding="utf-8").lower()
    if db_encrypted:
        return
    bad = [f"{p.relative_to(ROOT)}:{n}" for p in DOCS
           for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1)
           if CLAIM.search(line) and "critic" not in line]
    assert not bad, bad

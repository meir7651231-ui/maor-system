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


def _gate5_done() -> bool:
    """critic סבב 22: התנאי הישן («sqlcipher» מופיע ב-db.py) נעשה אמת ברגע שהקוד נכתב מאחורי דגל —
    והמגן כבה, אף שבפריסה הדגל כבוי. עכשיו: מותר לטעון רק כששער 5 ב-BETA-GATE סומן ✅."""
    for line in (ROOT / "legal/BETA-GATE.md").read_text(encoding="utf-8").splitlines():
        if line.startswith("| 5 |"):
            return line.split("|")[4].strip().startswith("✅")
    return False


def test_gate5_parsed_and_not_done_yet():
    assert not _gate5_done()


def test_no_customer_data_encrypted_claim_until_db_encryption_ships():
    if _gate5_done():
        return
    bad = [f"{p.relative_to(ROOT)}:{n}" for p in DOCS if p.name != "critic.md"
           for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1)
           if CLAIM.search(line) and "critic" not in line]
    assert not bad, bad

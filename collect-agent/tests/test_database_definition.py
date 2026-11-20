"""מסמך הגדרות המאגר (תקנה 2 לתקנות אבטחת מידע) = הקוד: כל טבלה שנוצרת ב-app/ מתוארת, ואין טבלה מדומה.

טבלה חדשה בלי שורה ב-legal/DATABASE-DEFINITION.md ⇒ נכשל ⇒ מתארים מטרה, מידע אישי ושמירה לפני שממשיכים.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = (ROOT / "legal" / "DATABASE-DEFINITION.md").read_text("utf-8")


def _created() -> set[str]:
    src = "\n".join(p.read_text("utf-8") for p in (ROOT / "app").glob("*.py"))
    return set(re.findall(r"CREATE TABLE IF NOT EXISTS (\w+)", src))


def _documented() -> set[str]:
    sec = DOC.split("## 5.")[1].split("## 6.")[0]
    return set(re.findall(r"^\| `(\w+)` \|", sec, re.M))


def test_every_table_is_documented_and_no_phantoms():
    created = _created()
    assert len(created) >= 20, created          # הסריקה עצמה עובדת
    doc = _documented()
    assert not created - doc, f"טבלאות בלי תיאור במסמך הגדרות המאגר: {sorted(created - doc)}"
    assert not doc - created, f"טבלאות במסמך שלא קיימות בקוד: {sorted(doc - created)}"


def test_every_row_states_pii_and_retention():
    sec = DOC.split("## 5.")[1].split("## 6.")[0]
    for line in re.findall(r"^\| `\w+` \|.*$", sec, re.M):
        cells = [c.strip() for c in line.strip("|").split("|")]
        assert len(cells) == 5 and all(cells), line


def test_kept_after_wipe_matches_code():
    """סעיף 7 = מה ש-wipe באמת משאיר."""
    from app import wipe
    kept = _created() - set(wipe._TABLES)
    sec7 = DOC.split("## 7.")[1].split("## 8.")[0]
    for t in kept:
        assert f"`{t}`" in sec7, t
    assert kept == {"audit", "access_log", "suppressions"}, kept


def test_marked_draft():
    assert "טיוטה – לבדיקת עו״ד" in DOC and "תקנה 2" in DOC

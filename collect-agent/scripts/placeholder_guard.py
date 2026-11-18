"""שומר placeholders של המפעיל — מהיר, ל-pre-commit (QA, הפעלה 228).

רקע: דף «שאלות נפוצות» (552047d2) נכנס עם placeholder של פרטי המפעיל בלי שורה ב-
`legal/OPERATOR-PLACEHOLDERS.md` ⇒ נתפס רק ב-pytest המלא, ב-CI (ריצה 725 אדומה). השומר הזה
מריץ את אותה השוואה תוך פחות משנייה, בלי pytest ובלי תלויות, מתוך ה-pre-commit.

    python3 -I scripts/placeholder_guard.py [ROOT]   # יציאה 0 = הטבלה תואמת · 1 = פער (עם רשימה)

בודק: (1) הקבצים בטבלה ב׳ == הקבצים שבהם יש placeholder בפועל; (2) המספר בכותרת ב׳ («(N קבצים»)
תואם את מספר השורות.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROW_RX = re.compile(r"^\| `([^`]+)` \|", re.M)
COUNT_RX = re.compile(r"^## ב\.[^\n]*\((\d+) קבצים", re.M)


def _static_files(root: Path) -> list[str]:
    sys.path.insert(0, str(root))
    try:
        from app import legal  # stdlib-only מודול; אותה פונקציה שה-gate וה-pytest משתמשים בה
    finally:
        sys.path.pop(0)
    return legal.static_placeholder_files(root)


def check(root: Path) -> list[str]:
    table_path = root / "legal" / "OPERATOR-PLACEHOLDERS.md"
    text = table_path.read_text("utf-8")
    if "## ב." not in text:
        return ["חסר סעיף «## ב.» ב-legal/OPERATOR-PLACEHOLDERS.md"]
    listed = set(ROW_RX.findall(text.split("## ב.", 1)[1]))
    actual = set(_static_files(root))
    errs = [f"placeholder בקובץ שאינו בטבלה: {p}" for p in sorted(actual - listed)]
    errs += [f"בטבלה אבל כבר אין בו placeholder: {p}" for p in sorted(listed - actual)]
    m = COUNT_RX.search(text)
    if m and int(m.group(1)) != len(listed):
        errs.append(f"הכותרת ב׳ אומרת {m.group(1)} קבצים, בטבלה {len(listed)}")
    return errs


def main(argv: list[str]) -> int:
    root = Path(argv[1]).resolve() if len(argv) > 1 else Path(__file__).resolve().parents[1]
    errs = check(root)
    if errs:
        print("❌ legal/OPERATOR-PLACEHOLDERS.md לא תואם:")
        for e in errs:
            print("  -", e)
        print("  ⇒ להוסיף/להסיר שורה בטבלה ב׳ (ולעדכן את המספר בכותרת) באותו קומיט.")
        return 1
    print("✅ טבלת placeholders של המפעיל תואמת")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

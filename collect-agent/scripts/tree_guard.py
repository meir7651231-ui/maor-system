"""שומר-עץ: בדיקה לא משאירה קבצים בתיקיית הפרויקט (QA, הפעלה 216).

רקע: `test_wait_loud` יצר בשקט `collect-agent/.venv` עם קישור מת (215). git status רגיל לא היה תופס
את זה — `.venv/`, `*.sqlite3`, `demo-output/` ו-`.env` נמצאים ב-.gitignore. לכן משווים גם קבצים
מתעלמים, לפני ואחרי.

    python3 -I scripts/tree_guard.py snapshot /tmp/before.txt
    python -m pytest -q
    python3 -I scripts/tree_guard.py check /tmp/before.txt   # יציאה 1 + רשימה אם נוצר/השתנה משהו

מותר (תוצרי לוואי של המפרש/הכלים): __pycache__, .pytest_cache, .ruff_cache, *.egg-info.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALLOWED_PARTS = {"__pycache__", ".pytest_cache", ".ruff_cache"}
# תיקיות כבדות שנוצרות בכוונה בצעדי CI אחרים (npm/build) — לא חלק מסוויטת pytest.
SKIP_PREFIXES = ("web/node_modules/", "web/dist/")


def _allowed(path: str) -> bool:
    parts = path.rstrip("/").split("/")
    if any(p in ALLOWED_PARTS or p.endswith(".egg-info") for p in parts):
        return True
    return path.startswith(SKIP_PREFIXES)


def state(root: Path = ROOT) -> list[str]:
    """שורות `git status` (כולל מתעלמים, כל קובץ בנפרד) לתיקיית הפרויקט, בלי המותרים."""
    out = subprocess.run(  # noqa: S603 — פקודה קבועה, בלי קלט חיצוני
        ["git", "status", "--porcelain", "--ignored", "--untracked-files=all", "--", "."],  # noqa: S607
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    lines = []
    for line in out.splitlines():
        path = line[3:].strip('"')
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        if not _allowed(path):
            lines.append(line)
    return sorted(lines)


def diff(before: list[str], after: list[str]) -> list[str]:
    return sorted(set(after) - set(before))


def main(argv: list[str]) -> int:
    if len(argv) != 3 or argv[1] not in {"snapshot", "check"}:
        print("שימוש: tree_guard.py snapshot|check FILE", file=sys.stderr)
        return 2
    snap = Path(argv[2])
    if argv[1] == "snapshot":
        snap.write_text("\n".join(state(ROOT)) + "\n", encoding="utf-8")
        return 0
    before = [ln for ln in snap.read_text(encoding="utf-8").splitlines() if ln]
    new = diff(before, state(ROOT))
    if new:
        print("❌ הבדיקות השאירו/שינו קבצים בתיקיית הפרויקט:")
        for ln in new:
            print("   ", ln)
        return 1
    print("✅ העץ נקי — הבדיקות לא השאירו קבצים בפרויקט")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

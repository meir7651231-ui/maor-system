"""שומר-עץ: בדיקה לא משאירה קבצים בתיקיית הפרויקט (QA, הפעלה 216).

רקע: `test_wait_loud` יצר בשקט `collect-agent/.venv` עם קישור מת (215). git status רגיל לא היה תופס
את זה — `.venv/`, `*.sqlite3`, `demo-output/` ו-`.env` נמצאים ב-.gitignore. לכן משווים גם קבצים
מתעלמים, לפני ואחרי.

    python3 -I scripts/tree_guard.py snapshot /tmp/before.txt
    python -m pytest -q
    python3 -I scripts/tree_guard.py check /tmp/before.txt   # יציאה 1 + רשימה אם נוצר/השתנה משהו

מותר (תוצרי לוואי של המפרש/הכלים): __pycache__, .pytest_cache, .ruff_cache, *.egg-info.

מצב בלי git (הפעלה 219, ג'וב demo-clean): ב-container אין git, ו-actions/checkout מוריד את הקוד בלי .git.
`fs-snapshot`/`fs-check` מצלמים את רשימת הקבצים בתיקייה (ברירת מחדל: הפרויקט) ישירות מהדיסק —
לבדוק שריצה חוזרת של demo.sh לא מוסיפה קבצים, לא בפרויקט ולא ב-TMPDIR:

    python3 -I scripts/tree_guard.py fs-snapshot /tmp/x.txt [DIR]
    python3 -I scripts/tree_guard.py fs-check /tmp/x.txt [DIR]

ג׳וב web (הפעלה 224): TMPDIR ייעודי ($RUNNER_TEMP/e2e-tmp) לכל צעדי הדפדפן, fs-snapshot לפני ו-fs-check אחרי
⇒ סוד TOTP / sqlite / .org.chromium.* שנשארים ב-TMPDIR (222–223) נתפסים אוטומטית ב-CI.

ג׳וב test (הפעלה 225): אותו מגן ($RUNNER_TEMP/test-tmp) סביב pytest, evals, demo.sh, smoke, חוזים ו-sandbox;
pytest רץ עם --basetemp מחוץ לתיקייה (pytest-of-* נשמר בכוונה). רשימה מעל 200 ⇒ «ועוד N».
"""

from __future__ import annotations

import os
import subprocess  # nosec B404 — רק git status עם ארגומנטים קבועים
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# node-compile-cache (הפעלה 224): מטמון הקומפילציה של Node (npm/node 22 כותבים ל-os.tmpdir()) — לשימוש
# חוזר, בלי נתונים. נשאר אחרי כל ריצת e2e גם כשהכול נקי ⇒ מותר, כדי שמגן ה-TMPDIR של ג׳וב web יתפוס רק דליפות.
ALLOWED_PARTS = {"__pycache__", ".pytest_cache", ".ruff_cache", "node-compile-cache"}
# תיקיות כבדות שנוצרות בכוונה בצעדי CI אחרים (npm/build) — לא חלק מסוויטת pytest.
SKIP_PREFIXES = ("web/node_modules/", "web/dist/")


def _allowed(path: str, prefix: str = "") -> bool:
    """`path` יחסי לשורש המאגר (כך git status --porcelain מחזיר); `prefix` = תיקיית הפרויקט בתוכו.

    באג (הפעלה 217): ההשוואה ל-SKIP_PREFIXES נעשתה על נתיב-מהשורש (`collect-agent/web/dist/…`) מול
    `web/dist/` ⇒ אף פעם לא התאימה, ו-build של demo.sh הופיע כ«לכלוך» (אלפי שורות node_modules)."""
    parts = path.rstrip("/").split("/")
    if any(p in ALLOWED_PARTS or p.endswith(".egg-info") for p in parts):
        return True
    rel = path[len(prefix):] if prefix and path.startswith(prefix) else path
    return rel.startswith(SKIP_PREFIXES)


def _git(root: Path, *args: str) -> str:
    return subprocess.run(  # noqa: S603  # nosec B603 B607 — פקודת git קבועה, בלי קלט חיצוני
        ["git", *args],  # noqa: S607
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
    ).stdout


def state(root: Path = ROOT) -> list[str]:
    """שורות `git status` (כולל מתעלמים, כל קובץ בנפרד) לתיקיית הפרויקט, בלי המותרים."""
    prefix = _git(root, "rev-parse", "--show-prefix").strip()
    out = _git(root, "status", "--porcelain", "--ignored", "--untracked-files=all", "--", ".")
    lines = []
    for line in out.splitlines():
        path = line[3:].strip('"')
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        if not _allowed(path, prefix):
            lines.append(line)
    return sorted(lines)


def fs_state(root: Path) -> list[str]:
    """כל הקבצים (וקישורים) מתחת ל-`root`, יחסית אליו, בלי המותרים. בלי git — לעבודה ב-container."""
    out = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in ALLOWED_PARTS and not d.endswith(".egg-info")]
        for name in filenames:
            rel = Path(dirpath, name).relative_to(root).as_posix()
            if not _allowed(rel):
                out.append(rel)
    return sorted(out)


def diff(before: list[str], after: list[str]) -> list[str]:
    return sorted(set(after) - set(before))


def main(argv: list[str]) -> int:
    fs_mode = len(argv) in {3, 4} and argv[1] in {"fs-snapshot", "fs-check"}
    if not fs_mode and (len(argv) != 3 or argv[1] not in {"snapshot", "check"}):
        print("שימוש: tree_guard.py snapshot|check FILE  ·  fs-snapshot|fs-check FILE [DIR]", file=sys.stderr)
        return 2
    snap = Path(argv[2])
    if fs_mode:
        root = Path(argv[3]).resolve() if len(argv) == 4 else ROOT
        if argv[1] == "fs-snapshot":
            snap.write_text("\n".join(fs_state(root)) + "\n", encoding="utf-8")
            return 0
        before = [ln for ln in snap.read_text(encoding="utf-8").splitlines() if ln]
        snap_rel = snap.resolve().relative_to(root).as_posix() if snap.resolve().is_relative_to(root) else ""
        new = [ln for ln in diff(before, fs_state(root)) if ln != snap_rel]
        if new:
            print(f"❌ נוצרו קבצים חדשים תחת {root}:")
            for ln in new[:200]:
                print("   ", ln)
            if len(new) > 200:
                print(f"    … ועוד {len(new) - 200} (סה״כ {len(new)})")
            return 1
        print(f"✅ אין קבצים חדשים תחת {root}")
        return 0
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

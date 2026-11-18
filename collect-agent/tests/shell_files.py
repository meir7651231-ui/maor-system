"""רשימת סקריפטי ה-shell שהמגנים סורקים — מקור יחיד (הפעלה 233).

לפני כן כל מגן בנה רשימה משלו: מגני ה-mktemp/trap סרקו רק `demo.sh` + `scripts/*.sh`, ומגן תהליכי-הרקע
סרק `git ls-files '*.sh'`. סקריפט חדש מחוץ ל-`scripts/` (כמו `marketing/video/compose/*.sh`) עבר בלי מגן.
"""
from __future__ import annotations

import shutil
import subprocess  # nosec B404
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_GIT = shutil.which("git")


def tracked_sh() -> list[Path]:
    """כל קובצי `*.sh` שב-git (בתוך collect-agent/); בלי git — סריקת עץ בלי node_modules/.venv."""
    if _GIT:
        r = subprocess.run([_GIT, "ls-files", "*.sh"], cwd=ROOT, capture_output=True, text=True)  # noqa: S603  # nosec B603
        if r.returncode == 0 and r.stdout.strip():
            return sorted(ROOT / p for p in r.stdout.split())
    return sorted(p for p in ROOT.rglob("*.sh")
                  if "node_modules" not in p.parts and ".venv" not in p.parts)


def sh_id(p: Path) -> str:
    return p.relative_to(ROOT).as_posix()

"""critic סבב 70: נעילת תלויות (גרסאות + sha256) נאכפה רק בקובץ ה-workflow (`test_ci_installs_from_lock_with_hashes`).
הפעלה 191 שינתה את `demo.sh` ל-`pip install -e '.[dev]'` — **לא נעול** — והפעלה 192 הוסיפה ג'וב CI (demo-clean) שמריץ
בדיוק את `demo.sh` ⇒ ב-CI הותקנו גרסאות אחרונות מ-PyPI בלי hash (שרשרת אספקה), ו-README שולח לשם גם משתמשים.
המגן: כל `pip install` בסקריפטים, ב-README וב-workflow — או `--require-hashes -r <lock>` או `--no-deps -e`
(או שדרוג pip/setuptools/wheel עצמם)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = [ROOT / "demo.sh", *sorted((ROOT / "scripts").glob("*.sh")), ROOT / "README.md",
         ROOT.parent / ".github" / "workflows" / "collect-agent.yml"]
OK = re.compile(r"--require-hashes -r \S*\.lock|--no-deps\b|install -U pip setuptools wheel")


def test_every_pip_install_is_locked():
    bad = []
    for f in FILES:
        if not f.exists():
            continue
        for n, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            code = line.split("#", 1)[0] if f.suffix in (".sh", ".yml") else line
            if re.search(r"\bpip install\b", code) and not OK.search(code):
                bad.append(f"{f.relative_to(ROOT.parent)}:{n}: {line.strip()[:100]}")
    assert not bad, "התקנה לא נעולה:\n" + "\n".join(bad)

"""critic סבב 71 💡1 ⇒ הפעלה 196: ב-CI `npm i -g playwright@1.63.0` — גרסה מדויקת אבל **מחוץ לנעילה** (בלי
integrity), ו-`npx -y playwright@…` מוריד חבילה מהרשת בכל ריצה. אותה משפחה כמו 70.1 בצד הפייתון.
המגן: playwright הוא devDependency מדויק ב-package.json, רשום ב-package-lock עם sha512, ה-workflow לא מתקין
גלובלית ולא מוריד ב-npx, וסקריפטי ה-e2e טוענים את playwright מ-web/node_modules (לא מ-NODE_PATH גלובלי)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
WF = ROOT.parent / ".github" / "workflows" / "collect-agent.yml"


def _code_lines(path: Path):
    for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        yield n, line.split("#", 1)[0]


def test_playwright_is_exact_dev_dependency():
    pkg = json.loads((WEB / "package.json").read_text(encoding="utf-8"))
    v = pkg.get("devDependencies", {}).get("playwright")
    assert v and re.fullmatch(r"\d+\.\d+\.\d+", v), f"playwright חייב להיות devDependency בגרסה מדויקת, נמצא {v!r}"


def test_playwright_in_lock_with_integrity():
    pkg = json.loads((WEB / "package.json").read_text(encoding="utf-8"))
    want = pkg["devDependencies"]["playwright"]
    lock = json.loads((WEB / "package-lock.json").read_text(encoding="utf-8"))
    pk = lock["packages"]
    assert pk[""]["devDependencies"].get("playwright") == want, "package-lock לא מסונכרן ל-package.json"
    for name in ("playwright", "playwright-core"):
        e = pk.get(f"node_modules/{name}")
        assert e, f"{name} חסר ב-package-lock"
        assert e["version"] == want, f"{name}: {e['version']} ≠ {want}"
        assert str(e.get("integrity", "")).startswith("sha512-"), f"{name} בלי integrity"


def _violations(path: Path) -> list[str]:
    bad = []
    for n, code in _code_lines(path):
        if re.search(r"\bnpm (i|install|add)\b[^\n]*\s-g\b|\bnpm root -g\b|\bNODE_PATH=", code):
            bad.append(f"{n}: {code.strip()}")
        if re.search(r"\bnpx\b", code) and "--no-install" not in code:
            bad.append(f"{n}: {code.strip()} (npx בלי --no-install מוריד מהרשת)")
        if re.search(r"\bnpx\b[^\n]*\s(-y|--yes)\b", code):
            bad.append(f"{n}: {code.strip()}")
    return bad


def test_workflow_has_no_unlocked_npm():
    bad = _violations(WF)
    assert not bad, "התקנת npm מחוץ לנעילה ב-workflow:\n" + "\n".join(bad)


def test_workflow_installs_browser_from_local_playwright():
    s = WF.read_text(encoding="utf-8")
    assert "npx --no-install playwright install --with-deps chromium" in s


def test_e2e_scripts_resolve_playwright_locally():
    files = sorted((WEB / "e2e").glob("*.mjs"))
    users = [f for f in files if "'playwright'" in f.read_text(encoding="utf-8")]
    assert users, "לא נמצאו סקריפטי e2e שטוענים playwright"
    for f in users:
        s = f.read_text(encoding="utf-8")
        assert "createRequire(import.meta.url)('playwright')" in s, f"{f.name}: טעינה שלא מ-web/node_modules"
        assert "NODE_PATH" not in s, f"{f.name}: תלוי ב-NODE_PATH גלובלי"


def test_guard_catches_old_ci(tmp_path):
    """מוטציה: ה-workflow של 195 (npm i -g + npx -y + NODE_PATH) ⇒ המגן נופל."""
    old = ("      - run: |\n          npm i -g playwright@1.63.0\n"
           "          npx -y playwright@1.63.0 install --with-deps chromium\n"
           "      - run: NODE_PATH=\"$(npm root -g)\" node e2e/live.mjs\n")
    p = tmp_path / "wf.yml"
    p.write_text(old, encoding="utf-8")
    assert len(_violations(p)) >= 3

"""הפעלה 421 — ביקורת 252 ⚠️: web/dist ישן הוגש ב-/app/ כי demo.sh בנה רק כש-dist חסר.

המבקר ראה «✓ טופל» גנרי במקום כרטיס api_mass_vanish החדש, עד שהריץ npm run build ידנית.
scripts/web_build.sh בונה מחדש כשקובץ מקור חדש מ-dist, מדלג כשעדכני, ונכשל בקול כש-build נכשל.
הבדיקות מריצות את הסקריפט מול תיקיית web מזויפת ו-npm מזויף שרושם את הקריאות.
"""
import os
import re
import shutil
import subprocess
import time
from pathlib import Path

import pytest

from tests.test_demo_sh_portable import NOT_PORTABLE

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "web_build.sh"
BASH = shutil.which("bash")
pytestmark = pytest.mark.skipif(not BASH, reason="אין bash")

FAKE_NPM = """#!/bin/sh
echo "$*" >> "$NPM_LOG"
if [ "$1" = ci ]; then mkdir -p node_modules; exit 0; fi
if [ "$1" = run ] && [ "$2" = build ]; then
  [ -n "$NPM_FAIL" ] && { echo "src/x.tsx(1,1): error TS2322: boom"; exit 2; }
  mkdir -p dist; echo "<html>new</html>" > dist/index.html; exit 0
fi
exit 0
"""


def _web(tmp_path, *, dist=True, modules=True):
    web = tmp_path / "web"
    (web / "src").mkdir(parents=True)
    (web / "src" / "App.tsx").write_text("x")
    (web / "package.json").write_text("{}")
    (web / "package-lock.json").write_text("{}")
    if modules:
        (web / "node_modules").mkdir()
    if dist:
        (web / "dist").mkdir()
        (web / "dist" / "index.html").write_text("<html>old</html>")
    old = time.time() - 1000
    for p in [*web.rglob("*")]:
        os.utime(p, (old, old))
    if dist:  # dist חדש מהמקור
        os.utime(web / "dist" / "index.html", (old + 500, old + 500))
    return web


def _run(tmp_path, web, *, npm=True, fail=False, check=False):
    b = tmp_path / "bin"
    b.mkdir(exist_ok=True)
    if npm:
        (b / "npm").write_text(FAKE_NPM)
        (b / "npm").chmod(0o755)
    log = tmp_path / "npm.log"
    env = {**os.environ, "PATH": f"{b}{os.pathsep}/usr/bin{os.pathsep}/bin", "NPM_LOG": str(log)}
    if not npm:
        env["PATH"] = str(b) + os.pathsep + os.pathsep.join(
            d for d in os.environ["PATH"].split(os.pathsep) if not (Path(d) / "npm").exists())
    if fail:
        env["NPM_FAIL"] = "1"
    if check:
        env["WEB_BUILD"] = "check"
    r = subprocess.run([BASH, str(SCRIPT), str(web)], env=env, capture_output=True, text=True, timeout=60)  # noqa: S603
    calls = log.read_text().splitlines() if log.exists() else []
    return r, calls


def test_fresh_dist_is_not_rebuilt(tmp_path):
    web = _web(tmp_path)
    r, calls = _run(tmp_path, web)
    assert r.returncode == 0, r.stderr
    assert calls == []
    assert (web / "dist" / "index.html").read_text() == "<html>old</html>"


def test_stale_dist_is_rebuilt(tmp_path):
    """הבאג של 252: מקור שהשתנה אחרי ה-build ⇒ בונים מחדש (קודם: הוגש ה-dist הישן)."""
    web = _web(tmp_path)
    (web / "src" / "App.tsx").write_text("changed")  # mtime = עכשיו > dist
    r, calls = _run(tmp_path, web)
    assert r.returncode == 0, r.stderr
    assert calls == ["run build --silent"], calls  # node_modules קיים ⇒ בלי npm ci
    assert (web / "dist" / "index.html").read_text().strip() == "<html>new</html>"
    assert "src/App.tsx" in r.stdout
    # ריצה שנייה — עכשיו עדכני
    r2, calls2 = _run(tmp_path, web)
    assert r2.returncode == 0 and calls2 == calls, calls2


def test_missing_dist_and_modules_runs_ci_then_build(tmp_path):
    web = _web(tmp_path, dist=False, modules=False)
    r, calls = _run(tmp_path, web)
    assert r.returncode == 0, r.stderr
    assert [c.split()[0] for c in calls] == ["ci", "run"], calls


def test_failed_build_is_loud_and_nonzero(tmp_path):
    web = _web(tmp_path)
    (web / "src" / "App.tsx").write_text("changed")
    r, _ = _run(tmp_path, web, fail=True)
    assert r.returncode == 1
    assert "TS2322" in r.stderr and "נכשלה" in r.stderr
    assert (web / "dist" / "index.html").read_text() == "<html>old</html>"


def test_no_npm_warns_with_exit_2(tmp_path):
    web = _web(tmp_path)
    (web / "src" / "App.tsx").write_text("changed")
    r, calls = _run(tmp_path, web, npm=False)
    assert r.returncode == 2 and calls == []
    assert "ישן" in r.stderr


def test_check_mode_reports_without_building(tmp_path):
    web = _web(tmp_path)
    r, calls = _run(tmp_path, web, check=True)
    assert r.returncode == 0 and calls == []
    (web / "src" / "App.tsx").write_text("changed")
    r, calls = _run(tmp_path, web, check=True)
    assert r.returncode == 3 and calls == [] and "App.tsx" in r.stdout


def test_demo_sh_uses_staleness_check_not_only_missing():
    demo = (ROOT / "demo.sh").read_text(encoding="utf-8")
    code = "\n".join(ln for ln in demo.splitlines() if not ln.lstrip().startswith("#"))
    assert "scripts/web_build.sh" in code
    assert not re.search(r"\[\[ ! -f web/dist/index.html \]\] && command -v npm", code)


def test_web_build_sh_is_bash32_and_bsd_portable():
    src = SCRIPT.read_text(encoding="utf-8")
    hits = [(i + 1, why) for i, ln in enumerate(src.splitlines()) if not ln.lstrip().startswith("#")
            for pat, why in NOT_PORTABLE.items() if re.search(pat, ln)]
    assert not hits, hits

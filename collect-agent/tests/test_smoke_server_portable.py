"""הפעלה 195 — scripts/smoke_server.sh תואם macOS (פתוח מ-194, «הבא» 2).

team/qa.md §6 מתעד הרצה מקומית של bash scripts/smoke_server.sh. ב-mac אין timeout ו-stat הוא BSD:
- `if OWNER_API_TOKEN= timeout 20 python3 …` ⇒ exit 127 ⇒ ה-if לא נכנס ⇒ המעקה «השרת לא עולה בלי טוקן»
  (וגם SEND_MODE=live) **עבר בשקט בלי לבדוק כלום**.
- `stat -c '%a'` ⇒ שגיאה ⇒ הריצה נפלה בסוף.
התיקון: signal.alarm בתוך המפרש במקום timeout, הרשאות דרך python, ובדיקת ייבוא מוקדמת (אחרת גם
מפרש בלי תלויות היה «מכשיל» את המעקות ומעביר אותם).
"""
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

from tests.test_demo_sh_portable import NOT_PORTABLE

ROOT = Path(__file__).resolve().parent.parent
SMOKE = ROOT / "scripts" / "smoke_server.sh"
SRC = SMOKE.read_text(encoding="utf-8")
BASH = shutil.which("bash")


def test_smoke_is_bash32_and_bsd_portable():
    hits = [(i + 1, why, ln.strip()) for i, ln in enumerate(SRC.splitlines())
            if not ln.lstrip().startswith("#")
            for pat, why in NOT_PORTABLE.items() if re.search(pat, ln)]
    assert not hits, hits


def test_guards_bounded_by_interpreter_not_gnu_timeout():
    # כל שלושת המעקות מגבילים זמן בתוך המפרש, ויש בדיקת ייבוא לפני המעקות
    assert "signal.alarm(" in SRC
    assert SRC.count('python3 -c "$BOOT"') == 3
    pre = SRC.index("python3 -c 'import app.main'")
    assert pre < SRC.index('python3 -c "$BOOT"')


def _shim(tmp_path: Path, *, broken_python: bool = False) -> dict:
    """PATH של «mac»: timeout ו-stat של GNU לא קיימים (exit 127)."""
    b = tmp_path / "bin"
    b.mkdir()
    for name in ("timeout", "stat"):
        f = b / name
        f.write_text(f'#!/bin/sh\necho "{name}: command not found" >&2\nexit 127\n')
        f.chmod(0o755)
    py = b / "python3"
    if broken_python:  # מפרש בלי תלויות
        py.write_text(f'#!/bin/sh\nexec {sys.executable} -I -c "import sys; sys.exit(\'no fastapi\')"\n')
    else:
        py.write_text(f'#!/bin/sh\nexec {sys.executable} "$@"\n')
    py.chmod(0o755)
    env = {k: v for k, v in os.environ.items() if k not in ("DB_ENCRYPTION", "OWNER_API_TOKEN")}
    env["PATH"] = f"{b}:{env['PATH']}"
    env["PORT"] = str(18000 + os.getpid() % 2000)
    return env


@pytest.mark.skipif(not BASH or not shutil.which("curl"), reason="bash/curl")
def test_smoke_runs_green_without_gnu_timeout_and_stat(tmp_path):
    pytest.importorskip("uvicorn")
    r = subprocess.run([BASH, str(SMOKE)], cwd=ROOT, env=_shim(tmp_path),  # noqa: S603
                       capture_output=True, text=True, timeout=120)
    assert r.returncode == 0, r.stdout + r.stderr
    assert "✅ smoke:" in r.stdout
    assert "command not found" not in r.stderr


@pytest.mark.skipif(not BASH, reason="bash")
def test_smoke_fails_loudly_when_python_lacks_deps(tmp_path):
    r = subprocess.run([BASH, str(SMOKE)], cwd=ROOT, env=_shim(tmp_path, broken_python=True),  # noqa: S603
                       capture_output=True, text=True, timeout=60)
    assert r.returncode != 0
    assert "לא מייבא את app.main" in r.stdout


def test_trap_never_kills_process_group():
    # `kill "${PID:-0}"` לפני שהשרת עלה = `kill 0` ⇒ הרג את המעטפת/pytest/ה-CI שהריצו (נתפס 195)
    for f in (ROOT / "scripts").glob("*.sh"):
        src = "\n".join(ln for ln in f.read_text(encoding="utf-8").splitlines()
                        if not ln.lstrip().startswith("#"))
        assert not re.search(r'kill\s+"?\$\{?\w+:-0\}?', src), f.name
        assert not re.search(r"\bkill\s+(-\w+\s+)?0\b", src), f.name
    assert 'PID=""' in SRC and '[ -n "$PID" ]' in SRC

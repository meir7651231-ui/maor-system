"""הפעלה 194 — QA macOS ל-./demo.sh (פתוח מ-192).

נמצא: הפרויקט דורש Python 3.11+ (pyproject), אבל python3 שמגיע עם macOS הוא 3.9. demo.sh לא בדק גרסה ⇒
יצר .venv מ-3.9 וה-pip נפל בשגיאת נעילה לא מובנת (ו-.venv ישן כזה היה נבחר שוב בכל ריצה).
התיקון: בדיקת גרסה, בחירת מפרש 3.11+ מ-PATH (python3.13/3.12/3.11 של brew), בניית .venv ישן מחדש,
והודעה ברורה כשאין מפרש מתאים. בנוסף: מגן-מקור — demo.sh נשאר תואם bash 3.2 (ברירת המחדל של macOS)
וכלי BSD (בלי stat -c / readlink -f / sed -i / timeout וכו׳). ריצה אמיתית על mac לא בוצעה — אין runner.
"""
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
DEMO_PATH = ROOT / "demo.sh"
DEMO = DEMO_PATH.read_text(encoding="utf-8")
CODE = "\n".join(ln for ln in DEMO.splitlines() if not ln.lstrip().startswith("#"))
BASH = shutil.which("bash")

# bash 4+ או כלי GNU בלבד — לא קיימים ב-bash 3.2 / BSD של macOS
NOT_PORTABLE = {
    r"declare -[aA]*A": "מערך אסוציאטיבי (bash 4)",
    r"\b(mapfile|readarray|coproc)\b": "bash 4",
    r"\$\{[A-Za-z_][A-Za-z0-9_]*(,,|\^\^|,|\^)\}": "המרת אותיות (bash 4)",
    r"\blocal -n\b|\bdeclare -n\b": "nameref (bash 4.3)",
    r"\bwait -n\b": "bash 4.3",
    r"\[\[ -v ": "[[ -v (bash 4.2)",
    r"\$EPOCH(SECONDS|REALTIME)": "bash 5",
    r"&>>|\|&": "הפניה של bash 4",
    r";;&|;&\s*$": "case fallthrough (bash 4)",
    r"\breadlink -f\b": "GNU readlink",
    r"\bstat -c\b": "GNU stat (ב-mac: stat -f)",
    r"\bdate -d\b": "GNU date",
    r"\bsed -i(\s|$)": "GNU sed -i (ב-BSD דורש סיומת)",
    r"(^|[\s;|&(])timeout\s": "timeout לא קיים ב-macOS",
    r"\bgrep -[A-Za-z]*P": "grep -P (GNU)",
    r"\brealpath\b": "realpath לא קיים ב-macOS ישן",
    r"\bnproc\b": "nproc (GNU)",
}


def test_demo_sh_is_bash32_and_bsd_portable():
    hits = [(i + 1, why, ln.strip()) for i, ln in enumerate(DEMO.splitlines())
            if not ln.lstrip().startswith("#")
            for pat, why in NOT_PORTABLE.items() if re.search(pat, ln)]
    assert not hits, hits


def test_guard_catches_known_gnuisms():
    bad = ["stat -c %Y x", "declare -A m", "x=${y,,}", "timeout 5 cmd", "sed -i 's/a/b/' f", "mapfile -t a"]
    for ln in bad:
        assert any(re.search(p, ln) for p in NOT_PORTABLE), ln
    for ok in ['echo "${1:-}"', "seq 1 60", "mktemp -d", 'cd "$(dirname "$0")"']:
        assert not any(re.search(p, ok) for p in NOT_PORTABLE), ok


def test_requires_python_matches_pyproject():
    req = re.search(r'requires-python = ">=(\d+)\.(\d+)"', (ROOT / "pyproject.toml").read_text()).groups()
    m = re.search(r"sys\.version_info < \((\d+), (\d+)\)", CODE)
    assert m and m.groups() == req, (m and m.groups(), req)


@pytest.mark.skipif(not BASH, reason="אין bash")
def test_bash_parses():
    subprocess.run([BASH, "-n", str(DEMO_PATH)], check=True)  # noqa: S603


def _sandbox(tmp_path, *, newer=False, old_venv=False):
    """עותק של demo.sh בתיקייה ריקה + PATH שבו python3 הוא «3.9» מזויף (כמו mac נקי)."""
    work, bin_ = tmp_path / "work", tmp_path / "bin"
    work.mkdir()
    bin_.mkdir()
    shutil.copy(DEMO_PATH, work / "demo.sh")
    fake = "#!/bin/sh\n[ \"$1\" = --version ] && { echo 'Python 3.9.6'; exit 0; }\nexit 1\n"
    for target in [bin_ / "python3"] + ([work / ".venv/bin/python3"] if old_venv else []):
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(fake)
        target.chmod(0o755)
    for tool in ("dirname", "rm", "sh"):
        (bin_ / tool).symlink_to(shutil.which(tool))
    if newer:  # כמו python3.12 של brew
        (bin_ / "python3.12").symlink_to(sys.executable)
    env = {"PATH": str(bin_), "HOME": str(tmp_path), "SKIP_WEB": "1"}
    return work, env


def _run(work, env):
    return subprocess.run([BASH, str(work / "demo.sh"), "--check"], cwd=work, env=env,  # noqa: S603
                          capture_output=True, text=True, timeout=120)


@pytest.mark.skipif(not BASH, reason="אין bash")
def test_old_python_without_alternative_fails_with_clear_message(tmp_path):
    work, env = _sandbox(tmp_path)
    r = _run(work, env)
    assert r.returncode == 1, r
    assert "דרוש Python 3.11" in r.stderr and "3.9.6" in r.stderr and "brew install" in r.stderr, r.stderr
    assert not (work / ".venv").exists()


@pytest.mark.skipif(not BASH, reason="אין bash")
def test_venv_from_old_python_is_rebuilt(tmp_path):
    work, env = _sandbox(tmp_path, old_venv=True)
    r = _run(work, env)
    assert "יוצר מחדש" in r.stdout, r.stdout
    assert not (work / ".venv").exists() and r.returncode == 1


@pytest.mark.skipif(not BASH, reason="אין bash")
def test_picks_newer_interpreter_for_venv(tmp_path):
    work, env = _sandbox(tmp_path, newer=True)
    r = _run(work, env)  # אין requirements-dev.lock בעותק ⇒ ה-pip נופל מיד אחרי יצירת ה-venv
    assert r.returncode != 0
    vpy = work / ".venv/bin/python3"
    assert vpy.exists(), r.stdout + r.stderr
    probe = "import sys;print(sys.version_info[:2] >= (3, 11))"
    out = subprocess.run([str(vpy), "-c", probe], capture_output=True, text=True,  # noqa: S603
                         env={**os.environ}).stdout.strip()
    assert out == "True"

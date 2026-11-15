"""scripts/sandbox_day.sh (BACKLOG חיבורים #3): פקודה אחת ליום ה-sandbox ⇒ «להשיק / לא להשיק».

רץ ירוק מול gi_mock בתוך התהליך; בלי מפתחות ⇒ 2 בלי בקשה; כשל באחד הסקריפטים ⇒ «לא להשיק» עם
הסיבה; קבצים זמניים נמחקים. (subprocess של bash+python בתוך התהליך — בלי רשת.)
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess  # nosec B404
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SH = ROOT / "scripts" / "sandbox_day.sh"
BASH = shutil.which("bash") or "/bin/bash"


def _run(args=(), env_extra=None, path_prefix=None):
    env = {k: v for k, v in os.environ.items()
           if k not in ("GREENINVOICE_API_ID", "GREENINVOICE_API_SECRET")}
    env.update(env_extra or {})
    py_dir = Path(sys.executable).parent
    env["PATH"] = os.pathsep.join(filter(None, [path_prefix, str(py_dir), env.get("PATH", "")]))
    return subprocess.run([BASH, str(SH), *args], cwd=ROOT, env=env, capture_output=True,  # noqa: S603  # nosec B603
                          text=True, timeout=120)


def test_green_against_mock():
    r = _run()
    assert r.returncode == 0, r.stdout + r.stderr
    assert "✅ להשיק" in r.stdout and "הדמיה" in r.stdout


def test_sandbox_without_keys_sends_nothing():
    r = _run(["--sandbox"])
    assert r.returncode == 2 and "לא נשלחה אף בקשה" in r.stderr


def test_failure_means_do_not_launch(tmp_path):
    """python מזויף: בדיקת החוזה עוברת, בדיקת «פתוח = לא שולם» נכשלת ⇒ לא להשיק + הסיבה."""
    fake = tmp_path / "python"
    fake.write_text(f'#!/usr/bin/env bash\ncase "$*" in *sandbox_day1_paid_check*) exit 1;; '
                    f'*) exec "{sys.executable}" "$@";; esac\n')
    fake.chmod(0o755)
    r = _run(path_prefix=str(tmp_path))
    assert r.returncode == 1, r.stdout
    assert "❌ לא להשיק" in r.stdout and "לא ניתן לזהות מי כבר שילם" in r.stdout


def test_tempdir_cleanup_guard():
    src = SH.read_text("utf-8")
    # הפעלה 221: trap לפני ה-mktemp (מגן QA), INT/TERM ⇒ יציאה עם קוד-אות
    assert re.search(r"^trap cleanup EXIT$", src, flags=re.M)
    assert re.search(r"^trap 'exit 130' INT$", src, flags=re.M)
    assert 'rm -rf "$OUT"' in src and 'OUT="$(mktemp -d)"' in src
    assert src.index("trap cleanup EXIT") < src.index('OUT="$(mktemp -d)"')
    assert "sandbox-reports/" in (ROOT / ".gitignore").read_text("utf-8")   # דוחות אמיתיים לא נכנסים לגיט

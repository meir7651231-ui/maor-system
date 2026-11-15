"""הפעלה 230 (QA, «הבא» 2 מ-229) — scripts/smoke_server.sh: kill ⇒ wait עם תקרה ⇒ rm.

הבאג: ה-trap עשה `kill "$PID"` ומיד `rm -rf "$TMP"`. uvicorn שעוד נסגר כתב ללוג/ל-SQLite בתוך תיקייה שנמחקת,
והסקריפט יצא כשהשרת עוד מחזיק את 8765 (הריצה הבאה ⇒ «כתובת תפוסה» או שיחה עם השרת הישן). שרת שמתעלם
מ-SIGTERM נשאר יתום. אותו דפוס כמו demo.sh (227) ו-contract_checks_http.sh (229).
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import time
from pathlib import Path

import pytest

SRC = (Path(__file__).resolve().parents[1] / "scripts" / "smoke_server.sh").read_text("utf-8")
BASH = shutil.which("bash")


def _cleanup_fn() -> str:
    m = re.search(r"^cleanup\(\) \{\n.*?^\}\n", SRC, flags=re.S | re.M)
    assert m, "אין פונקציית cleanup ב-smoke_server.sh"
    return m.group(0)


def test_cleanup_trapped_and_ordered_kill_k9_wait_rm():
    assert re.search(r"^trap cleanup EXIT$", SRC, flags=re.M)
    assert SRC.index("trap cleanup") < SRC.index('TMP="$(mktemp')
    body = _cleanup_fn()
    kill, k9, wait, rm = (body.index(s) for s in ('kill "$PID"', "kill -9", 'wait "$PID"', 'rm -rf "$TMP"'))
    assert kill < k9 < wait < rm
    assert 'exit "$rc"' in body                      # קוד היציאה של הסקריפט נשמר (כשל נשאר כשל)


def _run_cleanup(tmp_path: Path, server: str, rc: int = 0) -> tuple[float, int, int, Path]:
    d = tmp_path / "smoke"
    d.mkdir()
    (d / "server.log").write_text("x")
    pidfile = tmp_path / "pid"
    script = (
        _cleanup_fn()
        + f'TMP="{d}"\n'
        + f"{server} &\n"
        + f'PID=$!; echo $PID > "{pidfile}"; sleep 0.3\n'
        + f"(exit {rc}); cleanup\n"
    )
    t0 = time.monotonic()
    proc = subprocess.run(  # noqa: S603  # nosec B603
        [BASH, "-c", script], env={"PATH": "/usr/bin:/bin"}, timeout=20, capture_output=True,
    )
    return time.monotonic() - t0, proc.returncode, int(pidfile.read_text()), d


def _dead(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return True
    return False


@pytest.mark.skipif(BASH is None, reason="אין bash")
def test_cleanup_does_not_hang_on_server_ignoring_sigterm(tmp_path):
    took, rc, pid, d = _run_cleanup(tmp_path, "bash -c 'trap \"\" TERM; while :; do sleep 0.1; done'")
    assert took < 10, f"cleanup נתקע {took:.1f}s מול שרת שמתעלם מ-SIGTERM"
    assert rc == 0
    assert _dead(pid), "השרת נשאר יתום"
    assert not d.exists()


@pytest.mark.skipif(BASH is None, reason="אין bash")
def test_cleanup_fast_and_keeps_failure_rc(tmp_path):
    took, rc, pid, d = _run_cleanup(tmp_path, "sleep 30", rc=1)
    assert took < 2.5
    assert rc == 1, "cleanup בלע את קוד הכשל"
    assert _dead(pid)
    assert not d.exists()


@pytest.mark.skipif(BASH is None, reason="אין bash")
def test_cleanup_without_server_does_not_kill_anything(tmp_path):
    # PID ריק (כשל לפני שהשרת עלה) ⇒ אין kill בכלל (195: `kill 0` הרג את קבוצת התהליכים)
    d = tmp_path / "smoke"
    d.mkdir()
    script = _cleanup_fn() + f'PID=""; TMP="{d}"\n(exit 0); cleanup\n'
    proc = subprocess.run([BASH, "-c", script], env={"PATH": "/usr/bin:/bin"},  # noqa: S603  # nosec B603
                          timeout=10, capture_output=True)
    assert proc.returncode == 0, proc.stderr
    assert not d.exists()

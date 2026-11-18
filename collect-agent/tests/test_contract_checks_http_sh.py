"""מגן-מקור ל-scripts/contract_checks_http.sh (BACKLOG חיבורים #2): כל mktemp נמחק ב-cleanup,
ה-cleanup רשום ל-trap על EXIT/INT/TERM, ושני שרתי ה-mock נהרגים — גם בכשל."""
from __future__ import annotations

import re
from pathlib import Path

SRC = (Path(__file__).resolve().parents[1] / "scripts" / "contract_checks_http.sh").read_text("utf-8")


def _cleanup_body() -> str:
    m = re.search(r"^cleanup\(\) \{\n(.*?)^\}", SRC, flags=re.S | re.M)
    assert m, "אין פונקציית cleanup"
    return m.group(1)


def test_every_mktemp_is_removed_in_cleanup():
    temps = re.findall(r'^(\w+)="\$\(mktemp[^)]*\)"', SRC, flags=re.M)
    assert temps, "לא נמצאו mktemp (אם הוסרו — להסיר גם את המגן)"
    body = _cleanup_body()
    for v in temps:
        assert re.search(rf'rm -[rf]+ [^\n]*"\$\{{?{v}(:-)?\}}?"', body), f"{v} לא נמחק ב-cleanup"


def test_cleanup_trapped_on_exit_and_signals_and_kills_servers():
    # הפעלה 221: יושר עם tests/test_shell_tmp_cleanup.py (QA) — ה-trap נרשם *לפני* כל mktemp (קודם: הדרישה
    # הייתה הפוכה, «אין mktemp אחרי ה-trap», והשתיים סתרו זו את זו ⇒ הענף אדום). INT/TERM ⇒ יציאה עם קוד-אות.
    assert re.search(r"^trap cleanup EXIT$", SRC, flags=re.M)
    assert re.search(r"^trap 'exit 130' INT$", SRC, flags=re.M)
    assert re.search(r"^trap 'exit 143' TERM$", SRC, flags=re.M)
    assert SRC.index("trap cleanup") < SRC.index("python3 -m app.gi_mock")   # לפני שמרימים שרתים
    body = _cleanup_body()
    assert 'kill "$GI"' in body and 'kill "$SMS"' in body
    assert "$(mktemp" not in SRC.split("trap cleanup", 1)[0]                # אין mktemp לפני ה-trap


# ── הפעלה 229 (ביקורת מ-227 ה׳): kill ⇒ wait עם תקרה ⇒ rm ─────────────────────────────────────────────
import os  # noqa: E402
import shutil  # noqa: E402
import subprocess  # noqa: E402
import time  # noqa: E402

import pytest  # noqa: E402

BASH = shutil.which("bash")


def _cleanup_fn() -> str:
    m = re.search(r"^cleanup\(\) \{\n.*?^\}\n", SRC, flags=re.S | re.M)
    assert m
    return m.group(0)


def test_cleanup_order_kill_then_wait_then_tail_and_rm():
    """kill בלי wait: שרת שעוד נסגר כותב ללוג אחרי ה-rm (יתום ב-TMPDIR) ומחזיק את הפורט לריצה הבאה."""
    body = _cleanup_body()
    kill = body.index('kill "$GI"')
    k9 = body.index("kill -9")
    wait = body.index('wait "$p"')
    tail = body.index("tail -n 30")
    rm = body.index("rm -f")
    assert kill < k9 < wait < tail < rm


def _run_cleanup(tmp_path, server: str) -> tuple[float, int, Path]:
    log = tmp_path / "gi.log"
    log.write_text("x")
    pidfile = tmp_path / "pid"
    script = (
        _cleanup_fn()
        + f'GI_LOG="{log}"; SMS_LOG=""; SMS=""\n'
        + f"{server} &\n"
        + f'GI=$!; echo $GI > "{pidfile}"; sleep 0.3\n'
        + "(exit 0); cleanup\n"
    )
    t0 = time.monotonic()
    proc = subprocess.run(  # noqa: S603  # nosec B603
        [BASH, "-c", script], env={"PATH": "/usr/bin:/bin"}, timeout=20, capture_output=True,
    )
    assert proc.returncode == 0, proc.stderr
    return time.monotonic() - t0, int(pidfile.read_text()), log


@pytest.mark.skipif(BASH is None, reason="אין bash")
def test_cleanup_does_not_hang_on_server_ignoring_sigterm(tmp_path):
    took, pid, log = _run_cleanup(tmp_path, "bash -c 'trap \"\" TERM; while :; do sleep 0.1; done'")
    assert took < 10, f"cleanup נתקע {took:.1f}s מול שרת שמתעלם מ-SIGTERM"
    with pytest.raises(ProcessLookupError):
        os.kill(pid, 0)
    assert not log.exists()


@pytest.mark.skipif(BASH is None, reason="אין bash")
def test_cleanup_fast_when_server_exits_on_sigterm(tmp_path):
    took, pid, log = _run_cleanup(tmp_path, "sleep 30")
    assert took < 2.5
    with pytest.raises(ProcessLookupError):
        os.kill(pid, 0)
    assert not log.exists()


def test_http_gi_run_is_seeded_and_strict():
    """ריצת ה-HTTP של חשבונית ירוקה מוכנת כמו sandbox (זיכוי מקושר · תשלום חלקי · קבלה) ונכשלת על GAP —
    אחרת היא חלשה מהריצה בתוך התהליך (היה: 16/1 GAP/5 SKIP; עכשיו 19/0/3 — רק בדיקות כתיבה)."""
    for seed in ('"type":330', "/partial", "/demo5/pay"):
        assert seed in SRC, seed
    assert '--json "$GI_REPORT"' in SRC and '"GAP", "FAIL"' in SRC
    assert SRC.index("curl -sf -o /dev/null -X POST \"$A/documents\"") < SRC.index("gi_contract_check.py")

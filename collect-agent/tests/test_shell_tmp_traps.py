"""הפעלה 221 — משלים את tests/test_shell_tmp_cleanup.py (מגן trap-לפני-mktemp, QA 7052f9d8) בשלושה חורים
שנמצאו בהרצת אותות אמיתית על demo.sh:
1. אתחול לריק לפני ה-trap (לקח סבב 86): משתנה mktemp בלי `VAR=""` לפני ה-trap ⇒ ניקוי מוקדם מוחק ערך
   שירשנו מהסביבה.
2. `trap cleanup EXIT INT TERM`: אות לתהליך הסקריפט (kill/timeout/ביטול CI) הריץ cleanup (הרג שרתים, מחק
   קבצים) **וההדגמה המשיכה** עד שקרסה בשגיאה מטעה (`cat: … No such file`, יציאה 1). עכשיו INT⇒exit 130,
   TERM⇒exit 143, וה-EXIT מנקה פעם אחת.
3. Ctrl+C בזמן עליית השרת: השרת כתב את קובץ סוד ה-TOTP *אחרי* ה-rm ⇒ הסוד נשאר ב-TMPDIR. cleanup: kill⇒wait⇒rm.
"""
import os
import re
import shutil
import signal
import subprocess  # nosec B404
import sys
import time
from pathlib import Path

import pytest

from tests.shell_files import sh_id, tracked_sh

ROOT = Path(__file__).resolve().parent.parent
# הפעלה 233: כל `*.sh` שב-git (היה: demo.sh + scripts/ בלבד)
SCRIPTS = tracked_sh()
BASH = shutil.which("bash")


def _trap_lines(text: str) -> list[tuple[int, str]]:
    return [(i, ln) for i, ln in enumerate(text.splitlines()) if re.match(r"\s*trap\s", ln)]


@pytest.mark.parametrize("path", SCRIPTS, ids=sh_id)
def test_mktemp_vars_are_initialised_empty_before_first_trap(path):
    lines = path.read_text(encoding="utf-8").splitlines()
    first_trap = next((i for i, ln in enumerate(lines) if re.match(r"\s*trap\s", ln)), None)
    for ln in lines:
        # הפעלה 233: גם באמצע שורה (`KEEP=0; OUT="$(mktemp -d)"`) — היה re.match בתחילת שורה בלבד
        m = None if ln.lstrip().startswith("#") else re.search(r'(?:^|[;&|])\s*([A-Z_]+)="\$\(mktemp( -d)?\)"', ln)
        if not m:
            continue
        var = m.group(1)
        init = [j for j, ln2 in enumerate(lines)
                if re.search(rf'(^|[;\s]){var}=(""|\'\')(;|\s|$)', ln2)]
        assert first_trap is not None and init and min(init) < first_trap, (
            f"{path.name}: {var} לא מאותחל לריק לפני ה-trap הראשון")


@pytest.mark.parametrize("path", SCRIPTS, ids=sh_id)
def test_no_trap_on_int_that_continues(path):
    """trap על INT/TERM שלא יוצא ⇒ הסקריפט ממשיך אחרי Ctrl+C."""
    for _, ln in _trap_lines(path.read_text(encoding="utf-8")):
        sigs = re.findall(r"\b(INT|TERM)\b", ln.split("'")[-1] if "'" in ln else ln)
        if sigs:
            assert "exit" in ln, f"{path.name}: {ln.strip()} — לא יוצא אחרי האות"


def _sigint_default() -> None:
    signal.signal(signal.SIGINT, signal.SIG_DFL)


@pytest.mark.skipif(BASH is None, reason="אין bash")
def test_demo_sigint_stops_and_cleans_once(tmp_path):
    """ה-traps האמיתיים של demo.sh: SIGINT באמצע ⇒ יציאה 130, cleanup פעם אחת, לא ממשיך."""
    text = (ROOT / "demo.sh").read_text(encoding="utf-8")
    traps = "\n".join(ln for _, ln in _trap_lines(text))
    script = (
        "set -euo pipefail\n"
        'cleanup() { echo CLEAN >> "$OUT"; }\n'
        + traps + "\n"
        'echo READY >> "$OUT"\n'
        "sleep 20 & wait $!\n"
        'echo CONTINUED >> "$OUT"\n'
    )
    out = tmp_path / "out.txt"
    proc = subprocess.Popen(  # noqa: S603  # nosec B603
        [BASH, "-c", script], env={"PATH": "/usr/bin:/bin", "OUT": str(out)},
        # הפעלה 378 (QA #1, «נופל תחת עומס» 375–377): השארדים רצים כ-job ברקע (`pytest … &`) ⇒ SIGINT יורש
        # SIG_IGN, ו-bash לא-אינטראקטיבי לא יכול ללכוד אות שהיה מוזנח בכניסה ⇒ ה-trap מת, sleep 20 ⇒ Timeout.
        # שוחזר דטרמיניסטית (`bash -c 'pytest … & wait'`). הבדיקה בודקת את demo.sh, לא את סביבת המריץ ⇒ מאפסים.
        preexec_fn=_sigint_default,  # noqa: PLW1509
    )
    deadline = time.monotonic() + 30
    while not (out.exists() and "READY" in out.read_text()):
        assert proc.poll() is None, f"bash יצא לפני READY (rc={proc.returncode})"
        assert time.monotonic() < deadline, "bash לא הגיע ל-READY תוך 30 שניות"
        time.sleep(0.05)
    proc.send_signal(signal.SIGINT)
    rc = proc.wait(timeout=10)
    log = out.read_text().split()
    assert "CONTINUED" not in log, "demo.sh ממשיך אחרי Ctrl+C"
    assert log.count("CLEAN") == 1, log
    assert rc == 130


def test_demo_cleanup_waits_for_servers_before_removing_secret():
    """Ctrl+C בזמן עליית השרת: השרת כתב את קובץ סוד ה-TOTP אחרי ה-rm ⇒ הסוד נשאר ב-TMPDIR.
    נמצא בהרצת SIGINT אמיתית על demo.sh (הפעלה 221). cleanup חייב: kill ⇒ wait ⇒ rm."""
    text = (ROOT / "demo.sh").read_text(encoding="utf-8")
    body = re.search(r"^cleanup\(\) \{\n(.*?)\n\}\n", text, re.S | re.M).group(1)
    kill = body.find("kill ")
    wait = body.find('wait "$p"')
    rm = body.find("rm -f")
    assert -1 < kill < wait < rm, "cleanup: חייב לחכות לשרתים (wait) בין ה-kill למחיקת הקבצים"


def _demo_cleanup_fn() -> str:
    text = (ROOT / "demo.sh").read_text(encoding="utf-8")
    return re.search(r"^cleanup\(\) \{\n.*?\n\}\n", text, re.S | re.M).group(0)


@pytest.mark.skipif(BASH is None, reason="אין bash")
def test_demo_cleanup_does_not_hang_on_server_ignoring_sigterm(tmp_path):
    """ביקורת סבב 87 (ד׳), הפעלה 227: `wait` בלי תקרה נתקע לנצח כששרת מתעלם מ-SIGTERM (graceful shutdown
    תקוע) ⇒ Ctrl+C/ביטול CI תקע את ההדגמה. ה-cleanup האמיתי של demo.sh, מול שרת שבולע TERM: חייב לסיים
    תוך ~5 שניות, להרוג את השרת (kill -9) ולמחוק את הקבצים."""
    secret = tmp_path / "secret.txt"
    secret.write_text("x")
    pidfile = tmp_path / "pid"
    script = (
        _demo_cleanup_fn()
        + 'PID="" GI_PID="" LOG="" GI_LOG="" BK="" WP="" EN=""\n'
        + f'OWN_SECRET="{secret}"\n'
        # «שרת» שמתעלם מ-SIGTERM
        + "bash -c 'trap \"\" TERM; while :; do sleep 0.1; done' &\n"
        + f'PID=$!; echo $PID > "{pidfile}"; sleep 0.3\n'
        + "cleanup\n"
    )
    t0 = time.monotonic()
    proc = subprocess.run(  # noqa: S603  # nosec B603
        [BASH, "-c", script], env={"PATH": "/usr/bin:/bin"}, timeout=20,
    )
    took = time.monotonic() - t0
    assert proc.returncode == 0
    assert took < 10, f"cleanup נתקע {took:.1f}s מול שרת שמתעלם מ-SIGTERM"
    pid = int(pidfile.read_text())
    with pytest.raises(ProcessLookupError):
        os.kill(pid, 0)
    assert not secret.exists(), "הסוד לא נמחק"


@pytest.mark.skipif(BASH is None, reason="אין bash")
def test_demo_cleanup_fast_when_server_exits_on_sigterm(tmp_path):
    """המסלול הרגיל: שרת שיוצא על SIGTERM ⇒ cleanup לא מחכה את כל התקרה (לא מאט כל ריצה ב-5 שניות)."""
    script = (
        _demo_cleanup_fn()
        + 'PID="" GI_PID="" LOG="" GI_LOG="" OWN_SECRET="" BK="" WP="" EN=""\n'
        + "sleep 30 & PID=$!\n"
        + "cleanup\n"
    )
    t0 = time.monotonic()
    subprocess.run([BASH, "-c", script], env={"PATH": "/usr/bin:/bin"}, timeout=20, check=True)  # noqa: S603  # nosec B603
    assert time.monotonic() - t0 < 2.5


def test_demo_interactive_server_runs_in_background_with_wait():
    """הפעלה 227: במצב האינטראקטיבי uvicorn רץ בחזית ⇒ bash דוחה את ה-trap עד שהפקודה מסתיימת ⇒ SIGTERM לסקריפט
    (kill/timeout/«עצור» ב-IDE) לא עשה כלום, ואחרי SIGKILL נשארו uvicorn + ה-mock יתומים על הפורטים (נמצא בפועל:
    הריצה הבאה דיברה עם השרת הישן ⇒ 401). חייב: ברקע, PID=$!, ואז `wait "$PID"` (נקטע ע״י אות)."""
    text = (ROOT / "demo.sh").read_text(encoding="utf-8")
    branch = re.search(r'if \[\[ "\$\{1:-\}" != "--check" \]\]; then\n(.*?)\nfi\n', text, re.S).group(1)
    uv = [ln for ln in branch.splitlines() if "uvicorn" in ln and not ln.lstrip().startswith("#")]
    assert uv and all(ln.rstrip().endswith("&") for ln in uv), "uvicorn במצב האינטראקטיבי חייב לרוץ ברקע"
    assert "PID=$!" in branch and 'wait "$PID"' in branch


def _free_port() -> int:
    import socket
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.mark.skipif(BASH is None or shutil.which("curl") is None, reason="אין bash/curl")
def test_demo_interactive_sigterm_stops_servers(tmp_path):
    """ההדגמה האמיתית במצב אינטראקטיבי: SIGTERM לסקריפט ⇒ יוצא 143 ולא נשאר אף שרת על הפורטים."""
    import sys
    curl = shutil.which("curl")

    def http_ok(p: int, path: str = "/") -> bool:  # curl בתת-תהליך: ה-conftest חוסם sockets בתוך pytest
        return subprocess.run(  # noqa: S603  # nosec B603
            [curl, "-s", "-o", "/dev/null", "-m", "1", f"http://127.0.0.1:{p}{path}"], check=False,
        ).returncode == 0
    port, gi_port = _free_port(), _free_port()
    env = {**os.environ, "PORT": str(port), "GI_PORT": str(gi_port),
           "PATH": f"{Path(sys.executable).parent}:{os.environ.get('PATH', '')}"}
    proc = subprocess.Popen(  # noqa: S603  # nosec B603
        [BASH, str(ROOT / "demo.sh")], cwd=ROOT, env=env,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(240):
            if http_ok(port, "/health"):
                break
            if proc.poll() is not None:
                pytest.fail(f"demo.sh יצא לפני שהשרת עלה (rc={proc.returncode})")
            time.sleep(0.25)
        else:
            pytest.fail("השרת לא עלה")
        proc.send_signal(signal.SIGTERM)
        rc = proc.wait(timeout=20)
        assert rc == 143, rc
        time.sleep(0.5)
        assert not http_ok(port), "שרת גבי נשאר חי אחרי SIGTERM לסקריפט"
        assert not http_ok(gi_port), "ה-mock של חשבונית ירוקה נשאר חי אחרי SIGTERM לסקריפט"
    finally:
        if proc.poll() is None:
            proc.kill()
        subprocess.run(["pkill", "-f", f"--port {port}"], check=False)  # noqa: S603,S607  # nosec
        subprocess.run(["pkill", "-f", f"--port {gi_port}"], check=False)  # noqa: S603,S607  # nosec


@pytest.mark.skipif(BASH is None, reason="אין bash")
def test_sigint_test_survives_runner_with_ignored_sigint():
    """הפעלה 378: הבדיקה למעלה נפלה ב-375/376/377 בהרצת 4 שארדים ועברה לבד. השורש: מריץ שהופעל כ-job ברקע
    יורש SIGINT=SIG_IGN. מריצים אותה כאן כשה-SIGINT מוזנח בתהליך-האב — חייבת לעבור."""
    rc = subprocess.run(  # noqa: S603  # nosec B603
        [sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider",
         f"{Path(__file__)}::test_demo_sigint_stops_and_cleans_once"],
        cwd=ROOT, capture_output=True, text=True, timeout=60,
        preexec_fn=lambda: signal.signal(signal.SIGINT, signal.SIG_IGN),  # noqa: PLW1509
    )
    assert rc.returncode == 0, rc.stdout[-2000:] + rc.stderr[-2000:]

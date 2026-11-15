"""הפעלה 221 — משלים את tests/test_shell_tmp_cleanup.py (מגן trap-לפני-mktemp, QA 7052f9d8) בשלושה חורים
שנמצאו בהרצת אותות אמיתית על demo.sh:
1. אתחול לריק לפני ה-trap (לקח סבב 86): משתנה mktemp בלי `VAR=""` לפני ה-trap ⇒ ניקוי מוקדם מוחק ערך
   שירשנו מהסביבה.
2. `trap cleanup EXIT INT TERM`: אות לתהליך הסקריפט (kill/timeout/ביטול CI) הריץ cleanup (הרג שרתים, מחק
   קבצים) **וההדגמה המשיכה** עד שקרסה בשגיאה מטעה (`cat: … No such file`, יציאה 1). עכשיו INT⇒exit 130,
   TERM⇒exit 143, וה-EXIT מנקה פעם אחת.
3. Ctrl+C בזמן עליית השרת: השרת כתב את קובץ סוד ה-TOTP *אחרי* ה-rm ⇒ הסוד נשאר ב-TMPDIR. cleanup: kill⇒wait⇒rm.
"""
import re
import shutil
import signal
import subprocess  # nosec B404
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = [ROOT / "demo.sh", *sorted((ROOT / "scripts").glob("*.sh"))]
BASH = shutil.which("bash")


def _trap_lines(text: str) -> list[tuple[int, str]]:
    return [(i, ln) for i, ln in enumerate(text.splitlines()) if re.match(r"\s*trap\s", ln)]


@pytest.mark.parametrize("path", SCRIPTS, ids=lambda p: p.name)
def test_mktemp_vars_are_initialised_empty_before_first_trap(path):
    lines = path.read_text(encoding="utf-8").splitlines()
    first_trap = next((i for i, ln in enumerate(lines) if re.match(r"\s*trap\s", ln)), None)
    for ln in lines:
        m = re.match(r'\s*([A-Z_]+)="\$\(mktemp( -d)?\)"', ln)
        if not m:
            continue
        var = m.group(1)
        init = [j for j, ln2 in enumerate(lines)
                if re.search(rf'(^|[;\s]){var}=(""|\'\')(;|\s|$)', ln2)]
        assert first_trap is not None and init and min(init) < first_trap, (
            f"{path.name}: {var} לא מאותחל לריק לפני ה-trap הראשון")


@pytest.mark.parametrize("path", SCRIPTS, ids=lambda p: p.name)
def test_no_trap_on_int_that_continues(path):
    """trap על INT/TERM שלא יוצא ⇒ הסקריפט ממשיך אחרי Ctrl+C."""
    for _, ln in _trap_lines(path.read_text(encoding="utf-8")):
        sigs = re.findall(r"\b(INT|TERM)\b", ln.split("'")[-1] if "'" in ln else ln)
        if sigs:
            assert "exit" in ln, f"{path.name}: {ln.strip()} — לא יוצא אחרי האות"


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
    )
    for _ in range(100):
        if out.exists() and "READY" in out.read_text():
            break
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

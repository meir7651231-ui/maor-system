"""הפעלה 231 (QA, «הבא» 2 מ-230) — מגן-מקור כללי לתהליכי רקע בכל קובץ `*.sh` בתיקייה.

רקע: שלוש פעמים תוקן אותו באג, כל פעם בסקריפט אחר — demo.sh (227), contract_checks_http.sh (229),
smoke_server.sh (230): שרת שהורם ברקע נהרג ב-`kill` בלי `wait` ⇒ כותב לקבצים שכבר נמחקו, מחזיק פורט, ושרת
שמתעלם מ-SIGTERM נשאר יתום. הסריקה הכללית מצאה מופע רביעי ש**אף מגן לא כיסה** (המגנים הקודמים סרקו רק את
demo.sh ו-scripts/): `marketing/video/compose/run_edit.sh` — composite ברקע בלי `$!`, בלי trap ו-`wait` חשוף
(מחזיר 0 גם כשהרינדור ברקע נכשל ⇒ verify רץ על mp4 שבור; כשל בחזית ⇒ הרקע יתום).

הכלל, לכל `*.sh` שנמצא ב-git תחת collect-agent/ ומריץ פקודה ברקע (`… &`):
1. ה-PID נלכד (`VAR=$!` באותה שורה או בשורה הבאה) — אחרת אי אפשר להרוג או לחכות לו.
2. יש `trap <fn> EXIT`, וב-fn: `kill` ⇒ `kill -9` ⇒ `wait` בסדר הזה, וכל `rm` אחרי ה-wait. כל משתנה PID מופיע בה.
3. אין `wait` חשוף (בלי PID) — הוא מחזיר 0 ובולע כשל של תהליך הרקע.
"""
import os
import re
import shutil
import signal
import subprocess  # nosec B404
import time
from pathlib import Path

import pytest

from tests.shell_files import tracked_sh

ROOT = Path(__file__).resolve().parent.parent
SH = shutil.which("sh")

SCRIPTS = tracked_sh()
# `&` שמסיים פקודה: לא `&&`, לא `2>&1`/`&>`, ואחריו סוף שורה, `;` או `VAR=$!`.
BG_RE = re.compile(r"(?<![&>|<0-9])&(?![&>])\s*(?:;|$|[A-Za-z_][A-Za-z0-9_]*=\$!)")
PID_RE = re.compile(r"\b([A-Za-z_][A-Za-z0-9_]*)=\$!")


def _code_lines(text: str) -> list[str]:
    return [("" if ln.lstrip().startswith("#") else ln) for ln in text.splitlines()]


def _bg_launches(lines: list[str]) -> list[int]:
    return [i for i, ln in enumerate(lines) if BG_RE.search(ln)]


def _pid_vars(lines: list[str]) -> set[str]:
    return {m.group(1) for ln in lines for m in PID_RE.finditer(ln)}


def _exit_handler_body(lines: list[str]) -> list[str] | None:
    name = None
    for ln in lines:
        m = re.match(r"\s*trap\s+['\"]?([A-Za-z_][A-Za-z0-9_]*)['\"]?\s+.*\bEXIT\b", ln)
        if m:
            name = m.group(1)
    if not name:
        return None
    start = next((i for i, ln in enumerate(lines) if re.match(rf"\s*{name}\s*\(\)\s*\{{", ln)), None)
    if start is None:
        return None
    end = next(j for j in range(start + 1, len(lines)) if re.match(r"^\}\s*$", lines[j]))
    return lines[start + 1:end]


def _first(body: list[str], pat: str) -> int | None:
    return next((i for i, ln in enumerate(body) if re.search(pat, ln)), None)


BG_SCRIPTS = [p for p in SCRIPTS if _bg_launches(_code_lines(p.read_text(encoding="utf-8")))]


def test_scan_sees_every_known_background_script():
    """הסריקה עצמה לא עיוורת: ארבעת הסקריפטים המוכרים מזוהים (מוטציה ב-BG_RE ⇒ נופל כאן)."""
    names = {p.relative_to(ROOT).as_posix() for p in BG_SCRIPTS}
    assert {"demo.sh", "scripts/contract_checks_http.sh", "scripts/smoke_server.sh",
            "marketing/video/compose/run_edit.sh"} <= names, names


@pytest.mark.parametrize("path", BG_SCRIPTS, ids=lambda p: p.relative_to(ROOT).as_posix())
def test_background_pid_is_captured(path):
    lines = _code_lines(path.read_text(encoding="utf-8"))
    for i in _bg_launches(lines):
        here = PID_RE.search(lines[i])
        nxt = next((ln for ln in lines[i + 1:] if ln.strip()), "")
        assert here or PID_RE.match(nxt.strip()), (
            f"{path.name}:{i + 1}: תהליך ברקע בלי VAR=$! — אי אפשר להרוג/לחכות לו")


@pytest.mark.parametrize("path", BG_SCRIPTS, ids=lambda p: p.relative_to(ROOT).as_posix())
def test_exit_cleanup_kills_then_kill9_then_waits_before_rm(path):
    lines = _code_lines(path.read_text(encoding="utf-8"))
    body = _exit_handler_body(lines)
    assert body is not None, f"{path.name}: מריץ תהליך ברקע בלי trap <fn> EXIT"
    text = "\n".join(body)
    k = _first(body, r"\bkill\s+(?!-0\b|-9\b)")
    k9 = _first(body, r"\bkill\s+-9\b")
    w = _first(body, r"\bwait\s+\S")
    assert k is not None and k9 is not None and w is not None, (
        f"{path.name}: ה-cleanup חייב kill ⇒ kill -9 ⇒ wait (נמצא kill={k}, kill -9={k9}, wait={w})")
    assert k < k9 < w, f"{path.name}: סדר שגוי ב-cleanup (kill={k}, kill -9={k9}, wait={w})"
    rm = _first(body, r"\brm\s")
    assert rm is None or rm > w, f"{path.name}: rm לפני wait — השרת עוד כותב לתיקייה שנמחקת"
    for var in _pid_vars(lines):
        assert re.search(rf"\b{var}\b", text), f"{path.name}: ${var} (PID ברקע) לא נהרג ב-cleanup"


@pytest.mark.parametrize("path", BG_SCRIPTS, ids=lambda p: p.relative_to(ROOT).as_posix())
def test_no_bare_wait(path):
    """`wait` בלי PID מחזיר 0 גם כשתהליך הרקע נכשל."""
    for i, ln in enumerate(_code_lines(path.read_text(encoding="utf-8"))):
        for m in re.finditer(r"(?:^|[;&|]\s*|\s)wait\b(.*)", ln):
            rest = m.group(1).split(";")[0].strip()
            assert rest and not rest.startswith(("#", "||", "&&")), f"{path.name}:{i + 1}: wait חשוף"


# --- התנהגות אמיתית של run_edit.sh מול PY מזויף ---------------------------------------------------

FAKE_PY = r"""#!/bin/sh
# composite ברקע = הפלט הסופי (ארגומנט 9 שאינו /dev/null)
case "$1" in
  composite.py)
    if [ "$9" != /dev/null ]; then
      echo $$ > "$MARK/bg.pid"
      trap '' TERM
      [ "$MODE" = bgfail ] && exit 3
      i=0; while [ $i -lt 300 ]; do sleep 0.1; i=$((i + 1)); done
      exit 0
    fi
    [ "$MODE" = fgfail ] && { sleep 0.5; exit 2; }
    i=0; while [ ! -s "$MARK/bg.pid" ] && [ $i -lt 50 ]; do sleep 0.1; i=$((i + 1)); done
    sleep 0.5; exit 0 ;;
  verify.py) echo ran > "$MARK/verify"; exit 0 ;;
  *) exit 0 ;;
esac
"""


def _run_edit(tmp_path: Path, mode: str, script: Path | None = None):
    py = tmp_path / "py"
    py.write_text(FAKE_PY, encoding="utf-8")
    py.chmod(0o755)
    mark = tmp_path / "mark"
    mark.mkdir()
    env = {**os.environ, "PY": str(py), "MARK": str(mark), "MODE": mode, "CLIPS": "h"}
    t0 = time.monotonic()
    r = subprocess.run([SH, str(script or ROOT / "marketing/video/compose/run_edit.sh"), str(tmp_path)],  # noqa: S603  # nosec B603
                       cwd=tmp_path, env=env, capture_output=True, text=True, timeout=60)
    return r, time.monotonic() - t0, mark


def _alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    # זומבי עדיין «חי» ל-kill -0; קוראים את המצב מ-/proc כשיש
    stat = Path(f"/proc/{pid}/stat")
    return not (stat.exists() and stat.read_text().split(") ")[-1].startswith("Z"))


@pytest.mark.skipif(SH is None, reason="אין sh")
def test_run_edit_foreground_failure_does_not_orphan_background(tmp_path):
    r, dt, mark = _run_edit(tmp_path, "fgfail")
    pid = int((mark / "bg.pid").read_text())
    try:
        assert r.returncode != 0
        assert dt < 15, f"cleanup נתקע ({dt:.1f}s)"
        assert not _alive(pid), "composite ברקע נשאר יתום אחרי כשל בחזית"
        assert not (mark / "verify").exists()
    finally:
        if _alive(pid):
            os.kill(pid, signal.SIGKILL)


@pytest.mark.skipif(SH is None, reason="אין sh")
def test_run_edit_background_failure_stops_before_verify(tmp_path):
    r, _, mark = _run_edit(tmp_path, "bgfail")
    assert r.returncode != 0, "כשל הרינדור ברקע נבלע (wait חשוף)"
    assert not (mark / "verify").exists(), "verify רץ על mp4 שהרינדור שלו נכשל"


@pytest.mark.skipif(SH is None, reason="אין sh")
def test_run_edit_mutation_bare_wait_is_caught(tmp_path):
    """בקרה: הגרסה הישנה (בלי $!/trap, wait חשוף) — אותו תרחיש מפיל אותה. מוכיח שהבדיקות לא ריקות."""
    old = (ROOT / "marketing/video/compose/run_edit.sh").read_text(encoding="utf-8")
    old = re.sub(r"BG=\"\"\ncleanup\(\) \{.*?\n\}\ntrap cleanup EXIT\n", "", old, flags=re.S)
    old = old.replace("  BG=$!\n", "").replace('  wait "$BG"; BG=""\n', "  wait\n")
    assert "trap cleanup EXIT" not in old and "  BG=$!" not in old
    mutant = tmp_path / "old_run_edit.sh"
    mutant.write_text(old, encoding="utf-8")
    r, _, mark = _run_edit(tmp_path, "bgfail", mutant)
    assert r.returncode == 0 and (mark / "verify").exists(), "הבקרה לא משחזרת את הבאג הישן"

"""גבי בדיקות (BACKLOG): כל `mktemp` בסקריפטי ה-shell נמחק גם בכשל.

הבאג: ב-`smoke_server.sh` ה-trap נרשם 3 שורות אחרי `mktemp`, וב-`ci_clean_demo.sh` התיקייה נמחקה רק
בשורה האחרונה (במסלול ההצלחה) — כל `exit 1` באמצע השאיר אותה ב-/tmp. ב-CI זה מצטבר, ובמקומי
זה משאיר צילומי-עץ של הפרויקט.

הכלל (מגן-מקור): לכל `VAR="$(mktemp ...)"` יש לפניו `trap` שהמטפל שלו (מחרוזת או פונקציה)
מוחק את `$VAR`. ובנוסף ריצה אמיתית של smoke_server.sh שנכשלת מיד אחרי mktemp ⇒ לא נשאר כלום.
"""
from __future__ import annotations

import os
import re
import subprocess
from pathlib import Path

import pytest

from tests.shell_files import sh_id, tracked_sh

ROOT = Path(__file__).resolve().parents[1]
# הפעלה 233: כל `*.sh` שב-git (היה: רק `*.sh` בשורש + `scripts/` ⇒ `marketing/video/compose/*.sh` לא נסרק).
SCRIPTS = tracked_sh()

# הפעלה 233: גם השמה באמצע שורה (`KEEP=0; OUT="$(mktemp -d)"` ב-sandbox_day.sh היה **שקוף למגן** —
# ה-regex דרש את ההשמה בתחילת השורה, אז הסקריפט עבר בלי שאף כלל נבדק עליו).
MKTEMP = re.compile(r'(?:^|[;&|]\s*|^\s*)(?:local\s+)?([A-Z_][A-Z0-9_]*)="\$\(mktemp\b')
# כל קריאה ל-mktemp בקוד (לא בהערה) — חייבת להיות בצורה ש-MKTEMP מזהה
MKTEMP_ANY = re.compile(r"\bmktemp\b")
TRAP = re.compile(r"^\s*trap\s+(?:'([^']*)'|\"([^\"]*)\"|([A-Za-z_][A-Za-z0-9_]*))\s")


def _func_body(lines: list[str], name: str) -> str:
    out, inside = [], False
    for ln in lines:
        if re.match(rf"^\s*{re.escape(name)}\s*\(\)\s*\{{", ln):
            if re.search(r"\}\s*$", ln):   # פונקציה בשורה אחת: cleanup() { ...; }
                return ln
            inside = True
            continue
        if inside:
            if re.match(r"^\s*\}\s*$", ln):
                break
            out.append(ln)
    return "\n".join(out)


def _covers(handler: str, var: str) -> bool:
    return bool(re.search(rf"\$\{{?{var}\b", handler)) and "rm " in handler


# שורות שלא יכולות להיכשל בין mktemp ל-trap (מוסכמת הצוות, test_contract_checks_http_sh):
# השמה פשוטה, mktemp נוסף, הגדרת פונקציה, fi/else, הערה, שורה ריקה
_SAFE = re.compile(r'^\s*(#.*|$|fi\b.*|else\b.*|[A-Za-z_][A-Za-z0-9_]*="[^"$`]*"(;\s*[A-Za-z_][A-Za-z0-9_]*'
                   r'="[^"$`]*")*;?\s*(#.*)?|[A-Z_][A-Z0-9_]*="\$\(mktemp[^)]*\)"(;.*)?|'
                   r'.*KEEP=\d.*)$')


def _trap_covers(lines: list[str], line: str, var: str) -> bool:
    t = TRAP.match(line)
    if not t:
        return False
    handler = t.group(1) or t.group(2) or _func_body(lines, t.group(3))
    return _covers(handler, var)


def violations(text: str) -> list[str]:
    lines = text.splitlines()
    bad = []
    for i, ln in enumerate(lines):
        m = MKTEMP.search(ln)
        if not m or ln.lstrip().startswith("#"):
            continue
        var = m.group(1)
        # (א) trap שמכסה לפני ה-mktemp
        ok = any(_trap_covers(lines, prev, var) for prev in lines[:i])
        # (ב) או trap שמכסה מיד אחרי — כשבאמצע רק שורות שלא נכשלות / גוף הפונקציה שה-trap קורא לה
        if not ok:
            j, in_func = i + 1, False
            while j < len(lines):
                cur = lines[j]
                if _trap_covers(lines, cur, var):
                    ok = True
                    break
                if re.match(r"^\s*[A-Za-z_][A-Za-z0-9_]*\s*\(\)\s*\{", cur):
                    in_func = not re.search(r"\}\s*$", cur)
                elif in_func:
                    in_func = not re.match(r"^\s*\}\s*$", cur)
                elif not _SAFE.match(cur):
                    break
                j += 1
        if not ok:
            bad.append(f"שורה {i + 1}: {var}=$(mktemp) בלי trap שמוחק אותו לפני כן")
    return bad


def unrecognised_mktemp(text: str) -> list[str]:
    """שורות קוד שקוראות ל-mktemp בצורה שהמגן לא מזהה (לא `VAR="$(mktemp …)"`) ⇒ היו עוברות בשקט."""
    return [f"שורה {i + 1}: {ln.strip()}" for i, ln in enumerate(text.splitlines())
            if not ln.lstrip().startswith("#") and MKTEMP_ANY.search(ln.split(" #")[0])
            and not MKTEMP.search(ln)]


def test_scripts_found():
    ids = {sh_id(p) for p in SCRIPTS}
    assert {"demo.sh", "scripts/smoke_server.sh", "scripts/ci_clean_demo.sh", "scripts/sandbox_day.sh",
            "marketing/video/compose/run_edit.sh", "marketing/video/compose/run_all.sh"} <= ids, ids


@pytest.mark.parametrize("script", SCRIPTS, ids=sh_id)
def test_every_mktemp_has_trap_before_it(script):
    assert violations(script.read_text(encoding="utf-8")) == []


@pytest.mark.parametrize("script", SCRIPTS, ids=sh_id)
def test_every_mktemp_is_visible_to_the_guard(script):
    """הפעלה 233: mktemp בצורה שהמגן לא מזהה = mktemp בלי מגן. צורה חדשה ⇒ להרחיב את MKTEMP, לא לעקוף."""
    assert unrecognised_mktemp(script.read_text(encoding="utf-8")) == []


def test_guard_sees_mid_line_mktemp():
    """sandbox_day.sh: `KEEP=0; OUT="$(mktemp -d)"` — לפני 233 לא נבדק בכלל. עכשיו: בלי trap ⇒ נתפס."""
    assert violations('KEEP=0; OUT="$(mktemp -d)"\necho x\n')
    assert not violations('OUT=""\ncleanup() { rm -rf "$OUT"; }\ntrap cleanup EXIT\nKEEP=0; OUT="$(mktemp -d)"\n')
    assert unrecognised_mktemp('cp a "$(mktemp)"\n') and unrecognised_mktemp("T=$(mktemp)\n")
    assert not unrecognised_mktemp('# mktemp בהערה\nX="$(mktemp)"\n')


def test_guard_catches_the_original_bug():
    """מבחן למגן: הצורה הישנה של smoke_server.sh וזו של ci_clean_demo.sh — נתפסות."""
    # smoke_server.sh הישן: export עם python3 (יכול להיכשל) לפני... לא — שם ה-trap היה אחרי השמות בלבד;
    # המקרה המזיק: פקודה שיכולה להיכשל בין mktemp ל-trap, או בלי trap בכלל (ci_clean_demo הישן)
    risky = 'TMP="$(mktemp -d)"\npython3 -c "x"\ntrap \'rm -rf "$TMP"\' EXIT\n'
    old_ci = 'SNAP_DIR="$(mktemp -d)"\necho x\nrm -rf "$SNAP_DIR"\n'
    assert violations(risky) and violations(old_ci)
    ok_team = 'A="$(mktemp)"\nB="$(mktemp)"\nX=""\ncleanup() {\n  rm -f "$A" "$B"\n}\ntrap cleanup EXIT\n'
    assert not violations(ok_team)
    assert violations("cleanup() {\n  echo hi\n}\ntrap cleanup EXIT\nX=\"$(mktemp)\"\n")
    assert not violations("cleanup() {\n  rm -f \"${X:-}\"\n}\ntrap cleanup EXIT\nX=\"$(mktemp)\"\n")


@pytest.mark.skipif(os.name != "posix", reason="bash")
def test_smoke_server_failure_right_after_mktemp_leaves_nothing(tmp_path):
    """ריצה אמיתית: python3 נכשל בשורה שאחרי mktemp ⇒ הסקריפט יוצא עם שגיאה, ו-TMPDIR ריק."""
    fake_bin = tmp_path / "bin"
    fake_bin.mkdir()
    py = fake_bin / "python3"
    py.write_text("#!/bin/sh\nexit 1\n")
    py.chmod(0o755)
    tmpdir = tmp_path / "tmp"
    tmpdir.mkdir()
    env = {**os.environ, "PATH": f"{fake_bin}:{os.environ['PATH']}", "TMPDIR": str(tmpdir)}
    r = subprocess.run(["bash", str(ROOT / "scripts" / "smoke_server.sh")], env=env,  # noqa: S603,S607
                       capture_output=True, text=True, timeout=60)
    assert r.returncode != 0
    assert list(tmpdir.iterdir()) == [], "נשארה תיקייה זמנית אחרי כשל"

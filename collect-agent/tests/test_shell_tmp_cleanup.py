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

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = sorted(p for p in [*ROOT.glob("*.sh"), *ROOT.glob("scripts/*.sh")]
                 if "node_modules" not in p.parts)

MKTEMP = re.compile(r'^\s*(?:local\s+)?([A-Z_][A-Z0-9_]*)="\$\(mktemp\b')
TRAP = re.compile(r"^\s*trap\s+(?:'([^']*)'|\"([^\"]*)\"|([A-Za-z_][A-Za-z0-9_]*))\s")


def _func_body(lines: list[str], name: str) -> str:
    out, inside = [], False
    for ln in lines:
        if re.match(rf"^\s*{re.escape(name)}\s*\(\)\s*\{{", ln):
            inside = True
            continue
        if inside:
            if re.match(r"^\s*\}\s*$", ln):
                break
            out.append(ln)
    return "\n".join(out)


def _covers(handler: str, var: str) -> bool:
    return bool(re.search(rf"\$\{{?{var}\b", handler)) and "rm " in handler


def violations(text: str) -> list[str]:
    lines = text.splitlines()
    bad = []
    for i, ln in enumerate(lines):
        m = MKTEMP.match(ln)
        if not m:
            continue
        var = m.group(1)
        ok = False
        for prev in lines[:i]:
            t = TRAP.match(prev)
            if not t:
                continue
            handler = t.group(1) or t.group(2) or _func_body(lines, t.group(3))
            if _covers(handler, var):
                ok = True
        if not ok:
            bad.append(f"שורה {i + 1}: {var}=$(mktemp) בלי trap שמוחק אותו לפני כן")
    return bad


def test_scripts_found():
    names = {p.name for p in SCRIPTS}
    assert {"demo.sh", "smoke_server.sh", "ci_clean_demo.sh"} <= names, names


@pytest.mark.parametrize("script", SCRIPTS, ids=lambda p: p.name)
def test_every_mktemp_has_trap_before_it(script):
    assert violations(script.read_text(encoding="utf-8")) == []


def test_guard_catches_the_original_bug():
    """מבחן למגן: הצורה הישנה של smoke_server.sh וזו של ci_clean_demo.sh — נתפסות."""
    old_smoke = 'TMP="$(mktemp -d)"\nPID=""\ntrap \'rm -rf "$TMP"\' EXIT\n'
    old_ci = 'SNAP_DIR="$(mktemp -d)"\necho x\nrm -rf "$SNAP_DIR"\n'
    assert violations(old_smoke) and violations(old_ci)
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

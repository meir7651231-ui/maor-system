"""QA (הפעלה 237): subprocess בסקריפטי scripts/*.py — כשל או תקיעה של git לא נבלעים.

הבאג: team_watch.py הריץ `git log` בלי check ובלי timeout. git שנכשל (ריפו נעול, cwd שגוי)
החזיר stdout ריק ⇒ «0 commits לכולם» ⇒ כל עובד עם שורה פתוחה סומן «להעיר», וה-state
התקדם ⇒ חלון הזמן אבד והבדיקה הבאה כבר לא ראתה את מה שקרה בו. git תקוע ⇒ המקשר תקוע לנצח.
עכשיו: כשל ⇒ יציאה 2 עם error, בלי לכתוב state; תקיעה ⇒ timeout. tree_guard קיבל timeout
(צעד CI תקוע עד 6 שעות). מגן-מקור: כל קריאת subprocess ב-scripts/*.py עם check+timeout.
"""
import ast
import importlib.util
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = sorted((ROOT / "scripts").glob("*.py"))
CALLS = {"run", "Popen", "call", "check_call", "check_output"}


def _load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / f"scripts/{name}.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def _subprocess_calls(path: Path):
    tree = ast.parse(path.read_text(encoding="utf-8"))
    for n in ast.walk(tree):
        if (isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and n.func.attr in CALLS
                and isinstance(n.func.value, ast.Name) and n.func.value.id == "subprocess"):
            yield n


def test_scan_sees_both_scripts():
    """נגד עיוורון של המגן: הסריקה מוצאת את שתי הקריאות הידועות."""
    found = {p.name for p in SCRIPTS for _ in _subprocess_calls(p)}
    assert {"team_watch.py", "tree_guard.py"} <= found


@pytest.mark.parametrize("path", SCRIPTS, ids=lambda p: p.name)
def test_every_subprocess_call_has_check_and_timeout(path):
    for call in _subprocess_calls(path):
        kw = {k.arg: k.value for k in call.keywords}
        assert call.func.attr != "Popen", f"{path.name}:{call.lineno} Popen — צריך ניקוי מפורש, לא כאן"
        assert "timeout" in kw, f"{path.name}:{call.lineno} בלי timeout"
        if call.func.attr == "run":
            assert isinstance(kw.get("check"), ast.Constant) and kw["check"].value is True, \
                f"{path.name}:{call.lineno} בלי check=True — כשל נבלע כפלט ריק"


def _fake_git(tmp_path: Path, body: str) -> Path:
    d = tmp_path / "bin"
    d.mkdir()
    g = d / "git"
    g.write_text(f"#!/bin/sh\n{body}\n")
    g.chmod(0o755)
    return d


def _run_watch(tmp_path, bindir, state):
    env = {**os.environ, "PATH": f"{bindir}{os.pathsep}{os.environ['PATH']}"}
    return subprocess.run(  # noqa: S603
        [sys.executable, "-I", str(ROOT / "scripts/team_watch.py"), "--since", "2026-11-01T00:00:00+00:00",
         "--state", str(state)], env=env, capture_output=True, text=True, timeout=60, check=False)


def test_team_watch_git_failure_exits_and_keeps_window(tmp_path):
    bindir = _fake_git(tmp_path, 'echo "fatal: not a git repository" >&2; exit 128')
    state = tmp_path / "state.json"
    state.write_text(json.dumps({"last": "2026-11-01T00:00:00+00:00"}))
    r = _run_watch(tmp_path, bindir, state)
    assert r.returncode == 2, r.stdout + r.stderr
    out = json.loads(r.stdout)
    assert "git log" in out["error"] and "not a git repository" in out["error"]
    assert "wake" not in out  # לא «להעיר» את כולם על סמך פלט ריק
    assert json.loads(state.read_text())["last"] == "2026-11-01T00:00:00+00:00"  # החלון נשמר


def test_team_watch_missing_state_not_created_on_failure(tmp_path):
    bindir = _fake_git(tmp_path, "exit 1")
    state = tmp_path / "state.json"
    assert _run_watch(tmp_path, bindir, state).returncode == 2
    assert not state.exists()


def test_team_watch_ok_control(tmp_path):
    """בקרה: git תקין ⇒ דוח מלא ו-state נכתב."""
    bindir = _fake_git(tmp_path, "exit 0")
    state = tmp_path / "state.json"
    r = _run_watch(tmp_path, bindir, state)
    assert r.returncode == 0, r.stderr
    out = json.loads(r.stdout)
    assert "workers" in out and len(out["workers"]) == 10
    assert json.loads(state.read_text())["last"] == out["now"]


def test_team_watch_hanging_git_times_out(tmp_path, monkeypatch):
    bindir = _fake_git(tmp_path, "exec sleep 30")
    tw = _load("team_watch")
    monkeypatch.setattr(tw, "GIT_TIMEOUT", 1)
    monkeypatch.setattr(tw.shutil, "which", lambda _: str(bindir / "git"))
    t0 = time.monotonic()
    with pytest.raises(tw.GitError, match="TimeoutExpired"):
        tw.commits_since("session_x", "2026-11-01")
    assert time.monotonic() - t0 < 10


def test_tree_guard_hanging_git_times_out(tmp_path, monkeypatch):
    bindir = _fake_git(tmp_path, "exec sleep 30")
    tg = _load("tree_guard")
    monkeypatch.setattr(tg, "GIT_TIMEOUT", 1)
    monkeypatch.setenv("PATH", f"{bindir}{os.pathsep}{os.environ['PATH']}")
    t0 = time.monotonic()
    with pytest.raises(subprocess.TimeoutExpired):
        tg.state(tmp_path)
    assert time.monotonic() - t0 < 10

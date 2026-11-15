"""שומר-העץ (scripts/tree_guard.py) — QA הפעלה 216.

הבאג שהוא נועד לתפוס: `test_wait_loud` יצר `collect-agent/.venv` (מתעלם ב-.gitignore) עם קישור
מת, ו-git status רגיל לא ראה כלום (215). כאן: מאגר git זמני, בלי לגעת בפרויקט.
"""

from __future__ import annotations

import importlib.util
import subprocess
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "tree_guard.py"
spec = importlib.util.spec_from_file_location("tree_guard", SCRIPT)
tg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tg)


@pytest.fixture
def repo(tmp_path: Path) -> Path:
    def git(*a: str) -> None:
        subprocess.run(["git", *a], cwd=tmp_path, check=True, capture_output=True)  # noqa: S603,S607

    git("init", "-q")
    (tmp_path / ".gitignore").write_text(".venv/\n*.sqlite3\n__pycache__/\n*.egg-info/\n")
    (tmp_path / "a.py").write_text("x = 1\n")
    git("add", ".")
    git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init")
    return tmp_path


def test_ignored_leftovers_are_caught(repo: Path) -> None:
    before = tg.state(repo)
    (repo / ".venv" / "bin").mkdir(parents=True)
    (repo / ".venv" / "bin" / "python3").write_text("")
    (repo / "x.sqlite3").write_text("")
    new = tg.diff(before, tg.state(repo))
    assert any(".venv/bin/python3" in ln for ln in new)
    assert any("x.sqlite3" in ln for ln in new)


def test_untracked_and_modified_are_caught(repo: Path) -> None:
    before = tg.state(repo)
    (repo / "a.py").write_text("x = 2\n")
    (repo / "new.txt").write_text("")
    new = tg.diff(before, tg.state(repo))
    assert any("a.py" in ln for ln in new) and any("new.txt" in ln for ln in new)


def test_interpreter_byproducts_are_allowed(repo: Path) -> None:
    before = tg.state(repo)
    (repo / "__pycache__").mkdir()
    (repo / "__pycache__" / "a.cpython-311.pyc").write_text("")
    (repo / "pkg.egg-info").mkdir()
    (repo / "pkg.egg-info" / "PKG-INFO").write_text("")
    assert tg.diff(before, tg.state(repo)) == []


def test_web_build_is_allowed_when_project_is_a_subdirectory(repo: Path) -> None:
    """הפעלה 217: הפרויקט יושב ב-`collect-agent/` בתוך המאגר. build של הממשק (demo.sh) נכתב ל-
    web/dist + web/node_modules — מותר. לפני התיקון ההשוואה הייתה מול נתיב-מהשורש ⇒ הכול סומן."""
    proj = repo / "collect-agent"
    (proj / "web").mkdir(parents=True)
    (proj / "keep.py").write_text("")
    subprocess.run(["git", "add", "."], cwd=repo, check=True, capture_output=True)  # noqa: S603,S607
    before = tg.state(proj)
    for rel in ("web/dist/index.html", "web/node_modules/vite/package.json"):
        (proj / rel).parent.mkdir(parents=True, exist_ok=True)
        (proj / rel).write_text("")
    assert tg.diff(before, tg.state(proj)) == []
    (proj / ".venv").mkdir()
    (proj / ".venv" / "pyvenv.cfg").write_text("")
    assert any("collect-agent/.venv/pyvenv.cfg" in ln for ln in tg.diff(before, tg.state(proj)))


def test_preexisting_state_is_not_blamed(repo: Path) -> None:
    (repo / "dev.sqlite3").write_text("")  # היה לפני הריצה (DB של מפתח)
    before = tg.state(repo)
    assert tg.diff(before, tg.state(repo)) == []


def test_cli_exit_codes(repo: Path, tmp_path_factory: pytest.TempPathFactory, monkeypatch) -> None:
    monkeypatch.setattr(tg, "ROOT", repo)
    snap = tmp_path_factory.mktemp("snap") / "before.txt"
    assert tg.main(["tree_guard.py", "snapshot", str(snap)]) == 0
    assert tg.main(["tree_guard.py", "check", str(snap)]) == 0
    (repo / ".venv").mkdir()
    (repo / ".venv" / "pyvenv.cfg").write_text("home = /tmp/pytest-of-x/bin\n")
    assert tg.main(["tree_guard.py", "check", str(snap)]) == 1
    assert tg.main(["tree_guard.py"]) == 2


def test_ci_wraps_pytest_with_the_guard() -> None:
    wf = (Path(__file__).resolve().parents[2] / ".github" / "workflows" / "collect-agent.yml").read_text()
    test_job = wf.split("\n  sqlcipher:")[0]
    i_snap = test_job.index("tree_guard.py snapshot")
    i_pytest = test_job.index("python -m pytest -q", i_snap)
    i_check = test_job.index("tree_guard.py check", i_pytest)
    assert i_snap < i_pytest < i_check


def test_ci_guard_also_covers_demo_smoke_and_contracts() -> None:
    """הפעלה 217: השומר עטף רק את pytest. demo.sh --check / smoke / חוזים מריצים שרתים ו-DB בתוך הפרויקט —
    בדיקה סופית אחרי כולם, מול אותו צילום."""
    wf = (Path(__file__).resolve().parents[2] / ".github" / "workflows" / "collect-agent.yml").read_text()
    test_job = wf.split("\n  sqlcipher:")[0]
    i_snap = test_job.index("tree_guard.py snapshot")
    last_check = test_job.rindex("tree_guard.py check")
    for step in ("./demo.sh --check", "bash scripts/smoke_server.sh", "bash scripts/contract_checks_http.sh",
                 "python -m evals.harness"):
        assert i_snap < test_job.index(step) < last_check, step

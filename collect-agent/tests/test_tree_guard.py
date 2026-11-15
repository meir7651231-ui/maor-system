"""שומר-העץ (scripts/tree_guard.py) — QA הפעלה 216.

הבאג שהוא נועד לתפוס: `test_wait_loud` יצר `collect-agent/.venv` (מתעלם ב-.gitignore) עם קישור
מת, ו-git status רגיל לא ראה כלום (215). כאן: מאגר git זמני, בלי לגעת בפרויקט.
"""

from __future__ import annotations

import importlib.util
import re
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


def test_ci_guard_also_covers_sqlcipher_job() -> None:
    """הפעלה 218: ג׳וב `sqlcipher` מריץ pytest, demo.sh ו-smoke עם DB מוצפן ומפתח חד-פעמי — בלי שומר-עץ.
    קובץ DB מוצפן או מפתח שנשאר בפרויקט לא היה נתפס. צילום לפני הבדיקות, בדיקה אחרי pytest ובסוף."""
    wf = (Path(__file__).resolve().parents[2] / ".github" / "workflows" / "collect-agent.yml").read_text()
    job = wf.split("\n  sqlcipher:")[1].split("\n  web:")[0]
    i_snap = job.index("tree_guard.py snapshot")
    i_first_test = job.index("python -m pytest -q")
    assert i_snap < i_first_test
    i_full = job.index("python -m pytest -q\n")
    assert i_full < job.index("tree_guard.py check", i_full) < job.index("./demo.sh --check")
    last_check = job.rindex("tree_guard.py check")
    for step in ("DB_ENCRYPTION=sqlcipher ./demo.sh --check", "bash scripts/smoke_server.sh"):
        assert i_snap < job.index(step) < last_check, step


# --- הפעלה 219: מצב fs (בלי git) לג'וב demo-clean — ב-container אין git ואין .git ---


def test_fs_mode_works_without_git_and_catches_new_files(tmp_path: Path) -> None:
    (tmp_path / "old.txt").write_text("")
    before = tg.fs_state(tmp_path)
    (tmp_path / "leak" / "snaps").mkdir(parents=True)
    (tmp_path / "leak" / "snaps" / "x.gbk").write_text("")
    (tmp_path / "__pycache__").mkdir()
    (tmp_path / "__pycache__" / "m.pyc").write_text("")
    assert tg.diff(before, tg.fs_state(tmp_path)) == ["leak/snaps/x.gbk"]


def test_fs_cli_ignores_its_own_snapshot_file(tmp_path: Path, capsys) -> None:
    snap = tmp_path / "snap.txt"
    assert tg.main(["tg", "fs-snapshot", str(snap), str(tmp_path)]) == 0
    assert tg.main(["tg", "fs-check", str(snap), str(tmp_path)]) == 0, "קובץ הצילום עצמו אינו «דליפה»"
    (tmp_path / "new.sqlite3").write_text("")
    assert tg.main(["tg", "fs-check", str(snap), str(tmp_path)]) == 1
    assert "new.sqlite3" in capsys.readouterr().out
    assert tg.main(["tg", "fs-nope", str(snap)]) == 2


def test_clean_demo_second_run_is_guarded_in_project_and_tmp() -> None:
    script = (SCRIPT.parent / "ci_clean_demo.sh").read_text(encoding="utf-8")
    run2 = script.index("ריצה 2: .venv קיים")
    targets = ('"$SNAP_DIR/project.txt"', '"$SNAP_DIR/tmp.txt" "$TMP_ROOT"')
    snaps = [script.index(f"fs-snapshot {t}") for t in targets]
    checks = [script.index(f"fs-check {t}") for t in targets]
    first_run_end = script.index("[[ -x .venv/bin/python3 ]]")
    assert all(first_run_end < s < run2 for s in snaps), "הצילום אחרי ריצה 1 (ה-.venv כבר נוצר בכוונה)"
    assert all(c > script.index('OUT="$(./demo.sh --check') for c in checks), "הבדיקה אחרי ריצה 2"
    assert "git status" not in script and "tree_guard.py snapshot" not in script, "אין git ב-container"


# --- הפעלה 224: מגן TMPDIR בג'וב web — דליפות של בדיקות הדפדפן נתפסות אוטומטית ב-CI ---


def test_fs_mode_allows_node_compile_cache_but_not_chromium_leftovers(tmp_path: Path) -> None:
    before = tg.fs_state(tmp_path)
    (tmp_path / "node-compile-cache" / "v22-x64").mkdir(parents=True)
    (tmp_path / "node-compile-cache" / "v22-x64" / "2850518c").write_text("")
    assert tg.diff(before, tg.fs_state(tmp_path)) == [], "מטמון Node — לא דליפה"
    (tmp_path / ".org.chromium.Chromium.abc").write_text("")
    (tmp_path / "gabi-live-x" / "totp.txt").parent.mkdir()
    (tmp_path / "gabi-live-x" / "totp.txt").write_text("")
    assert tg.diff(before, tg.fs_state(tmp_path)) == [".org.chromium.Chromium.abc", "gabi-live-x/totp.txt"]


def test_web_job_guards_dedicated_tmpdir_around_all_browser_steps() -> None:
    wf = (SCRIPT.parent.parent.parent / ".github" / "workflows" / "collect-agent.yml").read_text(encoding="utf-8")
    job = wf.split("\n  web:")[1].split("\n  demo-clean:")[0]
    i_env = job.index('echo "TMPDIR=$RUNNER_TEMP/e2e-tmp" >> "$GITHUB_ENV"')
    i_snap = job.index('fs-snapshot "$RUNNER_TEMP/e2e-tmp-before.txt" "$RUNNER_TEMP/e2e-tmp"')
    i_check = job.index('fs-check "$RUNNER_TEMP/e2e-tmp-before.txt" "$RUNNER_TEMP/e2e-tmp"')
    nodes = [m.start() for m in re.finditer(r"node e2e/\w[\w-]*\.mjs", job)]
    assert len(nodes) >= 12, "כל סקריפטי הדפדפן"
    assert i_env < min(nodes) and i_snap < min(nodes), "TMPDIR והצילום לפני הדפדפן הראשון"
    assert max(nodes) < i_check, "הבדיקה אחרי הדפדפן האחרון"
    assert "e2e-tmp/" not in job, "הצילום מחוץ לתיקייה הנבדקת (אחרת הוא עצמו «דליפה»)"


# --- הפעלה 225: מגן TMPDIR גם בג'וב test (pytest + evals + demo.sh + smoke + חוזים + sandbox) ---


def test_test_job_guards_dedicated_tmpdir_around_all_steps() -> None:
    """עד 225 ג׳וב test שמר רק על עץ הפרויקט: קובץ זמני שנשאר ב-/tmp (sqlite, מפתח, שרת שכתב לוג) לא נתפס.
    pytest עצמו משאיר בכוונה pytest-of-* ⇒ --basetemp מחוץ לתיקייה הנבדקת, אחרת כל ריצה «דולפת»."""
    wf = (SCRIPT.parent.parent.parent / ".github" / "workflows" / "collect-agent.yml").read_text(encoding="utf-8")
    job = wf.split("\n  sqlcipher:")[0]
    i_env = job.index('echo "TMPDIR=$RUNNER_TEMP/test-tmp" >> "$GITHUB_ENV"')
    i_snap = job.index('fs-snapshot "$RUNNER_TEMP/test-tmp-before.txt" "$RUNNER_TEMP/test-tmp"')
    i_check = job.index('fs-check "$RUNNER_TEMP/test-tmp-before.txt" "$RUNNER_TEMP/test-tmp"')
    i_pytest = job.index("python -m pytest -q")
    assert i_env < i_pytest and i_snap < i_pytest, "TMPDIR והצילום לפני pytest"
    assert '--basetemp="$RUNNER_TEMP/pytest-base"' in job[i_pytest:job.index("\n", i_pytest)]
    steps = ("python -m evals.harness", "./demo.sh --check", "bash scripts/smoke_server.sh",
             "bash scripts/contract_checks_http.sh", "sandbox_day1_paid_check.py --mock no-status")
    for step in steps:
        assert i_pytest < job.index(step) < i_check, step
    assert "test-tmp/" not in job, "הצילום וה-basetemp מחוץ לתיקייה הנבדקת"


def test_fs_check_reports_count_beyond_200(tmp_path: Path, capsys) -> None:
    """225: ה-fs-check חתך ל-200 שורות בלי לומר — 726 קבצי pytest נראו כ«200»."""
    root, snap = tmp_path / "t", tmp_path / "snap.txt"
    root.mkdir()
    assert tg.main(["tg", "fs-snapshot", str(snap), str(root)]) == 0
    for i in range(205):
        (root / f"f{i:03}").write_text("")
    assert tg.main(["tg", "fs-check", str(snap), str(root)]) == 1
    assert "ועוד 5 (סה״כ 205)" in capsys.readouterr().out

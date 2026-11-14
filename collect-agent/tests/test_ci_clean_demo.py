"""הפעלה 192 — באג 191 (demo.sh נפל במכונה נקייה) לא נראה ב-CI כי setup-python מסתיר אותו.

הג'וב demo-clean מריץ את ההדגמה ב-container של הפצה, בלי setup-python. כאן נועל שהוא קיים ונשאר נקי,
ושהסקריפט באמת בודק את מסלול ה-.venv (ולא עובר בשקט כשהמכונה לא נקייה).
מוטציה שאומתה ב-docker: demo.sh שלפני 191 (`pip install` עיוור) ⇒ הסקריפט נופל ב-debian:bookworm (PEP 668).
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WF = (ROOT.parent / ".github" / "workflows" / "collect-agent.yml").read_text(encoding="utf-8")
SCRIPT = (ROOT / "scripts" / "ci_clean_demo.sh").read_text(encoding="utf-8")


def _job(name: str) -> str:
    m = re.search(rf"^  {name}:\n(.*?)(?=^  [\w-]+:\n|\Z)", WF, re.S | re.M)
    assert m, f"ג'וב {name} חסר ב-workflow"
    return m.group(1)


def test_demo_clean_job_runs_in_distro_containers_without_setup_python():
    job = _job("demo-clean")
    assert "container: ${{ matrix.image }}" in job
    assert "debian:bookworm" in job and "ubuntu:24.04" in job
    assert "setup-python" not in job, "setup-python מסתיר בדיוק את מה שהג'וב בודק"
    assert "pip install" not in job, "ההתקנה היחידה היא זו של demo.sh"
    assert "bash scripts/ci_clean_demo.sh" in job


def test_script_installs_distro_cryptography_and_requires_clean_machine():
    # cryptography של ההפצה = מה שחסם שדרוג ב-191; בלי fastapi במערכת ⇒ מסלול ה-.venv חייב לרוץ
    assert "python3-cryptography" in SCRIPT
    assert re.search(r"python3 -c 'import fastapi'.*?\n.*?exit 1", SCRIPT, re.S)
    assert "rm -rf .venv" in SCRIPT


def test_script_checks_venv_created_and_reused():
    i1 = SCRIPT.index("./demo.sh --check")
    assert SCRIPT.index("[[ -x .venv/bin/python3 ]]") > i1
    assert SCRIPT.count("./demo.sh --check") >= 2, "ריצה שנייה מה-.venv הקיים"
    assert "יוצר סביבה מקומית" in SCRIPT, "ריצה 2 אסור שתיצור .venv מחדש"


def test_script_is_strict_and_has_no_cyrillic():
    assert "set -euo pipefail" in SCRIPT
    assert not [c for c in SCRIPT if "Ѐ" <= c <= "ӿ"]

"""תסריט ההדגמה של מכירות (sales/demo-script.md) צמוד לדמו האמיתי (BACKLOG «גבי מכירות» 1):
כל שלב בתסריט (S1…Sn) ממומש כשלב ב-web/e2e/sales-demo.mjs (שרץ מול DEMO=1 ונכשל כשהשלב לא עובד), ויש לו
צילום עדכני ב-docs/screens/. שלב שנוסף לתסריט בלי מימוש, שלב שנמחק מה-e2e, או צילום חסר ⇒ נכשל."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = (ROOT / "sales/demo-script.md").read_text(encoding="utf-8")
E2E = (ROOT / "web/e2e/sales-demo.mjs").read_text(encoding="utf-8")


def _script_steps() -> list[str]:
    return re.findall(r"^\| (S\d+) \|", SCRIPT, re.M)


def test_script_has_steps_and_fits_five_minutes():
    steps = _script_steps()
    assert len(steps) >= 5 and len(steps) == len(set(steps)), steps
    assert "4:45–5:00" in SCRIPT


def test_every_script_step_is_run_against_the_demo():
    in_e2e = set(re.findall(r"^\s{4}(S\d+): async", E2E, re.M))
    script = set(_script_steps())
    assert script == in_e2e, (sorted(script - in_e2e), sorted(in_e2e - script))


def test_every_step_has_its_screenshot():
    for s in _script_steps():
        ref = f"docs/screens/sales-demo-{s}.png"
        assert ref in SCRIPT, f"{s}: הצילום לא מופיע בשורה"
        assert (ROOT / ref).stat().st_size > 10_000, f"{s}: הצילום חסר או ריק"


def test_script_is_draft_and_says_what_is_mocked():
    assert "טיוטה – לבדיקת עו״ד" in SCRIPT and "הכול כאן מדומה" in SCRIPT
    assert "₪1,190" in SCRIPT and "כולל מע״מ ככל שחל" in SCRIPT

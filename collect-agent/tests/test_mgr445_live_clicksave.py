"""הפעלה 445 (מבקר 270ℹ️): כשל חולף ב-live.mjs — «שמירה» disabled ⇒ timeout בלי לומר באיזה שלב.

כל לחיצה על settings-save ב-e2e עוברת דרך clickSave(page, '<שלב>') מ-lib.mjs, שמחכה לכפתור זמין ואם לא —
זורקת עם שם השלב ואבחון. שומר-מקור: אין לחיצה ישירה, לכל קריאה יש שם שלב לא ריק, והבדיקה רצה ב-CI.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
E2E = ROOT / "web" / "e2e"


def test_no_raw_settings_save_click_in_e2e():
    for f in sorted(E2E.glob("*.mjs")):
        if f.name == "lib.mjs":
            continue
        src = f.read_text(encoding="utf-8")
        raw = re.search(r"getByTestId\('settings-save'\)\.click\(", src)
        assert not raw, f"{f.name}: לחיצה ישירה על שמירה — דרך clickSave"


def test_live_clicksave_calls_have_stage_names():
    src = (E2E / "live.mjs").read_text(encoding="utf-8")
    calls = re.findall(r"clickSave\((\w+), '([^']*)'\)", src)
    assert len(calls) >= 15
    assert all(stage.strip() for _, stage in calls)
    assert len({s for _, s in calls}) == len(calls), "שמות שלבים כפולים — הלוג לא יבחין ביניהם"


def test_clicksave_diag_runs_in_ci():
    wf = (ROOT.parent / ".github" / "workflows" / "collect-agent.yml").read_text(encoding="utf-8")
    assert "node e2e/clicksave-diag.mjs" in wf
    lib = (E2E / "lib.mjs").read_text(encoding="utf-8")
    assert "שלב «${stage}»" in lib and "saveDiag(page)" in lib

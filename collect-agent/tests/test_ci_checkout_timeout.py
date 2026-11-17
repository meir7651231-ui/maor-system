"""מנהל 274 — ריצה 833 בוטלה: שלב ה-checkout נתקע 15 דקות ובלע את כל ה-timeout של ג׳וב sqlcipher (3.11).
כל checkout ב-workflow של גבי חייב timeout קצר משלו (נכשל מהר ⇒ רואים תקלת runner, לא «בוטל» אחרי רבע שעה)."""
from pathlib import Path

import yaml

WF = Path(__file__).resolve().parents[2] / ".github" / "workflows" / "collect-agent.yml"


def test_every_checkout_has_short_timeout():
    jobs = yaml.safe_load(WF.read_text(encoding="utf-8"))["jobs"]
    seen = 0
    for name, job in jobs.items():
        for step in job["steps"]:
            if str(step.get("uses", "")).startswith("actions/checkout"):
                seen += 1
                t = step.get("timeout-minutes")
                assert isinstance(t, int) and 1 <= t <= 5, f"{name}: checkout בלי timeout קצר ({t})"
                assert t < job["timeout-minutes"], name
    assert seen == len(jobs) >= 5

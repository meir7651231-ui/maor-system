"""«כל בוקר רשימה מוכנה» — מסר הליבה (שלב 2) — נעול מול עבודת הבוקר `app.morning`.

הבאג (BACKLOG «גבי שיווק», 19.11): המסר הופיע ב-5 מקומות, ובקוד לא היה שום תזמון יומי — /sync ו-/plan רצו
ידנית או מ-webhook. הכרעת המקשר: לא מרככים; גבי חיבורים בנה את `app/morning.py` (7a3365a): סנכרון ⇒ הכנת
תזכורות ⇒ סיכום, **בלי שליחה**. נועל: (1) המסר נמצא בכל 5 המקומות, ולכן הבדיקה שומרת עליהם · (2) הפקודה
קיימת ומריצה sync + plan · (3) אין בה שום נתיב שליחה (dispatch/send) — המסר «רשימה מוכנה» ו«אתה מאשר»
נשארים נכונים יחד · (4) יש בדיקת התנהגות שמחליפה את השולח במלכודת (tests/test_morning.py).
"""
import ast
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
MORNING = ROOT / "app/morning.py"
PLACES = {"marketing/landing/index.html": "כל בוקר: רשימה מוכנה",
          "web/src/pages/Landing.tsx": "כל בוקר: רשימה מוכנה",
          "marketing/posts.md": "כל בוקר מחכה לך רשימה",
          "marketing/emails-trial.md": "כל בוקר תחכה לך רשימה",
          "marketing/landing/for/build.py": "כל בוקר תזכורת מוכנה",
          "marketing/seo/01-how-to-ask-client-to-pay.md": "מכין כל בוקר תזכורות כאלה",
          "marketing/seo/02-client-didnt-pay.md": "ומכין לך כל בוקר את התזכורות"}


@pytest.mark.parametrize("rel", PLACES)
def test_claim_is_where_we_think_it_is(rel):
    assert PLACES[rel] in (ROOT / rel).read_text(encoding="utf-8"), f"{rel}: המסר זז — לעדכן את המיפוי"


def _calls(fn: ast.FunctionDef) -> set[str]:
    return {n.func.attr if isinstance(n.func, ast.Attribute) else getattr(n.func, "id", "")
            for n in ast.walk(fn) if isinstance(n, ast.Call)}


def test_morning_job_exists_and_runs_sync_then_plan():
    from app import morning
    assert callable(morning.run_morning) and callable(morning.check)
    tree = ast.parse(MORNING.read_text(encoding="utf-8"))
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "run_morning")
    assert {"sync", "plan"} <= _calls(fn), "עבודת הבוקר לא מסנכרנת או לא מכינה תזכורות — «רשימה מוכנה» לא נכון"
    assert re.search(r"python -m app\.morning", MORNING.read_text(encoding="utf-8")), "אין הוראת הרצה ל-cron"


def test_morning_job_never_sends():
    """מוטציה: הוספת svc.dispatch() / send ל-app/morning.py ⇒ נכשל (וגם «אתה מאשר כל הודעה» נשבר)."""
    tree = ast.parse(MORNING.read_text(encoding="utf-8"))
    calls = set().union(*(_calls(n) for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)))
    sending = {c for c in calls if re.search(r"dispatch|send|approve|flush", c, re.I)}
    assert not sending, f"עבודת הבוקר שולחת/מאשרת: {sending}"


def test_behaviour_trap_exists():
    t = (ROOT / "tests/test_morning.py").read_text(encoding="utf-8")
    assert "def test_" in t and re.search(r"send", t), "בדיקת ההתנהגות (מלכודת שולח) של עבודת הבוקר חסרה"

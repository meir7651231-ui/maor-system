"""גבי בדיקות: נעילת הסטים המוחזקים החיצוניים בשער ה-CI.

השער (`test_engine_round4.test_external_blind_sets_have_no_silent_critical_error`) אוסף **במשתמע** כל סט
שיש לו כותרת `## <שם>` ב-RESULTS.md. שני סיכונים שאיש לא בדק:
  1. כותרת שנמחקה/שונתה ⇒ הסט נשמט מהשער בשקט (למשל סט המשפט 2425167 — «הזוויות המשפטיות»).
  2. עריכת קובץ הסט אחרי המסירה (כוונון הציפיות לפי המנוע) ⇒ הסט כבר לא עיוור, והשער «עובר» על משהו אחר.
כאן: כל סט שנכתב מחוץ למנוע חייב להיות בשער, והתוכן שלו = בדיוק ה-sha256 שנרשם בהודעת ה-commit של המסירה.
סט חדש = שורה חדשה כאן (עם ה-hash מהודעת ה-commit).
"""
from __future__ import annotations

import hashlib
from pathlib import Path

import pytest

from tests import test_engine_round4 as gate

HELDOUT = Path(__file__).resolve().parents[1] / "evals" / "heldout"

# שם קובץ ⇒ (מי כתב, commit המסירה, sha256 שנרשם בהודעת ה-commit)
SEALED = {
    "external-2026-11-15-legal.jsonl": ("גבי משפט", "2425167",
                                         "6c5f519ed6dab0dcf09833378e0ae0000b33742b7562375f59b8343b323a5911"),
    "external-2026-11-15-critic.jsonl": ("גבי מבקר", "5cd26e8",
                                          "cbed0c0fc37462025120e0aaa9d3a6c47dff971567e626acd69260837238c6dd"),
    "external-2026-11-15-qa.jsonl": ("גבי בדיקות", "2a2444d",
                                      "498bdc55400027bada10a33b746f23d56aaa7a65c14ab85786650f480f8bdb34"),
    "external-2026-11-15-qa2.jsonl": ("גבי בדיקות", "c858444",
                                       "b2bdeec2180c6a022b544d29b940969e420534775fdcc53d708ae39737f37cb4"),
    "external-2026-11-15-qa3.jsonl": ("גבי בדיקות", "1ca5d8c",
                                       "58249add69b1cee9de33f20175707f6fd0e726a8662b4c84faa06ea88c510dfb"),
}


@pytest.mark.parametrize("name", sorted(SEALED))
def test_external_set_is_unchanged_since_handover(name):
    author, commit, sha = SEALED[name]
    got = hashlib.sha256((HELDOUT / name).read_bytes()).hexdigest()
    assert got == sha, (f"{name} ({author}, {commit}) שונה אחרי המסירה — הסט כבר לא עיוור. "
                        "תיקון ציפייה = סט חדש, לא עריכה של הישן")


@pytest.mark.parametrize("name", sorted(SEALED))
def test_external_set_is_in_the_ci_gate(name):
    gated = {p.name for p in gate.EXTERNAL}
    assert name in gated, (f"{name} נשמט משער ה-CI (אין לו כותרת ב-RESULTS.md?) — "
                           "השער היה עובר בלי לבדוק אותו")


def test_legal_set_covers_the_legal_angles():
    """סט המשפט (הכרעת גבי משפט): עו״ד/תביעה, «החוב לא שלי», פרטיות, חדלות, מספר שגוי, קטין/נפטר, הסרה."""
    import json
    rows = [json.loads(x) for x in (HELDOUT / "external-2026-11-15-legal.jsonl").read_text("utf-8").splitlines() if x]
    intents = {r["expect"]["intent"] for r in rows}
    assert len(rows) == 30 and sum(r.get("critical", False) for r in rows) >= 20
    assert {"legal", "dispute", "wrong_person", "opt_out", "minor"} <= intents, intents

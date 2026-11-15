"""רצפת הגנה מבנית — שורש משותף ל-3 רגרסיות היום (critic סבבים 80, 88, 91): חוק "discard" שמוריד כוונה
מגינה (הסרה/מחלוקת/עו"ד/מצוקה/קטין/מספר שגוי) בלי שמשהו מגן בא במקומה ⇒ התזכורות ממשיכות בשקט.
מעכשיו: אם תבנית מגינה נתפסה בטקסט והוסרה בעידון, ההחלטה לפחות השהיה + כרטיס לבעל העסק."""
import pytest

from app import conversation as cv
from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def d(text):
    return respond(text, build_ctx({}))


def test_floor_applies_when_a_discard_rule_drops_a_protective_intent(monkeypatch):
    """מדמה חוק discard עתידי שגוי: מוחק כל הסרה. הרצפה חייבת להשאיר עצירה + כרטיס."""
    real = cv.detect

    def buggy(text, ctx=None):
        return [i for i in real(text, ctx) if i != Intent.OPT_OUT] or [Intent.UNKNOWN]
    monkeypatch.setattr(cv, "detect", buggy)
    r = d("הסירו אותי מהרשימה")
    assert r.stop != Stop.NONE and r.escalate != Escalation.NONE
    assert "protective_floor" in r.tags


@pytest.mark.parametrize("text", ["סטופ, רק בטלפון", "עצור. רק בטלפון", "לא רוצה לקבל הודעות, רק טלפון"])
def test_round91_cases_never_zero_stop(text):
    assert d(text).stop != Stop.NONE


def test_plain_cases_unaffected():
    assert d("איך משלמים?").stop == Stop.NONE
    assert d("הסר").stop == Stop.PERMANENT

"""critic סבב 141 · המשך לסבב 140: normalize מאחד שורות, ותיקון 140 כיסה רק רשימה סגורה של מילות הסרה. «תודה\\nתפסיקו»
⇒ thanks, «קיבלתי\\nדי» ⇒ unknown — ההסרה אבדה. עכשיו: שורה קצרה (עד 4 מילים) מסווגת גם לבד, וכוונה מגינה שעולה
ממנה מצטרפת להודעה כולה (אותן תבניות כמו הודעה בת-שורה-אחת — עקבי). «טעות» / «לא אני» לבד ⇒ unknown גם כהודעה
שלמה, ולכן גם כשורה (עקבי, לא באג)."""
import pytest

from app.conversation import Intent, respond
from evals.harness import build_ctx


@pytest.mark.parametrize("ch", ["sms", "email"])
@pytest.mark.parametrize("t,want", [
    ("תודה\nתפסיקו", Intent.OPT_OUT), ("קיבלתי\nדי", Intent.OPT_OUT), ("תודה\nמספיק", Intent.OPT_OUT),
    ("שלום\nהפסיקו", Intent.OPT_OUT), ("תודה\nהסר", Intent.OPT_OUT), ("hi\nstop", Intent.OPT_OUT),
    ("שלום\nאני בן 14", Intent.MINOR), ("שלום\nאני רוצה למות", Intent.DISTRESS),
])
def test_short_protective_line(t, want, ch):
    assert respond(t, build_ctx({"channel": ch})).intent == want, (t, ch)


@pytest.mark.parametrize("t", ["תודה\nהסרתי את החסימה, אשלם מחר", "קיבלתי\nהסרה של הקנס?",
                               "ok\nstop by tomorrow to pay",
                               "תודה\nטעות שלי, אשלם מחר", "שלום\nדי מהר אשלם", "תודה\nמספיק לי עד מחר"])
def test_line_traps(t):
    assert respond(t, build_ctx({"channel": "sms"})).intent != Intent.OPT_OUT, t

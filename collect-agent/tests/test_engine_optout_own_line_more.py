"""לולאה 18.11 (המשך לסבב 140 — «הסר» בשורה נפרדת): הכלל של 140 תפס רק מילה חשופה. «בסדר\\nהסר בבקשה»,
«Thanks\\nstop please», «אוקיי\\nתפסיקו», «תודה\\nמספיק», «שלום\\n\\nדי» ⇒ עדיין thanks/unknown (ההסרה אבדה).
«די»/«מספיק» בשורה נחשבים הסרה רק כשאין בהודעה תוכן אחר («די\\nאני משלמת מחר» נשאר הבטחה)."""
import pytest

from app.conversation import Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["בסדר\nהסר בבקשה", "Thanks\nstop please", "אוקיי\nתפסיקו", "תודה\nמספיק",
                                  "שלום\n\nדי", "הבנתי\nהסירו אותי תודה"])
def test_own_line_opt_out(text):
    d = _d(text)
    assert d.intent == Intent.OPT_OUT and d.stop == Stop.PERMANENT, (text, d.intent)


# «די\\nאני משלמת מחר» ⇒ הסרה (הכרעת ראש צוות 18.11)
@pytest.mark.parametrize("text", ["תודה\nהסר את הקנס ואשלם", "תודה\nמספיק לי שבוע"])
def test_not_opt_out(text):
    assert _d(text).intent != Intent.OPT_OUT

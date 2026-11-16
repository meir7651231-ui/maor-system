"""מנהל הפעלה 241 · AI — «השם שלי בחשבונית שגוי» (בלי «טעות»).

הכרעה: נשאר **מחלוקת דחופה** (fail-safe — «השם שלי שגוי» יכול להיות «החשבונית בכלל לא שלי», ובעל העסק צריך
לראות מיד), אבל עד עכשיו כינוי-השייכות («שלי»/«של החברה») או אנגלית («my name on the invoice is wrong»)
הפילו את תג `invoice_fix` ואת פעולת התיקון ⇒ בעל העסק קיבל «מחלוקת» בלי לדעת שצריך רק לתקן שם.
ובסדר-מילים הפוך («בחשבונית השם שלי שגוי») ההודעה הייתה unknown **בלי השהיה** — התזכורות היו ממשיכות.
"""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx

FIX_ACTION = "לתקן את פרטי החשבונית"


def _d(t, ch="sms"):
    return respond(t, build_ctx({"channel": ch}))


@pytest.mark.parametrize("text", [
    "השם שלי בחשבונית שגוי", "השם שלי בחשבונית לא נכון, תתקנו", "הח.פ. שלי בחשבונית שגוי",
    "השם של החברה בחשבונית לא נכון", "בחשבונית השם שלי שגוי", "בחשבונית הכתובת לא נכונה",
    "my name on the invoice is wrong", "the name on the invoice is wrong", "our address on the invoice is incorrect",
])
@pytest.mark.parametrize("ch", ["sms", "email"])
def test_field_wrong_is_urgent_dispute_with_fix_action(text, ch):
    d = _d(text, ch)
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT, (d.intent, d.escalate)
    assert d.stop != Stop.NONE
    assert "invoice_fix" in d.tags
    assert any(FIX_ACTION in a for a in d.owner_actions)


@pytest.mark.parametrize("text", ["החשבונית שגויה", "the invoice is wrong", "השם שלי דנה והחשבונית שגויה",
                                  "הסכום בחשבונית שגוי"])
def test_no_field_no_fix_tag_still_dispute(text):
    d = _d(text)
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT
    assert "invoice_fix" not in d.tags


@pytest.mark.parametrize("text", ["קיבלתי את החשבונית תודה", "מה השם של העסק?", "שילמתי את החשבונית אתמול"])
def test_traps(text):
    d = _d(text)
    assert d.intent != Intent.DISPUTE and "invoice_fix" not in d.tags

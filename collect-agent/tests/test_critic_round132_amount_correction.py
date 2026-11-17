"""critic סבב 132 · שני באגים בסכומים:
(1) 🟡 תיקון סכום = מחלוקת, ולא נתפס בשום כתיב: «חייבתם אותי 1,500 במקום 1,200», «הסכום הוא 1,200 לא 1,500»,
    «החיוב צריך להיות 1000 ולא 1200», «the bill should be 1,000 not 1,200», «you charged me 1500 instead of 1200»
    ⇒ unknown (בלי השהיה דחופה ובלי כרטיס מחלוקת). צפוי: dispute ⇒ pause + urgent.
(2) מפריד אלפים בסכום חודשי (המשך לסבב 131): «אשלם 1.000 לחודש» ⇒ הצעת ברירת מחדל 3×400 במקום כמו «1,000 לחודש»
    (2×600); «אפשר 1 000 בחודש?» ⇒ כנ״ל."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t, st="idle"):
    return respond(t, build_ctx({"channel": "sms", "state": st, "offered_n": 3}))


@pytest.mark.parametrize("t", [
    "חייבתם אותי 1,500 במקום 1,200", "חייבתם אותי 1.500 במקום 1.200", "הסכום הוא 1,200 לא 1,500",
    "הסכום הוא 1200 ולא 1500", "החיוב צריך להיות 1000 ולא 1200", "החשבונית אמורה להיות 800 ש\"ח ולא 1200",
    "the bill should be 1,000 not 1,200", "you charged me 1500 instead of 1200", "the amount is 800 not 1200",
])
def test_amount_correction_is_dispute(t):
    d = _d(t)
    assert d.intent == Intent.DISPUTE and d.stop == Stop.PAUSE and d.escalate == Escalation.URGENT, (t, d.intent)


@pytest.mark.parametrize("t", [
    "אשלם 1000 ולא 1200 כי זה מה שיש לי",     # הצעה/קושי — לא תיקון חיוב (בלי חיוב/סכום/חשבונית)
    "שילמתי 600 במקום 1200, את היתרה אשלם בשבוע הבא",
    "אפשר 300 לחודש במקום 400?",
])
def test_not_dispute_traps(t):
    assert _d(t).intent != Intent.DISPUTE, (t, _d(t).intent)


@pytest.mark.parametrize("dot,comma", [
    ("אשלם 1.000 לחודש", "אשלם 1,000 לחודש"),
    ("אפשר 1 000 בחודש?", "אפשר 1,000 בחודש?"),
    ("i can pay 1.000 a month", "i can pay 1,000 a month"),
])
@pytest.mark.parametrize("st", ["idle", "awaiting_plan_reply"])
def test_monthly_thousands_like_comma(dot, comma, st):
    a, b = _d(dot, st), _d(comma, st)
    assert (a.intent, (a.owner_summary or "").split(" ההודעה:")[0]) == \
        (b.intent, (b.owner_summary or "").split(" ההודעה:")[0])

"""מנהל הפעלה 239 · AI — «טעות קטנה… אבל אשלם».

שני חורים שנמצאו בבדיקת הווריאציות של סבב 101:
1. «טעות קטנה בסכום/במחיר אבל אשלם» סווג כהבטחה בלי הסלמה ⇒ טענה על הסכום לא הגיעה לבעל העסק.
   עכשיו: מחלוקת דחופה (כמו «יש טעות בסכום»).
2. «טעות בשם בחשבונית, תתקנו ואשלם» / «צריך חשבונית מתוקנת» ⇒ אף אחד לא תיקן את החשבונית.
   עכשיו: תג `invoice_fix` + הסלמה רגילה + פעולה לבעל העסק. ההבטחה לשלם נשמרת (לא מחלוקת דחופה).
"""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def _d(t, ch="sms"):
    return respond(t, build_ctx({"channel": ch}))


@pytest.mark.parametrize("ch", ["sms", "email"])
@pytest.mark.parametrize("text", ["טעות קטנה בסכום אבל אשלם", "טעות קטנה במחיר אבל אשלם מחר",
                                  "יש טעות קלה בחיוב, אשלם היום"])
def test_small_amount_error_is_urgent_dispute(text, ch):
    d = _d(text, ch)
    assert (d.intent, d.escalate, d.stop) == (Intent.DISPUTE, Escalation.URGENT, Stop.PAUSE)


@pytest.mark.parametrize("ch", ["sms", "email"])
@pytest.mark.parametrize("text", ["טעות בשם בחשבונית, תתקנו ואשלם", "יש טעות קטנה בשם שלי בחשבונית, אבל אשלם מחר",
                                  "תתקנו את השם בחשבונית", "צריך חשבונית מתוקנת", "החשבונית על שם החברה לא עליי",
                                  "wrong name on the invoice, please fix", "please reissue the invoice"])
def test_invoice_detail_fix_reaches_owner(text, ch):
    d = _d(text, ch)
    assert "invoice_fix" in d.tags
    assert d.escalate != Escalation.NONE
    assert any("חשבונית מתוקנת" in a for a in d.owner_actions)
    assert d.stop != Stop.PERMANENT and d.intent != Intent.OPT_OUT


@pytest.mark.parametrize("text", ["טעות בשם בחשבונית, תתקנו ואשלם", "יש טעות קטנה בשם שלי בחשבונית, אבל אשלם מחר"])
def test_name_fix_with_promise_stays_promise(text):
    d = _d(text)
    assert d.intent == Intent.PROMISE and d.escalate == Escalation.NORMAL


@pytest.mark.parametrize("text", ["אשלם מחר", "תודה, אשלם היום", "שם הטכנאי היה נחמד, אשלם מחר",
                                  "מה שם העסק? אשלם היום", "the invoice is fine, paying tomorrow"])
def test_no_false_invoice_fix(text):
    d = _d(text)
    assert "invoice_fix" not in d.tags


def test_invoice_fix_browser_e2e_runs_in_ci():
    """הפעלה 240: הפעולה «לתקן את פרטי החשבונית» נבדקת גם בדפדפן מול שרת DEMO=1 (web/e2e/ui-invoice-fix.mjs)."""
    from pathlib import Path
    root = Path(__file__).resolve().parent.parent
    wf = (root.parent / ".github/workflows/collect-agent.yml").read_text(encoding="utf-8")
    e2e = (root / "web/e2e/ui-invoice-fix.mjs").read_text(encoding="utf-8")
    assert "node e2e/ui-invoice-fix.mjs" in wf
    assert "לתקן את פרטי החשבונית" in e2e and "ul.acts" in e2e

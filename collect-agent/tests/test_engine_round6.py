"""סבב 6 — critic.md סבב 80 (🟡 לא תוקן): "לא בוצע" על *התשלום* (תקלה טכנית) סווג מחלוקת דחופה.
תקלה בתשלום ≠ טענה נגד החוב. "העבודה לא בוצעה" נשאר מחלוקת."""
import pytest

from app.conversation import Intent, respond
from evals.harness import build_ctx


def d(text):
    return respond(text, build_ctx({}))


@pytest.mark.parametrize("text", ["ההעברה לא בוצעה, הבנק חסם אותה. אנסה מחר",
                                  "החיוב באשראי לא עבר, יש קישור אחר?",
                                  "ניסיתי לשלם והתשלום לא בוצע בגלל שגיאה"])
def test_failed_payment_is_not_dispute(text):
    assert Intent.DISPUTE not in d(text).all_intents


@pytest.mark.parametrize("text", ["העבודה לא בוצעה בכלל", "התיקון שלא בוצע מופיע בחשבונית"])
def test_work_not_done_still_dispute(text):
    assert Intent.DISPUTE in d(text).all_intents


@pytest.mark.parametrize("text", ["התשלום לא בוצע בגלל תקלה באתר", "ההעברה לא עברה, אנסה שוב מחר"])
def test_failed_payment_is_not_a_paid_claim(text):
    r = d(text)
    assert Intent.PAID_CLAIM not in r.all_intents and Intent.DISPUTE not in r.all_intents

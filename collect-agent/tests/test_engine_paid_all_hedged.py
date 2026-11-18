"""לולאה 18.11 (בעקבות מנהל 279 — מלכודות _PAY_ALL בהבטחות): אותה מלכודת בטענת תשלום. «שילמתי הכל» = מלוא החוב
(qa16), אבל «הכל מלבד 300», «כמעט הכל», «everything except 200», «almost everything», «כל הסכום פחות 100» נרשמו
«שילם/ה 1,200 ₪» — בעל העסק היה סוגר חוב שלא שולם במלואו. עכשיו: חלקי, בלי סכום. סכום מפורש לא מושפע."""
import pytest

from app.conversation import respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))   # חוב 1,200 ₪


@pytest.mark.parametrize("text", ["העברתי הכל מלבד 200", "שילמתי כמעט את הכל",
                                  "I paid everything except the last month",
                                  "paid almost everything", "שילמתי את כל החוב פחות 150"])
def test_hedged_all_is_partial_without_amount(text):
    d = _d(text)
    assert d.paid_agorot is None and "partial" in d.tags


@pytest.mark.parametrize("text,amount,partial", [("שילמתי הכל", 120000, False), ("I paid in full", 120000, False),
                                                 ("שילמתי 1200 בערך לפני שבוע", 120000, False),
                                                 ("שילמתי 500", 50000, True)])
def test_unhedged_unchanged(text, amount, partial):
    d = _d(text)
    assert d.paid_agorot == amount and ("partial" in d.tags) == partial

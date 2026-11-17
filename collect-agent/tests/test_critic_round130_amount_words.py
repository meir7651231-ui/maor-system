"""critic סבב 130 · באג ב-805ef41e (סכום חודשי במילים): שתי צורות יומיומיות נקראו לא נכון, והטיוטה לבעל העסק
הציעה **סכום חודשי גבוה ממה שהלקוח אמר שהוא יכול** (חוב 1,200 ₪):
  · «can we do two fifty a month?» (= 250) ⇒ «two» נקרא מספר תשלומים (הצעה נגדית) ⇒ 2×600 ₪. הצוות קבע במכוון
    ש«one fifty a month» לא מומר (דו-משמעי ⇒ unknown, בעל העסק מכריע) — אז גם כאן: לא הצעה של 2 תשלומים.
  · «שלושת/ארבעת אלפים לחודש» (צורת סמיכות, חד-משמעית) ⇒ לא באוצר ⇒ «אלפים» לבד = 1000 ⇒ 2×600 ₪.
    המצופה = כמו הספרות («3000 לחודש» ⇒ בלי הצעה אוטומטית)."""
import pytest

from app.conversation import respond
from evals.harness import build_ctx


def _summary(t):
    d = respond(t, build_ctx({"channel": "sms", "state": "awaiting_plan_reply", "offered_n": 3}))
    return d.intent.value, (d.owner_summary or "").split(" ההודעה:")[0]


@pytest.mark.parametrize("t", ["can we do two fifty a month?", "could we do three-fifty a month",
                               "can we do two fifty per month please"])
def test_two_fifty_is_not_two_installments(t):
    intent, summary = _summary(t)
    assert "ל-2 תשלומים" not in summary and "ל-3 תשלומים" not in summary and "600 ₪" not in summary, summary


@pytest.mark.parametrize("words,digits", [
    ("שלושת אלפים לחודש", "3000 לחודש"),
    ("ארבעת אלפים בחודש", "4000 בחודש"),
    ("חמשת אלפים שקל לחודש", "5000 שקל לחודש"),
])
def test_words_match_digits(words, digits):
    assert _summary(words) == _summary(digits), (_summary(words), _summary(digits))


@pytest.mark.parametrize("t", ["twenty five a month", "two payments a month", "אשלם עשרים לחודש"])
def test_traps_not_changed(t):
    """«twenty five» = 25 (לא 2,500); «two payments» — payments מפריד; «עשרים לחודש» = יום בחודש."""
    d = respond(t, build_ctx({"channel": "sms", "state": "awaiting_plan_reply", "offered_n": 3}))
    assert "2,500" not in (d.owner_summary or "") and "2500" not in (d.owner_summary or "")

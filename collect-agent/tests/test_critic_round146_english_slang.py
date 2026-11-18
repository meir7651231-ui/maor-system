"""critic סבב 146 · סלנג/קיצורים באנגלית בכוונות מגינות (40 הודעות; 22 תקינות). 16 פערים ⇒ unknown:
«i aint paying», «i wont be paying», «u cant charge me for this» (מחלוקת) · «i aint the guy u want», «wrong # buddy»,
«i dont know u», «idk who u r» (מספר שגוי) · «dont txt me no more», «pls dont msg me», «rmv me», «ur number is blocked»
(הסרה) · «cant take it no more» (מצוקה) · «no money rn» (קושי) · «i never ordered nothin», «aint nobody ordered this»
(מחלוקת) · «who dis». לא תוקנו במכוון: «this aint mine» (הצוות הכריע ב-a609fae4 ש«isnt my debt» = מחלוקת; «mine»
לבד דו-משמעי) · «ur scamming me» ⇒ abusive."""
import pytest

from app.conversation import Intent, respond
from evals.harness import build_ctx

CASES = [
    ("i aint paying", Intent.DISPUTE), ("i wont be paying", Intent.DISPUTE),
    ("u cant charge me for this", Intent.DISPUTE),
    ("i aint the guy u want", Intent.WRONG_PERSON), ("wrong # buddy", Intent.WRONG_PERSON),
    ("i dont know u", Intent.WRONG_PERSON), ("idk who u r", Intent.WRONG_PERSON),
    ("dont txt me no more", Intent.OPT_OUT), ("pls dont msg me", Intent.OPT_OUT), ("rmv me", Intent.OPT_OUT),
    ("ur number is blocked", Intent.OPT_OUT), ("cant take it no more", Intent.DISTRESS),
    ("no money rn", Intent.CANT_PAY),
    ("i never ordered nothin", Intent.DISPUTE), ("aint nobody ordered this", Intent.DISPUTE),
    ("who dis", Intent.WHO_IS_THIS),
]


@pytest.mark.parametrize("t,want", CASES)
def test_slang(t, want):
    assert respond(t, build_ctx({"channel": "sms"})).intent == want, t


@pytest.mark.parametrize("t,bad", [
    ("im not paying today, ill pay tomorrow", Intent.DISPUTE), ("i aint paying till friday sorry", Intent.DISPUTE),
    ("i dont know u had a new number, here is the payment", Intent.WRONG_PERSON),
    ("dont txt me the link, email it", Intent.OPT_OUT), ("no money rn, can i pay next week?", Intent.OPT_OUT),
])
def test_slang_traps(t, bad):
    d = respond(t, build_ctx({"channel": "sms"}))
    assert d.intent != bad, (t, d.intent)

"""critic סבב 145 · המשך לסבב 120: הצורה המקוצרת באנגלית לא נתפסה — «this isn't my number», «this isnt my number»,
«bro this isnt my number», «this aint my number», «this number isnt mine» ⇒ unknown (בלי חסימה לצמיתות).
«that is not my number» / «thats not my number» כבר נתפסו. `_FILLERS` (סבב 144) מול 30 תמימים — נקי."""
import pytest

from app.conversation import Intent, Stop, respond
from evals.harness import build_ctx


@pytest.mark.parametrize("t", ["this isn't my number", "this isnt my number", "bro this isnt my number",
                               "this aint my number", "this number isnt mine", "this phone isn't mine",
                               "it isnt my phone"])
def test_isnt_my_number(t):
    d = respond(t, build_ctx({"channel": "sms"}))
    assert d.intent == Intent.WRONG_PERSON and d.stop == Stop.PERMANENT, (t, d.intent)


@pytest.mark.parametrize("t", ["my number isnt changing, same one",
                               "isnt my number on file?", "this isnt my first reminder"])
def test_traps(t):
    assert respond(t, build_ctx({"channel": "sms"})).intent != Intent.WRONG_PERSON, t

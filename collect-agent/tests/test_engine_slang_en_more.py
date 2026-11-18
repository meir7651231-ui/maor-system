"""לולאה 18.11 (המשך לסבב 146 — סלנג באנגלית): «aint my bill» ⇒ unknown (מחלוקת אבדה), «leave me tf alone» ⇒
unknown (הסרה אבדה — מילת חיזוק באמצע), «i aint got money» ⇒ unknown, «ill pay u fri» ⇒ unknown."""
import pytest

from app.conversation import Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text,intent", [("aint my bill bro", Intent.DISPUTE), ("that aint mine", Intent.DISPUTE),
                                         ("leave me the f alone", Intent.OPT_OUT),
                                         ("i aint got no money", Intent.CANT_PAY),
                                         ("ill pay ya monday", Intent.PROMISE)])
def test_slang(text, intent):
    assert _d(text).intent == intent


def test_leave_alone_opt_out_is_permanent():
    assert _d("leave me tf alone").stop == Stop.PERMANENT


@pytest.mark.parametrize("text", ["leave me the hell alone for a week", "this aint working, the link"])
def test_traps(text):
    assert _d(text).intent not in (Intent.OPT_OUT, Intent.DISPUTE)

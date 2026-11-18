"""critic סבב 108 · 7308716c (ביטוח משלם ⇒ הבטחה) החריג «הביטוח אם/לא ישלם» אבל לא «**אם** הביטוח ישלם…» — תנאי, לא
הבטחה ⇒ promise בלי הסלמה, ובעל העסק לא יודע שהתשלום תלוי בביטוח."""
import pytest

from app.conversation import Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["אם הביטוח ישלם אז בסדר", "רק אם הביטוח יכסה את זה", "if the insurance pays, fine"])
def test_conditional_insurance_is_not_promise(text):
    assert _d(text).intent != Intent.PROMISE


def test_plain_insurance_promise_stays():
    assert _d("הביטוח ישלם לכם בשבוע הבא").intent == Intent.PROMISE

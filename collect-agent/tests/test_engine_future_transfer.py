"""STATUS 297 «הבא» AI: עתיד של העברה כהבטחה. «I'll make the transfer tomorrow», «I will do the bank transfer on
Sunday», «ill send the transfer friday», «אעשה את ההעברה מחר», «אבצע העברה ביום ראשון» ⇒ היו UNKNOWN: בלי השהיה ובלי
מועד, והתזכורת הבאה יצאה למי שהבטיח. וסירוב («I won't make the transfer», «לא אעשה את ההעברה») ⇒ מחלוקת, כמו «לא אשלם».
דחייה («won't make the transfer today, will do it Sunday») אינה סירוב."""
from datetime import date

import pytest

from app.conversation import Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["I'll make the transfer tomorrow", "I will do the bank transfer on Sunday",
                                  "ill send the transfer friday", "gonna make the payment tomorrow",
                                  "אעשה את ההעברה מחר", "אבצע העברה ביום ראשון"])
def test_future_transfer_is_promise_with_date(text):
    d = _d(text)
    assert d.intent == Intent.PROMISE and d.stop == Stop.PAUSE and isinstance(d.promise_date, date)


@pytest.mark.parametrize("text", ["I won't make the transfer", "I will not make the transfer until you fix it",
                                  "לא אעשה את ההעברה"])
def test_refusal_is_dispute(text):
    assert _d(text).intent == Intent.DISPUTE


@pytest.mark.parametrize("text", ["won't make the transfer today, will do it Sunday",
                                  "לא אעשה את ההעברה מחר, רק ביום ראשון",
                                  "did the transfer go through?"])
def test_not_dispute(text):
    assert _d(text).intent != Intent.DISPUTE

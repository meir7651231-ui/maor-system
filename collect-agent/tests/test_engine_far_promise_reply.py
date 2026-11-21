"""הכרעת ראש צוות 20.11 (q21-19): הבטחה מעבר ל-max_defer_days ⇒ «בתשובה ללקוח/ה אומר שבעל העסק יאשר את התאריך».
המימוש (cap + «בדוק ואשר») — מנהל 56bda8c / סט #21b; כאן ננעל נוסח התשובה. ניסוחים חדשים (לא טקסט הסט)."""
import pytest

from app.conversation import respond
from evals.harness import build_ctx


@pytest.mark.parametrize("text", ["I can pay on December 1st.", "אשלם ב-5 בדצמבר"])
@pytest.mark.parametrize("channel", ["sms", "email"])
def test_far_promise_reply_says_owner_will_approve(text, channel):
    ctx = build_ctx({"channel": channel})
    d = respond(text, ctx)
    assert "בעל העסק יאשר את המועד המבוקש" in d.reply
    if channel == "sms":
        assert ctx.fits_sms(d.reply)


def test_within_limit_reply_unchanged():
    d = respond("I'll pay on the 18th", build_ctx({"channel": "sms"}))
    assert "בעל העסק יאשר" not in d.reply and "ולא נשלח תזכורות עד אז" in d.reply

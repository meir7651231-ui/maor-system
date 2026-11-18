"""critic סבב 143 · אימוג׳י (🛑/⛔/✋ די ⇒ הסרה) ותמלול קולי בלי פיסוק ✓. פער ותיק: «תפסיקו כבר», «תפסיקו כבר!»,
«נו תפסיקו כבר», «מספיק כבר», «תפסיקו כבר עם זה», «תפסיקו כבר עם ההודעות», «🤬 תפסיקו כבר» ⇒ unknown — ההסרה אבדה,
אף ש«תפסיקו» לבד ו«די כבר» נתפסים. «כבר» אחרי הפועל שבר את התבנית."""
import pytest

from app.conversation import Intent, respond
from evals.harness import build_ctx


@pytest.mark.parametrize("t", ["תפסיקו כבר", "תפסיקו כבר!", "נו תפסיקו כבר", "מספיק כבר", "תפסיקו כבר עם זה",
                               "תפסיקו כבר עם ההודעות", "🤬 תפסיקו כבר", "הפסיקו כבר", "תפסיק כבר עם הסמסים"])
def test_stop_already(t):
    assert respond(t, build_ctx({"channel": "sms"})).intent == Intent.OPT_OUT, t


@pytest.mark.parametrize("t", ["תפסיקו כבר לחייב אותי פעמיים", "מספיק כבר עם החיובים הכפולים",
                               "כבר שילמתי, תפסיקו את התזכורות על החשבונית הזאת"])
def test_not_plain_optout(t):
    """תלונה על חיוב / שילמתי — לא הסרה לצמיתות (נשארים בכוונה החזקה יותר)."""
    d = respond(t, build_ctx({"channel": "sms"}))
    assert d.intent != Intent.OPT_OUT, (t, d.intent)

"""critic סבב 93 · 🔴 עקיפה של רצפת ההגנה (62f396bb): הרצפה מגינה רק על מה שנתפס בטקסט הגולמי. בקשות
«עזבו אותי» נפוצות לא נתפסות בכלל ⇒ unknown, stop=none ⇒ התזכורות ממשיכות:
«תעזבו אותי בשקט» · «די כבר, נמאס לי מכם» · «עזבו אותי במנוחה» · «נמאס לי מההודעות שלכם».
מלכודות: «נמאס לי מהמצב, אשלם כשאוכל» (קושי, לא הסרה) · «עזבו, אני כבר משלם» (לא הסרה)."""
import pytest

from app.conversation import Intent, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["תעזבו אותי בשקט", "די כבר, נמאס לי מכם", "עזבו אותי במנוחה",
                                  "נמאס לי מההודעות שלכם", "תעזבו אותי כבר!"])
def test_leave_me_alone_is_opt_out(text):
    d = _d(text)
    assert d.stop == Stop.PERMANENT and Intent.OPT_OUT in d.all_intents, (d.intent, d.stop)


@pytest.mark.parametrize("text", ["נמאס לי מהמצב, אשלם כשאוכל", "עזבו, אני כבר משלם"])
def test_traps(text):
    assert _d(text).stop != Stop.PERMANENT

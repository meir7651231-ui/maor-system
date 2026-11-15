"""critic סבב 89 (🟡 מסבב 87, לא טופל ע"י גבי מנוע): הסרה שבאה עם העדפת ערוץ או כוונת תשלום —
«אל תכתבו לי במייל, רק בסמס», «אל תתקשרו אליי, רק תשלחו קישור ואני אשלם» — עצרה לצמיתות בלי הסלמה
(escalate=none) ⇒ לקוח שרוצה לשלם נעלם בשקט ובעל העסק לא יודע. ההסרה נשארת (בטוח משפטית); נוסף כרטיס רגיל
לבעלים עם פעולה ברורה. הסרה נקייה («הסירו אותי», STOP) נשארת בלי כרטיס."""
import pytest

from app.conversation import Escalation, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text", ["אל תכתבו לי יותר במייל, רק בסמס",
                                  "אל תתקשרו אליי יותר, רק תשלחו קישור ואני אשלם",
                                  "אל תכתבו לי שוב, אני משלם עכשיו",
                                  "stop texting me, I will pay by bank transfer"])
def test_opt_out_with_pay_or_channel_wish_tells_the_owner(text):
    d = _d(text)
    assert d.stop == Stop.PERMANENT, d.stop                       # ההסרה מכובדת
    assert d.escalate == Escalation.NORMAL, (d.intent, d.escalate)  # ובעל העסק יודע
    assert any("ערוץ" in a or "לשלם" in a or "תשלום" in a for a in d.owner_actions), d.owner_actions


@pytest.mark.parametrize("text", ["הסירו אותי בבקשה", "STOP", "אל תפנו אליי יותר"])
def test_plain_opt_out_stays_quiet(text):
    d = _d(text)
    assert d.stop == Stop.PERMANENT and d.escalate == Escalation.NONE, (d.intent, d.escalate)

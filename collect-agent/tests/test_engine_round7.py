"""סבב 7 — בקשת הסרה שנפלה ל"לא ברור" אינה פספוס בטוח: unknown לא עוצר תזכורות עד שבעל העסק קורא.
מחלקה מ-qa2 (xq2-01/03), טקסטים חדשים."""
import pytest

from app.conversation import Intent, Stop, respond
from evals.harness import build_ctx


def d(text):
    return respond(text, build_ctx({}))


@pytest.mark.parametrize("text", ["אל תפנו אליי שוב, בשום דרך", "בבקשה לא לכתוב לי יותר אף פעם",
                                  "מספיק! אל תשלחו כלום יותר", "אני לא רוצה שתפנו אליי בכלל",
                                  "תפסיקו ליצור איתי קשר", "אל תיצרו איתי קשר יותר"])
def test_opt_out_phrasings_stop_permanently(text):
    r = d(text)
    assert r.intent == Intent.OPT_OUT and r.stop == Stop.PERMANENT


@pytest.mark.parametrize("text", ["אל תפנו אליי לפני יום ראשון, אני בחו\"ל", "לא לכתוב לי בשבת בבקשה"])
def test_timing_requests_are_not_opt_out(text):
    assert Intent.OPT_OUT not in d(text).all_intents

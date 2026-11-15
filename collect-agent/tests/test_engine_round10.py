"""סבב 10 — העדפת ערוץ בלי מילת-תמידיות («אל תכתבו לי במייל, רק בסמס») נשארה unknown בלי עצירה ⇒
תזכורות המשיכו בדיוק בערוץ שהלקוח ביקש להפסיק. אין במנוע עצירה פר-ערוץ, ולכן: השהיה + כרטיס לבעלים
עם הערוץ המבוקש. לא הסרה לצמיתות (הלקוח לא ביקש להפסיק לגמרי)."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx


def d(text):
    return respond(text, build_ctx({}))


@pytest.mark.parametrize("text", ["אל תשלחו לי מיילים, רק הודעה לנייד", "לא במייל בבקשה, רק SMS",
                                  "אל תתקשרו אליי, תכתבו במייל", "עדיף לי רק במייל, לא בסמס"])
def test_channel_preference_pauses_and_tells_owner(text):
    r = d(text)
    assert r.stop == Stop.PAUSE and r.escalate != Escalation.NONE
    assert any("ערוץ" in a for a in r.owner_actions), r.owner_actions
    assert Intent.OPT_OUT not in r.all_intents


def test_plain_permanent_opt_out_unchanged():
    assert d("אל תשלחו לי יותר שום הודעה").stop == Stop.PERMANENT


def test_channel_word_without_preference_is_untouched():
    r = d("שלחתי לכם מייל עם האסמכתא")
    assert "channel_pref" not in r.tags

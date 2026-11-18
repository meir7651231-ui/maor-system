"""הכרעות ראש צוות 18.11:
  q15-28 — «תפסיקו לחפור (לי בשכל)» = בקשת הפסקה ⇒ הסרה לצמיתות (היה abusive/unknown). בספק — הכוונה המגינה מנצחת.
  q12-11 — «אני רוצה לשלם» / «I want to pay» לבד ⇒ קישור תשלום (היה «לא ברור»).
  שאר הפתוחים (q11-25/28 הבטחה משהה תזכורות; q13-16 מסנן עו״ד בטיוטה ערוכה נשאר; q14-12 בקשת קבלה+«אחרי שאשלם»
  ⇒ «עד מתי?») — המנוע כבר מתנהג לפי ההמלצה; ננעלים כאן."""
import pytest

from app.conversation import Intent, Stop, respond
from evals.harness import build_ctx


def _d(t, **kw):
    return respond(t, build_ctx({"channel": "sms", **kw}))


@pytest.mark.parametrize("text", ["תפסיקו לחפור לי בשכל יא נוכלים", "תפסיקו לחפור", "די לחפור לי", "מספיק לנדנד",
                                  "תפסיק לחפור לי במוח"])
def test_q15_28_stop_digging_is_opt_out(text):
    d = _d(text)
    assert d.intent == Intent.OPT_OUT and d.stop == Stop.PERMANENT


@pytest.mark.parametrize("text", ["אני רוצה לשלם", "I want to pay", "אני רוצה לשלם, איך?"])
def test_q12_11_want_to_pay_is_how_to_pay(text):
    assert _d(text).intent == Intent.HOW_TO_PAY


@pytest.mark.parametrize("text", ["אני רוצה לשלם אבל אין לי כסף"])
def test_want_to_pay_but_cant_stays_cant_pay(text):
    assert _d(text).intent == Intent.CANT_PAY


def test_q11_promise_pauses_reminders():
    assert _d("Stop worrying, I'll pay on Friday").stop == Stop.PAUSE


def test_q13_16_owner_draft_with_lawyer_still_blocked():
    from app import compliance
    assert "lawyer" in compliance.violations("סטודיו: נמתין לפנייה מעורך הדין שלך", compliance.Rules(business="סטודיו"))


@pytest.mark.parametrize("text", ["חלאס, אשלם מחר", "די\nאני משלמת מחר", "מספיק כבר. אשלם", "די לי עם הלחץ, אשלם"])
def test_protective_wins_bare_enough_plus_promise(text):
    d = _d(text)
    assert d.intent == Intent.OPT_OUT and d.stop == Stop.PERMANENT


@pytest.mark.parametrize("text", ["עזוב, אשלם בשבוע הבא", "נמאס לי מהעבודה, אשלם מחר", "די הרבה זמן לקח לי, אשלם מחר",
                                  "מספיק לי שבוע"])
def test_not_opt_out(text):
    assert _d(text).intent != Intent.OPT_OUT


@pytest.mark.parametrize("text,intent", [("די, שילמתי כבר אתמול", Intent.PAID_CLAIM),
                                         ("די, אין לי כסף", Intent.CANT_PAY)])
def test_bare_enough_with_other_content_keeps_it(text, intent):
    """«די» + הבטחה ⇒ הסרה; «די» + טענה אחרת (שילמתי/קושי/מחלוקת) ⇒ הטענה (xc47 בסט המבקר)."""
    assert _d(text).intent == intent

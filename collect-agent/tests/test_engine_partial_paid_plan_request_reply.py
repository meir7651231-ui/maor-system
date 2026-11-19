"""STATUS «הבא» AI (q17-12): «I paid 400 yesterday. can I split the remaining 800 into 2 payments?» — טענת תשלום חלקית
עיקרית, בקשת פריסה משנית. לא מציעים הסדר לפני אימות התשלום (הסדר על כל החוב היה שגוי), אבל התשובה התעלמה מהשאלה.
עכשיו: «נחזור אליכם לגבי חלוקת היתרה לתשלומים»; בלי בקשת פריסה — הנוסח הקודם, ביט אחר ביט."""
from app.conversation import Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


def test_partial_paid_with_plan_request_acknowledges_request_without_plan():
    d = _d("שילמתי 300 אתמול, אפשר לפרוס את מה שנשאר ל-3 תשלומים?")
    assert d.intent == Intent.PAID_CLAIM and Intent.PLAN_REQUEST in d.secondary
    assert not d.plan and "חלוקת היתרה לתשלומים" in d.reply and not d.guardrail_issues


def test_partial_paid_without_plan_request_unchanged():
    d = _d("שילמתי 300")
    assert "נחזור אליכם לגבי היתרה." in d.reply and "חלוקת" not in d.reply


# וריאציות 303 (STATUS «הבא» AI: וריאציות 295–308): תנאי-משכורת בסדר אחר — «once my salary comes in», «when my
# paycheck comes», «כשהמשכורת תיכנס» ⇒ היו UNKNOWN (בלי השהיה); עם המשך עוין ⇒ נשאר UNKNOWN + כרטיס (159/305).
import pytest  # noqa: E402


@pytest.mark.parametrize("text", ["once my salary comes in", "when my paycheck comes",
                                  "when the salary arrives ill pay",
                                  "כשהמשכורת תיכנס", "ברגע שהכסף ייכנס אעביר"])
def test_salary_arrives_variants_are_promise(text):
    assert _d(text).intent == Intent.PROMISE


@pytest.mark.parametrize("text", ["once my salary comes in I'm done with you", "כשהמשכורת תיכנס אני מבטל את החוג"])
def test_salary_arrives_with_hostile_tail_not_silent_promise(text):
    assert _d(text).intent != Intent.PROMISE

"""critic סבב 148 · «נשבר/התקלקל/לא עובד» לבד ⇒ מחלוקת (שורה 660). נכון למוצר/שירות («המוצר נשבר»), אבל:
  · «הטלפון שלי נשבר, אשלם כשאתקן», «נשבר לי המסך של הטלפון, אשלם מחר», «המחשב התקלקל, אעביר מחר» — המכשיר
    **של הלקוח** (סיבה לעיכוב) + הבטחה ⇒ מחלוקת דחופה (השהיה + מייל דחוף). עכשיו: הבטחה בלי מחלוקת.
  · «זה הגיע שבור», «הגיע פגום», «it arrived broken» (המוצר שסופק) ⇒ unknown. עכשיו: מחלוקת.
«נשבר לי» לבד (סלנג «נמאס») ⇒ נשאר מחלוקת דחופה (כיוון בטוח, לצוות להכריע)."""
import pytest

from app.conversation import Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("t", ["הטלפון שלי נשבר, אשלם כשאתקן", "נשבר לי המסך של הטלפון, אשלם מחר",
                               "המחשב התקלקל, אעביר מחר", "my phone broke, ill pay tomorrow"])
def test_own_device_broken_with_promise_not_dispute(t):
    d = _d(t)
    assert d.intent != Intent.DISPUTE and Intent.DISPUTE not in d.secondary, (t, d.intent, d.secondary)


@pytest.mark.parametrize("t", ["זה הגיע שבור", "המוצר הגיע פגום", "הגיע שבור ואני לא משלם", "it arrived broken"])
def test_delivered_broken_is_dispute(t):
    assert _d(t).intent == Intent.DISPUTE, t


@pytest.mark.parametrize("t", ["המוצר נשבר", "המכונה שתיקנתם התקלקלה שוב", "הרכב שלי התקלקל שוב אחרי הטיפול, לא משלם",
                               "המזגן שהתקנתם לא עובד"])
def test_real_broken_dispute_kept(t):
    assert _d(t).intent == Intent.DISPUTE, t

"""critic סבב 138 · ורטיקלים אחרים (מספרה/קוסמטיקה/מוסך/קליניקה/רו״ח). 15 הודעות שגרתיות — נקיות.
פער ותיק: 15 תלונות אמיתיות ⇒ unknown (בלי מחלוקת דחופה): «הרכב חזר עם אותה תקלה», «חייבו על טיפול שלא עשיתי»,
«ביטלתי את התור יום לפני ובכל זאת חייבו», «התספורת יצאה הרוסה», «השיער נשרף מהצבע», «המוסך לא תיקן את מה שביקשתי»,
«רואה החשבון לא הגיש את הדוח בזמן», ובאנגלית «came back with the same problem», «charged me for a treatment I never
had», «was still charged», «came out terrible», «part that was never replaced», «accountant missed the deadline»,
«the haircut was ruined», «did not fix what I asked»."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("t", [
    "הרכב חזר עם אותה תקלה", "חייבו על טיפול שלא עשיתי", "ביטלתי את התור יום לפני ובכל זאת חייבו",
    "התספורת יצאה הרוסה", "השיער נשרף מהצבע", "המוסך לא תיקן את מה שביקשתי",
    "רואה החשבון לא הגיש את הדוח בזמן וקיבלתי קנס", "the car came back with the same problem",
    "you charged me for a treatment I never had", "I cancelled the appointment a day before and was still charged",
    "the color came out terrible", "you charged for a part that was never replaced",
    "my accountant missed the deadline and I got fined", "the haircut was ruined", "they did not fix what I asked",
])
def test_vertical_complaint_is_dispute(t):
    d = _d(t)
    assert d.intent == Intent.DISPUTE and d.escalate == Escalation.URGENT, (t, d.intent)


@pytest.mark.parametrize("t", [
    "הצבע יצא מהמם, תודה!", "התספורת יצאה מושלמת", "did they fix the car yet?", "the haircut came out great",
    "I missed the deadline for the payment, sorry, paying now", "הרכב חזר מהטסט, תודה", "מתי יתקנו את הרכב?",
    "לא תיקנו עדיין? מתי יהיה מוכן", "the color came out great, will pay friday",
])
def test_vertical_routine_not_dispute(t):
    assert _d(t).intent != Intent.DISPUTE, (t, _d(t).intent)

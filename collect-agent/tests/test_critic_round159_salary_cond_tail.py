"""critic סבב 159 · 🟡 לתיקון בונה — רכיב: `app/conversation.py` → `_en_salary_promise` (מנהל 303, `ad75e37c`)
ובעברית הדפוס המקביל של «כשאקבל משכורת» (קיים מקודם, 303 העתיק את השוויון).

תנאי-המשכורת נקרא הבטחה גם כשההמשך הוא עוינות / ביטול / «לא מבטיח» — ההמשך נבדק רק לפי מילת-פתיחה
(«then», «and», «on the 10th», «this») ולא לפי מה שנאמר אחריה. נמדד (respond, sms):
  «once I get paid then I'm done with you people» ⇒ promise, escalate=NONE, טיוטה «תודה דנה! עד איזה תאריך…»
  «when I get paid on the 10th I'm cancelling the lessons» ⇒ promise ⇒ «רשמנו שהתשלום צפוי…»
  (הודעת ביטול לא מגיעה כ«לא ברור» לבעלים)
  «when I get paid I promise nothing» · «when I get paid and pigs fly» · «כשאקבל משכורת אני מבטל את החוג» ⇒ promise
בקרה: «this is the last time I use you» לבד ⇒ unknown (כרטיס לבעלים) — כלומר תנאי-המשכורת בראש ההודעה **מסתיר**
את מה שהיה מגיע לבעל העסק. הצעה: כשאחרי התנאי יש תוכן שאינו מועד/פועל-תשלום (cancel/done/last time/promise
nothing/pigs fly/מבטל/נגמר) ⇒ לא PROMISE (UNKNOWN ⇒ כרטיס), או PROMISE + הסלמה. הבדיקות xfail(strict=True)."""
import pytest

from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx

TAILS = ["once I get paid then I'm done with you people",
         "when I get paid on the 10th I'm cancelling the lessons",
         "when I get paid I promise nothing",
         "when I get paid and pigs fly",
         "כשאקבל משכורת אני מבטל את החוג"]


@pytest.mark.parametrize("text", TAILS)
def test_salary_condition_with_hostile_or_cancel_tail_reaches_owner(text):
    d = respond(text, build_ctx({"channel": "sms"}))
    assert d.intent != Intent.PROMISE or d.escalate != Escalation.NONE, (text, d.intent, d.reply)


@pytest.mark.parametrize("text", ["when I get paid", "when I get paid on the 10th I'll transfer it",
                                  "כשאקבל משכורת", "once I get paid then I'll pay"])
def test_control_plain_salary_promise_stays_promise(text):
    assert respond(text, build_ctx({"channel": "sms"})).intent == Intent.PROMISE

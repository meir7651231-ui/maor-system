"""critic סבב 133 · פער ותיק: מחלוקות יומיומיות (שירות לא סופק / באיחור / חלקי, מוצר לא הגיע, ביטול שכבר בוקש,
מחיר שלא הוסכם) ⇒ unknown — בלי השהיה דחופה ובלי כרטיס מחלוקת. 21 ניסוחים בסיסיים, עברית ואנגלית."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from evals.harness import build_ctx

DISPUTES = [
    "לא קיבלתי את ההזמנה", "המוצר לא הגיע", "השירות לא סופק", "הם הגיעו באיחור של שעתיים ולא סיימו",
    "עשו רק חצי מהעבודה", "ביקשתי לבטל לפני שבוע", "ביקשתי ביטול ועדיין מחייבים", "ביטלתי בזמן",
    "אמרו לי שזה יעלה 500",
    "I still havent received the product", "my order never arrived", "the service was never provided",
    "the technician never showed up", "they were late and didnt finish", "the job was only half done",
    "I asked to cancel a week ago", "I cancelled before the deadline", "we never agreed on this price",
    "you quoted me 500", "that is not the price we agreed", "the work isnt finished",
]


@pytest.mark.parametrize("t", DISPUTES)
def test_everyday_dispute(t):
    d = respond(t, build_ctx({"channel": "sms"}))
    assert d.intent == Intent.DISPUTE and d.stop == Stop.PAUSE and d.escalate == Escalation.URGENT, (t, d.intent)


@pytest.mark.parametrize("t,bad", [
    ("לא קיבלתי את החשבונית, אפשר לשלוח שוב?", Intent.DISPUTE),
    ("לא קיבלתי את הקישור לתשלום", Intent.DISPUTE),
    ("the package arrived, thanks! will pay friday", Intent.DISPUTE),
    ("can you quote me a price for next month?", Intent.DISPUTE),
    ("המוצר הגיע, תודה", Intent.DISPUTE),
    ("I havent received the invoice yet", Intent.DISPUTE),
])
def test_traps(t, bad):
    assert respond(t, build_ctx({"channel": "sms"})).intent != bad, t


def test_i_didnt_finish_reading_not_dispute():
    assert respond("sorry I didn't finish reading your message, will pay friday",
                   build_ctx({"channel": "sms"})).intent != Intent.DISPUTE

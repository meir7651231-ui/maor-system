"""critic סבב 112 · 🔴 הודעה ברוסית/ערבית ⇒ «שפה זרה»: השהיה + כרטיס **רגיל**. מצוקה או קטין בשפה זרה לא הוסלמו
לדחוף ⇒ מייל הדחוף לבעלים (סבב 102) לא נשלח, ובעל העסק אולי לא קורא את השפה. תיקון: סימני מצוקה/קטין בסיסיים
ברוסית ובערבית ⇒ דחוף + תווית בעברית בכרטיס («ייתכן מצוקה», «ייתכן קטין») — עדיין בלי מענה אוטומטי."""
import pytest

from app.conversation import Escalation, Stop, respond
from evals.harness import build_ctx


def _d(t):
    return respond(t, build_ctx({"channel": "sms"}))


@pytest.mark.parametrize("text, kind", [("Хочу умереть", "מצוקה"), ("Я больше не могу жить", "מצוקה"),
                                        ("أريد أن أموت", "מצוקה"), ("لا أريد أن أعيش", "מצוקה"),
                                        ("Мне 14 лет", "קטין"), ("عمري 14 سنة", "קטין"), ("عمري ١٤ سنة", "קטין")])
def test_foreign_distress_or_minor_is_urgent(text, kind):
    d = _d(text)
    assert d.escalate == Escalation.URGENT and d.stop != Stop.NONE, (d.intent, d.escalate)
    assert kind in d.owner_summary, d.owner_summary
    assert d.reply is None and not d.auto_send


@pytest.mark.parametrize("text", ["Мне 40 лет, заплачу завтра", "Здравствуйте, когда можно оплатить?",
                                  "شكرا، سأدفع غدا"])
def test_ordinary_foreign_stays_normal(text):
    assert _d(text).escalate != Escalation.URGENT


def test_foreign_distress_triggers_owner_email(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", "Хочу умереть")
    mails = [m for m in svc.sender.sent if m["channel"] == "email" and m.get("audience") == "owner"]
    assert mails and "умереть" not in mails[-1]["body"], [m.get("subject") for m in mails]

"""הכרעת ראש צוות 19.11 (qa19 q19-09/11): «wrong number, stop texting» = שני הדברים יחד — מספר שגוי לצמיתות
(הכתובת יוצאת מהחייב, אין שום שליחה אליה) + בקשת הסרה מתועדת + כרטיס לבעל העסק לעדכון מספר.
ספק ⇒ המחמיר מנצח ⇒ לא שולחים כלום (גם לא «הבקשה התקבלה» לזר)."""
import pytest

from app.conversation import Escalation, Intent, Stop, respond
from app.inbox import ConversationInbox
from evals.harness import build_ctx
from tests.conftest import customer_sent

COMBO_SMS = ["wrong number, please stop messaging me", "טעות במספר, תפסיקו לשלוח לי הודעות",
             "you have the wrong number. stop texting."]
COMBO_EMAIL = ["This is the wrong email address, I'm not your client. Stop emailing me.",
               "wrong e-mail. please remove me"]


@pytest.mark.parametrize("text,ch", [(t, "sms") for t in COMBO_SMS] + [(t, "email") for t in COMBO_EMAIL])
def test_combo_is_wrong_person_plus_opt_out_no_reply(text, ch):
    d = respond(text, build_ctx({"channel": ch}))
    assert d.intent == Intent.WRONG_PERSON and Intent.OPT_OUT in d.secondary
    assert d.stop == Stop.PERMANENT and d.reply is None and not d.auto_send
    assert d.escalate != Escalation.NONE and any("לעדכן" in a for a in d.owner_actions)


# בקרה: כל אחד לבד — ללא שינוי (מספר שגוי ⇒ התנצלות בטיוטה; הסרה ⇒ אישור הסרה)
def test_each_alone_unchanged():
    w = respond("wrong number", build_ctx({"channel": "sms"}))
    o = respond("stop texting me", build_ctx({"channel": "sms"}))
    assert w.intent == Intent.WRONG_PERSON and w.reply and Intent.OPT_OUT not in w.secondary
    assert o.intent == Intent.OPT_OUT and o.reply


def _cust(svc, cid):
    return svc.db.one("SELECT * FROM customers WHERE id=?", (cid,))


@pytest.mark.parametrize("ch,addr,text", [("sms", "050-1234567", "wrong number, stop texting me"),
                                          ("email", "c1@example.com",
                                           "You have the wrong email address. Please stop.")])
def test_service_both_effects_and_nothing_sent(svc, ch, addr, text):
    svc.sync()
    inbox = ConversationInbox(svc, llm=None)
    col = "phone" if ch == "sms" else "email"
    if ch == "sms":
        cid = svc.db.one("SELECT id FROM customers WHERE name='דנה כהן'")["id"]
    else:
        cid = svc.db.one("SELECT id FROM customers WHERE email=?", (addr,))["id"]
    before = len(customer_sent(svc))
    inbox.handle(ch, addr, text)
    c = _cust(svc, cid)
    assert c["opted_out"] == 1 and c[col] is None                    # מספר שגוי לצמיתות: הכתובת יצאה מהחייב
    acts = [r["action"] for r in svc.db.q("SELECT action FROM audit")]
    assert "opt_out_request" in acts                                   # בקשת ההסרה מתועדת
    assert svc.db.one("SELECT COUNT(*) n FROM messages WHERE customer_id=? AND needs_owner=1", (cid,))["n"] >= 1
    svc.dispatch()
    assert len(customer_sent(svc)) == before                           # לא נשלח כלום

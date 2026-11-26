"""מנהל 433 (מבקר 262🟡): לקוחה שההסרה שלה עברה בירושה בקובץ (219א/239) ושולחת «הסר» בעצמה ⇒ זו הבקשה הראשונה
שלה: טיוטת אישור + ההסרה נרשמת על שמה (suppression + audit). הודעה שאינה הסרה ⇒ מסלול 239 ללא שינוי; הסרה אמיתית
חוזרת ⇒ שקט כמו קודם."""
from datetime import timedelta

from tests.test_critic_round239_inherited_optout import DANA, MICHAL, _row, _sent_to_dana


def _inherited(svc, clock):
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "STOP")
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    return svc.db.one("SELECT id FROM customers WHERE phone=?", (MICHAL,))["id"]


def _acks(svc, cid):
    return svc.db.q("SELECT id FROM drafts WHERE customer_id=? AND intent='opt_out'", (cid,))


def test_hebrew_first_optout_ack_and_recorded(svc, clock):
    cid = _inherited(svc, clock)
    assert svc._inherited_optout(cid)
    r = svc.inbound("sms", MICHAL, "הסר אותי")
    assert r["intent"] == "opt_out" and r["draft_id"]
    assert len(_acks(svc, cid)) == 1
    assert svc.suppressed("sms", MICHAL)
    # עכשיו ההסרה שלה עצמה — כבר לא ירושה
    assert not svc._inherited_optout(cid)


def test_second_optout_silent(svc, clock):
    cid = _inherited(svc, clock)
    svc.inbound("sms", MICHAL, "please remove me")
    r = svc.inbound("sms", MICHAL, "please remove me")
    assert r["draft_id"] is None and len(_acks(svc, cid)) == 1


def test_non_optout_message_keeps_239_path(svc, clock):
    cid = _inherited(svc, clock)
    r = svc.inbound("sms", MICHAL, "שילמתי את החשבונית")
    assert r["intent"] != "opt_out"
    assert not svc.suppressed("sms", MICHAL)
    assert not _acks(svc, cid)
    assert svc.db.one("SELECT 1 FROM messages WHERE intent='inherited_optout' AND customer_id=?", (cid,))

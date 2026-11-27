"""מנהל 452 · מבקר 277ℹ️: חלון בין ה-SMS למייל של אותה תזכורת.

היה: `dispatch` קרא את שורת הלקוח פעם אחת לפני ה-claim ⇒ «הסר אותי» מהלקוח (או «שולם»/השהיית קטין) שהגיע אחרי
שה-SMS יצא ולפני המייל — לא עצר את המייל (gate ראה opted_out ישן). עכשיו: לפני כל הודעה נוספת — שורת לקוח טרייה +
`_midsend_block` (חסימת לקוח / חשבונית שכבר לא פתוחה) ⇒ המייל לא יוצא, audit `dispatch_stopped_midway`.
"""
from __future__ import annotations

import json

import pytest

from app.channels import sent_mark, sent_since


def _approved(svc):
    svc.sync()
    rid = svc.plan()[0]
    assert [m["channel"] for m in json.loads(
        svc.db.one("SELECT payload FROM reminders WHERE id=?", (rid,))["payload"])] == ["sms", "email"]
    svc.approve(rid, confirm_open=True)
    iid = svc.db.one("SELECT invoice_id FROM reminders WHERE id=?", (rid,))["invoice_id"]
    cid = svc.db.one("SELECT customer_id FROM invoices WHERE id=?", (iid,))["customer_id"]
    return rid, iid, cid, svc.db.one("SELECT phone FROM customers WHERE id=?", (cid,))["phone"]


def _after_first_send(svc, during):
    orig = svc.sender.send
    state = {"n": 0}

    def w(msg):
        out = orig(msg)
        state["n"] += 1
        if state["n"] == 1:
            during()
        return out
    svc.sender.send = w


@pytest.mark.parametrize("act", ["reply_optout", "paid", "hold", "dispute"])
def test_action_between_sms_and_email_stops_email(svc, act):
    rid, iid, cid, phone = _approved(svc)
    acts = {"reply_optout": lambda: svc.inbound("sms", phone, "הסר אותי"),
            "paid": lambda: svc.mark_paid_outside(iid),
            "hold": lambda: svc.set_hold(cid, "minor", ""),
            "dispute": lambda: svc.db.x("UPDATE customers SET disputed=1 WHERE id=?", (cid,))}
    _after_first_send(svc, acts[act])
    mark = sent_mark(svc.sender.sent)
    out = svc.dispatch()
    assert len(out) == 1 and len(out[0]["message_ids"]) == 1   # רק ה-SMS
    reminders = [m for m in sent_since(svc.sender.sent, mark) if "טרם סומנה" in str(m)]
    assert len(reminders) == 1 and "'email'" not in str(reminders[0])   # המייל של התזכורת לא יצא
    ev = svc.db.one("SELECT detail FROM audit WHERE action='dispatch_stopped_midway'")
    assert ev and json.loads(ev["detail"])["reminder"] == rid


def test_control_no_action_sends_both(svc):
    _approved(svc)
    out = svc.dispatch()
    assert len(out) == 1 and len(out[0]["message_ids"]) == 2
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='dispatch_stopped_midway'")

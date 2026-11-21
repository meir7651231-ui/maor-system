"""מנהל 360 (מבקר 206🔴): הודעה דחופה / השהיה קשה עוצרת תשובות `approved` שממתינות לחלון — בגבולות הנכונים."""
import json


def _approved(svc, text="איך משלמים?"):
    svc.sync()
    r = svc.inbound("sms", "050-1234567", text)
    svc.db.x("UPDATE drafts SET status='approved' WHERE id=?", (r["draft_id"],))
    return r["draft_id"]


def _status(svc, did):
    return svc.db.one("SELECT status, decided_by FROM drafts WHERE id=?", (did,))


def test_card_tells_owner_and_audit(svc):
    did = _approved(svc)
    r = svc.inbound("sms", "050-1234567", "אני בן 16")
    st = _status(svc, did)
    assert (st["status"], st["decided_by"]) == ("superseded", "system:protective_reply")
    card = svc.db.one("SELECT owner_actions FROM drafts WHERE id=?", (r["draft_id"],))
    assert any("עצרנו תשובה שאישרת" in a for a in json.loads(card["owner_actions"]))
    a = svc.db.one("SELECT detail FROM audit WHERE action='approved_drafts_stopped_protective'")
    assert json.loads(a["detail"])["drafts"] == [did]


def test_non_urgent_reply_keeps_approved(svc):
    did = _approved(svc)
    svc.inbound("sms", "050-1234567", "תודה רבה")
    assert _status(svc, did)["status"] == "approved"
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='approved_drafts_stopped_protective'")


def test_promise_keeps_approved(svc):
    did = _approved(svc)
    svc.inbound("sms", "050-1234567", "אשלם ב-15 לחודש")
    assert _status(svc, did)["status"] == "approved"


def test_dispatch_sends_nothing_after_stop(svc):
    did = _approved(svc)
    svc.inbound("sms", "050-1234567", "אבא שלי נפטר אתמול, אני הבן שלו")
    svc.dispatch()
    assert _status(svc, did)["status"] == "superseded"
    assert not [m for m in svc.db.q("SELECT body FROM messages WHERE customer_id=1 AND direction='out'")
                if "בקישור" in m["body"]]


def test_earlier_urgent_approved_reply_not_stopped(svc):
    """תשובת אמפתיה דחופה שאושרה ממתינה לחלון — הודעה דחופה נוספת לא עוצרת אותה (זו לא גבייה)."""
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "אבא שלי נפטר אתמול, אני הבן שלו")
    svc.db.x("UPDATE drafts SET status='approved' WHERE id=?", (r["draft_id"],))
    svc.inbound("sms", "050-1234567", "אני בהליך פשיטת רגל")
    if svc.db.one("SELECT escalate FROM drafts WHERE id=?", (r["draft_id"],))["escalate"] == "urgent":
        assert _status(svc, r["draft_id"])["status"] == "approved"

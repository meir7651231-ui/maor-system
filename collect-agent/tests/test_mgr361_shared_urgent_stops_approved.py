"""מנהל 361 (ביקורת 207🔴): פנייה דחופה מכתובת **משותפת** («אני בן 15», «אבא נפטר», עו״ד) עוקפת את handle_customer ⇒
תשובה מאושרת (קישור תשלום) לאחד המקושרים, שממתינה לחלון, יצאה ב-dispatch — אף שכרטיס הכתובת המשותפת מבטיח
«בלי תשובה ללקוח עד שבעל העסק בוחר». עכשיו נעצרת לכל המקושרים, כמו בפנייה ישירה (מנהל 360)."""
import json

import pytest

from tests.conftest import customer_sent


@pytest.fixture
def shared(svc, fake_gi):
    fake_gi.docs[1]["client"]["phone"] = "050-1234567"       # דנה ויוסי על אותו טלפון
    svc.sync()
    return svc


def _approved_for(svc, cid, text="איך משלמים?"):
    c = svc.db.one("SELECT * FROM customers WHERE id=?", (cid,))
    r = svc.inbox.handle_customer(c, "sms", text)
    svc.db.x("UPDATE drafts SET status='approved' WHERE id=?", (r["draft_id"],))
    return r["draft_id"]


@pytest.mark.parametrize("text", ["אני בן 15", "העברתי לעורך הדין שלי", "פוטרתי, אין לי כסף ואני על סף קריסה"])
def test_shared_urgent_stops_approved_of_all_linked(shared, text):
    svc = shared
    d1, d2 = _approved_for(svc, 1), _approved_for(svc, 2)
    r = svc.inbound("sms", "050-1234567", text)
    assert r["intent"] == "shared_contact_urgent"
    for did in (d1, d2):
        st = svc.db.one("SELECT status, decided_by FROM drafts WHERE id=?", (did,))
        assert (st["status"], st["decided_by"]) == ("superseded", "system:protective_reply")
    svc.dispatch()
    assert customer_sent(svc) == []
    card = svc.db.one("SELECT payload FROM messages WHERE id=?", (r["card_id"],))
    assert json.loads(card["payload"])["stopped_approved"] == 2
    audits = [json.loads(a["detail"]) for a in
              svc.db.q("SELECT detail FROM audit WHERE action='approved_drafts_stopped_protective'")]
    assert sorted(a["customer"] for a in audits) == [1, 2]
    assert all(a["shared_card"] == r["card_id"] for a in audits)


def test_shared_paid_claim_does_not_stop(shared):
    """«שילמתי» מכתובת משותפת אינו דחוף — כמו בפנייה ישירה, לא עוצר (ההשהיה של הכרטיס מטפלת בתזכורות)."""
    svc = shared
    did = _approved_for(svc, 1)
    r = svc.inbound("sms", "050-1234567", "שילמתי אתמול")
    if r["intent"] == "shared_contact_paid_claim":
        assert svc.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"] == "approved"
        assert "stopped_approved" not in json.loads(
            svc.db.one("SELECT payload FROM messages WHERE id=?", (r["card_id"],))["payload"])


def test_no_approved_no_payload_key(shared):
    r = shared.inbound("sms", "050-1234567", "אני בן 15")
    assert "stopped_approved" not in json.loads(
        shared.db.one("SELECT payload FROM messages WHERE id=?", (r["card_id"],))["payload"])


def test_opt_out_approval_not_stopped(shared):
    """אישור הסרה שממתין לחלון אינו גבייה — לא נעצר."""
    svc = shared
    did = _approved_for(svc, 1)
    svc.db.x("UPDATE drafts SET intent='opt_out' WHERE id=?", (did,))
    svc.inbound("sms", "050-1234567", "אני בן 15")
    assert svc.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"] == "approved"

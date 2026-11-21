"""מנהל 362 · מבקר 207🟡 — תשובה שאושרה וממתינה לחלון (`approved`) נעצרת גם אחרי «שילמתי» ואחרי «רק מייל».

לפני: `_stop_approved_on_protective` עצר רק בדחוף / השהיה קשה ⇒ «איך משלמים?» אושרה בערב ⇒ «שילמתי» ⇒ בבוקר יצא
«אפשר לשלם (1,200 ₪) בקישור» אחרי «עצרנו את התזכורות ונבדוק»; «תפסיקו לשלוח SMS, רק מייל» ⇒ התשובה יצאה ב-SMS.
אחרי: superseded (`system:protective_reply`) + שורה בכרטיס + audit עם הסיבה. הודעה רגילה («תודה») — לא נעצרת."""
import json

import pytest

CASES = [("שילמתי", "paid_claim"), ("תפסיקו לשלוח לי SMS, רק מייל", "channel_pref")]


def _run(svc, second):
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "איך משלמים?")
    svc.db.x("UPDATE drafts SET status='approved' WHERE id=?", (r["draft_id"],))
    r2 = svc.inbound("sms", "050-1234567", second)
    return r["draft_id"], r2


@pytest.mark.parametrize("second,pause", CASES)
def test_approved_stopped_with_reason(svc, second, pause):
    did, _ = _run(svc, second)
    row = svc.db.one("SELECT status, decided_by FROM drafts WHERE id=?", (did,))
    assert (row["status"], row["decided_by"]) == ("superseded", "system:protective_reply")
    a = svc.db.one("SELECT detail FROM audit WHERE action='approved_drafts_stopped_protective' ORDER BY id DESC")
    assert json.loads(a["detail"])["pause"] == pause


@pytest.mark.parametrize("second,_p", CASES)
def test_card_tells_owner(svc, second, _p):
    _, r2 = _run(svc, second)
    assert any("עצרנו תשובה שאישרת" in x for x in r2["owner_actions"])


@pytest.mark.parametrize("second,_p", CASES)
def test_nothing_sent_after_dispatch(svc, second, _p):
    did, _ = _run(svc, second)
    svc.dispatch()
    assert svc.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"] == "superseded"


def test_ordinary_reply_does_not_stop(svc):
    did, r2 = _run(svc, "תודה")
    assert not any("עצרנו תשובה שאישרת" in x for x in r2["owner_actions"])
    svc.dispatch()
    assert svc.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"] == "sent_dry_run"

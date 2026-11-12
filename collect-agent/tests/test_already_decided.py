"""הפעלה 146 — ניסיון חוזר של הכרעה שכבר נרשמה.

המצב: בעל העסק לוחץ «אישור», השרת רושם את האישור, והתשובה אובדת ברשת (הפעלות 144–145: «לא ידוע אם
הפעולה נרשמה»). אם הוא מנסה שוב, השרת ענה 409 עם «לא ממתינה לאישור (status=approved)»: קוד סטטוס גולמי,
ובממשק זה הוצג כשגיאה («לא אושר: …») אף שהתזכורת מאושרת.
התיקון: עדיין 409 ובלי שינוי מצב, אבל (1) הנוסח בעברית בלי קוד גולמי, (2) אותה הכרעה שוב מסומנת
בכותרת `X-Gabi-Already` כדי שהממשקים יציגו «כבר אושרה» ולא שגיאה, (3) ביומן הביקורת אין רישום כפול.
"""
from __future__ import annotations

import re
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

ROOT = Path(__file__).resolve().parent.parent
RAW = re.compile(r"status=|pending_approval|approved|rejected|sent_dry_run|cancelled")


def _api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _first_pending(api):
    api.post("/sync")
    api.post("/plan")
    return api.get("/reminders", params={"status": "pending_approval"}).json()[0]["id"]


def _audits(svc, action):
    return svc.db.q("SELECT * FROM audit WHERE action=?", (action,))


def test_second_approve_is_409_already_approved_in_hebrew(svc):
    api = _api(svc)
    rid = _first_pending(api)
    assert api.post(f"/reminders/{rid}/approve").status_code == 200
    before = svc.db.q("SELECT * FROM reminders WHERE id=?", (rid,))[0]
    again = api.post(f"/reminders/{rid}/approve")
    assert again.status_code == 409
    assert again.headers.get("x-gabi-already") == "approved"
    detail = again.json()["detail"]
    assert detail == "התזכורת כבר אושרה"
    assert not RAW.search(detail)
    # לא נרשם אישור שני, והשורה לא השתנתה (decided_at, approved_hash)
    assert len(_audits(svc, "approve")) == 1
    assert dict(svc.db.q("SELECT * FROM reminders WHERE id=?", (rid,))[0]) == dict(before)


def test_approve_after_send_says_already_sent(svc):
    api = _api(svc)
    rid = _first_pending(api)
    api.post(f"/reminders/{rid}/approve")
    svc.db.x("UPDATE reminders SET status='sent_dry_run' WHERE id=?", (rid,))
    r = api.post(f"/reminders/{rid}/approve")
    assert r.status_code == 409 and r.headers.get("x-gabi-already") == "approved"
    assert r.json()["detail"] == "התזכורת כבר אושרה ונשלחה"


def test_approve_of_rejected_is_a_real_refusal(svc):
    """דחייה ואז אישור = סירוב אמיתי: בלי הכותרת, כדי שהממשק לא יציג «כבר אושרה»."""
    api = _api(svc)
    rid = _first_pending(api)
    assert api.post(f"/reminders/{rid}/reject").status_code == 200
    r = api.post(f"/reminders/{rid}/approve")
    assert r.status_code == 409 and "x-gabi-already" not in r.headers
    assert r.json()["detail"] == "התזכורת כבר נדחתה. אי אפשר לאשר אותה"
    assert not RAW.search(r.json()["detail"])
    assert _audits(svc, "approve") == []


def test_second_reject_is_already_rejected(svc):
    api = _api(svc)
    rid = _first_pending(api)
    api.post(f"/reminders/{rid}/reject")
    r = api.post(f"/reminders/{rid}/reject")
    assert r.status_code == 409 and r.headers.get("x-gabi-already") == "rejected"
    assert r.json()["detail"] == "התזכורת כבר נדחתה"
    assert len(_audits(svc, "reject")) == 1


def test_reject_after_send_is_refused_without_marker(svc):
    api = _api(svc)
    rid = _first_pending(api)
    api.post(f"/reminders/{rid}/approve")
    svc.db.x("UPDATE reminders SET status='sent_dry_run' WHERE id=?", (rid,))
    r = api.post(f"/reminders/{rid}/reject")
    assert r.status_code == 409 and "x-gabi-already" not in r.headers
    assert r.json()["detail"] == "התזכורת כבר אושרה ונשלחה. אי אפשר לדחות אותה"


def test_unknown_status_still_hebrew_without_raw_code(svc):
    api = _api(svc)
    rid = _first_pending(api)
    svc.db.x("UPDATE reminders SET status='weird_state' WHERE id=?", (rid,))
    for action in ("approve", "reject"):
        r = api.post(f"/reminders/{rid}/{action}")
        assert r.status_code == 409 and "x-gabi-already" not in r.headers
        assert "weird_state" not in r.json()["detail"] and not RAW.search(r.json()["detail"])


def test_other_409s_carry_no_marker(svc):
    """סירוב רגיל (חסימה קשה) לא מקבל את הכותרת: רק הכרעה חוזרת."""
    api = _api(svc)
    rid = _first_pending(api)
    svc.db.x("UPDATE reminders SET block_reason='no_contact' WHERE id=?", (rid,))
    r = api.post(f"/reminders/{rid}/approve")
    assert r.status_code == 409 and "x-gabi-already" not in r.headers


def test_source_guard_no_raw_status_in_reminder_refusals():
    src = (ROOT / "app/service.py").read_text(encoding="utf-8")
    assert "לא ממתינה לאישור (status=" not in src
    assert "לא ניתן לדחות (status=" not in src
    assert 'headers={"X-Gabi-Already": state}' in (ROOT / "app/main.py").read_text(encoding="utf-8")


# ---------- הפעלה 147: אותו כלל להצעות פריסה ולטיוטות מענה ----------

def _plan(api):
    rid = _first_pending(api)
    api.post(f"/reminders/{rid}/approve")
    api.post("/dispatch")
    res = api.post("/inbound", json={"sender": "050-1234567", "text": "אפשר פריסה?"}).json()
    return res["plan_id"]


def _draft(api):
    api.post("/sync")
    return api.post("/conversation/inbound",
                    json={"channel": "sms", "sender": "050-1234567", "text": "איך אפשר לשלם?"}).json()["draft_id"]


def test_second_plan_approve_is_already_approved(svc):
    api = _api(svc)
    pid = _plan(api)
    assert api.post(f"/plans/{pid}/approve").status_code == 200
    sent = len(svc.sender.sent)
    r = api.post(f"/plans/{pid}/approve")
    assert r.status_code == 409 and r.headers.get("x-gabi-already") == "approved"
    assert r.json()["detail"] == "הצעת הפריסה כבר אושרה"
    # בלי אישור שני ביומן, בלי הודעה שנייה ללקוח
    assert len(_audits(svc, "plan_approved")) == 1 and len(svc.sender.sent) == sent


def test_already_approved_plan_wins_over_amount_check(svc, monkeypatch):
    """ניסיון חוזר בלי confirm_amount על הצעה שכבר אושרה: «כבר אושרה», לא דרישת אישור סכום."""
    api = _api(svc)
    pid = _plan(api)
    assert api.post(f"/plans/{pid}/approve").status_code == 200
    monkeypatch.setattr(svc, "_amount_outliers", lambda invs: [(invs[0], 1)] if invs else [])
    r = api.post(f"/plans/{pid}/approve")
    assert r.status_code == 409 and r.headers.get("x-gabi-already") == "approved"


def test_superseded_or_unknown_plan_is_a_real_refusal(svc):
    api = _api(svc)
    pid = _plan(api)
    for status in ("superseded", "approving", "weird_state"):
        svc.db.x("UPDATE plans SET status=? WHERE id=?", (status, pid))
        r = api.post(f"/plans/{pid}/approve")
        assert r.status_code == 409 and "x-gabi-already" not in r.headers
        assert "הצעת הפריסה" in r.json()["detail"] and not RAW.search(r.json()["detail"])
        assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == status
    assert _audits(svc, "plan_approved") == []
    assert api.post("/plans/99999/approve").status_code == 409


def test_second_draft_approve_is_already_approved(svc):
    api = _api(svc)
    did = _draft(api)
    assert api.post(f"/conversation/drafts/{did}/approve").status_code == 200
    sent = len(svc.sender.sent)
    r = api.post(f"/conversation/drafts/{did}/approve", json={"body": "נוסח אחר לגמרי"})
    assert r.status_code == 409 and r.headers.get("x-gabi-already") == "approved"
    assert r.json()["detail"].startswith("הטיוטה כבר אושרה") and not RAW.search(r.json()["detail"])
    assert len(_audits(svc, "draft_approved")) == 1 and len(svc.sender.sent) == sent


def test_second_draft_reject_is_already_rejected_and_cross_decisions_refuse(svc):
    api = _api(svc)
    did = _draft(api)
    assert api.post(f"/conversation/drafts/{did}/reject").status_code == 200
    r = api.post(f"/conversation/drafts/{did}/reject")
    assert r.status_code == 409 and r.headers.get("x-gabi-already") == "rejected"
    assert r.json()["detail"] == "הטיוטה כבר נסגרה בלי מענה"
    assert len(_audits(svc, "draft_rejected")) == 1
    # אישור של טיוטה שנסגרה = סירוב אמיתי, בלי הכותרת
    r = api.post(f"/conversation/drafts/{did}/approve")
    assert r.status_code == 409 and "x-gabi-already" not in r.headers
    assert r.json()["detail"] == "הטיוטה כבר נסגרה בלי מענה. אי אפשר לאשר אותה"
    # טיוטה שהוחלפה: שתי ההכרעות מסורבות בלי הכותרת
    svc.db.x("UPDATE drafts SET status='superseded' WHERE id=?", (did,))
    for action in ("approve", "reject"):
        r = api.post(f"/conversation/drafts/{did}/{action}")
        assert r.status_code == 409 and "x-gabi-already" not in r.headers

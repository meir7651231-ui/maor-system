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

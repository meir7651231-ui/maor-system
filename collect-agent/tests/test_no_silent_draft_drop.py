"""critic סבב 61: «היעלמויות שקטות». תשובה ללקוח שבעל העסק **אישר** ולא יצאה בגלל החלטת מערכת חייבת להגיע
אליו כהודעה (אחרת הוא בטוח שהלקוח קיבל תשובה, והלקוח שאל ולא נענה). היה: send_error (יש הודעה) ·
stale (יש) · opted_out בהסרה (סבב 60) — אבל `system:amount_changed` (היתרה השתנתה בין האישור לשליחה),
`system:no_address` ודחייה בשער (`system:<סיבה>`) נדחו **בשקט**.
מגן-מקור: כל `decided_by='system:…'` שדוחה טיוטה ב-_try_send עובר דרך הפונקציה שמודיעה לבעלים."""
from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.channels import sent_mark
from app.main import create_app
from app.policy import TZ
from tests.conftest import AUTH, OWNER_TOKEN

ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _approved_reply_at_night(api, svc, clock) -> int:
    api.post("/sync")
    rid = next(i for i in api.post("/plan").json()["created"]
               if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1)
    api.post(f"/reminders/{rid}/approve")
    api.post("/dispatch")
    r = api.post("/conversation/inbound", json={"channel": "sms", "sender": "050-1234567",
                                                "text": "איך אפשר לשלם?"}).json()
    if not r.get("draft_id"):
        pytest.skip("המנוע ענה אוטומטית — אין טיוטה ממתינה")
    clock.now = datetime(2026, 11, 8, 21, 30, tzinfo=TZ)            # לילה ⇒ אושר וממתין לחלון
    assert api.post(f"/conversation/drafts/{r['draft_id']}/approve", json={}).json()["status"] == "approved"
    return r["draft_id"]


def _notes(api):
    return [m for m in api.get("/owner/inbox").json() if m["intent"] == "draft_not_sent"]


def test_amount_changed_between_approval_and_send_tells_owner(api, svc, clock, fake_gi):
    did = _approved_reply_at_night(api, svc, clock)
    fake_gi.docs[0]["amount"] = "700.00"                              # שילם חלק בלילה
    n0 = sent_mark(svc.sender.sent)
    clock.now = datetime(2026, 11, 9, 9, 0, tzinfo=TZ)
    api.post("/dispatch")
    assert sent_mark(svc.sender.sent) == n0                                 # הסכום הישן לא יצא (נכון)
    assert svc.db.one("SELECT decided_by FROM drafts WHERE id=?", (did,))["decided_by"] == "system:amount_changed"
    notes = _notes(api)
    assert len(notes) == 1 and "השתנתה" in notes[0]["body"] and "דנה" in notes[0]["body"], notes


def test_no_address_tells_owner(api, svc, clock):
    did = _approved_reply_at_night(api, svc, clock)
    svc.db.x("UPDATE drafts SET to_addr=NULL WHERE id=?", (did,))
    svc.db.x("UPDATE customers SET phone='03-1234567' WHERE id=1")   # הנייד הוחלף בקווי
    clock.now = datetime(2026, 11, 9, 9, 0, tzinfo=TZ)
    api.post("/dispatch")
    assert svc.db.one("SELECT decided_by FROM drafts WHERE id=?", (did,))["decided_by"] == "system:no_address"
    assert _notes(api), "התשובה נדחתה בשקט"


def test_every_system_rejection_in_try_send_notifies():
    src = (ROOT / "app/inbox.py").read_text(encoding="utf-8")
    body = src[src.index("def _try_send"):src.index("def _drop_approved")]
    silent = re.findall(r"UPDATE drafts SET status='rejected'[^\n]*", body)
    assert not silent, f"דחיית טיוטה מאושרת בלי הודעה לבעלים: {silent}"

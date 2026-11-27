"""מנהל 447 (מבקר 273🟡 + 273ב🟡).

273: `GET /plans` מסמן הסדר שאושר וההצעה שלו עדיין בתור (`offer_queued` + `queued_reason`) ⇒ הלוח מציג
«⏳ ההצעה טרם נשלחה» במקום «פעיל». אחרי שיצאה — הסימן יורד.
273ב: הצעת פריסה מהשיחה שאושרה ונשארה בתור, והלקוח כבר השיב «מאשר»/«לא מתאים» ⇒ ההצעה הישנה לא יוצאת
(`superseded`, `system:customer_replied`) — האישור עצמו עדיין נקשר להסדר וממתין לאישור הסופי.
"""
from __future__ import annotations

from dataclasses import replace
from datetime import timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from app.ratelimit import RateLimiter
from tests.conftest import AUTH, OWNER_TOKEN

PHONE = "050-1234567"


def _stop(svc):
    svc.s = replace(svc.s, trial_start=(svc.clock().date() - timedelta(days=30)).isoformat())


def _resume(svc):
    svc.s = replace(svc.s, trial_start="")


def _plans(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})), headers=AUTH)
    return {p["id"]: p for p in api.get("/plans").json()}


def test_board_marks_queued_then_clears_after_send(svc):
    svc.sync()
    cid = svc.db.one("SELECT customer_id FROM invoices WHERE status='open' ORDER BY id")["customer_id"]
    pid = svc.propose_plan(cid, 3)
    _stop(svc)
    assert svc.approve_plan(pid)["queued"] is True
    p = _plans(svc)[pid]
    assert p["offer_queued"] is True and p["queued_reason"] == "trial_expired"
    _resume(svc)
    svc.dispatch()
    p = _plans(svc)[pid]
    assert p["status"] == "approved" and not p.get("offer_queued"), p


def test_board_not_marked_when_sent_immediately(svc):
    svc.sync()
    cid = svc.db.one("SELECT customer_id FROM invoices WHERE status='open' ORDER BY id")["customer_id"]
    pid = svc.propose_plan(cid, 3)
    assert svc.approve_plan(pid)["queued"] is False
    assert "offer_queued" not in _plans(svc)[pid]


def _queued_conversation_offer(svc):
    svc.sync()
    _stop(svc)
    did = svc.inbound("sms", PHONE, "אפשר לשלם ב-3 תשלומים?")["draft_id"]
    assert svc.inbox.approve_draft(did)["queued_reason"] == "trial_expired"
    return did


def test_accept_drops_queued_offer_but_keeps_plan_link(svc):
    did = _queued_conversation_offer(svc)
    r = svc.inbound("sms", PHONE, "מאשר")
    assert r["intent"] == "plan_accept"
    row = svc.db.one("SELECT status, decided_by FROM drafts WHERE id=?", (did,))
    assert (row["status"], row["decided_by"]) == ("superseded", "system:customer_replied")
    acc = svc.db.one("SELECT plan_id FROM drafts WHERE id=?", (r["draft_id"],))
    assert acc["plan_id"] is not None
    assert any(a["action"] == "queued_plan_offer_dropped" for a in svc.db.q("SELECT action FROM audit"))
    _resume(svc)
    svc.dispatch()
    assert svc.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"] == "superseded"


def test_reject_drops_queued_offer(svc):
    did = _queued_conversation_offer(svc)
    svc.inbound("sms", PHONE, "לא מתאים לי")
    _resume(svc)
    svc.dispatch()
    assert svc.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"] != "sent_dry_run"


def test_unrelated_reply_keeps_queued_offer(svc):
    """בקרה: הודעה שאינה תשובה להצעה (תודה) לא מבטלת את ההצעה שבתור."""
    did = _queued_conversation_offer(svc)
    svc.inbound("sms", PHONE, "תודה רבה")
    assert svc.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"] == "approved"

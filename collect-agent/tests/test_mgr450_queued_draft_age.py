"""מנהל 450 (STATUS 449 «הבא» עיצוב): ספירה לאחור גם לתשובות ולהצעות פריסה שאושרו ונשארו בתור.

לפני: «אם תחכה יותר מ-4 ימים…» כללי — בלי לדעת כמה כבר חיכתה. עכשיו `GET /conversation/drafts?status=approved`
ו-`GET /plans` (offer_queued) מחזירים `queued_since` + `queued_days_left` מאותו עוגן כמו `_withdraw_if_stale`
(decided_at + STALE_DRAFT_HOURS; בהצעת פריסה — מוקדם יותר, בחצות שאחרי מועד התשלום הראשון), כך שב-0 הסבב הבא
באמת מחזיר לאישור / מבטל.
"""
from __future__ import annotations

from dataclasses import replace
from datetime import timedelta
from pathlib import Path

from fastapi.testclient import TestClient

from app.inbox import STALE_DRAFT_HOURS
from app.main import create_app
from app.ratelimit import RateLimiter
from tests.conftest import AUTH, OWNER_TOKEN

ROOT = Path(__file__).resolve().parents[1]
PHONE = "050-1234567"


def _api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})), headers=AUTH)


def _stop(svc):
    svc.s = replace(svc.s, trial_start=(svc.clock().date() - timedelta(days=30)).isoformat())


def _resume(svc):
    svc.s = replace(svc.s, trial_start="")


def _queued_reply(svc) -> int:
    svc.sync()
    _stop(svc)
    did = svc.inbound("sms", PHONE, "איך אפשר לשלם?")["draft_id"]
    assert did
    assert svc.inbox.approve_draft(did)["queued_reason"] == "trial_expired"
    return did


def test_reply_countdown_from_approval(svc, clock):
    api = _api(svc)
    did = _queued_reply(svc)
    [d] = [d for d in api.get("/conversation/drafts?status=approved").json() if d["id"] == did]
    assert d["queued_since"] == svc.clock().date().isoformat()
    assert d["queued_days_left"] == STALE_DRAFT_HOURS // 24
    clock.now += timedelta(days=1, hours=1)
    [d] = [d for d in api.get("/conversation/drafts?status=approved").json() if d["id"] == did]
    assert d["queued_days_left"] == STALE_DRAFT_HOURS // 24 - 1   # 2 ימים ו-23 שעות ⇒ «עוד 3»


def test_reply_zero_then_next_round_returns_to_approval(svc, clock):
    """ב-0 הסבב הבא באמת מחזיר לאישור — אין «עוד יום» שקרי."""
    api = _api(svc)
    did = _queued_reply(svc)
    clock.now += timedelta(hours=STALE_DRAFT_HOURS, minutes=1)
    [d] = [d for d in api.get("/conversation/drafts?status=approved").json() if d["id"] == did]
    assert d["queued_days_left"] == 0
    _resume(svc)
    while not svc.policy.can_send_at(svc.clock()):
        clock.now += timedelta(hours=1)
    svc.inbox.flush()
    assert svc.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"] == "pending_approval"


def test_plan_offer_countdown_capped_by_first_due(svc, clock):
    api = _api(svc)
    svc.sync()
    cid = svc.db.one("SELECT customer_id FROM invoices WHERE status='open' ORDER BY id")["customer_id"]
    pid = svc.propose_plan(cid, 3)
    _stop(svc)
    assert svc.approve_plan(pid)["queued"] is True
    p = {x["id"]: x for x in api.get("/plans").json()}[pid]
    assert p["offer_queued"] is True and p["queued_since"] == svc.clock().date().isoformat()
    assert 0 <= p["queued_days_left"] <= STALE_DRAFT_HOURS // 24
    # מועד ראשון מחר ⇒ ההצעה תבוטל בחצות שאחריו — לא «עוד 4 ימים»
    tomorrow = (svc.clock().date() + timedelta(days=1)).isoformat()
    import json
    inst = json.loads(svc.db.one("SELECT installments FROM plans WHERE id=?", (pid,))["installments"])
    inst[0]["due"] = tomorrow
    svc.db.x("UPDATE plans SET installments=? WHERE id=?", (json.dumps(inst), pid))
    p = {x["id"]: x for x in api.get("/plans").json()}[pid]
    assert p["queued_days_left"] == 2   # היום 10:00 ⇒ חצות של מחרתיים = יום ו-14 שעות ⇒ תקרה 2


def test_not_queued_has_no_age(svc):
    api = _api(svc)
    svc.sync()
    did = svc.inbound("sms", PHONE, "איך אפשר לשלם?")["draft_id"]
    assert did
    for d in api.get("/conversation/drafts").json():
        assert "queued_since" not in d


def test_ui_and_app_share_countdown_source():
    src = (ROOT / "web/src/lib/draftQueue.ts").read_text(encoding="utf-8")
    assert "draftQueuedAge" in src
    for page in ("web/src/pages/Inbox.tsx", "web/src/lib/plans.ts"):
        assert "draftQueuedAge" in (ROOT / page).read_text(encoding="utf-8"), page

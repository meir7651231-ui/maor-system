"""בדיקות משחזרות ל-review/hostile-review-2026-11-06.md (חורים 2, 3, 10).
כל אחת נכשלת על 3163d09 ועוברת אחרי התיקון."""
from __future__ import annotations

from datetime import datetime

import pytest

from app.config import SafetyError, load_settings
from app.policy import TZ, Policy


def _cycle(svc):
    svc.sync()
    for rid in svc.plan():
        svc.approve(rid)
    svc.dispatch()


def test_hole2_plan_offer_sent_once_draft_then_plans(svc):
    _cycle(svc)
    res = svc.inbound("sms", "0501234567", "אפשר לפרוס לשלושה תשלומים?")
    n = len(svc.sender.sent)
    svc.inbox.approve_draft(res["draft_id"])
    assert len(svc.sender.sent) == n + 1
    with pytest.raises(ValueError):
        svc.approve_plan(res["plan_id"])
    assert len(svc.sender.sent) == n + 1


def test_hole3_no_receipt_creating_payment_mode():
    assert load_settings({}).payment_link_mode == "static"
    with pytest.raises(SafetyError, match="קבלה"):
        load_settings({"PAYMENT_LINK_MODE": "greeninvoice_form"})


@pytest.mark.parametrize("dt", [datetime(2029, 9, 3, 10), datetime(2031, 1, 5, 10)])
def test_hole10_no_sending_after_holiday_table_ends(dt):
    p = Policy()
    assert p.can_send_at(dt.replace(tzinfo=TZ)) is False
    assert "לוח החגים" in p.reason_closed(dt.replace(tzinfo=TZ))

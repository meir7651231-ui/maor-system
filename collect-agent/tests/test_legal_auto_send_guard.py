"""TERMS §5 / LAWYER-BRIEF: «כל הודעה מאושרת בנפרד». זה נכון כל עוד מצב safe_auto (תשובות מידע בלי אישור)
**לא נגיש** לבעל העסק. אם מישהו חושף אותו (סביבה / API הגדרות / ברירת מחדל) — הבדיקה נכשלת, וקודם
מעדכנים את TERMS §5, PRIVACY ו-LAWYER-BRIEF (ושואלים עו״ד: מענה אוטומטי מחמיר את שאלה 10).
"""
from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.config import load_settings
from app.conversation import SAFE_AUTO, Intent, OwnerPolicy
from app.settings_api import SettingsIn


def test_default_policy_requires_approval_for_every_reply(svc):
    assert OwnerPolicy().approval_mode == "all"
    assert svc.inbox.policy.approval_mode == "all"


def test_env_cannot_turn_on_auto_send(svc, monkeypatch):
    monkeypatch.setenv("APPROVAL_MODE", "safe_auto")
    monkeypatch.setenv("SAFE_AUTO", "1")
    s = load_settings({"APPROVAL_MODE": "safe_auto", "SAFE_AUTO": "1"})
    assert not hasattr(s, "approval_mode")
    from app.inbox import ConversationInbox
    assert ConversationInbox(svc).policy.approval_mode == "all"


@pytest.mark.parametrize("field", ["approval_mode", "safe_auto", "auto_send", "auto_approve"])
def test_settings_api_rejects_auto_send_fields(field):
    with pytest.raises(ValidationError):
        SettingsIn(**{field: "safe_auto"})


def test_safe_auto_never_covers_money_or_promises():
    """גם אם יופעל בעתיד: אף פעם לא כסף, הסדר, הבטחה, מחלוקת או עו״ד בלי אדם."""
    forbidden = {Intent.PLAN_REQUEST, Intent.PLAN_ACCEPT, Intent.PLAN_REJECT, Intent.PROMISE,
                 Intent.PAID_CLAIM, Intent.DISPUTE, Intent.LEGAL, Intent.CANT_PAY, Intent.DISTRESS,
                 Intent.MINOR}
    assert not (SAFE_AUTO & forbidden), SAFE_AUTO & forbidden

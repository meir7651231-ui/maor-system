"""יעד «גבי חיבורים» לפני השקה: שער המעבר לשליחה אמיתית מראה רק חוסמים שרק מאיר יכול להזיז.

אם נוסף חוסם שהצוות יכול לסגור בעצמו (או קטגוריה שלא סווגה) — הבדיקה נכשלת ומראה אותו.
"""
from __future__ import annotations

from app import golive
from app.config import load_settings


def test_every_remaining_blocker_is_meirs(monkeypatch):
    for k in ("COLLECT_MASTER_KEYS", "EMAIL_FROM", "SMS_WEBHOOK_KEY", "EMAIL_WEBHOOK_KEY",
              "PUBLIC_BASE_URL", "SMTP_HOST"):
        monkeypatch.delenv(k, raising=False)
    blockers = golive.real_send_blockers(load_settings({}), master_keys="")
    assert blockers
    not_meir = [(golive.blocker_owner(b), b) for b in blockers if golive.blocker_owner(b)[0] != "מאיר"]
    assert not not_meir, not_meir


def test_unknown_category_is_flagged():
    assert golive.blocker_owner("משהו חדש: x")[0] == "לא מסווג"
    assert golive.blocker_owner("019: x") == golive.BLOCKER_OWNERS["019"]


def test_cli_shows_owner_and_action(capsys, monkeypatch):
    for k in ("COLLECT_MASTER_KEYS", "SMTP_HOST"):
        monkeypatch.delenv(k, raising=False)
    golive.main([])
    out = capsys.readouterr().out
    assert "[מאיר: הרשמה ל-sandbox של morning]" in out and "לא מסווג" not in out

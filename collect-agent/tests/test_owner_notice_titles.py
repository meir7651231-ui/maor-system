"""critic סבב 50: כל סוג הודעת-מערכת שהשרת כותב לבעל העסק (direction='system') צריך כותרת ייעודית בממשק
(`web/src/lib/notices.ts`, KIND). בלעדיה ההודעה מוצגת ככותרת כללית «הודעה מגבי» בטון מידע — כך היה עם
amount_check (49.2) ועם send_error. המגן סורק את הקוד: intent מילולי וקבועים (CREDIT_REVIEW / AMOUNT_CHECK)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _server_intents() -> set[str]:
    src = "\n".join(p.read_text(encoding="utf-8") for p in (ROOT / "app").glob("*.py"))
    lit = set(re.findall(r"'system',\s*'(?:owner|sms)',\s*\?,\s*'([a-z_]+)'", src))
    # critic סבב 61: הודעה לבעלים דרך פונקציה עם intent כפרמטר (`_drop_approved(..., intent="send_error")`,
    # וברירת המחדל `intent: str = "draft_not_sent"`) — אחרת המגן היה מפספס אותן
    lit |= set(re.findall(r'\bintent(?::\s*str)?\s*=\s*"([a-z_]+)"', src))
    consts = dict(re.findall(r'^\s*(CREDIT_REVIEW|AMOUNT_CHECK)\s*=\s*"([a-z_]+)"', src, re.M))
    if re.search(r"'system','owner',\?,\?", src):
        lit |= set(consts.values())
    return lit


def test_every_owner_notice_intent_has_a_ui_title():
    intents = _server_intents()
    assert {"trial_ending", "credit_review", "amount_check", "send_error"} <= intents, intents
    notices = (ROOT / "web/src/lib/notices.ts").read_text(encoding="utf-8")
    kind = set(re.findall(r"^\s{2}([a-z_]+): \{ icon", notices, re.M))
    missing = sorted(intents - kind)
    assert not missing, f"intents בלי כותרת בממשק (יוצגו «הודעה מגבי»): {missing}"

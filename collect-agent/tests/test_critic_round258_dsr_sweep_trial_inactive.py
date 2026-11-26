"""מבקר סבב 258 · 🟡 — עסק שהניסיון/המנוי שלו נגמר לא מקבל התראות על מועד בקשת עיון/מחיקה (30 יום, חוק הגנת הפרטיות):
`dsr.sweep` רץ ב-`plan()` אחרי שער הניסיון.

רכיבים: `app/service.py` → `plan` (מנהל 427 הקדים את `purge_closed()` לפני `if not t["active"]: return []`, אבל
`dsr.sweep(self)` נשאר אחריו) · `app/dsr.py` → `sweep` («נקרא בכל plan(): התראה אחת כשנותרו ≤5 ימים, ואחת כשעבר המועד»).
תרחיש: בקשת עיון נפתחת (מועד 8.12) ⇒ התראת הפתיחה מגיעה ✓. הניסיון לא פעיל. יום 26 ⇒ `plan()` ⇒ אין «נותרו 4 ימים»;
יום 31 ⇒ אין «עברה את המועד»; `dsr.warned=''`; `run_morning` ⇒ `ok`.
המועד החוקי עובר בשקט — חובה משפטית, לא שליחה ללקוח.
✓ 257 (מנהל 427) תוקן — ר-10 לפני שער הניסיון. ⚠️ תהליך: ב-f9982b49 נמחק
`tests/test_critic_round257_purge_when_trial_inactive.py` (הוחלף ב-test_mgr427) — הוחזר בסבב הזה בלי xfail,
כמגן (הנוהג: מסירים את ה-xfail, לא את קובץ המבקר).
הצעה: `dsr.sweep` (וכל חובה שאינה שליחה) לפני שער הניסיון, יחד עם `purge_closed`. xfail(strict=True)."""
from dataclasses import replace
from datetime import timedelta

import pytest

from app import dsr


@pytest.mark.xfail(strict=True, reason="258🟡: ניסיון לא פעיל ⇒ dsr.sweep לא רץ ⇒ אין התראת מועד/איחור לבקשת עיון")
def test_dsr_deadline_alerts_when_trial_inactive(svc, clock):
    svc.sync()
    cid = svc.db.one("SELECT id FROM customers LIMIT 1")["id"]
    rid = dsr.open_request(svc, cid, "access", "owner", note="בקשת עיון בטלפון")
    svc.s = replace(svc.s, trial_start=(clock.now.date() - timedelta(days=60)).isoformat())
    assert svc.trial()["active"] is False
    clock.now += timedelta(days=31)
    svc.plan()
    warned = svc.db.one("SELECT warned FROM dsr WHERE id=?", (rid,))["warned"]
    assert "late" in warned.split(","), warned

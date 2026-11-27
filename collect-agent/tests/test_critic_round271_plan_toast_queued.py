"""מבקר סבב 271 (🟡, גבייה עיצוב): «✓ אישור ההצעה» (הסדר תשלומים) — הטוסט אומר «נשלחה ללקוח» גם כשהיא בתור.

אותה משפחה כמו 270 (תוקן במנהל 443 לתשובות): `approve_plan` כבר מחזיר `queued: true` / `draft_status:
'approved'` כשההצעה לא יצאה (שירות עצור / מחוץ לחלון / עצירת שחזור), אבל `web/src/pages/Dashboard.tsx`
(NeedsYou → act) מציג קבוע 'ההצעה אושרה ונשלחה ללקוח (dry-run)'. [מאומת בדפדפן, ניסיון פג, 390px]:
התשובה `"queued":true,"draft_status":"approved"` ⇒ הטוסט «ההצעה אושרה ונשלחה ללקוח», וההסדר מוצג «פעיל»
עם «תשלום 1 מתוך 3 · 15.11.2026» — ללקוח לא נשלח דבר. `docs/screens/critic-271-plan-toast-stopped-390.png`.
ℹ️ באותה משפחה: אישור תזכורת (`web/src/store.tsx` approveAndSend) בזמן עצירה ⇒ «נכנס לתור — ייצא בחלון השליחה
הבא» — לא ייצא עד חידוש (ואחרי APPROVAL_VALID_DAYS האישור פג).
רכיב: web/src/pages/Dashboard.tsx → NeedsYou (approvePlan) · app/service.py → _approve_plan_claimed (queued).
"""
from __future__ import annotations

from dataclasses import replace
from datetime import timedelta
from pathlib import Path

import pytest

DASH = Path(__file__).resolve().parents[1] / "web" / "src" / "pages" / "Dashboard.tsx"


def test_server_reports_queued_plan_when_stopped_control(svc):
    svc.sync()
    cid = svc.db.one("SELECT customer_id FROM invoices WHERE status='open' ORDER BY id")["customer_id"]
    pid = svc.propose_plan(cid, 3)
    svc.s = replace(svc.s, trial_start=(svc.clock().date() - timedelta(days=30)).isoformat())
    assert svc.trial()["active"] is False
    r = svc.approve_plan(pid)
    assert r["queued"] is True and r["draft_status"] == "approved" and r["message_id"] is None


@pytest.mark.xfail(strict=True, reason="מבקר 271🟡: טוסט «ההצעה אושרה ונשלחה ללקוח» קבוע — גם כש-queued")
def test_plan_toast_reflects_queued():
    src = DASH.read_text(encoding="utf-8")
    assert "'ההצעה אושרה ונשלחה ללקוח (dry-run)'" not in src

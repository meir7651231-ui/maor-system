"""מנהל 444 (מבקר 271🟡 + ℹ️): אישור הצעת פריסה בזמן עצירה — השרת מחזיר queued_reason והממשק לא אומר «נשלחה».
גם: /dispatch מחזיר `held` (למה לא יצא כלום) ⇒ אישור תזכורת בזמן עצירה לא מבטיח «ייצא בחלון השליחה הבא»."""
from __future__ import annotations

from dataclasses import replace
from datetime import timedelta
from pathlib import Path

WEB = Path(__file__).resolve().parents[1] / "web" / "src"


def _stop(svc):
    svc.s = replace(svc.s, trial_start=(svc.clock().date() - timedelta(days=30)).isoformat())
    assert svc.trial()["active"] is False


def test_plan_queued_has_reason(svc):
    svc.sync()
    cid = svc.db.one("SELECT customer_id FROM invoices WHERE status='open' ORDER BY id")["customer_id"]
    pid = svc.propose_plan(cid, 3)
    _stop(svc)
    r = svc.approve_plan(pid)
    assert r["queued"] is True and r["queued_reason"] == "trial_expired"


def test_dispatch_hold_reason(svc):
    assert svc.dispatch_hold() in (None, "outside_window")
    _stop(svc)
    assert svc.dispatch_hold() == "trial_expired"


def test_ui_uses_status_toasts():
    dash = (WEB / "pages" / "Dashboard.tsx").read_text(encoding="utf-8")
    store = (WEB / "store.tsx").read_text(encoding="utf-8")
    assert "planApproveToast(res" in dash
    assert "reminderQueuedText(r.held)" in store
    assert "'נכנס לתור — ייצא בחלון השליחה הבא'}" not in store

"""מנהל 448 (מבקר 274ℹ️): תזכורת שאושרה ונשארה בתור בזמן עצירה — שורת החשבונית אומרת למה.

לפני: `/dashboard` החזיר `last_reminder.status='approved'` בלבד ⇒ בטבלה «מאושרת» / בלי סימן, והבעלים רואה רק את
באנר העצירה; אחרי 7 ימים היא חוזרת כ«האישור הקודם פג». עכשיו `queued_reason` (service.dispatch_hold) — גם ב-view=list.
"""
from __future__ import annotations

from dataclasses import replace
from datetime import timedelta
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from app.ratelimit import RateLimiter
from tests.conftest import AUTH, OWNER_TOKEN

ROOT = Path(__file__).resolve().parents[1]


def _api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})), headers=AUTH)


def _approve_all(svc, expire: bool = False) -> list[int]:
    svc.sync()
    ids = svc.plan()
    assert ids
    if expire:
        svc.s = replace(svc.s, trial_start=(svc.clock().date() - timedelta(days=30)).isoformat())
    for rid in ids:
        svc.approve(rid, confirm_open=True)
    return ids


def test_trial_expired_marks_approved_rows(svc):
    api = _api(svc)
    _approve_all(svc, expire=True)
    assert svc.dispatch() == []
    for view in ("", "?view=list"):
        rows = [r for r in api.get(f"/dashboard{view}").json()["invoices"]
                if r["last_reminder"] and r["last_reminder"]["status"] == "approved"]
        assert rows
        assert {r["last_reminder"]["queued_reason"] for r in rows} == {"trial_expired"}


def test_open_window_no_mark_and_after_send_none(svc):
    api = _api(svc)
    ids = _approve_all(svc)
    rows = api.get("/dashboard").json()["invoices"]
    lrs = [r["last_reminder"] for r in rows if r["last_reminder"]]
    # חלון פתוח ⇒ אין סיבת המתנה גם לפני ה-dispatch (ייצא בסבב הבא)
    assert lrs and all(lr["queued_reason"] is None for lr in lrs)
    svc.dispatch()
    sent = {r["id"] for r in svc.db.q("SELECT id FROM reminders WHERE status='sent_dry_run'")}
    assert sent & set(ids)
    lrs = [r["last_reminder"] for r in api.get("/dashboard").json()["invoices"] if r["last_reminder"]]
    assert all(lr["queued_reason"] is None for lr in lrs if lr["id"] in sent)


def test_pending_approval_never_marked(svc):
    api = _api(svc)
    svc.sync()
    assert svc.plan()
    svc.s = replace(svc.s, trial_start=(svc.clock().date() - timedelta(days=30)).isoformat())
    lrs = [r["last_reminder"] for r in api.get("/dashboard").json()["invoices"] if r["last_reminder"]]
    assert lrs and all(lr["status"] == "pending_approval" and lr["queued_reason"] is None for lr in lrs)


def test_ui_and_app_share_labels():
    """מגן-מקור: /ui (chipOf → HELD) ו-/app/ (reminderHeldNote) מכירים את אותן שלוש סיבות."""
    ui = (ROOT / "app" / "ui.html").read_text(encoding="utf-8")
    dq = (ROOT / "web" / "src" / "lib" / "draftQueue.ts").read_text(encoding="utf-8")
    chip = ui[ui.index("const chipOf"):].split("\n", 1)[0]
    assert "HELD[r.queued_reason]" in chip
    for k in ("trial_expired", "restore_hold", "outside_window"):
        assert f"{k}:" in ui[ui.index("const HELD"):ui.index("const chipOf")]
        assert f"{k}:" in dq[dq.index("REMINDER_HELD"):]
    api = (ROOT / "web" / "src" / "api.ts").read_text(encoding="utf-8")
    assert "reminderHeldNote(lr)" in api

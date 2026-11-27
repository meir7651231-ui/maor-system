"""מנהל 449 (STATUS 448 «הבא» עיצוב): תזכורת מאושרת בתור ⇒ «בתור מאז <תאריך> · עוד N ימים עד שתחזור לאישור».

לפני: ההערה בשורה אמרה רק «אם תחכה יותר מ-7 ימים…» — בלי לדעת כמה כבר חיכתה. עכשיו `/dashboard` מחזיר
`queued_since` + `queued_days_left` מאותו עוגן כמו dispatch (max(decided_at, scheduled_for) + APPROVAL_VALID_DAYS),
כך שהספירה לאחור מגיעה ל-0 בדיוק כשהסבב הבא מבטל כ-approval_expired.
"""
from __future__ import annotations

from dataclasses import replace
from datetime import timedelta
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app
from app.policy import APPROVAL_VALID_DAYS
from app.ratelimit import RateLimiter
from tests.conftest import AUTH, OWNER_TOKEN

ROOT = Path(__file__).resolve().parents[1]


def _api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN, limiter=RateLimiter(rules={})), headers=AUTH)


def _queued(api, view=""):
    return [r["last_reminder"] for r in api.get(f"/dashboard{view}").json()["invoices"]
            if r["last_reminder"] and r["last_reminder"]["status"] == "approved"]


def _expire_and_approve(svc) -> list[int]:
    svc.sync()
    ids = svc.plan()
    assert ids
    svc.s = replace(svc.s, trial_start=(svc.clock().date() - timedelta(days=30)).isoformat())
    for rid in ids:
        svc.approve(rid, confirm_open=True)
    return ids


def _anchor(svc, rid):
    r = svc.db.one("SELECT decided_at, scheduled_for FROM reminders WHERE id=?", (rid,))
    from app.service import _dt
    return max(d for d in (_dt(r["decided_at"]), _dt(r["scheduled_for"])) if d is not None)


def test_countdown_matches_dispatch_expiry(svc, clock):
    api = _api(svc)
    _expire_and_approve(svc)
    for view in ("", "?view=list"):
        lrs = _queued(api, view)
        assert lrs
        for lr in lrs:
            assert lr["queued_reason"] == "trial_expired"
            a = _anchor(svc, lr["id"])
            assert lr["queued_since"] == a.date().isoformat()
            exp = a + timedelta(days=APPROVAL_VALID_DAYS) - svc.clock()
            assert lr["queued_days_left"] == max(0, -(-int(exp.total_seconds()) // 86400))
            assert 1 <= lr["queued_days_left"] <= APPROVAL_VALID_DAYS


def test_countdown_reaches_zero_then_dispatch_expires(svc, clock):
    """הספירה לאחור יורדת עם הזמן; ב-0 הסבב הבא באמת מבטל (approval_expired) — אין «עוד יום» שקרי."""
    api = _api(svc)
    ids = _expire_and_approve(svc)
    first = {lr["id"]: lr["queued_days_left"] for lr in _queued(api)}
    clock.now += timedelta(days=3)
    later = {lr["id"]: lr["queued_days_left"] for lr in _queued(api)}
    assert later and all(later[k] == max(0, first[k] - 3) for k in later)
    clock.now += timedelta(days=APPROVAL_VALID_DAYS + 28)   # רביעי 16.12, 10:00
    lrs = _queued(api)
    assert lrs and all(lr["queued_days_left"] == 0 for lr in lrs)
    # חידוש ⇒ dispatch מבטל את מה שפג (העוגן הוא זה שהספירה הציגה)
    svc.s = replace(svc.s, trial_start=svc.clock().date().isoformat())
    svc.dispatch()
    assert svc.policy.can_send_at(svc.clock())
    rows = [svc.db.one("SELECT status, block_reason FROM reminders WHERE id=?", (i,)) for i in ids]
    assert rows and {r["block_reason"] for r in rows} == {"approval_expired"}


def test_not_queued_has_no_age(svc):
    api = _api(svc)
    svc.sync()
    assert svc.plan()
    for view in ("", "?view=list"):
        for r in api.get(f"/dashboard{view}").json()["invoices"]:
            lr = r["last_reminder"]
            if lr:
                assert lr["queued_since"] is None and lr["queued_days_left"] is None


def test_ui_and_app_share_countdown():
    """מגן-מקור: /ui (heldAge בתוך chipOf) ו-/app/ (reminderQueuedAge) — ואף אחד לא מציג ספירה בחלון-שליחה."""
    ui = (ROOT / "app" / "ui.html").read_text(encoding="utf-8")
    chip = ui[ui.index("const chipOf"):].split("\n", 1)[0]
    assert "heldAge(r)" in chip
    ha = ui[ui.index("const heldAge"):ui.index("const chipOf")]
    assert "queued_days_left" in ha and 'outside_window' in ha
    dq = (ROOT / "web" / "src" / "lib" / "draftQueue.ts").read_text(encoding="utf-8")
    assert "reminderQueuedAge(lr.queued_since, lr.queued_days_left)" in dq

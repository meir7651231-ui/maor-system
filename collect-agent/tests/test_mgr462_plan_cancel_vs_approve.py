"""מנהל 462 — check-then-update האחרון מהרשימה (458→461): ביטול הסדר (`_withdraw_if_stale`) ‖ אישור (`approve_plan`).

שוחזר לפני התיקון:
 (א) הצעת פריסה מתור «תשובות» שבעל העסק אישר והיא מחכה (סוף ניסיון/חלון) ⇒ ההסדר עדיין 'proposed' ⇒ /plans
     «אישור» שלח הצעה, **וה-flush הבא שלח גם את הטיוטה שבתור** — הלקוח קיבל את ההצעה פעמיים.
 (ב) אותו מצב אחרי 4+ ימים ⇒ `_withdraw_if_stale` (UPDATE בלי תנאי על תמונה ישנה) דחה את ההסדר **שכבר יצא**
     וכתב לבעל העסק «הצעת הפריסה שאישרת לא נשלחה».
 (ג) בעל העסק דחה תשובה ממתינה בזמן שה-flush החליט שהיא ישנה ⇒ היא חזרה ל«ממתינה לאישור».
עכשיו: /plans תופס את הטיוטה הממתינה (approved ⇒ superseded, מותנה); טיוטה שכבר נשלחת ⇒ 409; והביטול-כישנה
מותנה ב-status='approved' בתוך batch — 0 שורות ⇒ לא נוגעים.
"""
from __future__ import annotations

import dataclasses
from datetime import timedelta

import pytest

from app.channels import sent_mark, sent_since


def _queued(svc, clock, text="אפשר לפרוס ל-3 תשלומים?"):
    svc.s = dataclasses.replace(svc.s, trial_start=(clock.now.date() - timedelta(days=13)).isoformat())
    svc.sync()
    r = svc.inbound("sms", "050-1234567", text)
    clock.now += timedelta(days=2)                     # הניסיון נגמר ⇒ האישור מחכה בתור
    d = svc.inbox.approve_draft(r["draft_id"])
    assert d["status"] == "approved"
    svc.s = dataclasses.replace(svc.s, trial_start="")  # הצטרף
    return d


def _offers(svc, mark=0):
    return [m for m in sent_since(svc.sender.sent, mark) if m["to"] == "972501234567"]


def _draft(svc, did):
    return svc.db.one("SELECT * FROM drafts WHERE id=?", (did,))


def _plan(svc, pid):
    return svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"]


def test_plans_approve_supersedes_queued_offer_no_duplicate(svc, fake_gi, clock):
    d = _queued(svc, clock)
    assert _plan(svc, d["plan_id"]) == "proposed"
    mark = sent_mark(svc.sender.sent)
    out = svc.approve_plan(d["plan_id"])
    assert out["draft_status"] == "sent_dry_run"
    assert _draft(svc, d["id"])["status"] == "superseded"
    svc.dispatch()
    assert len(_offers(svc, mark)) == 1               # היה: 2 — גם הטיוטה שבתור יצאה
    assert _plan(svc, d["plan_id"]) == "approved"
    assert svc.db.one("SELECT 1 FROM audit WHERE action='plan_queued_offer_superseded'")


def test_stale_flush_after_plans_approve_does_not_cancel_sent_plan(svc, fake_gi, clock):
    d = _queued(svc, clock)
    svc.approve_plan(d["plan_id"])
    clock.now += timedelta(days=5)                     # הטיוטה שבתור «התיישנה»
    svc.dispatch()
    assert _plan(svc, d["plan_id"]) == "approved"      # היה: rejected — הסדר שיצא בוטל
    assert not svc.db.one("SELECT 1 FROM messages WHERE intent='stale_draft'")


def test_stale_withdraw_on_old_snapshot_is_noop_when_plans_approved_meanwhile(svc, fake_gi, clock):
    d = _queued(svc, clock)
    snap = _draft(svc, d["id"])                        # ה-flush קרא את הטיוטה (approved)…
    svc.approve_plan(d["plan_id"])                     # …ובינתיים /plans אישר ושלח
    clock.now += timedelta(days=5)
    assert svc.inbox._withdraw_if_stale(snap) is True  # לא שולחים
    assert _plan(svc, d["plan_id"]) == "approved"
    assert _draft(svc, d["id"])["status"] == "superseded"
    assert not svc.db.one("SELECT 1 FROM messages WHERE intent='stale_draft'")
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='draft_stale'")


def test_stale_reply_rejected_meanwhile_is_not_resurrected(svc, fake_gi, clock):
    d = _queued(svc, clock, "איך אפשר לשלם?")
    assert not d["plan_id"]
    snap = _draft(svc, d["id"])
    svc.inbox.reject_draft(d["id"])                    # בעל העסק דחה בינתיים
    clock.now += timedelta(days=5)
    assert svc.inbox._withdraw_if_stale(snap) is True
    dr = _draft(svc, d["id"])
    assert dr["status"] == "rejected" and dr["decided_by"] == "owner"   # היה: pending_approval


def test_plans_approve_while_queued_offer_already_sending_is_409(svc, fake_gi, clock):
    d = _queued(svc, clock)
    svc.db.x("UPDATE drafts SET status='sending', claimed_at=? WHERE id=?", (clock.now.isoformat(), d["id"]))
    mark = sent_mark(svc.sender.sent)
    with pytest.raises(ValueError, match="כבר יוצאת"):
        svc.approve_plan(d["plan_id"])
    assert sent_since(svc.sender.sent, mark) == []
    assert _plan(svc, d["plan_id"]) == "proposed"     # ה-finally מחזיר; הטיוטה תסמן approved כשתסיים
    assert svc.db.one("SELECT COUNT(*) n FROM drafts WHERE plan_id=? AND intent='plan_offer'",
                      (d["plan_id"],))["n"] == 0


def test_queued_offer_sent_while_plans_holds_claim_marks_plan_approved(svc, fake_gi, clock):
    """הטיוטה יצאה בדיוק כש-/plans מחזיק 'approving' ⇒ ההסדר 'approved' (לא חוזר ל-proposed), /plans ⇒ 409."""
    d = _queued(svc, clock)
    mark = sent_mark(svc.sender.sent)
    real = svc._claim_queued_plan_offer

    def flush_wins(pid):
        svc.inbox._try_send(d["id"])                   # ה-flush שולח בדיוק עכשיו
        return real(pid)
    svc._claim_queued_plan_offer = flush_wins
    try:
        with pytest.raises(ValueError, match="כבר יוצאת"):
            svc.approve_plan(d["plan_id"])
    finally:
        del svc._claim_queued_plan_offer
    assert len(_offers(svc, mark)) == 1
    assert _draft(svc, d["id"])["status"] == "sent_dry_run"
    assert _plan(svc, d["plan_id"]) == "approved"


def test_stale_withdraw_still_works_normally(svc, fake_gi, clock):
    d = _queued(svc, clock)
    clock.now += timedelta(days=20)
    svc.dispatch()
    dr = _draft(svc, d["id"])
    assert dr["status"] == "rejected" and dr["decided_by"] == "system:stale"
    assert _plan(svc, d["plan_id"]) == "rejected"
    assert svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent='stale_draft'")["n"] == 1

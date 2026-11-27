"""מבקר סבב 275 (🟠 ×2, גבי מנוע): שתי עובדות מחליטות על אותה תזכורת/תשובה באותו רגע — check-then-update לא אטומי.

[מאומת] REQUIRE_USER_LOGIN + TOTP, שתי עובדות (a, b), שני חוטים עם Barrier על `TestClient` אחד:
275א — `service.approve` בודק `status == 'pending_approval'` ואז `UPDATE reminders SET status='approved' WHERE id=?`
   (בלי `AND status=...`); `service.reject` אותו דבר. a מאשרת ו-b דוחה במקביל ⇒ **שתיהן 200**, ובמצב הסופי
   `approved` ב-6/10 — b ראתה «נדחתה» והתזכורת תישלח ללקוח. גם אישור כפול ⇒ שתי 200 ושתי רשומות `approve`
   ביומן (בלי שליחה כפולה — dispatch אחד שולח).
275ב — `inbox.approve_draft`: אותו דפוס (`UPDATE drafts SET status='approved', body=? WHERE id=?`). a עורכת ומאשרת,
   b מאשרת את המקור ⇒ ב-20 הרצות נקיות: 14× הנוסח שנשלח = המקור בעוד a קיבלה 200 על העריכה, ו-**1× נשלחו שתי
   הודעות ללקוח** (המקור ואז הערוך — `UPDATE` של a החזיר `sent_dry_run` ל-`approved` ו-`_try_send` שלח שוב).
   הצעת פריסה (`approve_plan`) תקינה — claim אטומי `status='approving' WHERE status='proposed'` (מנהל קודם).
הבדיקות כאן דטרמיניסטיות: הפעולה של b רצה **בין** הבדיקה לעדכון של a (עטיפת `_reminder` / `inbox._get`).
מצופה: UPDATE מותנה במצב שנבדק (`AND status='pending_approval'`, rowcount=0 ⇒ 409 «כבר הוחלט — על ידי X»).
רכיב: app/service.py → approve / reject · app/inbox.py → approve_draft.
"""
from __future__ import annotations

import contextlib

import pytest

from app.channels import sent_mark, sent_since

DANA = "972501234567"


def _interleave(obj, name, during):
    """הקריאה הראשונה ל-obj.name מחזירה את השורה **לפני** ש-during() רץ (כמו חוט שני שנכנס באמצע)."""
    orig = getattr(obj, name)
    state = {"done": False}

    def wrapped(i):
        row = orig(i)
        if not state["done"]:
            state["done"] = True
            during()
        return row
    setattr(obj, name, wrapped)


def test_sequential_second_approve_is_409_control(svc):
    svc.sync()
    rid = svc.plan()[0]
    svc.approve(rid, actor="user:2", confirm_open=True)
    with pytest.raises(Exception) as e:
        svc.approve(rid, actor="user:3", confirm_open=True)
    assert "כבר אושרה" in str(e.value)


@pytest.mark.xfail(strict=True, reason="מבקר 275א🟠: אישור במקביל לדחייה דורס אותה — שתיהן 200, התזכורת approved")
def test_reject_during_approve_is_not_overwritten(svc):
    svc.sync()
    rid = svc.plan()[0]
    rejected = {}
    _interleave(svc, "_reminder", lambda: rejected.update(r=svc.reject(rid, actor="user:3")))
    try:
        svc.approve(rid, actor="user:2", confirm_open=True)
        approved_ok = True
    except Exception:   # noqa: BLE001 — 409 של «כבר הוחלט» = ההתנהגות הנכונה
        approved_ok = False
    assert rejected["r"]["status"] == "rejected"
    final = svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))["status"]
    assert not (approved_ok and final == "approved"), "שתי ההחלטות «הצליחו» והדחייה נדרסה"


@pytest.mark.xfail(strict=True, reason="מבקר 275ב🟠: אישור תשובה במקביל — שליחה כפולה ללקוח / עריכה שאבדה")
def test_concurrent_draft_approve_sends_once(svc):
    svc.sync()
    did = svc.inbound("sms", "050-1234567", "שילמתי אתמול בהעברה")["draft_id"]
    mark = sent_mark(svc.sender.sent)
    _interleave(svc.inbox, "_get", lambda: svc.inbox.approve_draft(did, actor="user:3"))
    with contextlib.suppress(Exception):   # 409 לעובדת השנייה = ההתנהגות הנכונה
        svc.inbox.approve_draft(did, body="תודה דנה, נבדוק את ההעברה ונחזור אליך", actor="user:2")
    sent = [m for m in sent_since(svc.sender.sent, mark) if DANA in str(m)]
    assert len(sent) == 1, f"נשלחו {len(sent)} הודעות ללקוחה"

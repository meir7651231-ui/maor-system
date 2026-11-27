"""מנהל 456 (מבקר 280ℹ️ — 275 חלקי): «התזכורת כבר אושרה / נדחתה» ו«הטיוטה כבר אושרה / נסגרה בלי מענה» אומרים
**מי** הכריע ומתי — כמו הכרעת מועד ושיוך כרטיס (454).

היה: עובדת שנייה שלחצה «אשר» על תזכורת שעובדת אחרת דחתה קיבלה «התזכורת כבר נדחתה. אי אפשר לאשר אותה» בלי
לדעת מי ומתי, והייתה צריכה לחפש ביומן. הכרעות מערכת (system:* — טיוטה שחיכתה יותר מדי, הסרה, הוחלפה) לא
מיוחסות לאף אחד: «על ידי בעל העסק» שם היה שקר.
"""
from __future__ import annotations

import pytest

from app.users import SCHEMA
from tests.test_already_decided import _api, _draft, _first_pending

WHEN = r" ב-\d{1,2}\.\d{1,2} \d\d:\d\d"


def _staff(svc, uid: int, name: str):
    svc.db.conn.executescript(SCHEMA)
    svc.db.x("INSERT INTO users(id,email,name,pw_hash,totp_secret,created_at) VALUES (?,?,?,?,?,?)",
             (uid, f"u{uid}@studio.example", name, "x", "x", "2026-01-01T00:00:00"))


def test_reminder_rejected_by_staff_then_approve_says_who(svc):
    _staff(svc, 3, "רחל")
    rid = _first_pending(_api(svc))
    svc.reject(rid, actor="user:3")
    with pytest.raises(ValueError, match=rf"^התזכורת כבר נדחתה — על ידי רחל{WHEN}\. אי אפשר לאשר אותה$"):
        svc.approve(rid, actor="owner")


def test_reminder_approved_by_staff_then_again_already_with_who(svc):
    _staff(svc, 4, "דוד כהן")
    rid = _first_pending(_api(svc))
    svc.approve(rid, actor="user:4")
    with pytest.raises(ValueError, match=rf"^התזכורת כבר אושרה — על ידי דוד כהן{WHEN}$") as e:
        svc.approve(rid, actor="owner")
    assert getattr(e.value, "state", None) == "approved"   # עדיין AlreadyDecided ⇒ הממשק מציג «כבר אושרה»


def test_reminder_cancelled_by_system_has_no_attribution(svc):
    rid = _first_pending(_api(svc))
    svc.db.x("UPDATE reminders SET status='cancelled' WHERE id=?", (rid,))
    with pytest.raises(ValueError) as e:
        svc.approve(rid, actor="owner")
    assert "על ידי" not in str(e.value)


def test_draft_rejected_by_staff_then_approve_says_who(svc):
    _staff(svc, 5, "מיכל")
    did = _draft(_api(svc))
    svc.inbox.reject_draft(did, actor="user:5")
    with pytest.raises(ValueError, match=rf"^הטיוטה כבר נסגרה בלי מענה — על ידי מיכל{WHEN}\. אי אפשר לאשר אותה$"):
        svc.inbox.approve_draft(did, actor="owner")


def test_draft_closed_by_system_has_no_attribution(svc):
    did = _draft(_api(svc))
    svc.db.x("UPDATE drafts SET status='rejected', decided_by='system:stale' WHERE id=?", (did,))
    with pytest.raises(ValueError) as e:
        svc.inbox.reject_draft(did, actor="owner")
    assert str(e.value) == "הטיוטה כבר נסגרה בלי מענה"


def test_draft_closed_by_resume_names_the_resumer(svc):
    """«חידוש» סוגר כרטיסים פתוחים עם decided_by='user:N:resumed' ⇒ מיוחס לעובדת שחידשה."""
    _staff(svc, 6, "נועה")
    did = _draft(_api(svc))
    svc.db.x("UPDATE drafts SET status='rejected', decided_by='user:6:resumed', decided_at='2026-11-27T09:30:00+02:00' "
             "WHERE id=?", (did,))
    with pytest.raises(ValueError, match=r"^הטיוטה כבר נסגרה בלי מענה — על ידי נועה ב-27\.11 09:30$"):
        svc.inbox.reject_draft(did, actor="owner")


def test_draft_missing_decided_at_still_names_who(svc):
    did = _draft(_api(svc))
    svc.db.x("UPDATE drafts SET status='rejected', decided_by='owner', decided_at=NULL WHERE id=?", (did,))
    with pytest.raises(ValueError, match=r"^הטיוטה כבר נסגרה בלי מענה — על ידי בעל העסק$"):
        svc.inbox.reject_draft(did, actor="owner")

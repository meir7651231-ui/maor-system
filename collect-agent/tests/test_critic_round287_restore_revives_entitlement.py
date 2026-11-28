"""מבקר סבב 287 (🟠, גבי מנוע): שחזור מגיבוי מחזיר זכאות אורביט ישנה — מנוי שבוטל אחרי הגיבוי חוזר ל«פעיל».

✓ אימות 286 (מנהל 463): בשחזור, תזכורות/תשובות approved/sending ⇒ pending_approval (`restored_reapproval`) + שורה
   בהודעת העצירה «ייתכן שחלקן כבר יצאו… בדקו ביומן היוצאים». ℹ️ (BACKLOG גבייה עיצוב): יומן היוצאים של גבי שוחזר
   מהגיבוי — השליחות שאחרי הגיבוי לא מופיעות בו, ולכן ההוראה «בדקו ביומן היוצאים» לא ניתנת לביצוע מתוך גבי.
[מאומת] מקושר לאורביט, זכאות `active` ⇒ גיבוי ⇒ אורביט שולח `cancelled` (iat חדש) ⇒ `trial()` = cancelled ✓ ⇒
שחזור מהגיבוי ⇒ `orbit_entitlements` חוזרת לשורה הישנה ⇒ `trial()` = active ⇒ אחרי שחרור עצירת השחזור `plan()` בונה
תזכורות לעסק שהמנוי שלו בוטל — עד שאורביט ישלח זכאות חדשה (רק במסירה הבאה).
המונוטוניות (iat) נשמרת רק בתוך ה-DB ⇒ גם טוקן ישן שנלכד
בחלון ה-300 שנ׳ יתקבל. הודעת העצירה לא מזכירה את המנוי. אותה משפחה כמו 68 (ניתוק ⇒ חינם).
מצופה: אחרי שחזור, הזכאות מסומנת «לא מאומתת מאז השחזור» (שמרני: עצירה/חסד עד זכאות טרייה), או iat אחרון מחוץ ל-DB.
רכיב: app/backup.py → restore_backup · app/orbit_entitlement.py → current/evaluate ·
app/restore_guard.py → mark_restored.
"""
from __future__ import annotations

from datetime import timedelta

from app import restore_guard
from app.backup import create_backup, restore_backup
from app.db import DB
from app.secretbox import SecretBox, generate_key
from app.service import CollectService
from tests.test_orbit_entitlement import _ent, _ingest, keys  # noqa: F401
from tests.test_orbit_unlink_not_free import _link


def _restored_after_cancel(svc, clock, tmp_path):
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    svc.sync()
    _link(svc)
    _ingest(svc, _ent(svc, status="active", paid_until="2027-01-01"))
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    clock.now += timedelta(hours=3)
    _ingest(svc, _ent(svc, status="cancelled", paid_until=""))
    assert svc.trial()["active"] is False
    s2 = CollectService(svc.s, DB(str(restore_backup(bk, tmp_path / "r.db", box))), gi=svc.gi, clock=clock)
    restore_guard.release(s2.db, actor="owner", note="בדקתי הסרות", at=clock().isoformat())
    return s2


def test_restore_hold_blocks_before_release_control(svc, clock, tmp_path):
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    svc.sync()
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    s2 = CollectService(svc.s, DB(str(restore_backup(bk, tmp_path / "r.db", box))), gi=svc.gi, clock=clock)
    assert restore_guard.active(s2.db) and s2.dispatch() == []


def test_cancelled_after_backup_stays_stopped(svc, clock, tmp_path):
    s2 = _restored_after_cancel(svc, clock, tmp_path)
    assert s2.trial()["active"] is False
    assert s2.plan() == []

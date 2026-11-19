"""critic סבב 175 · 🔴 לתיקון בונה — רכיב: `app/backup.py` → `restore_backup` (+ `main` «restore», שמדפיס רק «ok»).

שחזור גיבוי מחזיר את ה-DB **כולו** למצב של רגע הגיבוי — כולל `suppressions`, `customers.opted_out` ו-`audit`.
לקוח שביקש הסרה **אחרי** הגיבוי האחרון (עד 24 שעות בגיבוי לילי; עד 30 יום בגיבוי ישן) חוזר להיות «לא מוסר».
[מאומת בהרצה:] גיבוי ⇒ «הסר» (opted_out=1, 2 שורות suppressions) ⇒ שחזור ⇒ opted_out=0, suppressions=0 ⇒ plan+אישור+
dispatch ⇒ **SMS ומייל נשלחו לדנה** שביקשה הסרה. זו הפרה ישירה של בקשת הסרה (חוק התקשורת §30א) — בדיוק המצב
שהמערכת בנויה למנוע — והכלי מדווח «ok» בלי שום אזהרה. אותו דבר למחיקה לפי בקשה (DSR) ולהתממה (ר-10): השחזור
מחזיר את ה-PII שנמחק.
הצעה: יומן הסרות/מחיקות **מחוץ** לקובץ ה-DB (append-only, גיבוב בלבד, כמו suppressions) שמוחל מחדש אחרי כל שחזור;
ובינתיים: DB משוחזר עולה עם שליחה עצורה (כמו credit_review לכל העסק) + אזהרה בולטת עד שבעל העסק מאשר שהחיל הסרות
מאז הגיבוי. xfail(strict=True); הבקרה (השחזור עצמו מדויק) נשארת ירוקה."""
from datetime import timedelta

import pytest

from app.backup import create_backup, restore_backup
from app.db import DB
from app.secretbox import SecretBox, generate_key
from app.service import CollectService

DANA = ("972501234567", "c1@example.com")


def _restore_after_optout(svc, clock, tmp_path):
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    svc.sync()
    bk = create_backup(svc.db.conn, tmp_path / "nightly.gbk", box)
    svc.inbound("sms", "0501234567", "הסר")
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    dest = restore_backup(bk, tmp_path / "restored.db", box)
    return CollectService(svc.s, DB(str(dest)), gi=svc.gi, clock=clock)


@pytest.mark.xfail(strict=True, reason="critic 175: שחזור גיבוי מבטל הסרה ⇒ תזכורת למי שביקש הסרה (לתיקון בונה)")
def test_no_reminder_to_opted_out_after_restore(svc, clock, tmp_path):
    s2 = _restore_after_optout(svc, clock, tmp_path)
    clock.now += timedelta(days=3)
    for rid in s2.plan():
        try:
            s2.approve(rid, confirm_open=True)
        except (ValueError, PermissionError):
            pass
    s2.dispatch()
    assert [m for m in s2.sender.sent if m["to"] in DANA] == []


def test_control_restore_is_exact_snapshot(svc, clock, tmp_path):
    """בקרה: השחזור עצמו מדויק — מחזיר את המצב שלפני ההסרה (לכן הבעיה היא חוסר היומן, לא השחזור)."""
    s2 = _restore_after_optout(svc, clock, tmp_path)
    assert s2.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 0

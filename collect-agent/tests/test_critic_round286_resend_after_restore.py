"""מבקר סבב 286 (🟠, גבי מנוע): שחזור מגיבוי ⇒ מה שאושר לפני הגיבוי ויצא אחריו — יוצא שוב אחרי שחרור עצירת השחזור.

[מאומת] גיבוי לילי (create_backup) כשתזכורת/תשובה כבר `approved` ⇒ dispatch שולח אותה (SMS+מייל לדנה) ⇒ שחזור מהגיבוי
(restore_backup) ⇒ השורה חוזרת ל-`approved` ו-`last_sent_at` ריק. restore_hold עוצר ✓, אבל `restore_guard.release`
(תיעוד ≥5 תווים על **הסרות/מחיקות**) משחרר כמו שהוא ⇒ dispatch שולח **שוב** את אותה תזכורת לאותה לקוחה כעבור שעתיים —
גם מרווח ה-72 שעות לא עוצר (last_sent_at אבד בשחזור). אותו דבר בתשובה ללקוח שאושרה ועמדה בתור. בגיבוי לילי ושחזור
למחרת — כל מה שאושר אתמול ויצא היום נשלח פעמיים. הודעת העצירה לבעל העסק מדברת רק על הסרות («החילו מחדש כל בקשת
הסרה, מחיקה או התממה») — לא על שליחות שכבר יצאו.
מצופה: בשחזור, תזכורות/טיוטות `approved`/`sending` ⇒ חזרה לאישור מחדש (או send_unknown + כרטיס), כמו approval_expired.
רכיב: app/backup.py → restore_backup · app/restore_guard.py → mark_restored / release.
"""
from __future__ import annotations

from dataclasses import replace
from datetime import timedelta

import pytest

from app import restore_guard
from app.backup import create_backup, restore_backup
from app.db import DB
from app.secretbox import SecretBox, generate_key
from app.service import CollectService

DANA = ("972501234567", "c1@example.com")


def _restored(svc, clock, tmp_path, bk_box):
    dest = restore_backup(tmp_path / "nightly.gbk", tmp_path / "restored.db", bk_box)
    s2 = CollectService(svc.s, DB(str(dest)), gi=svc.gi, clock=clock)
    assert restore_guard.active(s2.db)
    return s2


def test_hold_blocks_until_release_control(svc, clock, tmp_path):
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    svc.sync()
    svc.approve(svc.plan()[0], confirm_open=True)
    create_backup(svc.db.conn, tmp_path / "nightly.gbk", box)
    svc.dispatch()
    s2 = _restored(svc, clock, tmp_path, box)
    assert s2.dispatch() == []


@pytest.mark.xfail(strict=True, reason="מבקר 286🟠: תזכורת שיצאה אחרי הגיבוי נשלחת שוב אחרי שחזור+שחרור")
def test_reminder_sent_after_backup_not_resent(svc, clock, tmp_path):
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    svc.sync()
    svc.approve(svc.plan()[0], confirm_open=True)
    create_backup(svc.db.conn, tmp_path / "nightly.gbk", box)
    assert [m for m in svc.dispatch()]
    clock.now += timedelta(hours=2)
    s2 = _restored(svc, clock, tmp_path, box)
    restore_guard.release(s2.db, actor="owner", note="בדקתי הסרות", at=clock().isoformat())
    s2.dispatch()
    assert [m for m in s2.sender.sent if m["to"] in DANA] == []


@pytest.mark.xfail(strict=True, reason="מבקר 286🟠: תשובה שאושרה ויצאה אחרי הגיבוי נשלחת שוב אחרי שחזור+שחרור")
def test_draft_sent_after_backup_not_resent(svc, clock, tmp_path):
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    svc.sync()
    svc.s = replace(svc.s, trial_start=(svc.clock().date() - timedelta(days=30)).isoformat())
    svc.inbox.approve_draft(svc.inbound("sms", "050-1234567", "שילמתי אתמול בהעברה")["draft_id"])
    create_backup(svc.db.conn, tmp_path / "nightly.gbk", box)
    svc.s = replace(svc.s, trial_start="")
    svc.dispatch()
    s2 = _restored(svc, clock, tmp_path, box)
    restore_guard.release(s2.db, actor="owner", note="בדקתי הסרות", at=clock().isoformat())
    s2.dispatch()
    assert [m for m in s2.sender.sent if m["to"] in DANA] == []

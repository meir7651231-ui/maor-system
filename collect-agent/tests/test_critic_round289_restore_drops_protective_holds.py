"""מבקר סבב 289 (🟠, גבי מנוע): שחזור מגיבוי מוחק השהיות **מגנות** שהוצבו אחרי הגיבוי — גם עם OPTOUT_LEDGER.

✓ אימות 288א/ב (מנהל 466, REVOCATION_LEDGER): השבתה/הפעלה/הורדת הרשאה, סוד-מסירה שהוחלף ו-iat של זכאות שורדים שחזור
   (בדיקות הצוות + הקבצים 288 בלי xfail). אין במערכת שינוי סיסמה / איפוס TOTP — לא רלוונטי.
[מאומת, עם OPTOUT_LEDGER] אחרי הגיבוי הוצב ללקוחה 1 אחד מאלה ⇒ שחזור ⇒ שחרור עצירה ⇒ plan() למחרת:
  · «מספר שגוי» ⇒ opted_out חוזר מהיומן, אין תזכורת ✓.
  · השהיית **קטין** / **פטירה** (`set_hold`) ⇒ paused_reason=None ⇒ תזכורת נבנית ללקוחה.
  · **מחלוקת** («אני לא חייבת… טעות בחשבונית» ⇒ disputed=1) ⇒ disputed=0 ⇒ תזכורת על חוב שבמחלוקת.
  · **עצירה משפטית** (`set_legal_hold`) ⇒ legal_hold=None ⇒ ההתממה (90 יום מסגירה) כבר לא חסומה — תיק משפטי ימוחק.
  · ℹ️ הבטחת תשלום ⇒ ההשהיה נעלמת (תזכורת לפני המועד שהובטח).
הודעת העצירה מזכירה רק «הסרה, מחיקה או התממה» — לא השהיות קטין/פטירה/מחלוקת/עצירה משפטית.
מצופה: השהיות מגנות נרשמות ביומן מחוץ ל-DB (כמו 466) ומוחלות בשחזור, או מופיעות בהודעת העצירה לבדיקה ידנית.
רכיב: app/backup.py → restore_backup · app/restore_guard.py ·
app/service.py → set_hold / set_legal_hold / _apply_effects.
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

ACTS = {
    "minor": lambda s: s.set_hold(1, "minor", ""),
    "deceased": lambda s: s.set_hold(1, "deceased", ""),
    "dispute": lambda s: s.inbound("sms", "050-1234567", "אני לא חייבת את זה, יש טעות בחשבונית"),
    "legal": lambda s: s.set_legal_hold(1, "תביעה בבית משפט"),
}


def _restored_after(svc, clock, tmp_path, act):
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    led = tmp_path / "optout.ledger"
    svc.s = replace(svc.s, optout_ledger=str(led))
    svc.sync()
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    act(svc)
    s2 = CollectService(svc.s, DB(str(restore_backup(bk, tmp_path / "r.db", box, ledger=str(led)))), gi=svc.gi,
                        clock=clock)
    restore_guard.release(s2.db, actor="owner", note="בדקתי הסרות", at=clock().isoformat())
    clock.now += timedelta(days=1)
    s2.plan()
    return s2


def _reminders_to_1(s):
    return s.db.q("SELECT r.id FROM reminders r JOIN invoices i ON i.id=r.invoice_id WHERE i.customer_id=1")


def test_wrong_number_survives_via_ledger_control(svc, clock, tmp_path):
    wrong = "מספר שגוי, אני לא מכירה אתכם"
    s2 = _restored_after(svc, clock, tmp_path, lambda s: s.inbound("sms", "050-1234567", wrong))
    assert s2.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1 and not _reminders_to_1(s2)



@pytest.mark.parametrize("act", ["minor", "deceased", "dispute"])
def test_protective_hold_survives_restore(svc, clock, tmp_path, act):
    s2 = _restored_after(svc, clock, tmp_path, ACTS[act])
    assert not _reminders_to_1(s2)



def test_legal_hold_survives_restore(svc, clock, tmp_path):
    s2 = _restored_after(svc, clock, tmp_path, ACTS["legal"])
    assert s2.db.one("SELECT legal_hold FROM customers WHERE id=1")["legal_hold"]

"""critic סבב 177 · 🟠 לתיקון בונה — עצירת שליחה אחרי שחזור (`restore_hold`, `ae6a7db1`).

א. רכיב: `app/service.py` → `owner_message_done` (+ `dashboard`) מול `app/restore_guard.py`. הכרטיס «🛑 המערכת שוחזרה
   מגיבוי — השליחה ללקוחות עצורה» נוצר **פעם אחת** (`mark_restored`). «✓ טופל» עליו מוריד אותו (needs_owner=0) — אבל
   העצירה **נשארת** (`restore_hold()` פעיל), ושום דבר בדשבורד לא אומר שהשליחה עצורה ⇒ הגבייה נעצרת **בשקט ולתמיד**:
   כל התזכורות נשארות «מאושרות» ולא יוצאות, ובעל העסק לא יודע למה. [מאומת בהרצה.]
   הצעה: «טופל» על כרטיס restore_hold לא סוגר אותו (או מפנה לשחרור), ו/או `dashboard()` מחזיר `restore_hold` לבאנר.
ב. רכיב: `web/src` (/app/) + `app/ui.html` (/ui) — **אין מסך שחרור**: `POST /owner/restore-hold/release` קיים רק כ-API
   (owner + תיעוד ≥5), בלי כפתור/טופס. בעל עסק לא-טכני לא יכול לחדש שליחה אחרי שחזור.
xfail(strict=True); הבקרה (העצירה פעילה אחרי שחזור) נשארת ירוקה."""
from pathlib import Path

import pytest

from app.backup import create_backup, restore_backup
from app.db import DB
from app.secretbox import SecretBox, generate_key
from app.service import CollectService

ROOT = Path(__file__).resolve().parents[1]


def _restored(svc, clock, tmp_path):
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    svc.sync()
    bk = create_backup(svc.db.conn, tmp_path / "b.gbk", box)
    return CollectService(svc.s, DB(str(restore_backup(bk, tmp_path / "r.db", box))), gi=svc.gi, clock=clock)


@pytest.mark.xfail(strict=True, reason="critic 177א: «טופל» על כרטיס השחזור מעלים אותו והעצירה נשארת בשקט")
def test_hold_stays_visible_after_card_done(svc, clock, tmp_path):
    s2 = _restored(svc, clock, tmp_path)
    for m in s2.db.q("SELECT id FROM messages WHERE intent='restore_hold' AND needs_owner=1"):
        s2.owner_message_done(m["id"])
    assert s2.restore_hold()                                   # העצירה עדיין פעילה
    still_card = s2.db.one("SELECT 1 FROM messages WHERE intent='restore_hold' AND needs_owner=1")
    assert still_card or "restore_hold" in str(s2.dashboard())


@pytest.mark.xfail(strict=True, reason="critic 177ב: אין מסך שחרור לעצירת שחזור (לתיקון גבייה עיצוב)")
def test_web_has_restore_hold_release():
    files = [*(ROOT / "web" / "src").rglob("*.ts*"), ROOT / "app" / "ui.html"]
    # רק קוד, לא הערות (ב-notices.ts הכתובת מופיעה בהערה בלבד)
    code = [ln for f in files for ln in f.read_text(encoding="utf-8").splitlines()
            if not ln.strip().startswith(("//", "*", "/*"))]
    assert any("/owner/restore-hold/release" in ln for ln in code)


def test_control_hold_active_after_restore(svc, clock, tmp_path):
    s2 = _restored(svc, clock, tmp_path)
    assert s2.restore_hold() and s2.db.one("SELECT 1 FROM messages WHERE intent='restore_hold' AND needs_owner=1")

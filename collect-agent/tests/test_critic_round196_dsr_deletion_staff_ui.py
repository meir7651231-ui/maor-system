"""מבקר סבב 196 — סגירת בקשת מחיקה מוצעת לעובד/ת במרשם בקשות הפרטיות, ונדחית רק אחרי תיעוד+לחיצה.

רכיבים: `web/src/components/DsrRegister.tsx` → `DsrItem` («✓ טופל — סגירת הבקשה») + `app/ui.html` → מרשם DSR (#ds…).
הכרעת ראש צוות 20.11 (סט QA #22b, 56bda8ca): סגירת בקשת `deletion` = בעל העסק בלבד — השרת מחזיר 403 + audit
(`dsr_deletion_close_refused`). נכון. אבל המסך מציג לעובדת את השורה כרגיל: היא מקלידה «נמחק מהמערכת לבקשת הלקוח»,
לוחצת — ורק אז «הבקשה לא נסגרה: רק בעל העסק סוגר בקשת מחיקה». אותו דפוס כמו 194/195ג שתוקנו
(`lib/ownerOnly.ts`). מסע דפדפן כעובדת (סשן /auth/login): docs/screens/critic-196-staff-dsr-deletion-403.png.
תוקן במקביל ב-243ee5a5 (`lib/roles.ts` dsrCloseLocked + /ui) — xfail הוסר, נשאר שומר.
הצעה (בוצעה): לעובד/ת בשורת deletion — במקום תיבת התיעוד והכפתור, «🔒 בעל העסק בלבד — מאשר שהמחיקה בוצעה»."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _code(p: Path) -> str:
    return "\n".join(ln for ln in p.read_text(encoding="utf-8").splitlines()
                     if not ln.strip().startswith(("//", "*", "/*", "{/*")))


def test_app_dsr_register_locks_deletion_close_for_staff():
    code = _code(ROOT / "web" / "src" / "components" / "DsrRegister.tsx")
    assert re.search(r"isStaff|OwnerOnly|ownerOnly|me\??\.owner\b|OWNER_ONLY_TAG|deletionLocked|[cC]loseLocked", code)


def test_ui_dsr_register_locks_deletion_close_for_staff():
    code = _code(ROOT / "app" / "ui.html")
    assert re.search(r"deletion[^\n]{0,200}(owner|isStaff)|(\.owner|isStaff)[^\n]{0,200}deletion", code)

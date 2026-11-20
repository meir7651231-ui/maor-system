"""מבקר סבב 195ג — כפתור «↻ חידוש תזכורות» מוצג לעובד/ת על השהיה שבעל העסק סימן.

רכיבים: `web/src/pages/Dashboard.tsx` → `NeedsYou` (כרטיס ⏸️ ב«דורש טיפול שלך») + `app/ui.html` → `button.resume`.
מאז critic 191א השרת דוחה 403 עובד/ת שמחדש/ת השהיית-בעלים (`OWNER_HOLDS`: קטין/פטירה/חדלות פירעון) — נכון. אבל
המסך מציג לעובדת את הכפתור כרגיל, עם האזהרה «חדשו רק אחרי שבדקתם», היא לוחצת פעמיים (אישור) — ורק אז טוסט
«לא בוצע: רק בעל העסק יכול לבטל השהיה שהוא סימן». אותו דפוס כמו 194 (הגדרות), שתוקן ב-66cdb3df.
מסע דפדפן כעובדת (סשן /auth/login): docs/screens/critic-195-staff-resume-403.png.
הצעה: לעובד/ת — במקום הכפתור, «🔒 רק בעל העסק מחדש (קטין/פטירה/חדלות פירעון)» לפי /auth/me owner.
   תוקן (גבי עיצוב): web/src/lib/roles.ts + Dashboard (נעול + תג) · /ui OWNER_HOLDS/isStaff — ה-xfail הוסר."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROLE = re.compile(r"OWNER_HOLDS|ownerHold|OwnerHold|holdOwnerOnly|me\??\.owner\b|OwnerOnly|isOwner")


def _code(p: Path) -> str:
    out = []
    for ln in p.read_text(encoding="utf-8").splitlines():
        s = ln.strip()
        if s.startswith(("//", "*", "/*", "{/*")):
            continue
        out.append(ln)
    return "\n".join(out)


def test_app_dashboard_knows_owner_holds():
    assert ROLE.search(_code(ROOT / "web" / "src" / "pages" / "Dashboard.tsx"))


def test_ui_knows_owner_holds():
    assert ROLE.search(_code(ROOT / "app" / "ui.html"))

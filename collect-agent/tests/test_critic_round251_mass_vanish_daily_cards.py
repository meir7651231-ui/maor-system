"""מבקר סבב 251 · 🟡 — תקלת API שנמשכת כמה ימים פותחת כרטיס `api_mass_vanish` **חדש כל יום** בלי לסגור את הקודמים:
אחרי 4 ימים יש 5 כרטיסים פתוחים זהים ב«דורש טיפול» על אותן 6 חשבוניות.

רכיבים: `app/service.py` → `_hold_mass_vanish` (מפתח `mass_vanish:<תאריך>` — «כרטיס אחד ליום … כבר קיים היום ⇒
מעדכנים», אבל כרטיסי ימים קודמים לא נסגרים/מתאחדים) · `accept_mass_close(mid)` (מסמן רק את הכרטיס שנלחץ).
תרחיש (fake_gi): 6 פתוחות ⇒ סנכרון ריק ⇒ החזקה + כרטיס. 4 ימים נוספים, סנכרון ריק כל יום ⇒ כרטיסים 8.11, 9.11, 10.11,
11.11, 12.11 — כולם `needs_owner=1`, אותו payload (6 מ-6). «כולן באמת שולמו» על האחרון ⇒ 6 נסגרות; 4 הכרטיסים הישנים
נשארים ואומרים «גבי לא סימנה אותן כשולמו — הן נשארות פתוחות» (כבר לא נכון) עד הסנכרון הבא.
✓ 250 (מנהל 418) תוקן — 0 מסמכים + ≥2 נעלמו ⇒ כרטיס גם בעסק קטן; חשבונית יחידה נסגרת. 417: רענון לפני שליחה עם 404 על
מוחזקת ⇒ `refresh_failed` (לא נסגרת, לא נשלחת) ✓; מסמך שנמצא פתוח ⇒ נשלח (מאומת). «כולן שולמו» ⇒ בעלים בלבד (403,
נקרא בקוד). webhook = טריגר ל-sync ⇒ אותו מסלול.
הצעה: כרטיס אחד פתוח לתקלה (עדכון הכרטיס הפתוח במקום חדש ליום), והכרעה עליו מורידה את כל כרטיסי אותה תקלה.
xfail(strict=True)."""
from datetime import timedelta

from tests.conftest import gi_doc


def test_ongoing_vanish_keeps_single_open_card(svc, clock, fake_gi):
    fake_gi.docs[:] = [gi_doc(i, phone=f"050-00001{i:02d}") for i in range(1, 7)]
    svc.sync()
    fake_gi.docs[:] = []
    clock.now += timedelta(hours=2)
    svc.sync()
    for _ in range(4):
        clock.now += timedelta(days=1)
        svc.sync()
    n = svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent='api_mass_vanish' AND needs_owner=1")["n"]
    assert n == 1, n

"""מבקר סבב 252 · 🟡 — בזמן החזקת `api_mass_vanish` (מערכת החשבוניות מחזירה 0 מסמכים) עבודת הבוקר מסתיימת ב-`ok`
ובדיקת הניטור (`morning check`) מדווחת «תקין» — מי שמנטר את ה-cron לא יודע שהמקור מחזיר רשימה ריקה כבר ימים.

רכיבים: `app/morning.py` → `run_morning` (`status='ok'` כש-`sync` החזיר `vanish_held`) · `check` (מתריע רק על
`sync_failed` / ריצה ישנה). כרטיס `api_mass_vanish` מגיע לבעל העסק, אבל הניטור התפעולי (ALERT ב-cron) שקט.
תרחיש (fake_gi): 10 פתוחות ⇒ סנכרון ריק ⇒ החזקה + כרטיס. למחרת `run_morning` ⇒ `{'status': 'ok', 'sync': {'open': 0,
'closed': 0, 'vanish_held': 10}, …}`; `check(db)` ⇒ `(True, 'עבודת הבוקר (…, ok) …')`.
✓ 251 (מנהל 419) תוקן — כרטיס פתוח אחד שמתעדכן. ✓ /app/ (build טרי): הכרטיס «מערכת החשבוניות החזירה הרבה פחות…»
עם «כולן באמת שולמו — סמן כשולמו» (חימוש בלחיצה כפולה) + «השאר פתוחות — אבדוק את החיבור», דסקטופ ו-390px בלי גלילה
אופקית; אחרי אישור הכרטיס יורד ו-8 החשבוניות נסגרות; לעובד/ת הכפתור מוסתר (`!isStaff`). צילום:
docs/screens/critic-252-mass-vanish-card-390.png.
הצעה: `run_morning` עם `vanish_held` ⇒ סטטוס `sync_suspect` ו-`check` מתריע («המקור החזיר N במקום M — לבדוק חיבור»),
כמו `sync_failed`. xfail(strict=True).
   תוקן במנהל 420 (`run_morning` ⇒ `sync_suspect` · `check` מתריע עם המספרים) — ה-xfail הוסר."""
from datetime import timedelta

from app.morning import check, run_morning
from tests.conftest import gi_doc


def test_morning_check_alerts_on_mass_vanish_hold(svc, clock, fake_gi):
    fake_gi.docs[:] = [gi_doc(i, phone=f"050-00001{i:02d}") for i in range(1, 11)]
    svc.sync()
    fake_gi.docs[:] = []
    clock.now += timedelta(hours=2)
    svc.sync()
    clock.now += timedelta(days=1)
    out = run_morning(svc, force=True)
    assert out["sync"].get("vanish_held") == 10
    ok, msg = check(svc.db, now=svc.clock())
    assert not ok, (out["status"], msg)

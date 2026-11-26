"""מבקר סבב 249 · 🟠 — סנכרון API מלא שמחזיר רשימה ריקה (HTTP 200: פילטר שגוי, חשבון אחר, תקלה אצל הספק) סוגר את כל
החובות הפתוחים בשקט — «שולם», בלי כרטיס.

רכיבים: `app/service.py` → `sync` (`full=not bad` — רק מסמך פגום עוצר סגירה, `_notify_malformed`) · `_ingest_rows`
(full=True: כל חשבונית פתוחה שלא ב-`seen` ⇒ `status='closed', closed_at=now` + `_cancel_invoice`).
תרחיש (fake_gi): 20 חשבוניות פתוחות (20 לקוחות) ⇒ plan() בנה 20 תזכורות. הסנכרון הבא מחזיר 0 מסמכים ⇒ `{'open': 0,
'closed': 20}`, 20 תזכורות cancelled, אין אף כרטיס ב«דורש טיפול», הדשבורד: 0 פתוחות / 20 נסגרו (נספרות כנגבו לפי
closed_at). סנכרון אחר כך עם 10 ⇒ 10 נפתחות מחדש, 10 נשארות «שולמו». אין שום הבדל בין «הכול שולם הלילה» לבין תקלה.
✓ 248 (מנהל 415) תוקן — הסדר «הושלם» משחרר את השהיית ההסדר ⇒ חשבונית שנפתחה מחדש חוזרת לתזכורות.
הצעה: סף שפיות — היעלמות של חלק גדול מהפתוחות (למשל הכול, או ≥50% ו-≥5) בסנכרון אחד ⇒ לא סוגרים, כרטיס «מערכת
החשבוניות החזירה N מסמכים במקום M — בדקו את החיבור», כמו `_notify_malformed`. xfail(strict=True).
   תוקן במנהל 416 (`_mass_vanish` + כרטיס `api_mass_vanish` + `accept_mass_close`) — ה-xfail הוסר."""
from datetime import timedelta

from tests.conftest import gi_doc


def test_empty_api_response_does_not_close_everything_silently(svc, clock, fake_gi):
    fake_gi.docs[:] = [gi_doc(i, phone=f"050-00001{i:02d}") for i in range(1, 21)]
    svc.sync()
    clock.now += timedelta(days=1)
    assert len(svc.plan()) == 20
    fake_gi.docs[:] = []
    clock.now += timedelta(hours=2)
    svc.sync()
    still_open = svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open'")["n"]
    card = svc.db.one("SELECT 1 FROM messages WHERE needs_owner=1")
    assert still_open == 20 or card, (still_open, bool(card))

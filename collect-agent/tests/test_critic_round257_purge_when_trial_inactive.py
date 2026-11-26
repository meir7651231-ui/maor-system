"""מבקר סבב 257 · 🟠 — עסק שהניסיון/המנוי שלו נגמר לא מתמם אף פעם: ר-10 (90 יום מסגירת החוב) רץ רק בתוך `plan()`,
ו-`plan()` חוזר מוקדם כש-`trial()["active"]` False.

רכיבים: `app/service.py` → `plan` (`if not t["active"]: return []` **לפני** `self.purge_closed()   # ר-10`) — הקריאה
האוטומטית היחידה ל-`purge_closed` (מלבד `/maintenance/purge` הידני);
`app/morning.py` → `run_morning` (קורא רק ל-`plan()`).
תרחיש: קובץ 7001 דויד כהן 050-0000111 ⇒ «שולם»; `trial_start` לפני 60 יום (ניסיון 14 יום ⇒ `active: False`). 100 יום
אחרי הסגירה: `plan()` ⇒ `[]`, `run_morning` ⇒ `status: ok` — הלקוח עדיין `name='דויד כהן', phone='050-0000111',
purged_at=None`. עסק שעזב/לא שילם (בדיוק המקרה שבו המידע כבר לא משמש לשום דבר) שומר PII לתמיד.
✓ 256 (מנהל 425) תוקן — `purged:<אקראי>`. ✓ שחזור גיבוי: `restore_hold` + יומן ההסרות; התממה שבוטלה בשחזור
חוזרת ב-`plan()` הבא של עסק פעיל (נקרא בקוד); גיבויים עד 30 יום (`MAX_AGE_DAYS`, PRIVACY §10).
הצעה: `purge_closed()` לפני בדיקת ה-trial ב-`plan()` (ההתממה אינה שליחה), או בעבודת הבוקר ללא תלות ב-trial.
תוקן במנהל 427 (purge לפני שער הניסיון); הבדיקה הוחזרה ע״י המבקר בסבב 258 כמגן (נמחקה ב-f9982b49)."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def test_purge_runs_even_when_trial_inactive(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + "7001,דויד כהן,050-0000111,,1200,פתוח,01/10/26,15/10/26\n").encode())
    clock.now += timedelta(days=1)
    svc.import_csv((H + "7001,דויד כהן,050-0000111,,1200,שולם,01/10/26,15/10/26\n").encode())
    svc.s = replace(svc.s, trial_start=(clock.now.date() - timedelta(days=60)).isoformat())
    assert svc.trial()["active"] is False
    clock.now += timedelta(days=100)
    svc.plan()
    row = svc.db.one("SELECT phone, purged_at FROM customers")
    assert row["purged_at"] and row["phone"] is None, dict(row)

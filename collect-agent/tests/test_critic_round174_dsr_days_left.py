"""critic סבב 174 · 🟡 לתיקון בונה — רכיב: `app/dsr.py` → `listing` (`days = (due_at - now).days`), מוצג ב-/app/
(`web/src/lib/dsr.ts` → `dsrView`: «היום האחרון להשיב» / «באיחור של N ימים»).

הימים שנותרו נספרים ביחידות של 24 שעות ולא בימי לוח, והמסך מציג **תאריך** יעד ⇒ התווית סותרת את התאריך:
  • בקשה שהתקבלה 8.11 10:00 (יעד 08.12): ב-7.12 11:00 ⇒ days_left=0 ⇒ «היום האחרון להשיב» — אבל היעד מחר.
  • ב-8.12 10:30 (יום היעד עצמו) ⇒ days_left=-1, overdue=True ⇒ «באיחור של 1 ימים» — ביום היעד שמוצג על המסך.
[מאומת בהרצה.] בעל העסק קורא «להשיב עד 08.12» ו«באיחור» באותו יום. הצעה: days_left = (due.date() − now.date()).days
(ימי לוח, אזור זמן ישראל), overdue רק אחרי יום היעד. xfail(strict=True); הבקרה נשארת ירוקה.
הערה נלווית (🟡, `web/src/lib/dsr.ts` → `dsrView`): לקוח שהותמם (customer_id קיים, customer=NULL) מוצג
כ«כתובת משותפת — לשייך מהכרטיס בסקירה» — כי התווית נגזרת מהשם ולא מ-customer_id (אומת ב-node על הקוד עצמו)."""
from datetime import timedelta

import pytest

from app import dsr


def _open(svc):
    svc.sync()
    svc.inbound("sms", "0501234567", "מחקו את המידע שלי")


@pytest.mark.xfail(strict=True, reason="critic 174: days_left ב-24 שעות ⇒ «היום האחרון» יום לפני היעד")
def test_day_before_due_is_not_last_day(svc, clock):
    _open(svc)
    clock.now += timedelta(days=29, hours=1)          # 7.12 11:00, היעד 08.12
    assert dsr.listing(svc)[0]["days_left"] == 1


@pytest.mark.xfail(strict=True, reason="critic 174: ביום היעד עצמו מסומן «באיחור» (לתיקון בונה)")
def test_due_date_itself_not_overdue(svc, clock):
    _open(svc)
    clock.now += timedelta(days=30, minutes=30)       # 8.12 10:30 — יום היעד
    row = dsr.listing(svc)[0]
    assert row["overdue"] is False and row["days_left"] == 0


def test_control_day_after_due_is_overdue(svc, clock):
    _open(svc)
    clock.now += timedelta(days=31, hours=1)
    assert dsr.listing(svc)[0]["overdue"] is True

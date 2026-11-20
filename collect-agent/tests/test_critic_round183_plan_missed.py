"""critic סבב 183 · 🟠 לתיקון בונה — רכיב: `app/service.py` → `_customer_block` / `_customer_blocks` +
`app/policy.py` → `customer_blocked` (`plan_active` חוסם **ללא תנאי**), ואין מחזור-חיים להסדר (אין «הושלם» / «הוחמץ»):
`UPDATE plans SET status=` מופיע רק עם proposed/approving/approved/rejected/superseded.

`approve_plan` מסמן `approved` **ברגע שהצעת הפריסה נשלחת** (הנוסח: «השיבו "מאשר" ובעל העסק יאשר סופית»). מאותו רגע
`plan_active` חוסם כל תזכורת ללקוח — לתמיד. **[מאומת]** הסדר 3×400 ₪ (15.11, 15.12, 15.1) ⇒ 130 יום אחרי, כל המועדים
עברו, החשבונית עדיין פתוחה ⇒ `plan()` לא יוצר שום תזכורת לדנה, `_customer_block`=plan_active, **ואין שום כרטיס לבעל
העסק**. אותו דבר ללקוח שהתעלם מההצעה ולא ענה «מאשר» בכלל — אף פעם לא תזכורת נוספת. הגבייה של הלקוח נעצרת בשקט.
הצעה: הסדר חוסם רק עד מועד התשלום הבא + חסד; תשלום שהוחמץ ⇒ כרטיס לבעל העסק («תשלום 1 מתוך 3 לא התקבל») ו/או
תזכורת על **סכום התשלום** (לא על כל החוב) באישור בעל העסק; הצעה שלא אושרה ע״י הלקוח תוך N ימים ⇒ פגה.
xfail(strict=True)."""
from datetime import timedelta

import pytest


@pytest.mark.xfail(strict=True, reason="critic 183: הסדר שאושר/הוצע חוסם תזכורות לתמיד, גם אחרי שכל התשלומים הוחמצו")
def test_missed_plan_surfaces_to_owner_or_reminds(svc, clock):
    svc.sync()
    pid = svc.propose_plan(1, 3)
    svc.approve_plan(pid, confirm_amount=True)
    clock.now += timedelta(days=130)                      # כל 3 המועדים עברו, החשבונית פתוחה
    svc.sync()
    rids = svc.plan()
    to_dana = [r for r in rids if svc.db.one("SELECT 1 FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                                             "WHERE r.id=? AND i.customer_id=1", (r,))]
    cards = svc.db.q("SELECT 1 FROM messages WHERE needs_owner=1 AND customer_id=1")
    assert to_dana or cards


def test_control_plan_blocks_while_on_track(svc, clock):
    """בקרה: בזמן שההסדר בתוקף (לפני המועד הראשון) — אין תזכורת על החוב המקורי."""
    svc.sync()
    svc.approve_plan(svc.propose_plan(1, 3), confirm_amount=True)
    clock.now += timedelta(days=3)
    assert svc._customer_block(1) == "plan_active"

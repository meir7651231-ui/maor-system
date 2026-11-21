"""מבקר סבב 204ב · 🟡 — חשבונית חדשה ללקוח באמצע הסדר פעיל: שקטה עד סוף ההסדר, בלי כרטיס לבעל העסק.

רכיבים: `app/policy.py` → `customer_blocked` (`plan_active` חוסם את **הלקוח**, לא את החשבוניות שבהסדר) +
`app/service.py` → `plan` / `sync` (חשבונית חדשה ללקוח עם הסדר — לא מסומנת).
נבדק: הסדר 3×600 ₪ על 1001+1004 (`invoice_ids=[1,3]`) ⇒ נוצרת 1005 (300 ₪, מועד 12.11) — לא בהסדר ⇒ הלקוח עומד
בהסדר ⇒ על 1005 אין אף תזכורת עד שההסדר `completed` (14.1.2027) — חודשיים אחרי המועד — ואין שום כרטיס לבעל העסק
שיש חוב חדש מחוץ להסדר. הכרעה לבעל העסק אם להזכיר בנפרד או לצרף להסדר — אבל בלי כרטיס, הוא לא יודע שיש מה להכריע.
xfail(strict=True)."""
from datetime import timedelta

import pytest

from tests.conftest import gi_doc


@pytest.mark.xfail(strict=True, reason="204ב🟡: חשבונית מחוץ להסדר — בלי תזכורת ובלי כרטיס עד סוף ההסדר")
def test_new_invoice_outside_plan_is_surfaced(svc, clock, fake_gi):
    fake_gi.docs.append(gi_doc(4, amount="600.00", client_id="cl1"))
    svc.sync()
    pid = svc.propose_plan(1, 3)
    svc.approve_plan(pid, confirm_amount=True)
    fake_gi.docs.append(gi_doc(5, amount="300.00", client_id="cl1", due="2026-11-12"))
    fake_gi.docs[3]["amount"], fake_gi.docs[3]["status"] = "0.00", 2   # 1004 (600) שולמה = תשלום 1 בזמן
    svc.sync()
    inv5 = svc.db.one("SELECT id FROM invoices WHERE number='1005'")["id"]
    assert inv5 not in __import__("json").loads(svc.db.one("SELECT invoice_ids FROM plans WHERE id=?",
                                                           (pid,))["invoice_ids"])
    clock.now += timedelta(days=14)                      # 22.11 — עשרה ימים אחרי המועד של 1005
    svc.plan()
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == "approved"   # ההסדר עדיין פעיל
    reminded = svc.db.one("SELECT 1 FROM reminders WHERE invoice_id=?", (inv5,))
    carded = svc.db.one("SELECT 1 FROM messages WHERE needs_owner=1 AND body LIKE '%1005%'")
    assert reminded or carded

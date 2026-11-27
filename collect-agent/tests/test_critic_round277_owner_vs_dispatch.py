"""מבקר סבב 277 (שמירה, ללא ממצא): פעולת בעלים/לקוח במקביל ל-dispatch/sync — נבדק דטרמיניסטית.

✓ אימות 276א/ב (מנהל 451) גם במרוץ אמיתי [מאומת — שני חוטים + Barrier, 20 הרצות נקיות]: «אשר»‖«סרב» (בעלים משני
טוקנים) ⇒ 20/20 הכרעה אחת + טיוטת עדכון אחת (200/409); שיוך כרטיס משותף (שתי עובדות) ⇒ 20/20 לקוח אחד מושהה.
נבדק כאן: «שולם» / הסרה ע״י בעלים / השהיית קטין / «הסר אותי» מהלקוח — באמצע dispatch, בשלוש נקודות (בזמן הרענון
מהמקור, לפני ה-claim, בבדיקת חסימת הלקוח) ⇒ התזכורת `cancelled`, שום הודעה לא יוצאת (ה-claim מותנה ב-approved).
«שולם» באמצע sync (אחרי שהמקור החזיר «פתוחה») ⇒ החשבונית נשארת סגורה ולא נבנית לה תזכורת.
ℹ️ (BACKLOG גבי מנוע): חלון של שליחה אחת — אחרי שה-SMS יצא ולפני המייל של אותה תזכורת, `gate(cust, …)` משתמש בשורת
הלקוח שנקראה לפני ה-claim ⇒ «הסר אותי» שהגיע באותו רגע (או «שולם»/השהיה) לא עוצר את המייל; הסרה ע״י בעלים כן
(suppression). רכיב: app/service.py → dispatch (cust לא נקרא מחדש בין ההודעות).
"""
from __future__ import annotations

import pytest

from app.channels import sent_mark, sent_since


def _hook_once(obj, name, during):
    orig = getattr(obj, name)
    state = {"done": False}

    def w(*a, **k):
        if not state["done"]:
            state["done"] = True
            during()
        return orig(*a, **k)
    setattr(obj, name, w)


def _approved(svc):
    svc.sync()
    rid = svc.plan()[0]
    svc.approve(rid, confirm_open=True)
    iid = svc.db.one("SELECT invoice_id FROM reminders WHERE id=?", (rid,))["invoice_id"]
    cid = svc.db.one("SELECT customer_id FROM invoices WHERE id=?", (iid,))["customer_id"]
    return rid, iid, cid, svc.db.one("SELECT phone FROM customers WHERE id=?", (cid,))["phone"]


@pytest.mark.parametrize("where", ["_refresh_before_send", "_claim_reminder", "_customer_block"])
@pytest.mark.parametrize("act", ["paid", "owner_optout", "hold", "reply_optout"])
def test_owner_action_during_dispatch_cancels(svc, where, act):
    rid, iid, cid, phone = _approved(svc)
    acts = {"paid": lambda: svc.mark_paid_outside(iid), "owner_optout": lambda: svc.owner_opt_out(cid),
            "hold": lambda: svc.set_hold(cid, "minor", ""),
            "reply_optout": lambda: svc.inbound("sms", phone, "הסר אותי")}
    _hook_once(svc, where, acts[act])
    mark = sent_mark(svc.sender.sent)
    assert svc.dispatch() == []
    assert not [m for m in sent_since(svc.sender.sent, mark) if "טרם סומנה" in str(m)]
    assert svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))["status"] == "cancelled"


def test_mark_paid_during_sync_stays_closed(svc):
    svc.sync()
    iid = svc.db.one("SELECT id FROM invoices WHERE status='open' ORDER BY id")["id"]
    _hook_once(svc.gi, "open_debts", lambda: svc.mark_paid_outside(iid))
    svc.sync()
    assert svc.db.one("SELECT status FROM invoices WHERE id=?", (iid,))["status"] == "closed"
    svc.plan()
    assert not svc.db.one("SELECT 1 FROM reminders WHERE invoice_id=?", (iid,))

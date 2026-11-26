"""מבקר סבב 265 · 🟠 — DLR מאוחר של 019 עם קוד 201 («נחסם לפי בקשה») על SMS שיצא למספר **הישן** של לקוח, אחרי שהמקור
עדכן לו טלפון: גבי חוסם את המספר **החדש** ומסיר את הלקוח לצמיתות; המספר שבאמת חסם נשאר פתוח.

רכיבים: `app/service.py` → `_sms_webhook_019` (ענף `dlr`: 201 ⇒ `SELECT c.phone FROM messages m JOIN customers c …` —
הטלפון **הנוכחי** של הלקוח, לא `payload.to` של ההודעה) ⇒ `suppress("sms", <חדש>, "carrier_blacklist")` +
`_opt_out(cid, "carrier_blacklist")` — הסרה שאין לה מסלול ביטול (`lift_inherited_optout` רק לירושה).
תרחיש (fake_gi, `client.id` קבוע): תזכורת יצאה ל-972501234567 ⇒ במקור הטלפון הוחלף ל-050-0000777 ⇒ sync (הלקוח מתעדכן) ⇒
DLR 201 על אותו `shipment_id` ⇒ `matched`, `opted_out=1`,
`suppressed(050-0000777)=True`, `suppressed(050-1234567)=False`.
✓ חדש מאז 264: מנהל 436 (e2e ייצוא) — אין שינוי קוד. קבצי המבקר: 157.
✓ דה-דופ של webhook 019 לפי sha256 של הגוף + תפיסה לפני עיבוד (critic 42) — קיים.
הצעה: לחסום את `payload.to` של ההודעה (הכתובת שאליה נשלח בפועל), ולהסיר את הלקוח רק אם זה עדיין הטלפון שלו; אחרת כרטיס
«המספר הקודם חסם הודעות». xfail(strict=True)."""
from datetime import timedelta

import pytest

from tests.test_delivery_feedback_docs import FORM, _doc_019_body, _sent, api  # noqa: F401

NEW = "050-0000777"


@pytest.mark.xfail(strict=True, reason="265🟠: DLR 201 מאוחר ⇒ חוסם את הטלפון החדש ומסיר את הלקוח; הישן לא נחסם")
def test_late_dlr_201_blocks_the_number_it_was_sent_to(api, svc, fake_gi, clock):  # noqa: F811
    m = _sent(api, svc, "sms")
    old, cid = m["cphone"], m["customer_id"]
    tail = old.replace("-", "")[-7:]
    for d in fake_gi.docs:
        if (d["client"].get("phone") or "").replace("-", "")[-7:] == tail:
            d["client"]["phone"] = NEW
    clock.now += timedelta(hours=3)
    api.post("/sync")
    assert svc.db.one("SELECT phone FROM customers WHERE id=?", (cid,))["phone"] == NEW
    r = api.post("/webhooks/sms/019?k=whk-test", content=_doc_019_body(m["provider_id"], "201"), headers=FORM)
    assert r.json().get("matched")
    state = (svc.suppressed("sms", old), svc.suppressed("sms", NEW),
             svc.db.one("SELECT opted_out FROM customers WHERE id=?", (cid,))["opted_out"])
    assert state == (True, False, 0), state

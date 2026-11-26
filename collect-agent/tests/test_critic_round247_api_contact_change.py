"""מבקר סבב 247 · 🟠 — סנכרון API (בלי מזהה לקוח ובלי מייל) שבו טלפון+שם של חשבונית התחלפו: החשבונית נשארת אצל הלקוחה
הקודמת וכל התזכורות יוצאות לטלפון **הישן** בשמה — אותו נזק של 219א, שתוקן רק במסלול ה-CSV.

רכיבים: `app/service.py` → `customer_key` (בלי מזהה GI ובלי מייל ⇒ `phone:<מנורמל>`) · `_csv_contact_moved` (219א, רק
`import_csv`) · המסלול של מנהל 396 (מעבר ב-API **רק בתוך אותו טלפון/מייל**; בתיעוד: «החלפת טלפון/מייל ב-API ⇒ ללא שינוי
(לא בתחום)»).
תרחיש (fake_gi): מסמך 1001 של «דנה כהן» 050-1234567, בלי `client.id` ובלי מייל ⇒ תזכורת ראשונה נשלחה. הסנכרון הבא: אותו
מסמך עם «מיכל לוי» 050-0000999 ⇒ נוצרת מיכל (בלי חשבוניות), 1001 נשארת על דנה ⇒ שלוש התזכורות («שלום דנה, חשבונית
1001…», «דנה, חשבונית 1001 (1,200 ₪)…», «תזכורת אוטומטית…») נשלחות ל-972501234567 — המספר שהמקור כבר לא משייך לחוב
(אולי עבר לאדם אחר). עם `client.id` או מייל קבוע ⇒ ✓ הלקוח מתעדכן והתזכורות עוברות ל-050-0000999 (בקרה).
✓ נבדק: 246 (מנהל 413) תוקן; 412 לא שובר את 239–241 (הבדיקות עוברות).
הצעה: אותו כלל כמו 219א גם ב-API — המסמך הוא מקור האמת לפרטי הקשר (מעבר + ביטול תזכורת שנבנתה לפרטים הישנים), או
לפחות השהיה + כרטיס «פרטי הקשר של 1001 השתנו במקור» כמו בהסדר. xfail(strict=True)."""
from datetime import timedelta

import pytest

from app.channels import sent_mark, sent_since
from tests.conftest import gi_doc


def _run(svc, clock, fake_gi, client_id, email):
    d = gi_doc(1, phone="050-1234567", name="דנה כהן")
    if client_id is None:
        d["client"].pop("id", None)
    if not email:
        d["client"]["emails"] = []
    fake_gi.docs[:] = [d]
    svc.sync()
    clock.now += timedelta(days=1)
    rids = svc.plan()
    svc.approve(rids[0])
    svc.dispatch()
    mark = sent_mark(svc.sender.sent)
    d["client"]["phone"], d["client"]["name"] = "050-0000999", "מיכל לוי"
    for _ in range(10):
        clock.now += timedelta(days=1)
        svc.sync()
        for rid in svc.plan():
            svc.approve(rid)
        svc.dispatch()
    return [m.get("to") for m in sent_since(svc.sender.sent, mark)]


def test_api_contact_change_with_stable_key_moves_reminders(svc, clock, fake_gi):
    """בקרה: מזהה לקוח קבוע ⇒ התזכורות אחרי ההחלפה למספר החדש."""
    tos = _run(svc, clock, fake_gi, "cl-77", email=False)
    assert tos and all(t != "972501234567" for t in tos), tos


@pytest.mark.xfail(strict=True, reason="247🟠: API בלי מזהה/מייל — טלפון הוחלף במקור, התזכורות ממשיכות לטלפון הישן")
def test_api_contact_change_without_key_stops_old_phone(svc, clock, fake_gi):
    tos = _run(svc, clock, fake_gi, None, email=False)
    assert "972501234567" not in tos, tos

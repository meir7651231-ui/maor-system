"""מבקר סבב 248 · 🟡 — מסמך שנעלם מסנכרון API מלא ואז חוזר כפתוח (קבלה שבוטלה במערכת החשבוניות): ההסדר נשאר «הושלם»,
הלקוחה נשארת מושהית בהשהיית ההסדר לתמיד, בלי כרטיס ובלי תזכורת — ₪1,200 פתוחים שאף אחד לא יודע עליהם.

רכיבים: `app/service.py` → `_ingest_rows` (`reopened`/`_notify_csv_reopened` רק כש-`source == "csv"` — 219ב; ב-API
פתיחה מחדש שקטה) · `plan_progress` (סגירה ⇒ `completed`; פתיחה מחדש לא מחזירה) · השהיית `plan_accept` שמשתחררת רק
בהחמצה (fuzz ב׳).
תרחיש (fake_gi): 1001 דנה 1,200 ₪ ⇒ תזכורת ⇒ «אפשר בשלושה תשלומים?» ⇒ הצעה אושרה ⇒ «מאשר» ⇒ הסדר approved.
סנכרון מלא בלי המסמך ⇒ closed; למחרת plan() ⇒ ההסדר completed. סנכרון: המסמך חזר פתוח (1,200 ₪) ⇒ open, ההסדר
completed, `paused_reason='plan_accept'`, אין כרטיס; 3 ימי plan() ⇒ אף תזכורת.
✓ 247 (מנהל 414) תוקן; קצוות: החלפת מייל בלבד ⇒ התזכורות לפי המקור; החזרה לטלפון הקודם ⇒ חוזרת לדנה בלי כפילות; הסדר
⇒ לא זזה + כרטיס «במערכת החשבוניות» (נוסח API). ℹ️ «שילמתי» אחרי מעבר API עדיין «(פרטי הקשר השתנו בקובץ)».
הצעה: אותו כרטיס «נפתחה מחדש» (219ב) גם ב-API; והסדר completed שחשבוניתו נפתחה מחדש ⇒ חזרה ל-approved או שחרור
השהיית ההסדר + כרטיס. xfail(strict=True)."""
from datetime import timedelta

import pytest

from tests.conftest import gi_doc


@pytest.mark.xfail(strict=True, reason="248🟡: API — מסמך שנפתח מחדש אחרי «הושלם»: הלקוחה מושהית לתמיד, בלי כרטיס")
def test_api_reopened_after_completed_plan_is_visible(svc, clock, fake_gi):
    d = gi_doc(1)
    fake_gi.docs[:] = [d]
    svc.sync()
    clock.now += timedelta(days=1)
    rids = svc.plan()
    svc.approve(rids[0])
    svc.dispatch()
    r = svc.inbound("sms", "050-1234567", "אפשר בשלושה תשלומים?")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    r = svc.inbound("sms", "050-1234567", "מאשר")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    fake_gi.docs[:] = []
    clock.now += timedelta(hours=3)
    svc.sync()
    clock.now += timedelta(days=1)
    svc.plan()
    assert svc.db.one("SELECT status FROM plans")["status"] == "completed"
    fake_gi.docs[:] = [d]
    clock.now += timedelta(hours=3)
    svc.sync()
    assert svc.db.one("SELECT status FROM invoices")["status"] == "open"
    reminded = []
    for _ in range(3):
        clock.now += timedelta(days=1)
        reminded += svc.plan()
    card = svc.db.one("SELECT 1 FROM messages WHERE needs_owner=1 AND intent NOT IN ('plan_request','plan_accept')")
    assert reminded or card, "1001 פתוחה, ההסדר «הושלם», הלקוחה מושהית ואין כרטיס"

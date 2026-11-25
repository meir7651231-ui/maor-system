"""מבקר סבב 245 · 🟡 — «מאשר» על הצעת פריסה דולרית אחרי שהמקור שינה את מטבע החשבונית (מנהל 410 החליף את ההסדר):
הכרטיס מציג את ההצעה הישנה במטבע החדש («400 ₪») ומבקש «אישור סופי» להסדר שכבר לא קיים, והלקוחה מקבלת הבטחה שתקבל
את פרטי התשלום הראשון.

רכיבים: `app/inbox.py` → `handle_customer` / PLAN_ACCEPT (ניסוח הכרטיס והתשובה לפי ההצעה האחרונה, שמעוצבת במטבע
**הנוכחי** של החשבונית) מול `app/service.py` → `_note_currency_change` (מנהל 410: הסדר approved ⇒ superseded, השהיה
`currency_changed` שלא דורסת השהיה קיימת, כרטיס 💱).
תרחיש: 9001 דנה $1,200 ⇒ «אפשר בשלושה תשלומים?» ⇒ בעל העסק מאשר הצעה 3×$400 ⇒ נשלחה. קובץ: 9001 ₪4,400 ⇒ ההסדר
superseded + כרטיס 💱. דנה: «מאשר» ⇒ plan_id=None, הכרטיס «✅ דנה כהן אישר/ה את הצעת הפריסה (3 תשלומים חודשיים של
400 ₪, החל מ-16.11). נדרש אישור סופי שלך» (ההצעה הייתה $400; אין הסדר לאשר), והטיוטה ללקוחה «ההסדר הועבר לאישור סופי,
ואחרי האישור נשלח את פרטי התשלום הראשון».
✓ 244 (מנהל 410) תוקן — התזכורת לא אומרת «$1,100»; הסדר approved ⇒ superseded + כרטיס.
הצעה: PLAN_ACCEPT כשההסדר האחרון superseded בגלל מטבע ⇒ כרטיס «ההצעה בוטלה כי המטבע השתנה — הציעו מחדש», והתשובה
ללקוחה לא מבטיחה אישור סופי (נוסח «נחזור אליכם»). xfail(strict=True)."""
from dataclasses import replace
from datetime import timedelta

import pytest

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,מטבע,סטטוס,תאריך,תאריך לתשלום\n"
DANA = "050-1234567"


def _row(amount, currency):
    return (H + f"9001,דנה כהן,{DANA},,{amount},{currency},פתוח,01/10/26,15/10/26\n").encode()


@pytest.mark.xfail(strict=True, reason="245🟡: «מאשר» אחרי החלפת מטבע — «400 ₪… נדרש אישור סופי» להסדר שהוחלף")
def test_accept_after_currency_superseded_offer(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv(_row(1200, "USD"))
    clock.now += timedelta(days=1)
    rids = svc.plan()
    svc.approve(rids[0], confirm_open=True)
    svc.dispatch()
    r = svc.inbound("sms", DANA, "אפשר בשלושה תשלומים?")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    clock.now += timedelta(hours=3)
    svc.import_csv(_row(4400, "ILS"))
    assert svc.db.one("SELECT status FROM plans")["status"] == "superseded"
    r = svc.inbound("sms", DANA, "מאשר")
    body = svc.db.one("SELECT body FROM drafts WHERE id=?", (r["draft_id"],))["body"] if r["draft_id"] else ""
    summary = r["owner_summary"] or ""
    assert "400 ₪" not in summary and "אישור סופי" not in body, (summary, body)

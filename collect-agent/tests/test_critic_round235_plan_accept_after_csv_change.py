"""מבקר סבב 235 · 🟡×2 — «מאשר» על הסדר שאושר ונשלח, אחרי שהקובץ סגר/העביר את החשבונית.

רכיבים: `app/inbox.py` → `handle_customer` / PLAN_ACCEPT (`_plan_ack` — טיוטת «ההסדר בתוקף. התשלום הראשון: …» +
כרטיס «✅ … ההסדר בתוקף — נותר רק לשלוח») · `approve_draft` (שולח בלי בדיקה נוספת) · `service._csv_contact_moved`
(חשבונית בהסדר פעיל לא זזה; כרטיס `csv_contact_plan`: «הלקוח הושהה — שום הודעה לא תצא לפרטים הישנים») ·
`service.plan_progress` (מסמן completed רק בריצה הבאה — import_csv לא מריץ אותו).
תרחיש בסיס: 9001 דנה 1,200 ₪ ⇒ תזכורת נשלחה ⇒ «אפשר בשלושה תשלומים?» ⇒ בעל העסק מאשר הצעה 3×400 ⇒ נשלחה.
(א) שעתיים אחר כך קובץ: 9001 «שולם» ⇒ החשבונית closed, ההסדר עדיין approved. דנה: «מאשר» ⇒ טיוטה «ההסדר בתוקף.
    התשלום הראשון: 400 ₪ עד 16.11» (בלי קישור — המערכת יודעת שהיא סגורה) + כרטיס «ההסדר בתוקף»; בעל העסק מאשר ⇒
    יוצא. דרישת 400 ₪ על חשבונית שהקובץ אומר ששולמה.
(ב) קובץ: 9001 עם מיכל לוי/050-0000999 ⇒ כרטיס csv_contact_plan «שום הודעה לא תצא לפרטים הישנים». דנה: «מאשר» ⇒
    טיוטה עם 400 ₪ + קישור תשלום ל-9001 ל-050-1234567; הכרטיס «נותר רק לשלוח» לא מזכיר את שינוי הפרטים; אישור ⇒
    נשלחת לפרטים הישנים.
הצעה: (א) PLAN_ACCEPT על הסדר שכל חשבונותיו סגורים ⇒ «ההסדר הסתיים — החשבונית סומנה כשולמה» (או הרצת plan_progress
בסוף import_csv); (ב) PLAN_ACCEPT/טיוטה ללקוח עם כרטיס csv_contact_plan פתוח ⇒ הכרטיס אומר זאת והאישור דורש
אישור-מפורש (כמו confirm_amount). תוקן במנהל 399 (`inbox._plan_accept_file_check`)."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
DANA = "050-1234567"


def _plan_sent(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + f"9001,דנה כהן,{DANA},d@x.example,1200,פתוח,01/10/26,15/10/26\n").encode())
    clock.now += timedelta(days=1)
    rids = svc.plan()
    svc.approve(rids[0], confirm_open=True)
    svc.dispatch()
    r = svc.inbound("sms", DANA, "אפשר בשלושה תשלומים?")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    assert svc.db.one("SELECT status FROM plans")["status"] == "approved"
    clock.now += timedelta(hours=2)


def _accept(svc):
    r = svc.inbound("sms", DANA, "מאשר")
    assert r["intent"] == "plan_accept"
    return r, svc.db.one("SELECT body FROM drafts WHERE id=?", (r["draft_id"],))["body"] if r["draft_id"] else ""


def test_accept_after_invoice_closed_in_file(svc, clock):
    _plan_sent(svc, clock)
    svc.import_csv((H + f"9001,דנה כהן,{DANA},d@x.example,1200,שולם,01/10/26,15/10/26\n").encode())
    r, body = _accept(svc)
    assert "400" not in body and "בתוקף" not in r["owner_summary"], (body, r["owner_summary"])


def test_accept_after_contact_changed_in_plan(svc, clock):
    _plan_sent(svc, clock)
    svc.import_csv((H + "9001,מיכל לוי,050-0000999,m@x.example,1200,פתוח,01/10/26,15/10/26\n").encode())
    assert svc.db.one("SELECT 1 FROM messages WHERE intent='csv_contact_plan' AND needs_owner=1")
    r, body = _accept(svc)
    assert "השתנו" in r["owner_summary"] or "פרטי הקשר" in r["owner_summary"], r["owner_summary"]

"""גבי מנוע 25.11 — סט #26 (QA) q26-17/18: «מאשר» על הצעת פריסה שעוד **proposed** (לא רק על הסדר שאושר — מנהל 399)
אחרי שהקובץ סימן את החשבונית «שולם» / שינה את פרטי הקשר ⇒ היה טיוטת «…נשלח את פרטי התשלום הראשון» וסיכום בלי
האמת. עכשיו: בלי טיוטת תשלום, כרטיס שאומר במפורש מה השתנה. בקרה: בלי שינוי בקובץ ⇒ «מאשר» כרגיל."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
DANA = "050-1234567"


def _row(name, phone, status="פתוח"):
    return (H + f"9001,{name},{phone},d@x.example,1200,{status},01/10/26,15/10/26\n").encode()


def _proposed(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv(_row("דנה כהן", DANA))
    r = svc.inbound("sms", DANA, "אפשר בשלושה תשלומים?")
    assert r["intent"] == "plan_request"
    assert svc.db.one("SELECT status FROM plans ORDER BY id DESC LIMIT 1")["status"] == "proposed"
    clock.now += timedelta(days=1)


def _accept(svc):
    r = svc.inbound("sms", DANA, "מאשר")
    d = svc.db.one("SELECT body FROM drafts WHERE id=?", (r["draft_id"],)) if r.get("draft_id") else None
    return r, (d["body"] if d else "") or ""


def test_accept_proposed_after_paid_in_file(svc, clock):
    _proposed(svc, clock)
    svc.import_csv(_row("דנה כהן", DANA, "שולם"))
    r, body = _accept(svc)
    assert "התשלום הראשון" not in body and "plan_accept_closed" in r["tags"]
    assert "סומנה כשולמה" in r["owner_summary"] and r["escalation"] != "none"


def test_accept_proposed_after_contact_changed(svc, clock):
    _proposed(svc, clock)
    svc.import_csv(_row("דנה כהן", "053-4444444"))
    r, body = _accept(svc)
    # מהטלפון הישן: או «מאשר» של דנה עם כרטיס «פרטי הקשר השתנו», או שולח לא מוכר (הטלפון עודכן בכרטיס) — בשני
    # המקרים בלי טיוטת «התשלום הראשון» ועם כרטיס לבעל העסק. (סט #26 q26-18 עצמו: נכשל לפני ועובר אחרי.)
    assert "התשלום הראשון" not in body and r["escalate"]
    assert "plan_accept_contact_changed" in r.get("tags", ()) or r["intent"] == "unknown_sender"


def test_control_accept_proposed_unchanged(svc, clock):
    _proposed(svc, clock)
    r, _body = _accept(svc)
    assert "plan_accept_closed" not in r["tags"] and "plan_accept_contact_changed" not in r["tags"]

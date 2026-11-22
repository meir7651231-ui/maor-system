"""מנהל 376 — תיקון מבקר 219: עסק CSV לאורך זמן.

א🟠 טלפון/מייל חדשים לאותה חשבונית בקובץ ⇒ החשבונית עוברת ללקוח הנוכחי (הקובץ = מקור האמת לפרטי הקשר);
   תזכורת פעילה שנבנתה לפרטים הישנים מבוטלת (contact_changed); חשבונית בהסדר פעיל לא זזה (הלקוח הישן מושהה
   + כרטיס `csv_contact_plan`); מצבי עצירה (מחלוקת /
   השהיה / הסרה / עיכוב משפטי) עוברים — שינוי טלפון לא משחרר עצירה. ב-API (מזהה לקוח יציב) — ללא שינוי.
ב🟡 חשבונית CSV שנסגרה לפי קובץ וחוזרת כפתוחה ⇒ כרטיס «csv_reopened» לבעל העסק (אחד ליום), לא פתיחה שקטה.
   «שולם מחוץ למערכת» שסימן בעל העסק — לא נפתח בכלל (ללא שינוי) ⇒ אין כרטיס."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def _row(num="7001", phone="0541112222", email="r@x.example", status="פתוח", name="רוני"):
    return f"{num},{name},{phone},{email},500,{status},01/10/26,15/10/26\n"


def _csv(svc):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")


def _inv(svc, num="7001"):
    return svc.db.one("SELECT i.*, c.phone, c.email FROM invoices i JOIN customers c ON c.id=i.customer_id "
                      "WHERE i.number=?", (num,))


def _new_contact(svc, clock):
    clock.now += timedelta(hours=1)
    svc.import_csv((H + _row(phone="0529998888", email="new@x.example")).encode())


def test_invoice_moves_to_current_contact(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    _new_contact(svc, clock)
    inv = _inv(svc)
    assert (inv["phone"], inv["email"]) == ("0529998888", "new@x.example")
    assert svc.db.one("SELECT COUNT(*) n FROM invoices")["n"] == 1


def test_pending_reminder_for_old_contact_cancelled_and_rebuilt(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    svc.plan()
    first = svc.db.one("SELECT id, payload FROM reminders ORDER BY id DESC")
    assert "0541112222" in first["payload"] or "r@x.example" in first["payload"]
    _new_contact(svc, clock)
    r = svc.db.one("SELECT status, block_reason FROM reminders WHERE id=?", (first["id"],))
    assert (r["status"], r["block_reason"]) == ("cancelled", "contact_changed")
    svc.plan()
    active = svc.db.q("SELECT payload FROM reminders WHERE status NOT IN ('cancelled','blocked')")
    assert active and all("0541112222" not in a["payload"] and "r@x.example" not in a["payload"] for a in active)


def test_dispute_follows_invoice_to_new_contact(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    svc.db.x("UPDATE customers SET disputed=1, paused_reason='dispute'")
    _new_contact(svc, clock)
    c = svc.db.one("SELECT disputed, paused_reason FROM customers WHERE phone='0529998888'")
    assert (c["disputed"], c["paused_reason"]) == (1, "dispute")


def test_opt_out_and_legal_hold_follow(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    svc.db.x("UPDATE customers SET opted_out=1, legal_hold='עו\"ד'")
    _new_contact(svc, clock)
    c = svc.db.one("SELECT opted_out, legal_hold FROM customers WHERE phone='0529998888'")
    assert c["opted_out"] == 1 and c["legal_hold"]


def test_invoice_in_live_plan_not_moved_old_customer_paused(svc, clock):
    """הסדר מאושר קשור ללקוח ולא משוכתב במקום (מגן-מקור) ⇒ החשבונית לא זזה, הלקוח הישן מושהה + כרטיס אחד."""
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    inv = _inv(svc)
    svc.db.x("INSERT INTO plans(customer_id,invoice_id,installments,status,created_at) VALUES(?,?,'[]','approved',?)",
             (inv["customer_id"], inv["id"], "2026-11-08"))
    _new_contact(svc, clock)
    _new_contact(svc, clock)
    assert _inv(svc)["customer_id"] == inv["customer_id"]
    assert svc.db.one("SELECT paused_reason FROM customers WHERE id=?",
                      (inv["customer_id"],))["paused_reason"] == "csv_contact_changed"
    assert svc.db.one("SELECT customer_id FROM plans")["customer_id"] == inv["customer_id"]
    assert len(svc.db.q("SELECT 1 FROM messages WHERE intent='csv_contact_plan' AND needs_owner=1")) == 1


def test_closed_plan_does_not_block_move(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    inv = _inv(svc)
    svc.db.x("INSERT INTO plans(customer_id,invoice_id,installments,status,created_at) VALUES(?,?,'[]','completed',?)",
             (inv["customer_id"], inv["id"], "2026-11-08"))
    _new_contact(svc, clock)
    assert _inv(svc)["phone"] == "0529998888"


def test_move_is_audited(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    _new_contact(svc, clock)
    assert svc.db.one("SELECT 1 FROM audit WHERE action='csv_contact_changed'")


def test_same_contact_no_cancel(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    svc.plan()
    clock.now += timedelta(hours=1)
    svc.import_csv((H + _row()).encode())
    assert not svc.db.q("SELECT 1 FROM reminders WHERE block_reason='contact_changed'")
    assert not svc.db.q("SELECT 1 FROM audit WHERE action='csv_contact_changed'")


def test_other_invoice_of_old_contact_stays(svc, clock):
    """ייבוא חלקי: רק החשבונית שבקובץ עוברת; חשבונית אחרת של הלקוח הישן (לא בקובץ) לא זזה."""
    _csv(svc)
    svc.import_csv((H + _row() + _row(num="7002")).encode())
    _new_contact(svc, clock)
    assert _inv(svc, "7001")["phone"] == "0529998888"
    assert _inv(svc, "7002")["phone"] == "0541112222"


def test_reopen_after_file_close_card_once_per_day(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    clock.now += timedelta(days=1)
    svc.import_csv((H + _row(status="שולם")).encode())
    clock.now += timedelta(days=1)
    svc.import_csv((H + _row()).encode())
    svc.import_csv((H + _row()).encode())
    cards = svc.db.q("SELECT body FROM messages WHERE intent='csv_reopened' AND needs_owner=1")
    assert len(cards) == 1 and "7001" in cards[0]["body"]
    assert svc.db.one("SELECT 1 FROM audit WHERE action='csv_invoice_reopened'")


def test_owner_marked_paid_not_reopened_no_card(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    svc.mark_paid_outside(_inv(svc)["id"])
    clock.now += timedelta(days=1)
    svc.import_csv((H + _row()).encode())
    assert _inv(svc)["status"] == "closed"
    assert not svc.db.q("SELECT 1 FROM messages WHERE intent='csv_reopened'")


def test_open_twice_no_card(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    clock.now += timedelta(days=1)
    svc.import_csv((H + _row()).encode())
    assert not svc.db.q("SELECT 1 FROM messages WHERE intent='csv_reopened'")


def test_api_sync_unchanged(svc):
    """API: מזהה לקוח יציב — אין מסלול העברה/כרטיס."""
    svc.sync()
    assert not svc.db.q("SELECT 1 FROM audit WHERE action IN ('csv_contact_changed','csv_invoice_reopened')")

"""מנהל 382 — חיבורים: שם בלבד השתנה בקובץ CSV (אותו טלפון/מייל, אותה חשבונית) ⇒ פיצול לקוח 🟠.

לפני: ייבוא ראשון «דויד כהן», ייבוא שני אותה חשבונית עם «דוד כהן» (תיקון כתיב / «בע״מ» / שם מלא). אין מזהה
לקוח ב-CSV ⇒ המפתח הוא הטלפון ⇒ `_customer_key_db` ראה «שם אחר באותו טלפון» ⇒ לקוח **חדש** (shared_contact
של critic 26, שנועד לשני אנשים שונים באותו טלפון) ⇒ `_csv_contact_moved` העביר את החשבונית אליו, ביטל את
התזכורת הממתינה (contact_changed), השאיר לקוח-רפאים בלי חשבוניות, ושלח לבעל העסק כרטיס שגוי «שני לקוחות
בשמות שונים». אותו מסמך = אותו חייב: זה שינוי שם, לא אדם נוסף.

אחרי: כשהחשבונית כבר קיימת אצל לקוח באותו טלפון/מייל (המפתח הבסיסי או `|name:` שלו) ואין לקוח קיים בשם החדש ⇒
אותו לקוח, השם מתעדכן, התזכורת לא מבוטלת, אין כרטיס. שני אנשים שונים באותו טלפון (חשבונית **חדשה** בשם אחר)
⇒ ללא שינוי: נפרדים + כרטיס. חשבונית שעוברת לשם של לקוח **קיים** באותו טלפון ⇒ עוברת אליו (ללא שינוי)."""
from dataclasses import replace
from datetime import timedelta
from pathlib import Path

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def _row(num="7001", name="דויד כהן", phone="0541112222", email="d@x.example"):
    return f"{num},{name},{phone},{email},500,פתוח,01/10/26,15/10/26\n"


def _csv(svc):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")


def _custs(svc):
    return svc.db.q("SELECT id, name, external_id FROM customers ORDER BY id")


def _cards(svc):
    return svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent='shared_contact'")["n"]


def _again(svc, clock, rows):
    clock.now += timedelta(hours=1)
    svc.import_csv((H + rows).encode())


def test_rename_same_invoice_keeps_customer(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    before = _custs(svc)
    _again(svc, clock, _row(name="דוד כהן"))
    after = _custs(svc)
    assert len(after) == len(before) == 1
    assert after[0]["id"] == before[0]["id"] and after[0]["name"] == "דוד כהן"
    assert _cards(svc) == 0
    assert svc.db.one("SELECT customer_id FROM invoices WHERE number='7001'")["customer_id"] == before[0]["id"]


def test_rename_does_not_cancel_pending_reminder(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    svc.plan()
    r = svc.db.one("SELECT id, status FROM reminders ORDER BY id DESC")
    assert r is not None
    _again(svc, clock, _row(name="דוד כהן בע\"מ"))
    r2 = svc.db.one("SELECT status, block_reason FROM reminders WHERE id=?", (r["id"],))
    assert r2["block_reason"] != "contact_changed" and r2["status"] == r["status"]
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='csv_contact_changed'")


def test_rename_email_only_key(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row(phone="")).encode())
    _again(svc, clock, _row(name="דוד", phone=""))
    assert len(_custs(svc)) == 1 and _cards(svc) == 0


def test_different_person_new_invoice_still_split(svc, clock):
    """critic 26 נשמר: חשבונית **חדשה** בשם אחר באותו טלפון ⇒ לקוח נפרד + כרטיס."""
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    _again(svc, clock, _row() + _row(num="7002", name="שרה לוי"))
    custs = _custs(svc)
    assert len(custs) == 2 and _cards(svc) == 1
    own = {r["number"]: r["customer_id"] for r in svc.db.q("SELECT number, customer_id FROM invoices")}
    assert own["7001"] != own["7002"]


def test_rename_of_split_customer_keeps_it(svc, clock):
    """לקוח שכבר פוצל (|name:) ומשנה שם ⇒ נשאר אותו לקוח, לא לקוח שלישי."""
    _csv(svc)
    svc.import_csv((H + _row() + _row(num="7002", name="שרה לוי")).encode())
    sara = svc.db.one("SELECT customer_id FROM invoices WHERE number='7002'")["customer_id"]
    n = len(_custs(svc))
    _again(svc, clock, _row() + _row(num="7002", name="שרה לוי-כהן"))
    assert len(_custs(svc)) == n
    assert svc.db.one("SELECT customer_id FROM invoices WHERE number='7002'")["customer_id"] == sara
    assert svc.db.one("SELECT name FROM customers WHERE id=?", (sara,))["name"] == "שרה לוי-כהן"
    assert _cards(svc) == 1   # רק הכרטיס המקורי של הפיצול


def test_invoice_reassigned_to_existing_other_name_moves(svc, clock):
    """תיקון שיוך: חשבונית של שרה שבקובץ החדש רשומה על דויד (לקוח קיים באותו טלפון) ⇒ עוברת לדויד, לא
    משנה את שמה של שרה לדויד (שני «דויד» באותו טלפון)."""
    _csv(svc)
    svc.import_csv((H + _row() + _row(num="7002", name="שרה לוי")).encode())
    david = svc.db.one("SELECT customer_id FROM invoices WHERE number='7001'")["customer_id"]
    _again(svc, clock, _row() + _row(num="7002", name="דויד כהן"))
    assert svc.db.one("SELECT customer_id FROM invoices WHERE number='7002'")["customer_id"] == david
    names = [c["name"] for c in _custs(svc)]
    assert names.count("דויד כהן") == 1


def test_phone_change_still_moves(svc, clock):
    """מנהל 376 נשמר: טלפון חדש (לא רק שם) ⇒ החשבונית עוברת ללקוח החדש."""
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    _again(svc, clock, _row(name="דוד כהן", phone="0529998888", email="n@x.example"))
    inv = svc.db.one("SELECT c.phone FROM invoices i JOIN customers c ON c.id=i.customer_id")
    assert inv["phone"] == "0529998888"


def test_source_guard_rename_before_split():
    src = (Path(__file__).resolve().parents[1] / "app" / "service.py").read_text(encoding="utf-8")
    body = src.split("def _customer_key_db", 1)[1].split("\n    def ", 1)[0]
    assert body.index("_renamed_owner") < body.index("shared_contact_split")

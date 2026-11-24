"""מנהל 383 — ביקורת 223 על 382: `_renamed_owner` מאחד בטעות שני אנשים 🔴 (חשיפת חוב).

לפני: לקוח «דויד כהן» (טלפון משותף למשפחה) עם שתי חשבוניות 7001+7002. בייבוא חוזר 7002 שויכה **בצדק** לאדם
אחר באותו טלפון בשם **חדש** («שרה לוי»; תיקון שיוך במערכת החשבוניות). 382 ראה «החשבונית כבר אצל לקוח באותו
טלפון» ⇒ «שינוי שם» ⇒ כל הלקוח הפך ל«שרה לוי» — כולל 7001 של דויד. התזכורת המאוחדת פונה לשרה בשמה ומפרטת
גם את החוב של דויד (חשיפה), ובקובץ שבו שתי השורות מופיעות השם מהבהב בין השניים.

אחרי: שינוי שם נחשב שינוי שם רק כשאין ללקוח חשבוניות **אחרות** שנשארות תחת השם הישן — כלומר כל חשבוניותיו
(הפתוחות) הגיעו באותו קובץ בשם החדש, או שזו חשבוניתו היחידה. אחרת ⇒ שיוך מחדש ⇒ לקוח נפרד + כרטיס (critic 26,
הכיוון הבטוח: פיצול שגוי עולה כרטיס, איחוד שגוי חושף חוב). שינוי שם אמיתי של לקוח עם כמה חשבוניות בקובץ
מלא ⇒ עדיין אותו לקוח (382 נשמר)."""
from dataclasses import replace
from datetime import timedelta
from pathlib import Path

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def _row(num="7001", name="דויד כהן", phone="0541112222", email="d@x.example"):
    return f"{num},{name},{phone},{email},500,פתוח,01/10/26,15/10/26\n"


def _csv(svc):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")


def _again(svc, clock, rows):
    clock.now += timedelta(hours=1)
    svc.import_csv((H + rows).encode())


def _owner(svc):
    return {r["number"]: (r["customer_id"], r["name"]) for r in svc.db.q(
        "SELECT i.number, i.customer_id, c.name FROM invoices i JOIN customers c ON c.id=i.customer_id")}


def _cards(svc):
    return svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent='shared_contact'")["n"]


def test_reassign_one_of_two_to_new_name_splits(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row() + _row(num="7002")).encode())
    _again(svc, clock, _row(num="7002", name="שרה לוי"))
    o = _owner(svc)
    assert o["7001"][1] == "דויד כהן", "החוב של דויד לא עובר לשמה של שרה"
    assert o["7002"][1] == "שרה לוי" and o["7001"][0] != o["7002"][0]
    assert _cards(svc) == 1


def test_reassign_in_full_file_no_flapping(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row() + _row(num="7002")).encode())
    _again(svc, clock, _row() + _row(num="7002", name="שרה לוי"))
    o = _owner(svc)
    assert o["7001"][1] == "דויד כהן" and o["7002"][1] == "שרה לוי"
    assert o["7001"][0] != o["7002"][0]
    # ייבוא שלישי זהה ⇒ יציב, בלי כרטיס נוסף
    _again(svc, clock, _row() + _row(num="7002", name="שרה לוי"))
    assert _owner(svc) == o and _cards(svc) == 1


def test_rename_with_all_invoices_in_file_keeps_customer(svc, clock):
    """382 נשמר גם בריבוי חשבוניות: כל החשבוניות הגיעו בשם החדש ⇒ שינוי שם."""
    _csv(svc)
    svc.import_csv((H + _row() + _row(num="7002")).encode())
    before = _owner(svc)
    _again(svc, clock, _row(name="דוד כהן") + _row(num="7002", name="דוד כהן"))
    o = _owner(svc)
    assert o["7001"][0] == o["7002"][0] == before["7001"][0]
    assert o["7001"][1] == "דוד כהן" and _cards(svc) == 0
    assert len(svc.db.q("SELECT id FROM customers")) == 1


def test_rename_single_invoice_unchanged(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    _again(svc, clock, _row(name="דוד כהן בע\"מ"))
    assert len(svc.db.q("SELECT id FROM customers")) == 1 and _cards(svc) == 0


def test_closed_sibling_does_not_block_rename(svc, clock):
    """חשבונית ישנה שנסגרה (שולמה) לא מעידה על אדם אחר ⇒ שינוי שם."""
    _csv(svc)
    svc.import_csv((H + _row() + _row(num="7002")).encode())
    svc.db.x("UPDATE invoices SET status='closed' WHERE number='7001'")
    _again(svc, clock, _row(num="7002", name="דוד כהן"))
    assert len(svc.db.q("SELECT id FROM customers")) == 1 and _cards(svc) == 0


def test_source_guard():
    src = (Path(__file__).resolve().parents[1] / "app" / "service.py").read_text(encoding="utf-8")
    body = src[src.index("def _renamed_owner"):src.index("def ingest(")]
    assert "status='open'" in body and "_batch_names" in body

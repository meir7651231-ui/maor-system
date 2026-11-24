"""מנהל 388 — נוסח כרטיס בייבוא חלקי: «אולי שינוי שם?» (חיבורים «הבא» מ-383–387).

לפני: לקוח «דויד כהן» עם 7001+7002. קובץ חלקי שבו רק 7002 מגיעה בשם חדש («דוד כהן-לוי»). 383 קבע (נכון — הכיוון
הבטוח) פיצול + כרטיס, אבל הכרטיס אמר «שני לקוחות בשמות שונים… נשמרו כלקוחות נפרדים» — כאילו זו חשבונית חדשה של
אדם אחר. בעל העסק לא ידע שאולי זה פשוט תיקון שם שלא הגיע לכל החשבוניות, ולא ידע מה לעשות.

אחרי: כשהחשבונית **כבר הייתה רשומה** אצל לקוח באותו טלפון/מייל — הכרטיס שואל «אולי שינוי שם?» ואומר מה לעשות
בכל מקרה (אותו אדם ⇒ לעדכן שם בכל החשבוניות ולהעלות קובץ עם כולן — ואז הן באמת מתאחדות; אדם אחר ⇒ כלום).
חשבונית **חדשה** בשם אחר באותו טלפון ⇒ הנוסח הישן (critic 26) לא השתנה. בלי שמות/טלפון בכרטיס."""
from dataclasses import replace
from datetime import date, timedelta
from pathlib import Path

from app.greeninvoice import Invoice
from app.service import shared_split_rename_text

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def _row(num="7001", name="דויד כהן", phone="0541112222", email="d@x.example"):
    return f"{num},{name},{phone},{email},500,פתוח,01/10/26,15/10/26\n"


def _csv(svc):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")


def _again(svc, clock, rows):
    clock.now += timedelta(hours=1)
    svc.import_csv((H + rows).encode())


def _cards(svc):
    return [r["body"] for r in svc.db.q("SELECT body FROM messages WHERE intent='shared_contact'")]


def _owner(svc):
    return {r["number"]: (r["customer_id"], r["name"]) for r in svc.db.q(
        "SELECT i.number, i.customer_id, c.name FROM invoices i JOIN customers c ON c.id=i.customer_id")}


def test_partial_rename_card_asks_maybe_rename(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row() + _row(num="7002")).encode())
    _again(svc, clock, _row(num="7002", name="דוד כהן-לוי"))
    cards = _cards(svc)
    assert len(cards) == 1
    body = cards[0]
    assert "אולי שינוי שם?" in body and "7002" in body
    assert "העלו קובץ עם כולן" in body and "עברה לאדם אחר — אין צורך" in body
    assert "שני לקוחות בשמות שונים" not in body
    # בלי PII: לא שם ישן, לא שם חדש, לא טלפון/מייל
    for pii in ("דויד", "כהן-לוי", "0541112222", "d@x.example", "541112222"):
        assert pii not in body
    audit = svc.db.one("SELECT detail FROM audit WHERE action='shared_contact_split'")["detail"]
    assert "maybe_rename" in audit
    # הפיצול עצמו (383) לא השתנה
    o = _owner(svc)
    assert o["7001"][1] == "דויד כהן" and o["7002"][1] == "דוד כהן-לוי" and o["7001"][0] != o["7002"][0]


def test_card_promise_holds_full_file_unites(svc, clock):
    """הכרטיס מבטיח «העלו קובץ עם כולן; גבי תאחד» — הבטחה שחייבת להתקיים."""
    _csv(svc)
    svc.import_csv((H + _row() + _row(num="7002")).encode())
    _again(svc, clock, _row(num="7002", name="דוד כהן-לוי"))
    _again(svc, clock, _row(name="דוד כהן-לוי") + _row(num="7002", name="דוד כהן-לוי"))
    o = _owner(svc)
    assert o["7001"] == o["7002"] and o["7001"][1] == "דוד כהן-לוי"
    assert len(_cards(svc)) == 1, "האיחוד לא מוסיף כרטיס"


def test_new_invoice_other_person_keeps_old_wording(svc, clock):
    """חשבונית חדשה בשם אחר באותו טלפון = כנראה אדם אחר ⇒ נוסח 26 ללא שינוי."""
    _csv(svc)
    svc.import_csv((H + _row()).encode())
    _again(svc, clock, _row() + _row(num="7003", name="שרה לוי"))
    cards = _cards(svc)
    assert len(cards) == 1
    assert "שני לקוחות בשמות שונים" in cards[0] and "אולי שינוי שם" not in cards[0]
    audit = svc.db.one("SELECT detail FROM audit WHERE action='shared_contact_split'")["detail"]
    assert "maybe_rename" not in (audit or "")


def test_no_second_card_on_repeat(svc, clock):
    _csv(svc)
    svc.import_csv((H + _row() + _row(num="7002")).encode())
    _again(svc, clock, _row(num="7002", name="דוד כהן-לוי"))
    _again(svc, clock, _row(num="7002", name="דוד כהן-לוי"))
    assert len(_cards(svc)) == 1


def _inv(num, name):
    return Invoice(external_id=f"gi-{num}", number=num, doc_type=305, amount_agorot=50000, currency="ILS",
                   issued=date(2026, 10, 1), due=date(2026, 10, 15), client_external_id="",
                   client_name=name, client_phone="0541112222", client_email="")


def test_api_variant_wording(svc, clock):
    """אותו מצב מסנכרון API בלי מזהה לקוח ⇒ «מהמערכת» + «בסנכרון הבא», בלי «קובץ»."""
    svc.ingest([_inv("8001", "דויד כהן"), _inv("8002", "דויד כהן")], full=False)
    clock.now += timedelta(hours=1)
    svc.ingest([_inv("8002", "דוד כהן-לוי")], full=False)
    cards = _cards(svc)
    assert len(cards) == 1 and "אולי שינוי שם?" in cards[0]
    assert "מהמערכת" in cards[0] and "בסנכרון הבא" in cards[0] and "קובץ" not in cards[0]


def test_text_helper_both_variants():
    a, b = shared_split_rename_text("1"), shared_split_rename_text("1", csv=False)
    assert a != b and "  " not in a and "  " not in b and " ;" not in b and ";;" not in b
    assert a.startswith("חשבונית 1 ") and b.startswith("חשבונית 1 ")


def test_source_guard():
    src = Path(__file__).resolve().parents[1].joinpath("app", "service.py").read_text(encoding="utf-8")
    assert "_owned_by_same_contact(inv, key)" in src and "shared_split_rename_text(" in src

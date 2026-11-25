"""מנהל 392 — ביקורת 230: לקוח-רפאים אחרי איחוד (388) גרם לכל תשובה של האדם להיחשב «דו-משמעית».

לפני: «דויד כהן» עם 7001+7002 ⇒ קובץ חלקי (7002 בשם «דוד כהן-לוי» ⇒ פיצול + כרטיס «אולי שינוי שם?») ⇒ בעל העסק
עשה בדיוק מה שהכרטיס ביקש (קובץ מלא בשם החדש) ⇒ שתי החשבוניות עברו ל«דוד כהן-לוי», ו«דויד כהן» נשאר **בלי
חשבוניות** אבל עם אותו טלפון/מייל. מאז, כל «איך משלמים?» מהטלפון שלו = `shared_contact_ambiguous` ⇒ הסלמה,
בלי טיוטה — לנצח. ואם ההודעה האחרונה יצאה לפני האיחוד, התשובה הייתה משויכת לרפאים בלי חוב.

אחרי: בחיפוש השולח, לקוח בלי אף שורת חשבונית לא מתחרה בלקוח עם חשבוניות (לקוחות נוצרים רק מחשבוניות).
אם כולם בלי חשבוניות — כמו קודם. שני אנשים אמיתיים באותו טלפון (לשניהם חשבוניות) — עדיין דו-משמעי."""
from dataclasses import replace
from datetime import timedelta
from pathlib import Path

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
PHONE, EMAIL = "0541112222", "d@x.example"


def _row(num="7001", name="דויד כהן", phone=PHONE, email=EMAIL, status="פתוח"):
    return f"{num},{name},{phone},{email},500,{status},01/10/26,15/10/26\n"


def _csv(svc):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")


def _again(svc, clock, rows):
    clock.now += timedelta(hours=1)
    svc.import_csv((H + rows).encode())


def _merged(svc, clock):
    """מסלול 388 עד הסוף: חלקי ⇒ כרטיס ⇒ קובץ מלא בשם החדש ⇒ רפאים."""
    _csv(svc)
    svc.import_csv((H + _row() + _row(num="7002")).encode())
    _again(svc, clock, _row(num="7002", name="דוד כהן-לוי"))
    _again(svc, clock, _row(name="דוד כהן-לוי") + _row(num="7002", name="דוד כהן-לוי"))
    owner = svc.db.one("SELECT customer_id FROM invoices WHERE number='7001'")["customer_id"]
    ghost = [c["id"] for c in svc.db.q("SELECT id FROM customers") if c["id"] != owner]
    assert len(ghost) == 1 and not svc.db.one("SELECT 1 FROM invoices WHERE customer_id=?", (ghost[0],))
    return owner, ghost[0]


def test_reply_after_merge_is_not_ambiguous_sms(svc, clock):
    owner, _ = _merged(svc, clock)
    cust, amb = svc._resolve_sender("sms", PHONE)
    assert not amb and cust["id"] == owner
    out = svc.inbound("sms", PHONE, "איך משלמים?")
    assert out["intent"] != "shared_contact_ambiguous" and out.get("draft_id")


def test_reply_after_merge_is_not_ambiguous_email(svc, clock):
    owner, _ = _merged(svc, clock)
    cust, amb = svc._resolve_sender("email", EMAIL)
    assert not amb and cust["id"] == owner


def test_last_outbound_to_ghost_does_not_win(svc, clock):
    """ההודעה האחרונה יצאה לרפאים (לפני האיחוד) ⇒ התשובה עדיין שייכת למי שמחזיק את החוב."""
    owner, ghost = _merged(svc, clock)
    svc.db.x("INSERT INTO messages(customer_id,direction,channel,body,created_at) VALUES(?,'out','sms','x',?)",
             (ghost, "2026-10-01T10:00:00+02:00"))
    cust, amb = svc._resolve_sender("sms", PHONE)
    assert not amb and cust["id"] == owner


def test_two_real_people_still_ambiguous(svc, clock):
    """שני אנשים אמיתיים באותו טלפון (לשניהם חשבוניות) — הסינון לא נוגע: עדיין לא מנחשים (critic 27)."""
    _csv(svc)
    svc.import_csv((H + _row() + _row(num="7003", name="שרה לוי")).encode())
    assert svc.db.one("SELECT COUNT(DISTINCT customer_id) n FROM invoices")["n"] == 2
    cust, amb = svc._resolve_sender("sms", PHONE)
    assert cust is None and amb


def test_paid_only_customer_is_not_a_ghost(svc, clock):
    """לקוח שכל החשבוניות שלו שולמו הוא לא רפאים (יש לו שורות) ⇒ עדיין מתחרה."""
    _csv(svc)
    svc.import_csv((H + _row() + _row(num="7003", name="שרה לוי")).encode())
    _again(svc, clock, _row(status="שולם"))
    cust, amb = svc._resolve_sender("sms", PHONE)
    assert cust is None and amb


def test_all_ghosts_keep_old_behaviour(svc):
    rows = [{"id": 1}, {"id": 2}]
    assert svc._drop_ghosts(rows) == rows


def test_source_guard_find_customers_uses_drop_ghosts():
    src = (Path(__file__).resolve().parents[1] / "app" / "service.py").read_text(encoding="utf-8")
    body = src.split("def _find_customers", 1)[1].split("\n    def ", 1)[0]
    assert "_drop_ghosts(" in body

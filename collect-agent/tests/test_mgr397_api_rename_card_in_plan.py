"""מנהל 397 — כרטיס «אולי שינוי שם?» כשחשבונית ה-API בהסדר פעיל (🟡 פתוח מ-396).

לפני: ב-API חשבונית בהסדר פעיל לא זזה לשם החדש (396 — הסדר שבעל העסק אישר קשור ללקוח), אבל הכרטיס אמר «שמרנו
אותה כלקוח נפרד… בסנכרון הבא גבי תאחד» — לא קרה ולא יקרה. אחרי: נוסח נפרד שאומר את האמת (נשארה בשם הקודם, ההסדר
ממשיך) ומה לעשות. CSV וחשבונית בלי הסדר — ללא שינוי (נוסח 388)."""
from datetime import date, timedelta
from pathlib import Path

from app.greeninvoice import Invoice
from app.service import shared_split_rename_plan_text

OLD, NEW = "דויד כהן", "דוד כהן-לוי"


def _inv(num, name):
    return Invoice(external_id=f"gi-{num}", number=num, doc_type=305, amount_agorot=50000, currency="ILS",
                   issued=date(2026, 10, 1), due=date(2026, 10, 15), client_external_id="",
                   client_name=name, client_phone="0541112222", client_email="")


def _plan_on(svc, number, status="approved"):
    row = svc.db.one("SELECT id, customer_id FROM invoices WHERE number=?", (number,))
    svc.db.x("INSERT INTO plans(customer_id,invoice_id,installments,status,created_at) VALUES(?,?,'[]',?,?)",
             (row["customer_id"], row["id"], status, "2026-10-20T10:00:00"))


def _cards(svc):
    return [r["body"] for r in svc.db.q("SELECT body FROM messages WHERE intent='shared_contact' AND needs_owner=1")]


def _run(svc, clock, status="approved"):
    svc.ingest([_inv("8001", OLD), _inv("8002", OLD)], full=False)
    _plan_on(svc, "8002", status)
    clock.now += timedelta(hours=1)
    svc.ingest([_inv("8002", NEW)], full=False)


def test_plan_card_tells_truth(svc, clock):
    _run(svc, clock)
    owner = svc.db.one("SELECT c.name FROM invoices i JOIN customers c ON c.id=i.customer_id WHERE number='8002'")
    assert owner["name"] == OLD                          # 396: לא זזה
    cards = _cards(svc)
    assert len(cards) == 1
    b = cards[0]
    assert "8002" in b and "בהסדר תשלומים פעיל" in b and "נשארה בשם הקודם" in b
    assert "שמרנו אותה כלקוח נפרד" not in b and "בסנכרון הבא" not in b


def test_plan_card_no_pii(svc, clock):
    _run(svc, clock)
    b = _cards(svc)[0]
    for pii in ("דויד", "כהן", "0541112222", "541112222"):
        assert pii not in b


def test_completed_plan_uses_regular_text(svc, clock):
    """הסדר שהסתיים לא «פעיל» ⇒ החשבונית זזה ⇒ נוסח 388 הרגיל."""
    _run(svc, clock, status="completed")
    b = _cards(svc)[0]
    assert "בסנכרון הבא" in b and "בהסדר תשלומים פעיל" not in b


def test_no_plan_unchanged(svc, clock):
    svc.ingest([_inv("8001", OLD), _inv("8002", OLD)], full=False)
    clock.now += timedelta(hours=1)
    svc.ingest([_inv("8002", NEW)], full=False)
    assert "בסנכרון הבא" in _cards(svc)[0]


def test_text_helper():
    t = shared_split_rename_plan_text("123")
    assert t.startswith("חשבונית 123 ") and "אולי שינוי שם?" in t


def test_source_guard():
    src = Path(__file__).resolve().parents[1].joinpath("app", "service.py").read_text(encoding="utf-8")
    assert "shared_split_rename_plan_text(inv.number) if maybe_rename and not is_csv" in src

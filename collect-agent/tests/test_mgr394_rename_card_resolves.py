"""מנהל 394 — כרטיס «אולי שינוי שם?» יורד אחרי האיחוד (ממצא QA 393🟡, חיבורים «הבא» עדיפות).

לפני: 388 הוסיף כרטיס שמבקש «העלו קובץ עם כולן; גבי תאחד». בעל העסק עשה בדיוק את זה, האיחוד הצליח (שתי החשבוניות
תחת השם החדש) — והכרטיס **נשאר** ב«דורש טיפול» עם הכותרת «נשמרו כלקוחות נפרדים», שכבר לא נכונה.

אחרי: בסוף כל ייבוא/סנכרון — החשבונית שבכרטיס פתוחה, ולשם הקודם לא נשארה חשבונית פתוחה (איחוד), או שהחשבונית חזרה
ללקוח שהחזיק בה ⇒ הכרטיס יורד (audit `shared_contact_resolved` בלי PII). עוד חשבונית פתוחה בשם הקודם ⇒ נשאר.
כרטיס נוסח 26 (חשבונית חדשה של אדם אחר) לא נוגעים בו."""
import json
from dataclasses import replace
from datetime import date, timedelta
from pathlib import Path

from app.greeninvoice import Invoice

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
OLD, NEW = "דויד כהן", "דוד כהן-לוי"


def _row(num="7001", name=OLD, status="פתוח"):
    return f"{num},{name},0541112222,d@x.example,500,{status},01/10/26,15/10/26\n"


def _start(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + _row() + _row(num="7002")).encode())
    _again(svc, clock, _row(num="7002", name=NEW))


def _again(svc, clock, rows):
    clock.now += timedelta(hours=1)
    svc.import_csv((H + rows).encode())


def _open_cards(svc):
    return svc.db.q("SELECT id, body, payload FROM messages WHERE intent='shared_contact' AND needs_owner=1")


def _resolved(svc):
    rows = svc.db.q("SELECT detail FROM audit WHERE action='shared_contact_resolved'")
    return [json.loads(r["detail"]) for r in rows]


def test_card_open_after_partial_file(svc, clock):
    _start(svc, clock)
    cards = _open_cards(svc)
    assert len(cards) == 1 and "אולי שינוי שם?" in cards[0]["body"]
    p = json.loads(cards[0]["payload"])
    assert set(p) == {"rename_invoice", "from_customer"} and all(isinstance(v, int) for v in p.values())
    assert _resolved(svc) == []


def test_full_file_new_name_resolves(svc, clock):
    _start(svc, clock)
    _again(svc, clock, _row(name=NEW) + _row(num="7002", name=NEW))
    assert _open_cards(svc) == [], "הכרטיס נשאר אחרי שהאיחוד הצליח"
    r = _resolved(svc)
    assert len(r) == 1 and r[0]["why"] == "united"
    n = svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent='shared_contact'")["n"]
    assert n == 1, "הכרטיס נמחק במקום לרדת"


def test_file_back_to_old_name_resolves(svc, clock):
    _start(svc, clock)
    _again(svc, clock, _row() + _row(num="7002"))
    assert _open_cards(svc) == []
    assert _resolved(svc)[0]["why"] == "back"


def test_same_partial_file_again_stays(svc, clock):
    _start(svc, clock)
    _again(svc, clock, _row(num="7002", name=NEW))
    assert len(_open_cards(svc)) == 1
    assert _resolved(svc) == []


def test_unrelated_file_keeps_card(svc, clock):
    _start(svc, clock)
    _again(svc, clock, "9999,לקוח אחר,0549998888,o@x.example,100,פתוח,01/10/26,15/10/26\n")
    assert len(_open_cards(svc)) == 1


def test_card_invoice_closed_keeps_card(svc, clock):
    """7002 שולמה — אבל 7001 עדיין בשם הקודם, ושאלת הזהות לא נפתרה ⇒ הכרטיס נשאר (לא מנחשים)."""
    _start(svc, clock)
    _again(svc, clock, _row(num="7002", name=NEW, status="שולם"))
    assert svc.db.one("SELECT status FROM invoices WHERE number='7002'")["status"] == "closed"
    assert len(_open_cards(svc)) == 1


def test_third_person_same_phone_does_not_block(svc, clock):
    """אדם שלישי אמיתי באותו טלפון עם חוב פתוח — לא מונע את ירידת הכרטיס אחרי האיחוד."""
    _start(svc, clock)
    _again(svc, clock, _row(num="7003", name="שרה לוי"))
    _again(svc, clock, _row(name=NEW) + _row(num="7002", name=NEW))
    left = [c["body"] for c in _open_cards(svc)]
    assert all("אולי שינוי שם?" not in b for b in left), "כרטיס «אולי שינוי שם?» נשאר"
    assert any("שני לקוחות בשמות שונים" in b for b in left), "כרטיס האדם השלישי (נוסח 26) ירד"


def test_old_wording_card_untouched(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + _row()).encode())
    _again(svc, clock, _row() + _row(num="7003", name="שרה לוי"))
    _again(svc, clock, _row(status="שולם"))
    cards = _open_cards(svc)
    assert len(cards) == 1 and cards[0]["payload"] is None


def test_api_sync_card_unchanged(svc, clock):
    """סנכרון API: החשבונית לא עוברת לקוח בכלל (upsert לא משנה customer_id) ⇒ אין «איחוד» לזהות; הכרטיס נשאר
    כמו קודם (ממצא פתוח ב-STATUS 394 — נוסח API של 388). חשוב: לא יורד בשקט באותו סנכרון."""
    def inv(num, name):
        return Invoice(external_id=f"gi-{num}", number=num, doc_type=305, amount_agorot=50000, currency="ILS",
                       issued=date(2026, 10, 1), due=date(2026, 10, 15), client_external_id="",
                       client_name=name, client_phone="0541112222", client_email="")
    svc.ingest([inv("8001", OLD), inv("8002", OLD)], full=False)
    clock.now += timedelta(hours=1)
    svc.ingest([inv("8002", NEW)], full=False)
    assert len(_open_cards(svc)) == 1
    clock.now += timedelta(hours=1)
    svc.ingest([inv("8002", NEW)], full=False)
    assert len(_open_cards(svc)) == 1 and _resolved(svc) == []


def test_payload_and_audit_without_pii(svc, clock):
    _start(svc, clock)
    _again(svc, clock, _row(name=NEW) + _row(num="7002", name=NEW))
    blob = json.dumps([dict(r) for r in svc.db.q(
        "SELECT payload FROM messages WHERE intent='shared_contact'")] + _resolved(svc), ensure_ascii=False)
    for pii in ("דויד", "כהן-לוי", "0541112222", "541112222", "d@x.example"):
        assert pii not in blob


def test_source_guard():
    src = Path(__file__).resolve().parents[1].joinpath("app", "service.py").read_text(encoding="utf-8")
    assert "self._resolve_rename_cards()" in src and '"rename_invoice"' in src

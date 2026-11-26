"""מנהל 396 — נוסח/התנהגות API של 388 (ממצא 394🟡, גבי מנוע «הבא» (1) מ-395).

לפני: סנכרון API בלי מזהה לקוח. «דויד כהן» עם 8001+8002; 8002 הגיעה בשם «דוד כהן-לוי». ה-upsert לא שינה את
`customer_id` של חשבונית קיימת ⇒ 8002 נשארה אצל «דויד כהן» (נוצר לקוח-רפאים בשם החדש, בלי חשבוניות), התזכורת
המשיכה בשם הישן — והכרטיס «אולי שינוי שם?» אמר «שמרנו אותה כלקוח נפרד… בסנכרון הבא גבי תאחד»: שני משפטים לא נכונים.
גם אחרי שבעל העסק תיקן את השם בכל החשבוניות — שום דבר לא התאחד והכרטיס לא ירד לעולם.

אחרי: כמו CSV (219א), אבל רק בתוך אותו טלפון/מייל — החשבונית עוברת לשם שהמפתח נגזר אליו. הכרטיס אומר אמת, ויורד
אחרי האיחוד (united) או כשהשם הקודם חוזר (back). מזהה לקוח מהמערכת / טלפון אחר / הסדר פעיל ⇒ ללא שינוי."""
import json
from datetime import date, timedelta
from pathlib import Path

from app.greeninvoice import Invoice

OLD, NEW = "דויד כהן", "דוד כהן-לוי"


def _inv(num, name, phone="0541112222", cid=""):
    return Invoice(external_id=f"gi-{num}", number=num, doc_type=305, amount_agorot=50000, currency="ILS",
                   issued=date(2026, 10, 1), due=date(2026, 10, 15), client_external_id=cid,
                   client_name=name, client_phone=phone, client_email="")


def _sync(svc, clock, *invs):
    clock.now += timedelta(hours=1)
    svc.ingest(list(invs), full=False)


def _owner(svc):
    return {r["number"]: r["name"] for r in svc.db.q(
        "SELECT i.number, c.name FROM invoices i JOIN customers c ON c.id=i.customer_id")}


def _open_cards(svc):
    return svc.db.q("SELECT body FROM messages WHERE intent='shared_contact' AND needs_owner=1")


def _resolved(svc):
    return [json.loads(r["detail"])["why"] for r in svc.db.q(
        "SELECT detail FROM audit WHERE action='shared_contact_resolved'")]


def _partial(svc, clock):
    svc.ingest([_inv("8001", OLD), _inv("8002", OLD)], full=False)
    _sync(svc, clock, _inv("8002", NEW))


def test_partial_sync_moves_invoice_to_new_name(svc, clock):
    """«שמרנו אותה כלקוח נפרד» — עכשיו נכון: 8002 תחת השם החדש, 8001 נשארת בשם הקודם."""
    _partial(svc, clock)
    assert _owner(svc) == {"8001": OLD, "8002": NEW}
    cards = _open_cards(svc)
    assert len(cards) == 1 and "אולי שינוי שם?" in cards[0]["body"] and "בסנכרון הבא" in cards[0]["body"]
    a = svc.db.one("SELECT detail FROM audit WHERE action='csv_contact_changed'")
    assert a is not None and json.loads(a["detail"]).get("api") is True


def test_full_fix_unites_and_card_resolves(svc, clock):
    """«בסנכרון הבא גבי תאחד» — עכשיו נכון: אחרי תיקון השם בכל החשבוניות שתיהן תחת השם החדש והכרטיס יורד."""
    _partial(svc, clock)
    _sync(svc, clock, _inv("8001", NEW), _inv("8002", NEW))
    assert _owner(svc) == {"8001": NEW, "8002": NEW}
    assert _open_cards(svc) == [] and _resolved(svc) == ["united"]


def test_back_to_old_name_resolves(svc, clock):
    _partial(svc, clock)
    _sync(svc, clock, _inv("8002", OLD))
    assert _owner(svc) == {"8001": OLD, "8002": OLD}
    assert _open_cards(svc) == [] and _resolved(svc) == ["back"]


def test_partial_repeat_card_stays(svc, clock):
    """אותו סנכרון חלקי שוב ⇒ הכרטיס נשאר (המצב שהוא מתאר עדיין קיים) ואין כרטיס שני."""
    _partial(svc, clock)
    _sync(svc, clock, _inv("8002", NEW))
    assert len(_open_cards(svc)) == 1 and _resolved(svc) == []


def test_pending_reminder_cancelled_on_move(svc, clock):
    """התזכורת הממתינה נבנתה בשם הקודם (ומאוחדת עם 8001) — מבוטלת; התכנון הבא בונה חדשה לאישור."""
    svc.ingest([_inv("8001", OLD), _inv("8002", OLD)], full=False)
    svc.plan()
    active = svc.db.q("SELECT id FROM reminders WHERE status IN ('pending_approval','approved')")
    assert active, "אין תזכורת פעילה להתחלה"
    _sync(svc, clock, _inv("8002", NEW))
    rows = [svc.db.one("SELECT status, block_reason FROM reminders WHERE id=?", (r["id"],)) for r in active]
    assert all(r["status"] == "cancelled" and r["block_reason"] == "contact_changed" for r in rows)


def test_stop_states_carried(svc, clock):
    """מחלוקת על השם הקודם עוברת עם החשבונית — שינוי שם לא משחרר עצירה."""
    svc.ingest([_inv("8001", OLD), _inv("8002", OLD)], full=False)
    svc.db.x("UPDATE customers SET disputed=1 WHERE name=?", (OLD,))
    _sync(svc, clock, _inv("8002", NEW))
    assert svc.db.one("SELECT disputed FROM customers WHERE name=?", (NEW,))["disputed"] == 1


def test_client_id_from_system_unchanged(svc, clock):
    """עם מזהה לקוח מהמערכת — אין פיצול לפי שם ואין העברה (ללא שינוי)."""
    svc.ingest([_inv("8001", OLD, cid="c1"), _inv("8002", OLD, cid="c1")], full=False)
    _sync(svc, clock, _inv("8002", NEW, cid="c1"))
    assert svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='csv_contact_changed'")["n"] == 0
    assert len({r["customer_id"] for r in svc.db.q("SELECT customer_id FROM invoices")}) == 1


def test_phone_change_in_api_moves_as_contact_change(svc, clock):
    """טלפון אחר ב-API = שינוי פרטי קשר, לא שינוי שם — מחוץ לתחום, ללא שינוי (החשבונית נשארת).
    מנהל 414 (מבקר 247🟠): כבר לא מחוץ לתחום — כלל 219א חל גם ב-API: 8002 עוברת ללקוח של הפרטים החדשים
    (audit `contact`), 8001 נשארת. מסלול שינוי-השם (396) לא מופעל."""
    svc.ingest([_inv("8001", OLD), _inv("8002", OLD)], full=False)
    before = _owner(svc)
    _sync(svc, clock, _inv("8002", OLD, phone="0549998888"))
    assert _owner(svc) == before   # השם לא השתנה — רק פרטי הקשר
    cids = {r["number"]: r["customer_id"] for r in svc.db.q("SELECT number, customer_id FROM invoices")}
    assert cids["8001"] != cids["8002"]
    rows = [json.loads(a["detail"]) for a in svc.db.q("SELECT detail FROM audit WHERE action='csv_contact_changed'")]
    assert len(rows) == 1 and rows[0].get("contact") is True and rows[0].get("api") is True, rows


def test_live_plan_not_moved(svc, clock, monkeypatch):
    """חשבונית בהסדר פעיל לא זזה (ההסדר שבעל העסק אישר קשור ללקוח) — audit בלבד, בלי PII."""
    svc.ingest([_inv("8001", OLD), _inv("8002", OLD)], full=False)
    monkeypatch.setattr(svc, "_in_live_plan", lambda iid: True)
    _sync(svc, clock, _inv("8002", NEW))
    assert _owner(svc)["8002"] == OLD
    a = svc.db.one("SELECT detail FROM audit WHERE action='api_same_contact_move_skipped_plan'")
    assert a is not None and set(json.loads(a["detail"])) == {"invoice"}


def test_audit_without_pii(svc, clock):
    _partial(svc, clock)
    _sync(svc, clock, _inv("8001", NEW), _inv("8002", NEW))
    blob = json.dumps([r["detail"] for r in svc.db.q(
        "SELECT detail FROM audit WHERE action IN ('csv_contact_changed','shared_contact_resolved')")],
        ensure_ascii=False)
    for pii in ("דויד", "כהן-לוי", "0541112222", "541112222"):
        assert pii not in blob


def test_source_guard():
    src = Path(__file__).resolve().parents[1].joinpath("app", "service.py").read_text(encoding="utf-8")
    assert "self._api_same_contact_moved(inv, cid)" in src
    assert "elif not inv.client_external_id:" in src

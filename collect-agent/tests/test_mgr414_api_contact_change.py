"""מנהל 414 (מבקר 247🟠): כלל 219א גם בסנכרון API בלי מזהה לקוח — טלפון/מייל של חשבונית שהתחלפו במקור ⇒ החשבונית
עוברת ללקוח הנוכחי, תזכורת שנבנתה לפרטים הישנים מבוטלת, מצבי עצירה עוברים איתה; בהסדר פעיל ⇒ לא זזה, הקודמת מושהית +
כרטיס csv_contact_plan בנוסח «במערכת החשבוניות». שינוי שם בלבד (אותו טלפון) ⇒ מסלול 396 ללא שינוי; לקוח קודם עם מזהה
מקור ⇒ לא נוגעים (שמרני)."""
import json
from datetime import timedelta

from tests.conftest import gi_doc

DANA = "050-1234567"


def _doc(phone=DANA, name="דנה כהן", client_id=None):
    d = gi_doc(1, phone=phone, name=name, client_id=client_id)
    if client_id is None:
        d["client"].pop("id", None)
    d["client"]["emails"] = []
    return d


def _first_sent(svc, clock, fake_gi, doc):
    fake_gi.docs[:] = [doc]
    svc.sync()
    clock.now += timedelta(days=1)
    rids = svc.plan()
    svc.approve(rids[0])
    svc.dispatch()


def _owner(svc, iid):
    return svc.db.one("SELECT customer_id FROM invoices WHERE id=?", (iid,))["customer_id"]


def test_phone_change_moves_invoice_and_audits_api(svc, clock, fake_gi):
    _first_sent(svc, clock, fake_gi, _doc())
    iid = svc.db.one("SELECT id FROM invoices")["id"]
    old = _owner(svc, iid)
    fake_gi.docs[:] = [_doc(phone="050-0000999", name="מיכל לוי")]
    clock.now += timedelta(days=1)
    svc.sync()
    new = _owner(svc, iid)
    assert new != old
    assert svc.db.one("SELECT phone FROM customers WHERE id=?", (new,))["phone"] == "050-0000999"
    a = svc.db.one("SELECT detail FROM audit WHERE action='csv_contact_changed' ORDER BY id DESC LIMIT 1")
    det = json.loads(a["detail"])
    assert det["api"] is True and det["contact"] is True and det["from"] == old and det["to"] == new
    assert not svc.db.one("SELECT 1 FROM reminders WHERE invoice_id=? AND status IN "
                          "('pending_approval','approved')", (iid,))


def test_phone_change_carries_optout(svc, clock, fake_gi):
    _first_sent(svc, clock, fake_gi, _doc())
    iid = svc.db.one("SELECT id FROM invoices")["id"]
    svc.db.x("UPDATE customers SET opted_out=1 WHERE id=?", (_owner(svc, iid),))
    fake_gi.docs[:] = [_doc(phone="050-0000999", name="מיכל לוי")]
    clock.now += timedelta(days=1)
    svc.sync()
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (_owner(svc, iid),))["opted_out"] == 1


def test_rename_same_phone_unchanged(svc, clock, fake_gi):
    """בקרה: אותו טלפון, שם אחר ⇒ מסלול 396 בלבד (בלי audit contact)."""
    _first_sent(svc, clock, fake_gi, _doc())
    fake_gi.docs[:] = [_doc(name="מיכל לוי")]
    clock.now += timedelta(days=1)
    svc.sync()
    for a in svc.db.q("SELECT detail FROM audit WHERE action='csv_contact_changed'"):
        assert not json.loads(a["detail"]).get("contact")


def test_previous_owner_with_source_id_not_moved(svc, clock, fake_gi):
    """שמרני: הלקוח הקודם זוהה במזהה מקור; המסמך הגיע בלי מזהה ועם טלפון אחר ⇒ לא מעבירים לפי 414."""
    _first_sent(svc, clock, fake_gi, _doc(client_id="cl-9"))
    iid = svc.db.one("SELECT id FROM invoices")["id"]
    old = _owner(svc, iid)
    fake_gi.docs[:] = [_doc(phone="050-0000999", name="מיכל לוי")]
    clock.now += timedelta(days=1)
    svc.sync()
    assert _owner(svc, iid) == old


def test_phone_change_in_plan_pauses_and_cards(svc, clock, fake_gi):
    _first_sent(svc, clock, fake_gi, _doc())
    r = svc.inbound("sms", DANA, "אפשר בשלושה תשלומים?")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    assert svc.db.one("SELECT status FROM plans")["status"] == "approved"
    iid = svc.db.one("SELECT id FROM invoices")["id"]
    old = _owner(svc, iid)
    fake_gi.docs[:] = [_doc(phone="050-0000999", name="מיכל לוי")]
    clock.now += timedelta(hours=2)
    svc.sync()
    assert _owner(svc, iid) == old
    # מושהה (השהיית ההסדר הקיימת נשמרת — COALESCE, כמו ב-CSV); שום תזכורת פעילה על החשבונית
    assert svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (old,))["paused_reason"]
    assert not svc.db.one("SELECT 1 FROM reminders WHERE invoice_id=? AND status IN "
                          "('pending_approval','approved')", (iid,))
    card = svc.db.one("SELECT body FROM messages WHERE intent='csv_contact_plan' AND needs_owner=1")
    assert card and "במערכת החשבוניות" in card["body"] and "בקובץ" not in card["body"], card

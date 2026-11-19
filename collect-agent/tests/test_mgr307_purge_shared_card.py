"""מנהל 307 · ר-10 מול כרטיס «כתובת משותפת» (נשאר פתוח ממנהל 304: «purge מול כרטיס משותף פתוח — לביקורת»).

כרטיס 👥 (`shared_contact_urgent` / `shared_contact_paid_claim`) נשמר כהודעה עם `customer_id=NULL`
ו-payload `linked_customers[{id, name}]`. נמצאו שלושה חורים:
1. 🟠 לקוח מקושר שהחשבונית שלו נסגרה ⇒ אחרי 90 יום מותמם **בזמן שהכרטיס הדחוף פתוח** — `_has_open_card` בדק
   רק כרטיסים עם customer_id ⇒ «שייכו» על הלקוח הזה נכשל («כבר לא קיים»), ובעל העסק מאבד את מי שכתב «אני בן 15».
2. 🟠 השם שלו נשאר ב-payload של הכרטיס אחרי ההתממה (עד 90 יום מהכרטיס),
   ואחרי 90 יום ה-payload נמחק **כולו** (גם המזהים) ⇒ «שייכו» על כרטיס פתוח נכשל.
3. 🟡 גוף כרטיס דחוף **פתוח** נמחק אחרי 90 יום (לולאת «שולח לא מוכר») ⇒ כרטיס דחוף ריק, כמו 158א.
הכרעה זהה ל-158א: רק כרטיס **דחוף** פתוח דוחה, ובתקרה של 180 יום; כרטיס «שילמתי» לא דוחה."""
import json
from datetime import timedelta

from tests.test_legal_requirements import _shared_phone_csv

PHONE = "050-0001111"


def _card(svc, intent="shared_contact_urgent"):
    return svc.db.one("SELECT * FROM messages WHERE intent=? ORDER BY id DESC LIMIT 1", (intent,))


def _close_one(svc, cid):
    for inv in svc.db.q("SELECT id FROM invoices WHERE customer_id=?", (cid,)):
        svc.mark_paid_outside(inv["id"])


def test_open_urgent_shared_card_defers_anonymizing_linked_customer(svc, clock):
    ids = _shared_phone_csv(svc)
    assert svc.inbound("sms", PHONE, "אני בן 15")["intent"] == "shared_contact_urgent"
    cid = sorted(ids.values())[0]
    _close_one(svc, cid)
    clock.now += timedelta(days=91)
    svc.purge_closed()
    assert svc.db.one("SELECT name FROM customers WHERE id=?", (cid,))["name"], "הותמם בזמן שהכרטיס פתוח"
    card = _card(svc)
    assert card["body"], "גוף כרטיס דחוף פתוח נמחק"
    assert svc.inbox.assign_shared_card(card["id"], cid)["assigned"] == cid   # עדיין אפשר לשייך


def test_after_card_handled_purge_proceeds_and_scrubs_name_from_payload(svc, clock):
    ids = _shared_phone_csv(svc)
    svc.inbound("sms", PHONE, "אני בן 15")
    cid = sorted(ids.values())[0]
    _close_one(svc, cid)
    svc.inbox.assign_shared_card(_card(svc)["id"], None)
    clock.now += timedelta(days=91)
    svc.purge_closed()
    assert svc.db.one("SELECT name FROM customers WHERE id=?", (cid,))["name"] is None
    linked = json.loads(_card(svc)["payload"])["linked_customers"]
    assert all(x["name"] is None for x in linked if x["id"] == cid), linked
    assert {x["id"] for x in linked} == set(ids.values())       # המזהים נשמרים


def test_old_shared_card_payload_names_scrubbed_with_body(svc, clock):
    """כרטיס «שילמתי» (לא דחוף) — אחרי 90 יום: גוף ההודעה וגם השמות ב-payload נמחקים; המזהים נשמרים."""
    ids = _shared_phone_csv(svc)
    svc.inbound("sms", PHONE, "שילמתי כבר")
    clock.now += timedelta(days=91)
    svc.purge_closed()
    card = _card(svc, "shared_contact_paid_claim")
    assert card["body"] == ""
    linked = json.loads(card["payload"])["linked_customers"]
    assert {x["id"] for x in linked} == set(ids.values())
    assert all(x["name"] is None for x in linked), linked


def test_urgent_card_deferral_has_180_day_cap(svc, clock):
    ids = _shared_phone_csv(svc)
    svc.inbound("sms", PHONE, "אני בן 15")
    cid = sorted(ids.values())[0]
    _close_one(svc, cid)
    clock.now += timedelta(days=181)
    svc.purge_closed()
    assert svc.db.one("SELECT name FROM customers WHERE id=?", (cid,))["name"] is None
    card = _card(svc)
    assert card["body"] == ""
    assert all(x["name"] is None for x in json.loads(card["payload"])["linked_customers"])


def test_control_young_card_untouched(svc, clock):
    _shared_phone_csv(svc)
    svc.inbound("sms", PHONE, "שילמתי כבר")
    clock.now += timedelta(days=30)
    svc.purge_closed()
    card = _card(svc, "shared_contact_paid_claim")
    assert card["body"] and all(x["name"] for x in json.loads(card["payload"])["linked_customers"])

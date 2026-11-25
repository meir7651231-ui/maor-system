"""גבייה סוכן 18.11 · «אף לקוח ששילם לא מקבל תזכורת»: «שילמתי» מכתובת המשותפת לכמה לקוחות, כשאף אחד מהם לא
קיבל הודעה (אין שיוך) ⇒ היה shared_contact_ambiguous **בלי השהיה** ⇒ plan() בנה תזכורת לשניהם, כולל למי ששילם.
עכשיו: כרטיס 👥 אחד עם כל המקושרים, כולם מושהים עד שבעל העסק בוחר, אין תשובה ללקוח, אין מייל דחוף."""
import json

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN, customer_sent
from tests.test_legal_requirements import _shared_phone_csv
from tests.test_urgent_owner_email import _owner_mails

PHONE = "050-0001111"


def _card(svc):
    return svc.db.one("SELECT * FROM messages WHERE intent='shared_contact_paid_claim' ORDER BY id DESC LIMIT 1")


def test_paid_claim_from_shared_address_pauses_all_and_plans_nothing(svc):
    ids = _shared_phone_csv(svc)
    r = svc.inbound("sms", PHONE, "שילמתי כבר")
    assert r["intent"] == "shared_contact_paid_claim" and r["escalation"] == "normal"
    assert r["draft_id"] is None and r["auto_reply"] is None
    assert {c["paused_reason"] for c in svc.db.q("SELECT paused_reason FROM customers")} == \
        {"shared_contact_paid_claim"}
    assert svc.plan() == []                                   # היה [1, 2] — גם למי ששילם
    card = _card(svc)
    assert card["needs_owner"] == 1 and card["customer_id"] is None
    assert {c["id"] for c in json.loads(card["payload"])["linked_customers"]} == set(ids.values())
    assert customer_sent(svc) == [] and _owner_mails(svc) == []   # לא דחוף ⇒ בלי מייל


def test_paid_claim_english_too(svc):
    _shared_phone_csv(svc)
    assert svc.inbound("sms", PHONE, "I already paid")["intent"] == "shared_contact_paid_claim"
    assert svc.plan() == []


def test_assign_runs_paid_claim_for_chosen_and_resumes_other(svc, clock):
    from datetime import timedelta
    ids = _shared_phone_csv(svc)
    svc.inbound("sms", PHONE, "שילמתי")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    payer, other = ids["משה כהן"], ids["רונית לוי"]
    out = api.post(f"/owner/shared-cards/{_card(svc)['id']}/assign", json={"customer_id": payer})
    assert out.status_code == 200 and out.json()["intent"] == "paid_claim"
    paused = {c["id"]: c["paused_reason"] for c in svc.db.q("SELECT id, paused_reason FROM customers")}
    assert paused[payer] == "paid_claim" and paused[other] is None
    # כלל קיים: טיוטה פתוחה לאותה כתובת חוסמת את השותפים — בסיבה נפרדת (סט #26 q26-10)
    assert svc._customer_block(other) == "shared_contact_hold"
    svc.inbox.approve_draft(out.json()["draft_id"])          # בעל העסק אישר את התשובה למשה
    clock.now += timedelta(days=1)
    planned = {svc.db.one("SELECT i.customer_id c FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                          "WHERE r.id=?", (rid,))["c"] for rid in svc.plan()}
    assert payer not in planned and other in planned


def test_owner_done_on_paid_card_releases_pauses(svc):
    _shared_phone_csv(svc)
    svc.inbound("sms", PHONE, "שילמתי")
    svc.owner_message_done(_card(svc)["id"])
    assert {c["paused_reason"] for c in svc.db.q("SELECT paused_reason FROM customers")} == {None}


def test_non_paid_routine_from_shared_unchanged(svc):
    _shared_phone_csv(svc)
    r = svc.inbound("sms", PHONE, "איך אפשר לשלם?")
    assert r["intent"] == "shared_contact_ambiguous"
    assert {c["paused_reason"] for c in svc.db.q("SELECT paused_reason FROM customers")} == {None}


def test_paid_claim_attributed_by_last_outbound_unchanged(svc):
    """כשיש שיוך (משה קיבל את התזכורת האחרונה) ⇒ מסלול רגיל של משה, כמו קודם."""
    ids = _shared_phone_csv(svc)
    rems = {r["customer_id"]: r["id"] for r in svc.db.q(
        "SELECT r.id, i.customer_id FROM reminders r JOIN invoices i ON i.id=r.invoice_id")} or None
    if rems is None:
        svc.plan()
        rems = {r["customer_id"]: r["id"] for r in svc.db.q(
            "SELECT r.id, i.customer_id FROM reminders r JOIN invoices i ON i.id=r.invoice_id")}
    svc.approve(rems[ids["משה כהן"]], confirm_open=True)
    svc.dispatch()
    assert svc.inbound("sms", PHONE, "שילמתי")["intent"] == "paid_claim"

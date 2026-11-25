"""מבקר 234א🟡 · מנהל 398 — בקשת הסדר («אפשר בשלושה תשלומים?») מטלפון משותף בלי שיוך, כמו ההבטחה (233):
(1) כרטיס `shared_contact_plan_request` עם בחירת לקוח לכל מי שעל הטלפון, בלי טיוטה ובלי תשובה אוטומטית;
(2) עד השיוך — כל המקושרים מושהים ולא נבנית תזכורת לאף אחד;
(3) בשיוך — הצעת ההסדר נבנית ללקוח שנבחר בלבד (בלי שם/סכום/מספר של האחר), השני חוזר למסלול;
(4) «אף אחד מהם» / «טופל» — משחרר את שניהם; שילוב עם «שילמתי» ⇒ כרטיס «שילמתי» (חמור יותר)."""
import json
from dataclasses import replace
from datetime import timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN, customer_sent

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
ROWS = "7001,דויד כהן,050-0000111,,1200,פתוח,01/10/26,15/10/26\n7002,שרה לוי,050-0000111,,450,פתוח,01/10/26,15/10/26\n"
PHONE = "050-0000111"
CARD = "shared_contact_plan_request"


def _split(svc):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + ROWS).encode())
    return {r["name"]: r["id"] for r in svc.db.q("SELECT id, name FROM customers WHERE phone=?", (PHONE,))}


def _planned_numbers(svc):
    return sorted(svc.db.one("SELECT i.number FROM reminders r JOIN invoices i ON i.id=r.invoice_id WHERE r.id=?",
                             (rid,))["number"] for rid in svc.plan())


def _paused(svc, cid):
    return svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))["paused_reason"]


def test_card_lists_both_pauses_both_no_reply(svc, clock):
    ids = _split(svc)
    r = svc.inbound("sms", PHONE, "אפשר בשלושה תשלומים?")
    assert r["intent"] == CARD and r["detected"] == "plan_request" and r["escalation"] == "normal"
    assert r["draft_id"] is None and r["auto_reply"] is None and r["plan_id"] is None
    card = svc.db.one("SELECT * FROM messages WHERE id=?", (r["card_id"],))
    assert card["needs_owner"] == 1 and card["customer_id"] is None
    assert {c["id"] for c in json.loads(card["payload"])["linked_customers"]} == set(ids.values())
    assert {_paused(svc, c) for c in ids.values()} == {CARD}
    for _ in range(3):
        clock.now += timedelta(days=1)
        assert _planned_numbers(svc) == []
    assert customer_sent(svc) == []


def test_assign_builds_plan_only_for_chosen_other_back_to_normal(svc, clock):
    ids = _split(svc)
    r = svc.inbound("sms", PHONE, "אפשר בשלושה תשלומים?")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    out = api.post(f"/owner/shared-cards/{r['card_id']}/assign", json={"customer_id": ids["שרה לוי"]})
    assert out.status_code == 200 and out.json()["intent"] == "plan_request", out.json()
    j = out.json()
    plan = svc.db.one("SELECT customer_id, invoice_ids FROM plans WHERE id=?", (j["plan_id"],))
    assert plan["customer_id"] == ids["שרה לוי"] and plan["invoice_ids"] == "[2]"
    body = svc.db.one("SELECT body FROM drafts WHERE id=?", (j["draft_id"],))["body"]
    for leak in ("דויד", "כהן", "1,200", "7001"):
        assert leak not in body, leak
    assert _paused(svc, ids["דויד כהן"]) is None               # השהיית הכרטיס שוחררה לדויד
    # כלל קיים (critic 65): טיוטה שממתינה לבעל העסק מחזיקה את כל מי שבאותה כתובת — כמו בפנייה משויכת
    from app.service import AWAITING_OWNER
    assert svc._customer_block(ids["דויד כהן"]) == AWAITING_OWNER
    svc.inbox.reject_draft(j["draft_id"])                      # בעל העסק הכריע ⇒ דויד חוזר למסלול
    clock.now += timedelta(days=1)
    assert "7001" in _planned_numbers(svc)


def test_nobody_and_done_release_both(svc):
    ids = _split(svc)
    r = svc.inbound("sms", PHONE, "אפשר בשלושה תשלומים?")
    svc.inbox.assign_shared_card(r["card_id"], None)
    assert {_paused(svc, c) for c in ids.values()} == {None}
    r2 = svc.inbound("sms", PHONE, "אפשר לפרוס לתשלומים?")
    assert r2["intent"] == CARD
    assert svc.owner_message_done(r2["card_id"])["done"] is True                # «טופל» = «אף אחד מהם»
    assert {_paused(svc, c) for c in ids.values()} == {None}


def test_paid_claim_wins_over_plan_request(svc):
    _split(svc)
    assert svc.inbound("sms", PHONE, "שילמתי חלק, אפשר את השאר בתשלומים?")["intent"] == "shared_contact_paid_claim"


def test_routine_and_single_customer_unchanged(svc):
    _split(svc)
    assert svc.inbound("sms", PHONE, "מי זה?")["intent"] == "shared_contact_ambiguous"


def test_card_is_no_auto_send_pause():
    from app import inbox
    assert CARD in inbox._NO_AUTO_SEND_PAUSES and CARD in inbox.ConversationInbox.SHARED_CARDS
    from app import service
    assert CARD in service._SHARED_CARD_INTENTS

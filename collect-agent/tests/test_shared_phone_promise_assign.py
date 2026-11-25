"""מבקר 233🟡 · הכרעת ראש צוות 25.11 — הבטחה מטלפון משותף בלי שיוך:
(1) כרטיס עם בחירת לקוח לכל מי שעל הטלפון (מזהים פנימיים; בלי חשיפת שם/סכום של האחר ללקוח);
(2) עד השיוך — כל המקושרים מושהים ולא נבנית «טרם סומנה כשולמה» לאף אחד;
(3) אחרי שיוך — ההבטחה נרשמת לנבחר בלבד, השני חוזר למסלול הרגיל. «אף אחד מהם» (הכרעה 209) — ללא שינוי."""
import json
from dataclasses import replace
from datetime import timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN, customer_sent

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
ROWS = "7001,דויד כהן,050-0000111,,1200,פתוח,01/10/26,15/10/26\n7002,שרה לוי,050-0000111,,450,פתוח,01/10/26,15/10/26\n"
PHONE = "050-0000111"


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


def test_card_lists_both_and_pauses_both_until_assigned(svc, clock):
    ids = _split(svc)
    r = svc.inbound("sms", PHONE, "אשלם ב-12 לחודש")
    assert r["intent"] == "shared_contact_promise" and r["escalation"] == "normal" and r["draft_id"] is None
    card = svc.db.one("SELECT * FROM messages WHERE id=?", (r["card_id"],))
    assert card["needs_owner"] == 1 and card["customer_id"] is None
    assert {c["id"] for c in json.loads(card["payload"])["linked_customers"]} == set(ids.values())
    assert {_paused(svc, c) for c in ids.values()} == {"shared_contact_promise"}
    for _ in range(3):                                         # שלושה ימים — אף «טרם סומנה» לאף אחד
        clock.now += timedelta(days=1)
        assert _planned_numbers(svc) == []
    assert customer_sent(svc) == []


def test_assign_records_promise_only_for_chosen_other_back_to_normal(svc, clock):
    ids = _split(svc)
    r = svc.inbound("sms", PHONE, "אשלם ב-12 לחודש")          # 8.11 ⇒ 12.11
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    out = api.post(f"/owner/shared-cards/{r['card_id']}/assign", json={"customer_id": ids["דויד כהן"]})
    assert out.status_code == 200 and out.json()["intent"] == "promise"
    assert _paused(svc, ids["דויד כהן"]) == "promise:until=2026-11-13"
    assert _paused(svc, ids["שרה לוי"]) is None
    clock.now += timedelta(days=1)
    assert _planned_numbers(svc) == ["7002"]                   # שרה — כרגיל; דויד — לא עד אחרי ה-12


def test_reply_after_assign_does_not_expose_the_other_person(svc):
    ids = _split(svc)
    r = svc.inbound("sms", PHONE, "אשלם ב-12 לחודש")
    out = svc.inbox.assign_shared_card(r["card_id"], ids["דויד כהן"])
    body = svc.db.one("SELECT body FROM drafts WHERE id=?", (out["draft_id"],))["body"] if out.get("draft_id") else ""
    for leak in ("שרה", "לוי", "450", "7002"):
        assert leak not in body, leak


def test_nobody_keeps_decision_209(svc, clock):
    """«אף אחד מהם» (הכרעת מאיר 209) — ללא שינוי: ההשהיה משתחררת לשניהם."""
    ids = _split(svc)
    r = svc.inbound("sms", PHONE, "אשלם ב-12 לחודש")
    svc.inbox.assign_shared_card(r["card_id"], None)
    assert {_paused(svc, c) for c in ids.values()} == {None}


def test_paid_claim_with_promise_is_paid_card(svc):
    _split(svc)
    assert svc.inbound("sms", PHONE, "שילמתי חלק, ואשלם את השאר ב-12")["intent"] == "shared_contact_paid_claim"


def test_routine_message_from_shared_phone_unchanged(svc):
    _split(svc)
    assert svc.inbound("sms", PHONE, "מי זה?")["intent"] == "shared_contact_ambiguous"


def test_single_customer_promise_unchanged(svc):
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "אשלם ב-12 לחודש")
    assert r["intent"] == "promise"

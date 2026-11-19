"""מנהל 319 · תיקון critic 171 — מרשם בקשות נושאי מידע.

א. `dsr.detect` מזהה ניסוחים נפוצים (ציווי בלי ת׳, «מחיקה של», «איזה מידע», אנגלית information/details) — בלי
   להפוך הסרה רגילה או שאלה יומיומית לבקשה חוקית (בעל העסק לא צריך מועד 30 יום על «תמחקו אותי»).
ב. בקשה מכתובת משותפת שמשויכת אחרי X ימים ⇒ המועד נספר מקבלת ההודעה (`created_at` של הכרטיס), לא מהשיוך;
   `received_at` עתידי/פגום לא מאריך את המועד."""
import json
from datetime import timedelta

import pytest

from app import dsr
from app.inbox import _parse_iso


@pytest.mark.parametrize("text,kinds", [
    ("מחקו את המידע שלי", ["deletion"]),
    ("מבקש מחיקה של המידע שלי", ["deletion"]),
    ("please delete my information", ["deletion"]),
    ("Please delete all of my personal information", ["deletion"]),
    ("erase my details", ["deletion"]),
    ("what information do you have about me", ["access"]),
    ("What personal data do you hold on me?", ["access"]),
    ("אני רוצה לראות איזה מידע יש לכם עליי", ["access"]),
    ("אילו נתונים יש לכם עלי", ["access"]),
])
def test_common_phrasings_detected(text, kinds):
    assert dsr.detect(text) == kinds


@pytest.mark.parametrize("text", [
    "תמחקו אותי מהרשימה", "מחקו אותי", "delete me", "please remove me", "erase this number",
    "what is this about", "מה זה החוב הזה?", "איזה חשבונית?", "מחקו את ההודעה הקודמת",
    "delete the invoice please", "מה יש לכם עוד לשלוח לי",
])
def test_opt_out_and_everyday_not_requests(text):
    assert dsr.detect(text) == []


def _shared_card(svc, text="תמחקו את כל הפרטים שלי מהמאגר"):
    svc.sync()
    svc.import_csv(("מספר חשבונית,לקוח,סכום,תאריך לתשלום,טלפון,מייל\n"
                    "3,רונית לוי,300,2026-10-01,050-0001111,fam@ex.com\n"
                    "4,משה כהן,400,2026-10-01,050-0002222,fam@ex.com\n").encode())
    return svc.email_webhook("fam@ex.com", text, "")


def _cid(svc, name):
    return svc.db.one("SELECT id FROM customers WHERE name=?", (name,))["id"]


def test_shared_access_request_registered_on_receipt(svc, clock):
    """«מה המידע שיש לכם עליי» מכתובת משותפת (לא דחוף ⇒ כרטיס «לא שויכה») לא נרשם כלל לפני 319."""
    out = _shared_card(svc, "מה המידע שיש לכם עליי")
    (row,) = dsr.listing(svc)
    assert row["kind"] == "access" and row["customer_id"] is None
    assert row["due_at"][:10] == (clock.now + timedelta(days=30)).date().isoformat()
    card = svc.db.one("SELECT payload FROM messages WHERE intent='shared_contact_ambiguous'")
    assert json.loads(card["payload"])["dsr_ids"] == [row["id"]]
    assert out["intent"] == "shared_contact_ambiguous"


def test_shared_delete_registered_on_receipt_then_linked_without_moving_due(svc, clock):
    received = clock.now
    out = _shared_card(svc)
    (row,) = dsr.listing(svc)
    assert row["customer_id"] is None and row["kind"] == "deletion"
    clock.now += timedelta(days=12)
    svc.inbox.assign_shared_card(out["card_id"], _cid(svc, "משה כהן"))
    (row,) = dsr.listing(svc)                            # אותה בקשה, לא כפולה
    assert row["customer"] == "משה כהן"
    assert row["received_at"][:10] == received.date().isoformat()
    assert row["due_at"][:10] == (received + timedelta(days=30)).date().isoformat()
    assert row["days_left"] in (17, 18)                 # נותרו 18 יום, לא 30
    assert svc.db.one("SELECT 1 FROM audit WHERE action='dsr_linked'") is not None


def test_shared_request_assigned_after_deadline_is_overdue_and_alerts_late(svc, clock):
    out = _shared_card(svc)
    clock.now += timedelta(days=35)
    svc.inbox.assign_shared_card(out["card_id"], _cid(svc, "רונית לוי"))
    (row,) = dsr.listing(svc)
    assert row["overdue"] is True
    assert dsr.sweep(svc) == 1                           # התראת איחור מיד, לא אחרי 30 יום נוספים


def test_assign_none_keeps_request_unlinked(svc, clock):
    out = _shared_card(svc)
    svc.inbox.assign_shared_card(out["card_id"], None)
    (row,) = dsr.listing(svc)
    assert row["customer_id"] is None and row["status"] == "open"


def test_customer_with_open_request_gets_no_duplicate(svc, clock):
    out = _shared_card(svc)
    cid = _cid(svc, "רונית לוי")
    dsr.open_request(svc, cid, "deletion", "owner")
    svc.inbox.assign_shared_card(out["card_id"], cid)
    rows = dsr.listing(svc)
    assert sorted((r["customer_id"] or 0) for r in rows) == [0, cid]


def test_wrong_person_from_shared_address_not_registered(svc):
    _shared_card(svc, "מספר שגוי, תמחקו את כל הפרטים שלי מהמאגר")
    assert dsr.listing(svc) == []


def test_future_received_at_never_extends_due(svc, clock):
    svc.sync()
    cid = svc.db.one("SELECT id FROM customers LIMIT 1")["id"]
    dsr.open_request(svc, cid, "access", "sms", received_at=clock.now + timedelta(days=10))
    assert dsr.listing(svc)[0]["due_at"][:10] == (clock.now + timedelta(days=30)).date().isoformat()


@pytest.mark.parametrize("value", [None, "", "not-a-date"])
def test_parse_iso_bad_values_fall_back(value):
    assert _parse_iso(value) is None


def test_parse_iso_naive_gets_tz():
    assert _parse_iso("2026-11-01T10:00:00").tzinfo is not None

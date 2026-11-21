"""מנהל 358 · מבקר 204🟠+204ב🟡.

204🟠: הסדר שנסגר (`completed`/`missed`) מחזיר את השיחה ל-idle — רק אם ההצעה שבשיחה היא הלוח של ההסדר הזה.
204ב🟡: חשבונית מחוץ להסדר פעיל שהגיעה למועד ⇒ כרטיס אחד לבעל העסק (לא תזכורת ללקוח)."""
import json
from datetime import timedelta

from app.service import plan_outside_text
from tests.conftest import gi_doc


def _plan(svc):
    svc.sync()
    pid = svc.propose_plan(1, 3)
    svc.approve_plan(pid, confirm_amount=True)
    return pid


def _conv(svc):
    return svc.db.one("SELECT state, offered_plan FROM conversations WHERE customer_id=1")


def test_missed_plan_resets_conversation_and_audits(svc, clock):
    pid = _plan(svc)
    assert _conv(svc)["state"] == "awaiting_plan_reply"
    clock.now += timedelta(days=20)
    svc.plan()
    c = _conv(svc)
    assert c["state"] == "idle" and c["offered_plan"] is None
    assert svc.db.one("SELECT 1 FROM audit WHERE action='plan_offer_cleared' "
                      "AND json_extract(detail,'$.plan')=?", (pid,))


def test_newer_offer_in_conversation_is_kept(svc, clock):
    _plan(svc)
    other = json.dumps([{"n": 1, "due": "2027-01-01", "amount_agorot": 100}])
    svc.db.x("UPDATE conversations SET offered_plan=? WHERE customer_id=1", (other,))
    clock.now += timedelta(days=20)
    svc.plan()
    c = _conv(svc)
    assert c["state"] == "awaiting_plan_reply" and c["offered_plan"] == other


def test_active_plan_leaves_conversation(svc):
    _plan(svc)
    svc.plan()
    assert _conv(svc)["state"] == "awaiting_plan_reply"


def _outside(svc, fake_gi, due):
    fake_gi.docs.append(gi_doc(4, amount="600.00", client_id="cl1"))
    svc.sync()
    pid = svc.propose_plan(1, 3)
    svc.approve_plan(pid, confirm_amount=True)
    fake_gi.docs.append(gi_doc(5, amount="300.00", client_id="cl1", due=due))
    fake_gi.docs[3]["amount"], fake_gi.docs[3]["status"] = "0.00", 2
    svc.sync()
    return pid


def _cards(svc):
    return svc.db.q("SELECT body FROM messages WHERE intent='plan_outside_invoice' AND needs_owner=1")


def test_outside_invoice_card_once_and_no_customer_message(svc, clock, fake_gi):
    _outside(svc, fake_gi, "2026-11-12")
    clock.now += timedelta(days=14)
    svc.plan()
    svc.plan()
    cards = _cards(svc)
    assert len(cards) == 1 and "1005" in cards[0]["body"] and "12.11.2026" in cards[0]["body"]
    inv5 = svc.db.one("SELECT id FROM invoices WHERE number='1005'")["id"]
    assert not svc.db.one("SELECT 1 FROM reminders WHERE invoice_id=?", (inv5,))


def test_outside_invoice_not_yet_due_no_card(svc, fake_gi):
    _outside(svc, fake_gi, "2027-03-01")
    svc.plan()
    assert _cards(svc) == []


def test_outside_text_without_due():
    t = plan_outside_text(None, "77", 30000, None)
    assert "77" in t and "לקוח" in t and "מועד" not in t

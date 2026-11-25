"""מנהל 410 (מבקר 244🟠) · מטבע חשבונית שהשתנה במקור.

לפני: upsert הייבוא/הסנכרון עדכן `amount_agorot` בלי `currency` ⇒ קובץ 9001 1,200 USD ⇒ למחרת 1,100 ILS נקלט
כ-«$1,100»; בהסדר דולרי הירידה נספרה «שולם $100»; גם רענון-לפני-שליחה (API) התעלם מהמטבע.
אחרי (`_note_currency_change`): המטבע מתעדכן, תזכורות פעילות על החשבונית מבוטלות (`currency_changed`), הלקוח
מושהה (`currency_changed`, לא דורס השהיה קיימת), הסדר מאושר שכולל אותה מוחלף (`superseded`), כרטיס אחד לבעל העסק,
ואין כרטיס «היתרה עלתה» בין מטבעות."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,מטבע,סטטוס,תאריך,תאריך לתשלום\n"
DANA = "050-1234567"


def _row(amount, currency):
    return (H + f"9001,דנה כהן,{DANA},d@x.example,{amount},{currency},פתוח,01/10/26,15/10/26\n").encode()


def _start(svc, amount=1200, cur="USD"):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv(_row(amount, cur))


def _cards(svc):
    return svc.db.q("SELECT body FROM messages WHERE intent='currency_changed' AND needs_owner=1")


def test_currency_updated_paused_card_no_reminder(svc, clock):
    _start(svc)
    clock.now += timedelta(days=1)
    svc.import_csv(_row(1100, "ILS"))
    inv = svc.db.one("SELECT amount_agorot, currency FROM invoices WHERE external_id LIKE '%9001'")
    assert (inv["amount_agorot"], inv["currency"]) == (110000, "ILS")
    assert svc.db.one("SELECT paused_reason FROM customers WHERE name='דנה כהן'")["paused_reason"] == "currency_changed"
    cards = _cards(svc)
    assert len(cards) == 1 and "$1,200" in cards[0]["body"] and "1,100 ₪" in cards[0]["body"]
    assert svc.plan() == []
    assert not svc.db.one("SELECT 1 FROM messages WHERE intent='csv_balance_rose'")
    # אותו קובץ שוב ⇒ אין כרטיס כפול
    svc.import_csv(_row(1100, "ILS"))
    assert len(_cards(svc)) == 1


def test_pending_reminder_cancelled(svc, clock):
    _start(svc)
    clock.now += timedelta(days=1)
    rids = svc.plan()
    assert rids
    svc.import_csv(_row(1100, "ILS"))
    r = svc.db.one("SELECT status, block_reason FROM reminders WHERE id=?", (rids[0],))
    assert (r["status"], r["block_reason"]) == ("cancelled", "currency_changed")


def test_control_same_currency_no_card(svc, clock):
    _start(svc)
    clock.now += timedelta(days=1)
    svc.import_csv(_row(1100, "USD"))
    assert _cards(svc) == []
    assert svc.db.one("SELECT paused_reason FROM customers WHERE name='דנה כהן'")["paused_reason"] is None
    bodies = [svc.db.one("SELECT body FROM reminders WHERE id=?", (r,))["body"] for r in svc.plan()]
    assert any("$1,100" in b for b in bodies), bodies


def test_existing_pause_not_overwritten(svc, clock):
    _start(svc)
    svc.db.x("UPDATE customers SET paused_reason='dispute' WHERE name='דנה כהן'")
    svc.import_csv(_row(1100, "ILS"))
    assert svc.db.one("SELECT paused_reason FROM customers WHERE name='דנה כהן'")["paused_reason"] == "dispute"
    assert len(_cards(svc)) == 1


def test_usd_plan_superseded_not_counted_paid(svc, clock):
    _start(svc)
    clock.now += timedelta(days=1)
    rids = svc.plan()
    svc.approve(rids[0], confirm_open=True)
    svc.dispatch()
    r = svc.inbound("sms", DANA, "אפשר בשלושה תשלומים?")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    r = svc.inbound("sms", DANA, "מאשר")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    assert svc.db.one("SELECT status FROM plans")["status"] == "approved"
    svc.import_csv(_row(1100, "ILS"))
    assert svc.db.one("SELECT status FROM plans")["status"] == "superseded"
    assert "הסדר" in _cards(svc)[0]["body"]
    assert not svc.db.one("SELECT 1 FROM messages WHERE intent='plan_amount_changed'")
    a = svc.db.one("SELECT detail FROM audit WHERE action='currency_changed'")
    assert '"plans_superseded": [' in a["detail"] and '[]' not in a["detail"]

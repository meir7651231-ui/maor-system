"""מנהל 411 (ביקורת 245 · אימות 410) · מטבע חשבונית שהשתנה — מסלולי API ומקרי קצה.

410 תיקן את המסלול של קובץ CSV ובדק אותו; מסלול סנכרון ה-API (`sync`) ורענון-לפני-שליחה (`_refresh_invoice`)
עברו דרך אותו קוד אבל בלי בדיקה ייעודית. כאן: GI שמחזיר מטבע אחר בסנכרון ובשליחה, חזרה למטבע המקורי,
חידוש הלקוח אחרי הכרטיס (התזכורת נבנית במטבע החדש), ולקוח עם שתי חשבוניות שרק אחת מהן החליפה מטבע."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,מטבע,סטטוס,תאריך,תאריך לתשלום\n"
DANA = "050-1234567"


def _cards(svc):
    return svc.db.q("SELECT body FROM messages WHERE intent='currency_changed' AND needs_owner=1")


def _inv(svc, ext="doc1"):
    return svc.db.one("SELECT id, amount_agorot, currency, customer_id FROM invoices WHERE external_id=?", (ext,))


def _usd_then(fake_gi, amount="1100.00", cur="ILS"):
    fake_gi.docs[0]["amount"] = amount
    fake_gi.docs[0]["currency"] = cur


def test_api_sync_currency_change(svc, fake_gi, clock):
    fake_gi.docs[0]["currency"] = "USD"
    svc.sync()
    assert _inv(svc)["currency"] == "USD"
    _usd_then(fake_gi)
    clock.now += timedelta(days=1)
    svc.sync()
    inv = _inv(svc)
    assert (inv["amount_agorot"], inv["currency"]) == (110000, "ILS")
    c = svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (inv["customer_id"],))
    assert c["paused_reason"] == "currency_changed"
    assert len(_cards(svc)) == 1
    assert not any(svc.db.one("SELECT invoice_id FROM reminders WHERE id=?", (r,))["invoice_id"] == inv["id"]
                   for r in svc.plan())


def test_api_refresh_before_send_currency_change(svc, fake_gi, clock):
    fake_gi.docs[0]["currency"] = "USD"
    svc.sync()
    rids = svc.plan()
    rid = next(r for r in rids if svc.db.one("SELECT invoice_id FROM reminders WHERE id=?", (r,))["invoice_id"]
               == _inv(svc)["id"])
    svc.approve(rid, confirm_open=True)
    _usd_then(fake_gi)   # בין האישור לשליחה המטבע השתנה במקור
    svc.dispatch()
    r = svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))
    assert r["status"] != "sent"
    assert not any("1,100" in (m.get("body") or "") for m in svc.sender.sent)
    inv = _inv(svc)
    assert inv["currency"] == "ILS"
    assert len(_cards(svc)) == 1


def test_resume_after_card_reminder_in_new_currency(svc, fake_gi, clock):
    fake_gi.docs[0]["currency"] = "USD"
    svc.sync()
    _usd_then(fake_gi)
    clock.now += timedelta(days=1)
    svc.sync()
    cid = _inv(svc)["customer_id"]
    svc.resume_customer(cid)
    iid = _inv(svc)["id"]
    bodies = [svc.db.one("SELECT body, invoice_id FROM reminders WHERE id=?", (r,)) for r in svc.plan()]
    mine = [b["body"] for b in bodies if b["invoice_id"] == iid]
    assert mine and "1,100" in mine[0] and "$" not in mine[0], mine


def test_back_to_original_currency_new_card(svc, fake_gi, clock):
    fake_gi.docs[0]["currency"] = "USD"
    svc.sync()
    _usd_then(fake_gi)
    clock.now += timedelta(days=1)
    svc.sync()
    _usd_then(fake_gi, "1100.00", "USD")
    clock.now += timedelta(days=1)
    svc.sync()
    assert _inv(svc)["currency"] == "USD"
    assert len(_cards(svc)) == 2
    assert svc.db.one("SELECT paused_reason FROM customers WHERE id=?",
                      (_inv(svc)["customer_id"],))["paused_reason"] == "currency_changed"


def test_two_invoices_one_changes_csv(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    rows = (f"9001,דנה כהן,{DANA},d@x.example,1200,USD,פתוח,01/10/26,15/10/26\n"
            f"9002,דנה כהן,{DANA},d@x.example,500,ILS,פתוח,01/10/26,15/10/26\n")
    svc.import_csv((H + rows).encode())
    clock.now += timedelta(days=1)
    rids = svc.plan()
    assert rids
    svc.import_csv((H + rows.replace("1200,USD", "1100,ILS")).encode())
    # כל התזכורות של הלקוחה — גם המאוחדת שכוללת את 9002 — לא יוצאות
    for rid in rids:
        assert svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))["status"] in ("cancelled", "blocked"), rid
    assert svc.plan() == []
    svc.dispatch()
    assert [m for m in svc.sender.sent if m.get("audience") != "owner"] == []


def _usd_plan_sent(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + f"9001,דנה כהן,{DANA},,1200,USD,פתוח,01/10/26,15/10/26\n").encode())
    clock.now += timedelta(days=1)
    svc.approve(svc.plan()[0], confirm_open=True)
    svc.dispatch()
    r = svc.inbound("sms", DANA, "אפשר בשלושה תשלומים?")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)


def test_accept_after_plan_superseded_other_reason_unchanged(svc, clock):
    """בקרה ל-245🟡: הסדר שהוחלף **לא** בגלל מטבע ⇒ המסלול הקיים לא משתנה (אין כרטיס «בוטלה כי המטבע השתנה»)."""
    _usd_plan_sent(svc, clock)
    svc.db.x("UPDATE plans SET status='superseded'")
    r = svc.inbound("sms", DANA, "מאשר")
    assert "plan_accept_currency_changed" not in r["tags"]
    assert "המטבע" not in (r["owner_summary"] or "")


def test_accept_after_currency_change_audited(svc, clock):
    _usd_plan_sent(svc, clock)
    svc.import_csv((H + f"9001,דנה כהן,{DANA},,4400,ILS,פתוח,01/10/26,15/10/26\n").encode())
    r = svc.inbound("sms", DANA, "מאשר")
    assert "plan_accept_currency_changed" in r["tags"]
    assert svc.db.one("SELECT 1 FROM audit WHERE action='plan_accept_held_currency_changed'")
    assert not svc.db.one("SELECT 1 FROM drafts WHERE id=? AND body LIKE '%אישור סופי%'", (r["draft_id"] or 0,))

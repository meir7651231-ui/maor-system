"""מנהל 437 · מבקר 265🟠 — DLR 201 של 019 חוסם את המספר שאליו ההודעה נשלחה בפועל.

- טלפון לא השתנה ⇒ ההתנהגות הקודמת: המספר נחסם והלקוח מוסר, בלי כרטיס «מספר קודם».
- הטלפון הוחלף לפני ה-DLR ⇒ הישן נחסם, החדש פתוח, הלקוח לא מוסר, וכרטיס אחד לבעל העסק + audit.
- DLR כפול (retry של הספק) ⇒ לא כרטיס שני (דה-דופ לפי גוף)."""
from datetime import timedelta

from tests.test_delivery_feedback_docs import FORM, _doc_019_body, _sent, api  # noqa: F401

NEW = "050-0000777"


def _cards(svc, cid):
    return svc.db.q("SELECT body FROM messages WHERE customer_id=? AND intent='carrier_blacklist_old_phone'", (cid,))


def test_same_phone_still_opts_out(api, svc, fake_gi, clock):  # noqa: F811
    m = _sent(api, svc, "sms")
    cid = m["customer_id"]
    r = api.post("/webhooks/sms/019?k=whk-test", content=_doc_019_body(m["provider_id"], "201"), headers=FORM)
    assert r.json().get("matched")
    assert svc.suppressed("sms", m["cphone"])
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (cid,))["opted_out"] == 1
    assert _cards(svc, cid) == []


def test_changed_phone_blocks_old_card_once(api, svc, fake_gi, clock):  # noqa: F811
    m = _sent(api, svc, "sms")
    old, cid = m["cphone"], m["customer_id"]
    tail = old.replace("-", "")[-7:]
    for d in fake_gi.docs:
        if (d["client"].get("phone") or "").replace("-", "")[-7:] == tail:
            d["client"]["phone"] = NEW
    clock.now += timedelta(hours=3)
    api.post("/sync")
    body = _doc_019_body(m["provider_id"], "201")
    api.post("/webhooks/sms/019?k=whk-test", content=body, headers=FORM)
    api.post("/webhooks/sms/019?k=whk-test", content=body, headers=FORM)
    assert svc.suppressed("sms", old) and not svc.suppressed("sms", NEW)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (cid,))["opted_out"] == 0
    cards = _cards(svc, cid)
    assert len(cards) == 1 and "050" not in cards[0]["body"]          # בלי PII בכרטיס
    assert svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='carrier_blacklist_old_phone'")["n"] == 1

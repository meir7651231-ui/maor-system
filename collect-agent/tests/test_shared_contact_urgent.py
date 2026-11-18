"""החלטת ראש צוות (סבב ביקורת, נושא 5): הודעה דחופה מכתובת שמשותפת לכמה לקוחות ⇒ דחופה תמיד + כרטיס
בעל עסק אחד עם כל הלקוחות המקושרים, בלי שיוך אוטומטי ובלי תשובה ללקוח עד בחירה."""
import json

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN, customer_sent

SHARED = "0501234567"


@pytest.fixture
def api(svc, fake_gi):
    fake_gi.docs[1]["client"]["phone"] = "050-1234567"      # יוסי ודנה על אותו טלפון (בני זוג)
    svc.sync()
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _inbound(api, text, sender=SHARED):
    return api.post("/inbound", json={"channel": "sms", "sender": sender, "text": text}).json()


def _ids(svc):
    return sorted(r["id"] for r in svc.db.q("SELECT id FROM customers"))


@pytest.mark.parametrize("text", ["פוטרתי, אין לי כסף ואני על סף קריסה", "אני בן 15",
                                  "לא הזמנתי את זה, זו טעות", "העברתי לעורך הדין שלי", "הסר"])
def test_urgent_from_shared_address_is_one_card_with_all_linked(api, svc, text):
    r = _inbound(api, text)
    assert r["intent"] == "shared_contact_urgent" and r["escalation"] == "urgent"
    assert sorted(r["linked_customers"]) == _ids(svc) and r["draft_id"] is None
    cards = svc.db.q("SELECT * FROM messages WHERE intent='shared_contact_urgent' AND needs_owner=1")
    assert len(cards) == 1
    names = {x["name"] for x in json.loads(cards[0]["payload"])["linked_customers"]}
    assert names == {"דנה כהן", "יוסי לוי"}
    assert customer_sent(svc) == []                              # אין תשובה ללקוח


def test_urgent_not_auto_attributed_even_if_one_was_messaged_last(api, svc):
    """לפני ההחלטה: הכתובת שויכה אוטומטית למי שקיבל את ההודעה האחרונה. עכשיו — רק בחירה של בעל העסק."""
    rid = api.post("/plan").json()["created"][0]
    api.post(f"/reminders/{rid}/approve")
    api.post("/dispatch")                                        # מישהו מהשניים קיבל הודעה
    before = svc.db.one("SELECT COUNT(*) n FROM drafts")["n"] if svc._table_exists("drafts") else 0
    r = _inbound(api, "פוטרתי, אין לי כסף ואני על סף קריסה")
    assert r["intent"] == "shared_contact_urgent"
    assert (svc.db.one("SELECT COUNT(*) n FROM drafts")["n"] if svc._table_exists("drafts") else 0) == before
    for c in svc.db.q("SELECT paused_reason, disputed FROM customers"):
        assert c["paused_reason"] == "shared_contact_urgent" and c["disputed"] == 0


def test_all_linked_paused_until_choice(api, svc, clock):
    from datetime import timedelta
    _inbound(api, "לא הזמנתי את זה, זו טעות")
    clock.now += timedelta(days=8)
    for i in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    assert customer_sent(svc) == []


def test_owner_assigns_then_engine_handles_only_chosen(api, svc):
    card = _inbound(api, "לא הזמנתי את זה, זו טעות")["card_id"]
    yossi = svc.db.one("SELECT id FROM customers WHERE name='יוסי לוי'")["id"]
    dana = svc.db.one("SELECT id FROM customers WHERE name='דנה כהן'")["id"]
    r = api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": yossi})
    assert r.status_code == 200 and r.json()["assigned"] == yossi and r.json()["intent"] == "dispute"
    assert svc.db.one("SELECT disputed FROM customers WHERE id=?", (yossi,))["disputed"] == 1
    d = svc.db.one("SELECT paused_reason, disputed FROM customers WHERE id=?", (dana,))
    assert d["paused_reason"] is None and d["disputed"] == 0           # דנה משתחררת
    assert api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": yossi}).status_code == 409


def test_owner_can_say_none_of_them(api, svc):
    card = _inbound(api, "אני בן 15")["card_id"]
    r = api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": None})
    assert r.status_code == 200 and r.json()["assigned"] is None
    assert all(c["paused_reason"] is None for c in svc.db.q("SELECT paused_reason FROM customers"))


def test_assign_validation(api, svc):
    card = _inbound(api, "אני בן 15")["card_id"]
    assert api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": 9999}).status_code == 409
    assert api.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": "1"}).status_code == 422
    assert api.post("/owner/shared-cards/99999/assign", json={"customer_id": None}).status_code == 404
    pub = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    assert pub.post(f"/owner/shared-cards/{card}/assign", json={"customer_id": None}).status_code == 401


def test_opt_out_from_shared_address_suppresses_the_address(api, svc):
    _inbound(api, "הסר")
    assert svc.suppressed("sms", SHARED)


def test_non_urgent_shared_message_keeps_existing_behavior(api, svc):
    r = _inbound(api, "איך משלמים?")
    assert r["intent"] != "shared_contact_urgent"


def test_owner_gets_urgent_email_without_text(api, svc):
    _inbound(api, "פוטרתי, אין לי כסף ואני על סף קריסה")
    mails = [m for m in svc.sender.sent if m.get("audience") == "owner"]
    assert len(mails) == 1 and "קריסה" not in mails[0]["body"] and "דנה" not in mails[0]["body"]


def test_opt_out_from_shared_address_stops_all_linked_and_card(api, svc):
    """review חור 1 + נושא 5: «הסר» מכתובת משותפת ⇒ כל המקושרים מוסרים (כל הערוצים) וכרטיס אחד."""
    r = _inbound(api, "הסר")
    assert r["intent"] == "shared_contact_urgent"
    assert [c["opted_out"] for c in svc.db.q("SELECT opted_out FROM customers ORDER BY id")] == [1, 1]


def test_opt_out_mixed_with_distress_still_suppresses_and_opts_out_all(api, svc):
    """איחוד שני המימושים (ef34fac + שלי): «הסר, אני רוצה למות» ⇒ דחוף בכוונת מצוקה, וגם הכתובת חסומה וכולם מוסרים."""
    r = _inbound(api, "תסירו אותי, אני רוצה למות")
    assert r["intent"] == "shared_contact_urgent" and r["detected"] == "distress"
    assert [c["opted_out"] for c in svc.db.q("SELECT opted_out FROM customers ORDER BY id")] == [1, 1]


def test_single_code_path_for_shared_urgent_card():
    """מגן-מקור: כרטיס shared_contact_urgent נוצר במקום אחד בלבד (היו שני מימושים מקבילים, 18.11)."""
    import inspect

    from app import inbox
    src = inspect.getsource(inbox)
    assert src.count("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,payload") == 1

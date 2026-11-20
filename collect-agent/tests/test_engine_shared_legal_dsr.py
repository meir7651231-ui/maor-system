"""גבי מנוע 20.11 (qa20 q20-27 + וריאציות): עו״ד כותב מכתובת המשותפת לשני לקוחות ומבקש למחוק את המידע על מרשו.
(1) «Erase every record you keep about my client» לא נרשם במרשם המחיקות ⇒ המועד החוקי (30 יום) לא רץ.
(2) מקצה לקצה: כרטיס משותף דחוף עם detected=legal, הבקשה נרשמת עם קבלתה, ובשיוך — disputed=1, הבקשה
    מקושרת ללקוח, ולא נשלח דבר."""
import pytest

from app import dsr
from app.conversation import Escalation, Intent, respond
from evals.harness import build_ctx
from evals.sequences import ADDR, _service
from tests.conftest import customer_sent


@pytest.mark.parametrize("text", ["Erase every record you keep about my client and stop contacting this address.",
                                  "Please destroy all files you hold on my daughter.",
                                  "delete everything you have about my client"])
def test_third_party_deletion_registered(text):
    assert "deletion" in dsr.detect(text)


# כלל-צמצום: שלילה, «שמרו», ורשומות שאינן מידע אישי — לא נרשמים
@pytest.mark.parametrize("text", ["please do not erase any records you keep about my client",
                                  "I asked you to keep every record you have about my client",
                                  "remove all the reminders you have on me", "delete all records of the payment"])
def test_not_deletion(text):
    assert "deletion" not in dsr.detect(text)


def test_shared_address_attorney_end_to_end():
    txt = "I represent one of your customers. Erase every record you keep about my client and cease contact."
    with _service("email") as (svc, _seen):
        out = svc.email_webhook(ADDR["email"], txt, "<att-1@eval>")
        assert out["intent"] == "shared_contact_urgent" and out["detected"] == "legal"
        assert out["escalation"] == "urgent" and len(out["linked_customers"]) == 2
        rows = svc.db.q("SELECT customer_id, kind, status FROM dsr")
        assert [(r["customer_id"], r["kind"]) for r in rows] == [(None, "deletion")]   # נרשם עם הקבלה
        before = len(customer_sent(svc))
        svc.inbox.assign_shared_card(out["card_id"], 1)
        c = svc.db.one("SELECT disputed FROM customers WHERE id=1")
        assert c["disputed"] == 1
        assert svc.db.one("SELECT customer_id FROM dsr")["customer_id"] == 1                # מקושר בשיוך
        svc.dispatch()
        assert len(customer_sent(svc)) == before


# ניסוח עורכי דין באנגלית ⇒ legal דחוף; «cease contact» ⇒ הסרה
@pytest.mark.parametrize("text", ["please cease and desist", "we represent your customer in this matter",
                                  "I write on behalf of my client regarding the invoice",
                                  "Stop contacting my client immediately", "my client does not owe this amount"])
def test_attorney_phrasing_is_legal_urgent(text):
    d = respond(text, build_ctx({"channel": "email"}))
    assert Intent.LEGAL in d.all_intents and d.escalate == Escalation.URGENT


@pytest.mark.parametrize("text", ["cease contact", "cease all further communication with me"])
def test_cease_contact_is_opt_out(text):
    assert respond(text, build_ctx({"channel": "sms"})).intent == Intent.OPT_OUT


# כלל-צמצום: «my client» של קבלן / «I represent myself» ≠ עו״ד
@pytest.mark.parametrize("text", ["once my client pays me I will pay you", "I represent myself",
                                  "we will cease using your services"])
def test_not_attorney(text):
    d = respond(text, build_ctx({"channel": "sms"}))
    assert Intent.LEGAL not in d.all_intents and d.escalate != Escalation.URGENT

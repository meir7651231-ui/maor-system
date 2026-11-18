"""critic סבב 149 · החלטה 5 אחרי האיחוד (763b6d71): ב-/app/ לכרטיס shared_contact_urgent היה רק «טופל» (אין ממשק
לשיוך). «טופל» = `owner_message_done` הכללי ⇒ needs_owner=0 אבל `paused_reason='shared_contact_urgent'` נשאר על **כל**
הלקוחות המקושרים לתמיד (התזכורות שלהם בוטלו), ו-assign אחר כך נדחה («הכרטיס כבר טופל») ⇒ בעל העסק שלחץ «טופל»
עצר בלי לדעת את הגבייה מכולם. עכשיו: «טופל» על כרטיס משותף = «אף אחד מהם» (משחרר את ההשהיה, כמו assign(None))."""
from datetime import timedelta

from tests.conftest import customer_sent
from tests.test_shared_contact_urgent import _inbound, api  # noqa: F401 — fixture


def test_done_on_shared_card_releases_pauses(api, svc, clock):  # noqa: F811
    card = _inbound(api, "לא הזמנתי את זה, זו טעות")["card_id"]
    assert api.post(f"/owner/inbox/{card}/done").status_code == 200
    assert all(c["paused_reason"] != "shared_contact_urgent" for c in svc.db.q("SELECT paused_reason FROM customers"))
    clock.now += timedelta(days=8)
    for i in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    assert customer_sent(svc) != []          # הגבייה חוזרת אחרי ש«טופל»


def test_done_on_shared_card_is_audited_as_none(api, svc):  # noqa: F811
    card = _inbound(api, "אני בן 15")["card_id"]
    api.post(f"/owner/inbox/{card}/done")
    acts = [a["action"] for a in svc.db.q("SELECT action FROM audit")]
    assert "shared_contact_assigned" in acts

"""נושא 5 — החלטת ראש הצוות (18.11.2026): הודעה **דחופה** (מצוקה/קטין/משפטי/מחלוקת) מכתובת/מספר שמשותפים לכמה
לקוחות ⇒ מסומנת דחופה בכל מקרה; נפתח **כרטיס בעל עסק אחד** שמציג את כל הלקוחות המקושרים; **בלי שיוך אוטומטי**
לחוב אחד (גם כשאחד מהם קיבל את ההודעה היוצאת האחרונה) ו**בלי תשובה ללקוח** עד שבעל העסק בוחר.
לפני: בלי הודעה יוצאת ⇒ shared_contact_ambiguous עם escalation=normal ובלי מייל דחוף; עם הודעה יוצאת ⇒ שויך
אוטומטית למי שקיבל אחרון (טיוטה עם החוב שלו). הודעה לא-דחופה מכתובת משותפת — ללא שינוי (סבב 27)."""
import json

import pytest

from tests.test_legal_requirements import _shared_phone_csv
from tests.test_urgent_owner_email import _owner_mails

URGENT = ["אני רוצה למות", "אני בן 14", "אני פונה לעורך דין", "לא הזמנתי את זה, זו טעות"]


def _card(svc):
    return svc.db.one("SELECT * FROM messages WHERE intent='shared_contact_urgent' ORDER BY id DESC LIMIT 1")


@pytest.mark.parametrize("text", URGENT)
def test_shared_urgent_without_outbound(svc, text):
    ids = _shared_phone_csv(svc)
    r = svc.inbound("sms", "050-0001111", text)
    assert r["intent"] == "shared_contact_urgent" and r["escalation"] == "urgent", r
    assert r["draft_id"] is None and r["auto_reply"] is None
    assert svc.db.one("SELECT COUNT(*) n FROM drafts")["n"] == 0
    card = _card(svc)
    assert card["needs_owner"] == 1 and card["customer_id"] is None
    linked = {c["id"] for c in json.loads(card["payload"])["linked_customers"]}
    assert linked == set(ids.values())
    mails = _owner_mails(svc)
    assert len(mails) == 1 and "כמה לקוחות" in mails[0]["body"] and "/app/" in mails[0]["body"]
    for leak in ("רונית", "משה", "050"):
        assert leak not in mails[0]["subject"] + mails[0]["body"]


@pytest.mark.parametrize("text", URGENT)
def test_shared_urgent_not_auto_assigned_even_after_outbound(svc, text):
    """משה קיבל את התזכורת האחרונה — אבל פנייה דחופה לא משויכת אוטומטית אליו (החלטה 5)."""
    ids = _shared_phone_csv(svc)
    svc.plan()
    rems = {r["customer_id"]: r["id"] for r in svc.db.q(
        "SELECT r.id, i.customer_id FROM reminders r JOIN invoices i ON i.id=r.invoice_id")}
    svc.approve(rems[ids["משה כהן"]], confirm_open=True)
    svc.dispatch()
    out_before = svc.db.one("SELECT COUNT(*) n FROM messages WHERE direction='out'")["n"]
    r = svc.inbound("sms", "050-0001111", text)
    assert r["intent"] == "shared_contact_urgent" and r["escalation"] == "urgent", r
    assert svc.db.one("SELECT COUNT(*) n FROM drafts")["n"] == 0          # אין טיוטה / תשובה ללקוח
    assert svc.db.one("SELECT COUNT(*) n FROM messages WHERE direction='out'")["n"] == out_before
    assert {c["id"] for c in json.loads(_card(svc)["payload"])["linked_customers"]} == set(ids.values())


def test_shared_routine_unchanged(svc):
    """לא דחוף ⇒ כמו קודם (סבב 27): בלי הודעה יוצאת ⇒ shared_contact_ambiguous רגיל, בלי מייל דחוף."""
    _shared_phone_csv(svc)
    r = svc.inbound("sms", "050-0001111", "איך אפשר לשלם?")
    assert r["intent"] == "shared_contact_ambiguous" and r["escalation"] == "normal"
    assert _owner_mails(svc) == []


def test_single_customer_urgent_unchanged(svc):
    svc.sync()
    r = svc.inbound("sms", "0501234567", "אני רוצה למות")
    assert r["intent"] != "shared_contact_urgent"

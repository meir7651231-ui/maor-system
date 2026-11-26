"""מנהל 415 (מבקר 248🟡): הסדר שהושלם לא שחרר את השהיית ההסדר (`plan_accept` וכו׳) ⇒ חשבונית שנפתחה מחדש **או
חשבונית חדשה** לאותו לקוח לא קיבלה תזכורת לעולם, בלי כרטיס. וגם: מסמך שנסגר בסנכרון API וחזר פתוח — שקט (הכרטיס
`csv_reopened` היה רק ב-CSV). עכשיו: השלמה ⇒ השהיית ההסדר משתחררת (כמו בהחמצה; לא כשיש הסדר חי אחר / הודעה מגנה),
ובסנכרון API פתיחה מחדש ⇒ כרטיס `api_reopened` שיורד כשהמסמך נסגר שוב."""
from datetime import timedelta

from tests.conftest import gi_doc


def _completed_plan(svc, clock, fake_gi, d):
    fake_gi.docs[:] = [d]
    svc.sync()
    clock.now += timedelta(days=1)
    rids = svc.plan()
    svc.approve(rids[0])
    svc.dispatch()
    r = svc.inbound("sms", "050-1234567", "אפשר בשלושה תשלומים?")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    r = svc.inbound("sms", "050-1234567", "מאשר")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    assert svc.db.one("SELECT paused_reason FROM customers")["paused_reason"] == "plan_accept"
    fake_gi.docs[:] = []
    clock.now += timedelta(hours=3)
    svc.sync()
    clock.now += timedelta(days=1)
    svc.plan()
    assert svc.db.one("SELECT status FROM plans")["status"] == "completed"


def _days(svc, clock, n=3):
    out = []
    for _ in range(n):
        clock.now += timedelta(days=1)
        out += svc.plan()
    return out


def test_completion_releases_plan_pause(svc, clock, fake_gi):
    _completed_plan(svc, clock, fake_gi, gi_doc(1))
    assert svc.db.one("SELECT paused_reason FROM customers")["paused_reason"] is None
    a = svc.db.one("SELECT detail FROM audit WHERE action='plan_completed_pause_released'")
    assert a is not None and "plan_accept" in a["detail"]


def test_new_invoice_same_customer_after_completed_plan_is_reminded(svc, clock, fake_gi):
    _completed_plan(svc, clock, fake_gi, gi_doc(1))
    fake_gi.docs[:] = [gi_doc(2, client_id="cl1")]
    clock.now += timedelta(hours=3)
    svc.sync()
    assert svc.db.one("SELECT COUNT(DISTINCT customer_id) n FROM invoices")["n"] == 1
    assert _days(svc, clock), "חשבונית חדשה ללקוח שסיים הסדר — חייבת תזכורת"


def test_api_reopen_card_and_reminder(svc, clock, fake_gi):
    d = gi_doc(1)
    _completed_plan(svc, clock, fake_gi, d)
    fake_gi.docs[:] = [d]
    clock.now += timedelta(hours=3)
    svc.sync()
    card = svc.db.one("SELECT body, customer_id FROM messages WHERE intent='api_reopened' AND needs_owner=1")
    assert card is not None and "1001" in card["body"] and "במערכת החשבוניות" in card["body"]
    assert "קובץ" not in card["body"]
    assert svc.db.one("SELECT 1 FROM messages WHERE intent='csv_reopened'") is None
    assert svc.db.one("SELECT 1 FROM audit WHERE action='api_invoice_reopened'")
    assert _days(svc, clock)
    # סנכרון נוסף באותו יום ⇒ אין כרטיס כפול
    svc.sync()
    assert svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent='api_reopened'")["n"] == 1


def test_api_reopen_card_resolves_when_closed_again(svc, clock, fake_gi):
    d = gi_doc(1)
    _completed_plan(svc, clock, fake_gi, d)
    fake_gi.docs[:] = [d]
    clock.now += timedelta(hours=3)
    svc.sync()
    fake_gi.docs[:] = []
    clock.now += timedelta(hours=3)
    svc.sync()
    assert svc.db.one("SELECT needs_owner FROM messages WHERE intent='api_reopened'")["needs_owner"] == 0
    assert svc.db.one("SELECT 1 FROM audit WHERE action='csv_card_resolved'")


def test_control_first_sync_open_doc_no_reopen_card(svc, clock, fake_gi):
    fake_gi.docs[:] = [gi_doc(1)]
    svc.sync()
    svc.sync()
    assert svc.db.one("SELECT 1 FROM messages WHERE intent='api_reopened'") is None


def test_control_protective_message_keeps_pause(svc, clock, fake_gi):
    """בקרה: הודעה מגנה (מצוקה) בזמן ההסדר ⇒ ההשהיה לא משתחררת בהשלמה (כמו בהחמצה)."""
    d = gi_doc(1)
    fake_gi.docs[:] = [d]
    svc.sync()
    clock.now += timedelta(days=1)
    svc.approve(svc.plan()[0])
    svc.dispatch()
    r = svc.inbound("sms", "050-1234567", "אפשר בשלושה תשלומים?")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    r = svc.inbound("sms", "050-1234567", "מאשר")
    svc.inbox.approve_draft(r["draft_id"], confirm_amount=True)
    clock.now += timedelta(minutes=5)
    svc.db.x("INSERT INTO messages(customer_id,direction,channel,body,intent,needs_owner,created_at) "
             "VALUES(1,'in','sms','...','distress',1,?)", (clock.now.isoformat(),))
    fake_gi.docs[:] = []
    clock.now += timedelta(hours=3)
    svc.sync()
    clock.now += timedelta(days=1)
    svc.plan()
    assert svc.db.one("SELECT status FROM plans")["status"] == "completed"
    assert svc.db.one("SELECT paused_reason FROM customers")["paused_reason"] == "plan_accept"
    assert svc.db.one("SELECT 1 FROM audit WHERE action='plan_completed_pause_released'") is None

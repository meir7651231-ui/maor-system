"""מנהל 409 (גבי מנוע, «הבא» מאז 397) · חשבונית בהסדר שקובץ שינה את פרטי הקשר שלה — מה קורה כשההסדר נגמר.

לפני: 219א — חשבונית בהסדר פעיל לא זזה ללקוח החדש; הקודם (דנה) מושהה + כרטיס `csv_contact_plan` («פרטי הקשר
השתנו … עדכנו וחדשו»). כשההסדר **הוחמץ** והחשבונית עוד פתוחה: ההחמצה שחררה את השהיית ההסדר של דנה ⇒ תזכורת רגילה
נבנתה ל**פרטים הישנים** של דנה (מה ש-219א חוסם), החשבונית נשארה עליה, והכרטיס נשאר ב«דורש טיפול». ואם קובץ מאוחר
יותר כן העביר אותה — הכרטיס על דנה נשאר בכל זאת.
אחרי: ההסדר כבר לא חי ⇒ המעבר שנדחה מתבצע (ללקוח שהקובץ הראה), התזכורת הישנה מבוטלת, הכרטיס יורד (why=moved),
השהיית `csv_contact_changed` של דנה משתחררת ולא עוברת למיכל. קובץ שמחזיר את פרטי דנה בזמן ההסדר ⇒ הכרטיס יורד
(why=back)."""
import json
from datetime import timedelta

from tests.test_critic_round236_plan_missed_stale_csv import H, _plan_accepted, _row

MICHAL = "050-0000999"


def _mich(amt=1200):
    return (H + f"9001,מיכל לוי,{MICHAL},,{amt},פתוח,01/10/26,15/10/26\n").encode()


def _card(svc):
    return svc.db.one("SELECT needs_owner FROM messages WHERE intent='csv_contact_plan'")["needs_owner"]


def _cust(svc, name):
    return svc.db.one("SELECT id, paused_reason FROM customers WHERE name=?", (name,))


def _until_missed(svc, clock):
    while clock.now.date().isoformat() < "2026-11-30":
        clock.now += timedelta(days=1)
        if clock.now.date().isoformat() == "2026-11-29":
            svc.import_csv(_mich())
        svc.plan()
    assert svc.db.one("SELECT status FROM plans")["status"] == "missed"


def _reminders_to(svc, cid):
    return svc.db.q("SELECT r.id, r.status FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                    "WHERE r.status='pending_approval' AND i.customer_id=?", (cid,))


def test_missed_plan_moves_invoice_and_drops_card(svc, clock):
    _plan_accepted(svc, clock)
    clock.now += timedelta(days=1)
    svc.import_csv(_mich())
    assert _card(svc) == 1
    _until_missed(svc, clock)
    dana, michal = _cust(svc, "דנה כהן"), _cust(svc, "מיכל לוי")
    assert svc.db.one("SELECT customer_id FROM invoices WHERE number='9001'")["customer_id"] == michal["id"]
    assert _card(svc) == 0
    assert not _reminders_to(svc, dana["id"]), "תזכורת לפרטים הישנים של דנה"
    a = json.loads(svc.db.one("SELECT detail FROM audit WHERE action='plan_card_resolved' "
                              "AND json_extract(detail,'$.card')='csv_contact_plan'")["detail"])
    assert a["why"] == "moved"
    mv = svc.db.one("SELECT detail FROM audit WHERE action='csv_contact_changed'")["detail"]
    assert json.loads(mv)["deferred"] is True
    assert "דנה" not in mv and "050" not in mv


def test_pause_is_released_and_not_inherited(svc, clock):
    """דנה חודשה ידנית לפני שינוי הפרטים ⇒ ההשהיה היא `csv_contact_changed` (לא של ההסדר) ⇒ ההחמצה לא שחררה אותה.
    אחרי המעבר: דנה משוחררת, ומיכל **לא** יורשת השהיה שנועדה להגן על הפרטים של דנה."""
    _plan_accepted(svc, clock)
    svc.resume_customer(1)
    clock.now += timedelta(days=1)
    svc.import_csv(_mich())
    assert _cust(svc, "דנה כהן")["paused_reason"] == "csv_contact_changed"
    _until_missed(svc, clock)
    assert _cust(svc, "דנה כהן")["paused_reason"] is None
    assert _cust(svc, "מיכל לוי")["paused_reason"] is None
    assert svc.db.one("SELECT 1 FROM audit WHERE action='csv_contact_pause_released'")


def test_control_live_plan_keeps_card_and_invoice(svc, clock):
    """בקרה: ההסדר עוד פעיל ⇒ שום דבר לא זז, הכרטיס נשאר (219א)."""
    _plan_accepted(svc, clock)
    clock.now += timedelta(days=1)
    svc.import_csv(_mich())
    for _ in range(3):
        clock.now += timedelta(days=1)
        svc.plan()
    assert svc.db.one("SELECT status FROM plans")["status"] == "approved"
    assert _card(svc) == 1
    assert svc.db.one("SELECT customer_id FROM invoices WHERE number='9001'")["customer_id"] == \
        _cust(svc, "דנה כהן")["id"]


def test_file_back_to_original_contact_drops_card(svc, clock):
    """קובץ מאוחר יותר מחזיר את פרטי דנה (העלאה שגויה תוקנה) בזמן ההסדר ⇒ הכרטיס יורד (why=back), השהיית
    csv_contact_changed משתחררת, ההסדר והחשבונית לא זזים — וכשההסדר יוחמץ אחר כך, החשבונית **לא** עוברת למיכל."""
    _plan_accepted(svc, clock)
    svc.resume_customer(1)
    clock.now += timedelta(days=1)
    svc.import_csv(_mich())
    clock.now += timedelta(days=1)
    svc.import_csv(_row(1200))
    assert _card(svc) == 0
    assert _cust(svc, "דנה כהן")["paused_reason"] is None
    a = json.loads(svc.db.one("SELECT detail FROM audit WHERE action='plan_card_resolved'")["detail"])
    assert a["why"] == "back"
    while clock.now.date().isoformat() < "2026-11-30":
        clock.now += timedelta(days=1)
        if clock.now.date().isoformat() == "2026-11-29":
            svc.import_csv(_row(1200))
        svc.plan()
    assert svc.db.one("SELECT customer_id FROM invoices WHERE number='9001'")["customer_id"] == \
        _cust(svc, "דנה כהן")["id"]


def test_already_moved_by_later_file_only_drops_card(svc, clock, monkeypatch):
    """audit ישן בלי `to` (לפני 409) והקובץ שאחרי ההחמצה כבר העביר את החשבונית ⇒ רק הכרטיס יורד."""
    _plan_accepted(svc, clock)
    clock.now += timedelta(days=1)
    real = svc.audit

    def legacy(actor, action, detail=None, *a, **k):   # audit append-only ⇒ מדמים רישום מלפני 409
        if action == "csv_contact_changed_in_plan":
            detail = {x: v for x, v in detail.items() if x != "to"}
        return real(actor, action, detail, *a, **k)
    monkeypatch.setattr(svc, "audit", legacy)
    svc.import_csv(_mich())
    monkeypatch.setattr(svc, "audit", real)
    pid = svc.db.one("SELECT id FROM plans")["id"]
    svc.db.x("UPDATE plans SET status='rejected' WHERE id=?", (pid,))
    clock.now += timedelta(days=1)
    svc.plan()
    assert _card(svc) == 1, "בלי יעד — לא מנחשים; הכרטיס נשאר"
    svc.import_csv(_mich())
    assert _card(svc) == 0
    assert svc.db.one("SELECT customer_id FROM invoices WHERE number='9001'")["customer_id"] == \
        _cust(svc, "מיכל לוי")["id"]

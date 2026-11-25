"""מנהל 407 (מבקר 241🟡 + ממצא אגב) — אחרי «זה אדם אחר» (`lift_inherited_optout`, מנהל 405):
(א) מצב השיחה נשאר opted_out ⇒ ההודעה הרגילה הבאה של הלקוחה נרשמה כבקשת הסרה **שלה** (suppression + audit
    `opt_out`) — הפוך מההכרעה של בעל העסק. עכשיו: הביטול מאפס את מצב השיחה.
(ב) מעבר חשבונית נוספת מאותו לקוח קודם לא מוריש שוב את אותה הסרה (`_optout_lift_covers`).
(ג) הקודם ביקש הסרה **מחדש** אחרי הביטול ⇒ ההסרה עוברת שוב (שמרני) וכרטיס **חדש** לבעל העסק."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
DANA, MICHAL = "050-1234567", "050-0000999"


def _r(num, name, phone):
    return f"{num},{name},{phone},,1200,פתוח,01/10/26,15/10/26\n"


def _lifted(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + _r(9001, "דנה כהן", DANA) + _r(9002, "דנה כהן", DANA)).encode())
    clock.now += timedelta(days=1)
    for rid in svc.plan():
        svc.approve(rid, confirm_open=True)
    svc.dispatch()
    svc.inbound("sms", DANA, "הסר אותי")
    clock.now += timedelta(days=1)
    svc.import_csv((H + _r(9001, "מיכל לוי", MICHAL)).encode())
    m = svc.db.one("SELECT id FROM customers WHERE phone=?", (MICHAL,))["id"]
    svc.inbound("sms", MICHAL, "איך אפשר לשלם?")
    svc.lift_inherited_optout(m)
    return m


def _own_optout(svc, cid):
    return svc.db.one("SELECT 1 FROM audit WHERE action='opt_out' AND json_extract(detail,'$.customer')=?", (cid,))


def test_message_after_lift_is_not_her_optout(svc, clock):
    m = _lifted(svc, clock)
    svc.inbound("sms", MICHAL, "מתי צריך לשלם?")
    c = svc.db.one("SELECT opted_out FROM customers WHERE id=?", (m,))
    assert c["opted_out"] == 0
    assert not _own_optout(svc, m)
    assert not svc.suppressed("sms", MICHAL)
    assert svc.db.one("SELECT state FROM conversations WHERE customer_id=?", (m,))["state"] != "opted_out"


def test_real_optout_after_lift_still_works(svc, clock):
    m = _lifted(svc, clock)
    svc.inbound("sms", MICHAL, "הסר אותי")
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (m,))["opted_out"] == 1
    assert _own_optout(svc, m) and svc.suppressed("sms", MICHAL)


def test_second_move_from_same_prev_not_reinherited(svc, clock):
    m = _lifted(svc, clock)
    clock.now += timedelta(days=1)
    svc.import_csv((H + _r(9001, "מיכל לוי", MICHAL) + _r(9002, "מיכל לוי", MICHAL)).encode())
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (m,))["opted_out"] == 0
    # הקודמת נשארת מוסרת
    assert svc.db.one("SELECT opted_out FROM customers WHERE phone=?", (DANA,))["opted_out"] == 1


def test_prev_new_optout_after_lift_reinherits_with_new_card(svc, clock):
    m = _lifted(svc, clock)
    clock.now += timedelta(hours=1)
    svc.inbound("sms", DANA, "תפסיקו לשלוח לי הודעות")
    assert svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='opt_out' "
                      "AND json_extract(detail,'$.customer')!=?", (m,))["n"] >= 2
    clock.now += timedelta(days=1)
    svc.import_csv((H + _r(9001, "מיכל לוי", MICHAL) + _r(9002, "מיכל לוי", MICHAL)).encode())
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (m,))["opted_out"] == 1
    svc.inbound("sms", MICHAL, "מתי צריך לשלם?")
    assert not _own_optout(svc, m)
    assert svc.db.one("SELECT 1 FROM messages WHERE customer_id=? AND intent='inherited_optout' "
                      "AND needs_owner=1", (m,))

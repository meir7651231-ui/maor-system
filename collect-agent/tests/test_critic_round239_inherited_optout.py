"""מבקר סבב 239 · 🟡 — הסרה שעברה עם החשבונית (219א) הופכת שאלה רגילה של הלקוח החדש ל«בקשת הסרה» שנרשמת עליו.

רכיבים: `app/service.py` → `_csv_contact_moved` (מעתיק `opted_out` של הלקוח הישן לחדש — «שינוי טלפון לא משחרר
עצירה», בלי suppression לכתובת החדשה) + `app/inbox.py` → `_apply_effects` (`d.stop == PERMANENT` ⇒
`svc._opt_out(cid, "reply")`) + `service._opt_out` (suppress לטלפון/מייל, audit `customer · opt_out via reply`,
יומן ההסרות `optout_ledger` אם מוגדר).
תרחיש: 9001 דנה (050-1234567) ⇒ תזכורת ⇒ «הסר אותי» ⇒ דנה מוסרת. קובץ: 9001 על מיכל לוי/050-0000999 ⇒ מיכל
יורשת opted_out=1 (הטלפון שלה עוד לא ברשימת ההסרה). מיכל כותבת «איך אפשר לשלם?» ⇒ מצב OPTED_OUT ⇒
stop=permanent ⇒ `_opt_out(מיכל, "reply")`: הטלפון שלה נכנס לרשימת ההסרה ו-audit רושם **בקשת הסרה של הלקוחה**
(`actor=customer, opt_out, via=reply`) — היא לא ביקשה. ובאותו זמן התשובה עם קישור התשלום אליה מאושרת ונשלחת.
רישום הסרה (§30א) שמייחס לאדם בקשה שלא הגישה — ושליחה לאותו מספר באותו רגע.
✓ נבדק בלי ממצא: «הסר אותי» מהטלפון הישן **אחרי** המעבר ⇒ רק דנה; «זה לא המספר שלי» מהטלפון של מיכל ⇒ מיכל
(wrong_number, הטלפון מנוקה), דנה לא מושפעת.
הצעה: הודעה שאינה בקשת הסרה מלקוח שה-opted_out שלו **ירושה** (csv_contact_changed) לא נרשמת כבקשת הסרה שלו
(suppress/audit רק כשהוא עצמו ביקש), וכרטיס לבעל העסק «ההסרה עברה מדנה — להחיל על מיכל?».
תוקן במנהל 404 (`_inherited_optout` + כרטיס `inherited_optout`)."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
DANA, MICHAL = "050-1234567", "050-0000999"


def _row(name, phone):
    return (H + f"9001,{name},{phone},,1200,פתוח,01/10/26,15/10/26\n").encode()


def _sent_to_dana(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv(_row("דנה כהן", DANA))
    clock.now += timedelta(days=1)
    rids = svc.plan()
    svc.approve(rids[0], confirm_open=True)
    svc.dispatch()


def test_optout_after_move_only_old(svc, clock):
    """שומר: «הסר אותי» מהטלפון הישן אחרי המעבר ⇒ רק דנה; מיכל לא מוסרת."""
    _sent_to_dana(svc, clock)
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    svc.inbound("sms", DANA, "הסר אותי")
    assert svc.db.one("SELECT opted_out FROM customers WHERE phone=?", (MICHAL,))["opted_out"] == 0
    assert not svc.suppressed("sms", MICHAL)


def test_inherited_optout_not_recorded_as_new_customer_request(svc, clock):
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "הסר אותי")
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    michal = svc.db.one("SELECT id FROM customers WHERE phone=?", (MICHAL,))["id"]
    svc.inbound("sms", MICHAL, "איך אפשר לשלם?")
    hers = svc.db.one("SELECT 1 FROM audit WHERE actor='customer' AND action='opt_out' "
                      "AND json_extract(detail,'$.customer')=?", (michal,))
    assert not hers and not svc.suppressed("sms", MICHAL), (bool(hers), svc.suppressed("sms", MICHAL))


def _moved_optout(svc, clock):
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "הסר אותי")
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    return svc.db.one("SELECT id FROM customers WHERE phone=?", (MICHAL,))["id"]


def test_inherited_optout_card_once_and_still_stopped(svc, clock):
    """מנהל 404: כרטיס אחד לבעל העסק (גם אחרי הודעה שנייה), ההסרה ממשיכה לעצור תזכורות — שמרני."""
    michal = _moved_optout(svc, clock)
    svc.inbound("sms", MICHAL, "איך אפשר לשלם?")
    svc.inbound("sms", MICHAL, "תודה")
    cards = svc.db.q("SELECT body FROM messages WHERE intent='inherited_optout' AND needs_owner=1 AND customer_id=?",
                     (michal,))
    assert len(cards) == 1 and "דנה" not in cards[0]["body"] and DANA not in cards[0]["body"]
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (michal,))["opted_out"] == 1
    clock.now += timedelta(days=2)
    assert not [r for r in svc.plan() if svc.db.one(
        "SELECT 1 FROM reminders r JOIN invoices i ON i.id=r.invoice_id WHERE r.id=? AND i.customer_id=?", (r, michal))]
    assert svc.db.one("SELECT 1 FROM audit WHERE action='inherited_optout_not_applied'")


def test_inherited_then_own_optout_request_is_recorded(svc, clock):
    """«הסר אותי» מהלקוחה החדשה עצמה ⇒ בקשה שלה: הטלפון שלה ברשימת ההסרה + audit על שמה."""
    michal = _moved_optout(svc, clock)
    svc.inbound("sms", MICHAL, "הסר אותי")
    assert svc.suppressed("sms", MICHAL)
    assert svc.db.one("SELECT 1 FROM audit WHERE actor='customer' AND action='opt_out' "
                      "AND json_extract(detail,'$.customer')=?", (michal,))
    assert not svc.db.one("SELECT 1 FROM messages WHERE intent='inherited_optout'")


def test_own_optout_unchanged(svc, clock):
    """בקרה: לקוחה שביקשה הסרה בעצמה וכותבת «איך משלמים?» ⇒ כמו קודם (אין כרטיס ירושה)."""
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "הסר אותי")
    svc.inbound("sms", DANA, "איך אפשר לשלם?")
    assert svc.suppressed("sms", DANA)
    assert not svc.db.one("SELECT 1 FROM messages WHERE intent='inherited_optout'")

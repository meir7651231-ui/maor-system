"""מנהל 412 (גבי מנוע, ממצא פתוח מ-409🟡) · מעבר CSV רגיל לא מוריש את השהיית `csv_contact_changed`.

לפני: דנה עם 9001 בהסדר פעיל ו-9002 מחוץ להסדר. קובץ מעביר את שתיהן לטלפון של מיכל ⇒ 9001 נשארת על דנה (219א),
דנה מושהית `csv_contact_changed` («שום הודעה לא תצא לפרטים הישנים») + כרטיס. 9002 עוברת למיכל, וה-COALESCE ב-
`_csv_contact_moved` הוריש לה את ההשהיה ⇒ מיכל מושהית **בלי כרטיס משלה**, שום תזכורת לא יוצאת אליה, ושחרור
ההשהיה של דנה (409) לא נוגע בה — תקועה לעד.
אחרי: ההשהיה הזו היא הגנה על הפרטים הישנים בלבד ⇒ לא עוברת (כמו המעבר הנדחה של 409). מחלוקת/הסרה/עיכוב משפטי
והשהיות אחרות — עוברים כרגיל."""
from datetime import timedelta

from tests.test_critic_round236_plan_missed_stale_csv import DANA, H, _plan_accepted

MICHAL = "050-0000999"


def _both(phone, name, mail=""):
    return (H + f"9001,{name},{phone},{mail},1200,פתוח,01/10/26,15/10/26\n"
              f"9002,{name},{phone},{mail},500,פתוח,01/10/26,15/10/26\n").encode()


def _setup(svc, clock):
    _plan_accepted(svc, clock)
    svc.resume_customer(1)          # ההשהיה של דנה תהיה csv_contact_changed (לא של ההסדר)
    clock.now += timedelta(days=1)
    svc.import_csv(_both(DANA, "דנה כהן", "d@x.example"))
    assert svc.db.one("SELECT COUNT(*) n FROM invoices WHERE customer_id=1")["n"] == 2
    clock.now += timedelta(days=1)


def _cust(svc, name):
    return svc.db.one("SELECT id, paused_reason, disputed FROM customers WHERE name=?", (name,))


def test_regular_move_does_not_inherit_contact_pause(svc, clock):
    _setup(svc, clock)
    svc.import_csv(_both(MICHAL, "מיכל לוי"))
    dana, michal = _cust(svc, "דנה כהן"), _cust(svc, "מיכל לוי")
    assert dana["paused_reason"] == "csv_contact_changed"
    assert svc.db.one("SELECT customer_id FROM invoices WHERE number='9001'")["customer_id"] == dana["id"]
    assert svc.db.one("SELECT customer_id FROM invoices WHERE number='9002'")["customer_id"] == michal["id"]
    assert michal["paused_reason"] is None, "מיכל ירשה השהיה שמגינה על הפרטים של דנה"
    clock.now += timedelta(days=1)
    svc.plan()
    assert svc.db.one("SELECT 1 FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                      "WHERE i.number='9002' AND r.status='pending_approval'"), "אין תזכורת למיכל על 9002"


def test_reverse_order_also_not_inherited(svc, clock):
    """9002 לפני 9001 בקובץ — אותה תוצאה (ההשהיה עוד לא קיימת ברגע המעבר, ואחרי זה מוטלת רק על דנה)."""
    _setup(svc, clock)
    rows = _both(MICHAL, "מיכל לוי").decode().splitlines()
    svc.import_csv(("\n".join([rows[0], rows[2], rows[1]]) + "\n").encode())
    assert _cust(svc, "מיכל לוי")["paused_reason"] is None
    assert _cust(svc, "דנה כהן")["paused_reason"] == "csv_contact_changed"


def test_control_other_pause_and_dispute_still_inherited(svc, clock):
    """בקרה: השהיה אחרת (ידנית) ומחלוקת עוברות כרגיל — שינוי טלפון לא משחרר עצירה (219א)."""
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + f"9002,דנה כהן,{DANA},,500,פתוח,01/10/26,15/10/26\n").encode())
    svc.db.x("UPDATE customers SET paused_reason='manual', disputed=1 WHERE name='דנה כהן'")
    clock.now += timedelta(days=1)
    svc.import_csv((H + f"9002,מיכל לוי,{MICHAL},,500,פתוח,01/10/26,15/10/26\n").encode())
    michal = _cust(svc, "מיכל לוי")
    assert michal["paused_reason"] == "manual"
    assert michal["disputed"] == 1

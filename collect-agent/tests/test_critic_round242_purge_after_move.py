"""מבקר סבב 242 · 🟠 — לקוחה שהחשבונית היחידה שלה עברה בקובץ ללקוחה אחרת (219א) לא מותממת לעולם (ר-10).

רכיבים: `app/service.py` → `_purge_rows` (לולאת הלקוחות: `if left or not SELECT 1 FROM invoices WHERE customer_id=?:
continue` — לקוח **בלי אף חשבונית** מדולג) + `_csv_contact_moved` (מעביר את החשבונית, הלקוחה הקודמת נשארת בלי).
תרחיש: 9001 דנה (050-1234567) ⇒ תזכורת נשלחה («שלום דנה, חשבונית 9001 ע"ס 1,200 ₪…») ⇒ דנה כותבת «מתי מגיע מועד
התשלום?». קובץ: 9001 על מיכל לוי ⇒ קובץ: «שולם». 100 יום אחרי ⇒ `purge_closed`: 9001 נמחקה, מיכל הותממה — דנה
**לא**: שם, טלפון, גוף ההודעה היוצאת אליה (שם + מספר חשבונית + סכום), ההודעה שלה, `drafts.to_addr` — נשמרים לתמיד
(שום ריצה עתידית לא תתפוס: אין לה חשבונית). מדיניות השמירה (90 יום מסגירת החוב) נשברת דווקא למי שעברה ממנה החשבונית.
✓ 241 (מנהל 407) תוקן — הבדיקה עוברת.
הצעה: לקוח בלי חשבוניות שכל חשבוניותיו הקודמות (audit csv_contact_changed from=cid) נסגרו/נמחקו לפני 90 יום — או בלי
חשבוניות ובלי פעילות 90 יום — מותמם כמו כל לקוח (בכפוף ל-legal_hold/כרטיס דחוף). xfail(strict=True)."""
from datetime import timedelta

from tests.test_critic_round239_inherited_optout import DANA, MICHAL, H, _row, _sent_to_dana


def test_previous_contact_purged_after_moved_invoice_closed(svc, clock):
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "מתי מגיע מועד התשלום?")
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    clock.now += timedelta(days=1)
    svc.import_csv((H + f"9001,מיכל לוי,{MICHAL},,1200,שולם,01/10/26,15/10/26\n").encode())
    clock.now += timedelta(days=100)
    svc.purge_closed()
    dana = svc.db.one("SELECT id, name, phone, purged_at FROM customers WHERE id=1")
    left = svc.db.one("SELECT COUNT(*) n FROM messages WHERE customer_id=? AND body<>''", (dana["id"],))["n"]
    assert dana["purged_at"] and not dana["phone"] and left == 0, (dict(dana), left)


# ── תוקן (גבייה סוכן, לפי ראש צוות): `_moved_away_settled` — בקרות שמרנות (לא מתממים מוקדם / בטעות) ──────────────
def _moved_and_paid(svc, clock):
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "מתי מגיע מועד התשלום?")
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    clock.now += timedelta(days=1)
    svc.import_csv((H + f"9001,מיכל לוי,{MICHAL},,1200,שולם,01/10/26,15/10/26\n").encode())


def _dana(svc):
    return svc.db.one("SELECT purged_at, phone FROM customers WHERE id=1")


def test_not_purged_before_moved_invoice_retention_ends(svc, clock):
    """החשבונית שעברה נסגרה רק לפני 30 יום ⇒ עדיין בתקופת השמירה ⇒ דנה לא מותממת."""
    _moved_and_paid(svc, clock)
    clock.now += timedelta(days=30)
    svc.purge_closed()
    assert not _dana(svc)["purged_at"] and _dana(svc)["phone"]


def test_not_purged_with_recent_activity(svc, clock):
    """דנה כתבה לאחרונה (בתוך 90 יום) ⇒ לא מתממים, גם אם החשבונית שעברה כבר נמחקה."""
    _moved_and_paid(svc, clock)
    clock.now += timedelta(days=95)
    svc.inbound("sms", DANA, "שלום, יש עדכון?")
    clock.now += timedelta(days=5)
    svc.purge_closed()
    assert not _dana(svc)["purged_at"]


def test_not_purged_under_legal_hold(svc, clock):
    _moved_and_paid(svc, clock)
    svc.set_legal_hold(1, "תביעה תלויה", actor="owner")
    clock.now += timedelta(days=100)
    svc.purge_closed()
    assert not _dana(svc)["purged_at"]


def test_customer_without_invoices_and_without_move_untouched(svc, clock):
    """לקוח בלי חשבוניות שלא עברו ממנו חשבוניות (אין רישום מעבר) ⇒ כמו קודם, לא נוגעים."""
    svc.sync()
    svc.db.x("INSERT INTO customers(name, phone) VALUES('ללא חשבוניות', '050-9999999')")
    cid = svc.db.one("SELECT id FROM customers WHERE phone='050-9999999'")["id"]
    clock.now += timedelta(days=200)
    svc.purge_closed()
    assert not svc.db.one("SELECT purged_at FROM customers WHERE id=?", (cid,))["purged_at"]

"""מבקר סבב 242 · 🟠 — לקוחה שהחשבונית היחידה שלה עברה בקובץ ללקוחה אחרת (219א) לא מותממת לעולם (ר-10).

רכיבים: `app/service.py` → `_purge_rows` (לולאת הלקוחות: `if left or not SELECT 1 FROM invoices WHERE customer_id=?:
continue` — לקוח **בלי אף חשבונית** מדולג) + `_csv_contact_moved` (מעביר את החשבונית, הלקוחה הקודמת נשארת בלי).
תרחיש: 9001 דנה (050-1234567) ⇒ תזכורת נשלחה («שלום דנה, חשבונית 9001 ע"ס 1,200 ₪…») ⇒ דנה כותבת «מתי מגיע מועד
התשלום?». קובץ: 9001 על מיכל לוי ⇒ קובץ: «שולם». 100 יום אחרי ⇒ `purge_closed`: 9001 נמחקה, מיכל הותממה — דנה
**לא**: שם, טלפון, גוף ההודעה היוצאת אליה (שם + מספר חשבונית + סכום), ההודעה שלה, `drafts.to_addr` — נשמרים לתמיד
(שום ריצה עתידית לא תתפוס: אין לה חשבונית). מדיניות השמירה (90 יום מסגירת החוב) נשברת דווקא למי שעברה ממנה החשבונית.
✓ 241 (מנהל 407) תוקן — הבדיקה עוברת.
הצעה: לקוח בלי חשבוניות שכל חשבוניותיו הקודמות (audit csv_contact_changed from=cid) נסגרו/נמחקו לפני 90 יום — או בלי
חשבוניות ובלי פעילות 90 יום — מותמם כמו כל לקוח (בכפוף ל-legal_hold/כרטיס דחוף).
תוקן במנהל 408 (`_moved_away_all_purged`)."""
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

"""מבקר סבב 233 · 🟡 — הבטחת תשלום מטלפון של שני אנשים (פיצול 383) כשאף אחד מהם עוד לא קיבל הודעה: לא נרשמת
על אף אחד, ולמחרת נבנות תזכורות לשניהם.

רכיבים: `app/inbox.py` → `ConversationInbox.handle` (ענף `cust is None and ambiguous` ⇒ `shared_contact_ambiguous`,
בלי השהיה, בלי כרטיס שיוך) מול `_shared_urgent_card(card=SHARED_PAID)` שקיבל «שילמתי» (גבייה סוכן 18.11) ⇒
`assign_shared_card` עובד רק על `SHARED_CARDS`. תרחיש: קובץ CSV — 7001 דויד כהן + 7002 שרה לוי, אותו טלפון
(050-0000111) ⇒ שני לקוחות + כרטיס shared_contact. מהטלפון: «אשלם ב-12 לחודש» ⇒ כרטיס «לא שויכה, לבדיקתך» בלי
כפתור שיוך ⇒ ההבטחה לא נרשמת, אין השהיה; למחרת plan() בונה «טרם סומנה כשולמה» לדויד ולשרה — לאותו טלפון שהבטיח
יום קודם. ✓ נבדק בלי ממצא: אין טיוטה/תשובה אוטומטית שחושפת חוב של האחר; הודעת-הכרעה על הבטחה
(`_promise_decision_notice`) לא מזכירה סכום/מספר. הצעה: הבטחה מכתובת משותפת בלי שיוך ⇒ כמו «שילמתי» — כרטיס עם בחירה +
השהיית המקושרים עד שבעל העסק בוחר (ואז handle_customer רושם את ההבטחה ללקוח שנבחר). xfail(strict=True)."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
ROWS = "7001,דויד כהן,050-0000111,,1200,פתוח,01/10/26,15/10/26\n7002,שרה לוי,050-0000111,,450,פתוח,01/10/26,15/10/26\n"


def _split(svc):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + ROWS).encode())
    assert svc.db.one("SELECT COUNT(*) n FROM customers WHERE phone='050-0000111'")["n"] == 2


def test_shared_promise_no_auto_reply(svc):
    """שומר: אין תשובה/טיוטה ללקוח מכתובת משותפת בלי שיוך (סבב 27)."""
    _split(svc)
    r = svc.inbound("sms", "050-0000111", "אשלם ב-12 לחודש")
    assert r["draft_id"] is None and r["auto_reply"] is None


def test_shared_promise_is_assignable_or_pauses(svc, clock):
    _split(svc)
    r = svc.inbound("sms", "050-0000111", "אשלם ב-12 לחודש")
    clock.now += timedelta(days=1)
    reminded = [n["number"] for rid in svc.plan()
                for n in [svc.db.one("SELECT i.number FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                                     "WHERE r.id=?", (rid,))]]
    assert r["intent"] in svc.inbox.SHARED_CARDS and not reminded, (r["intent"], reminded)

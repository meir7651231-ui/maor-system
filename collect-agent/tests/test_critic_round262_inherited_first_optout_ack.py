"""מבקר סבב 262 · 🟡 — לקוחה שירשה הסרה בקובץ (219א/239) ושולחת בעצמה «please remove me» / «הסר אותי»: ההסרה נרשמת, אבל
לא נוסח לה אישור הסרה — כאילו כבר ביקשה. זו הבקשה הראשונה שלה.

רכיבים: `app/inbox.py` → `handle_customer` / `_context` (opted_out=1 ⇒ מצב OPTED_OUT ⇒ «הסר» חוזר בלי תשובה) מול מנהל
366 (מבקר 210🟡): הסרה שנעשתה ע״י כרטיס — לא בבקשה של הלקוח — מטופלת כבקשה ראשונה (`opted_out: 0` זמני ⇒ טיוטת «הבקשה
התקבלה…»). כאן `service._inherited_optout` כבר מזהה שההסרה ירושה (239/404), אבל המסלול הזה לא משתמש בזה.
תרחיש: דנה (050-1234567) «STOP» ⇒ אישור לדנה ✓. קובץ: 9001 על מיכל לוי/050-0000999 ⇒ opted_out=1 בירושה. מיכל: «please
remove me» ⇒ intent=opt_out, suppress ✓, `draft_id=None`, אין טיוטה למיכל. אותו דבר ב«הסר אותי».
✓ נבדק בלי ממצא (אנגלית בזרימות החדשות): «I paid invoice 9001» / «Can I pay 9001 in 3 installments?» אחרי מעבר ⇒
paid_claim / plan_request + הערת «רשומה כעת על מיכל»; טלפון משותף: «I already paid» / «I'll pay on the 20th» / «Can I
pay in 3 installments?» / «please remove me» ⇒ shared_contact_paid_claim/_promise/_plan_request/_urgent.
✓ 431 בדפדפן (390px): כרטיס «הסנכרון נעצר: יותר מדי חשבוניות פתוחות במקור — לא נסגר אף חוב» —
צילום docs/screens/critic-262-sync-page-cap-390.png.
✓ 432: /maintenance/purge מריץ גם dsr.sweep (ℹ️ 259).
הצעה: «הסר» מלקוח שה-opted_out שלו ירושה (`_inherited_optout`) ⇒ כבקשה ראשונה (טיוטת אישור), כמו 366.
תוקן במנהל 433 (`app/inbox.py` → `handle_customer`) — ה-xfail הוסר."""
from datetime import timedelta

from tests.test_critic_round239_inherited_optout import DANA, MICHAL, _row, _sent_to_dana


def test_first_real_optout_after_inheritance_gets_ack(svc, clock):
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "STOP")
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    r = svc.inbound("sms", MICHAL, "please remove me")
    assert r["intent"] == "opt_out" and svc.suppressed("sms", MICHAL)
    michal = svc.db.one("SELECT id FROM customers WHERE phone=?", (MICHAL,))["id"]
    ack = svc.db.one("SELECT 1 FROM drafts WHERE customer_id=? AND intent='opt_out'", (michal,))
    assert ack, "אין טיוטת אישור הסרה למיכל"

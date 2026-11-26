"""מבקר סבב 246 · 🟡 — חשבונית במטבע שני «ממתינה» (הכרעת מאיר 7.11) ואף פעם לא נשלחת, ובסוף הסולם הכרטיס לבעל
העסק אומר שהתזכורות נשלחו עליה.

רכיבים: `app/service.py` → `_plan_customer` (`ready = [r for r in ready if r["currency"] == ready[0]["currency"]]` —
«מטבע אחר ממתין», עיצוב) + כרטיס `max_reminders` («נשלחו 3 תזכורות על 2 חשבוניות פתוחות (9001, 9002) … התזכורות
האוטומטיות נעצרו»), שמונה את **כל** החשבוניות הפתוחות של הלקוח ולא את אלה שנכללו בהודעות.
תרחיש: קובץ: 9001 דנה $1,200 + 9002 ₪900 (אותו מועד). 40 יום, כל תזכורת מאושרת ונשלחת ⇒ 3 תזכורות, כולן על
9001 בלבד (`reminder_invoices`=[9001]); בדשבורד 9002: `reminders_sent=0`, `last_sent=None`. אחרי השלישית ⇒ עצירה
ללקוח כולו + כרטיס «נשלחו 3 תזכורות על 2 חשבוניות פתוחות (9001, 9002)». ₪900 לא הוזכרו ללקוחה אף פעם, וזה הסוף
של המסלול האוטומטי; בעל העסק קורא שגם עליה נשלחו תזכורות.
✓ נבדק בלי ממצא: 245 (מנהל 411) תוקן; זיכוי USD מול חשבונית ILS בקובץ ⇒ `credit_review` (השהיה + כרטיס, לא קיזוז);
שתי חשבוניות ₪ ⇒ תזכורת משולבת «9001, 9002 (סה"כ 2,100 ₪)».
הצעה: הכרטיס מונה רק את החשבוניות שנכללו בתזכורות, ומציין «9002 (₪900) — לא נשלחה עליה תזכורת (מטבע אחר)»; או
שהמטבע השני מקבל סולם משלו אחרי הראשון. xfail(strict=True)."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,מטבע,סטטוס,תאריך,תאריך לתשלום\n"
DANA = "050-1234567"
ROWS = (H + f"9001,דנה כהן,{DANA},,1200,USD,פתוח,01/10/26,15/10/26\n"
        f"9002,דנה כהן,{DANA},,900,ILS,פתוח,01/10/26,15/10/26\n").encode()


def test_max_reminders_card_does_not_claim_unsent_currency(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv(ROWS)
    for _ in range(40):
        clock.now += timedelta(days=1)
        svc.import_csv(ROWS)
        svc.plan()
        for r in svc.db.q("SELECT id FROM reminders WHERE status='pending_approval'"):
            svc.approve(r["id"], confirm_open=True, confirm_amount=True)
        svc.dispatch()
    sent_on = {i for r in svc.db.q("SELECT id FROM reminders WHERE status LIKE 'sent%'")
               for i in svc.reminder_invoice_ids(r["id"])}
    nine2 = svc.db.one("SELECT id FROM invoices WHERE number='9002'")["id"]
    assert nine2 not in sent_on
    card = svc.db.one("SELECT body FROM messages WHERE intent='max_reminders'")["body"]
    assert "9002" not in card or "לא נשלח" in card, card
    assert "לחשבונית 9001" in card and "9002 (900 ₪) — לא נשלחה עליה תזכורת (מטבע אחר)" in card, card


def test_max_reminders_card_same_currency_unchanged(svc, clock):
    """בקרה: שתי חשבוניות ₪ שנכללו בתזכורת המשולבת ⇒ הכרטיס כמו קודם (שתיהן ברשימה, בלי «לא נשלחה»)."""
    rows = ROWS.replace(b"1200,USD", b"1200,ILS")
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv(rows)
    for _ in range(40):
        clock.now += timedelta(days=1)
        svc.import_csv(rows)
        svc.plan()
        for r in svc.db.q("SELECT id FROM reminders WHERE status='pending_approval'"):
            svc.approve(r["id"], confirm_open=True, confirm_amount=True)
        svc.dispatch()
    card = svc.db.one("SELECT body FROM messages WHERE intent='max_reminders'")["body"]
    assert "על 2 חשבוניות פתוחות (9001, 9002)" in card and "לא נשלח" not in card, card

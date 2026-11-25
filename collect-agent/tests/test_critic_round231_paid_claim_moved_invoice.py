"""מבקר סבב 231 · 🟡 — «שילמתי על 9001» מהטלפון הישן אחרי שהחשבונית עברה ללקוח אחר (219א): הכרטיס אומר «התזכורות
הושהו», אבל 9001 ממשיכה.

רכיבים: `app/inbox.py` → `handle_customer` / השהיית paid_claim (על **הלקוח** שהטלפון שלו כתב) + כרטיס «X טוען/ת ששילם/ה.
התזכורות הושהו עד שתבדקו». אחרי 219א (55ca86b3) 9001 עברה מדנה (050-1234567) למיכל (050-0000999); דנה נשארת בלי
חשבונית פתוחה. נבדק: דנה כותבת «שילמתי אתמול על חשבונית 9001» ⇒ intent=paid_claim, ההשהיה על דנה, כרטיס
«דנה כהן טוען/ת ששילם/ה. **התזכורות הושהו** עד שתבדקו» — אבל מיכל `paused_reason=None` ו-plan יוצר תזכורת על 9001
(לאישור). בעל העסק קורא «הושהו», מאשר את תור הבוקר — ותזכורת על חשבונית שדנה אומרת ששילמה יוצאת למיכל.
הצעה: paid_claim שמזכיר מספר חשבונית פתוחה (או מטלפון שהחשבונית עברה ממנו) ⇒ להשהות גם אותה, או לפחות שהכרטיס יגיד
«9001 רשומה כעת על מיכל לוי — התזכורות עליה **לא** הושהו». xfail(strict=True)."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"



def test_paid_claim_on_moved_invoice_pauses_it_or_says_so(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + "9001,דנה כהן,050-1234567,d@x.example,1200,פתוח,01/10/26,15/10/26\n").encode())
    clock.now += timedelta(days=1)
    svc.import_csv((H + "9001,מיכל לוי,050-0000999,m@x.example,780,פתוח,01/10/26,15/10/26\n").encode())
    r = svc.inbound("sms", "050-1234567", "שילמתי אתמול על חשבונית 9001")
    assert r["intent"] == "paid_claim"
    clock.now += timedelta(days=1)
    rids = svc.plan()
    reminded = [x for x in rids if svc.db.one("SELECT 1 FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                                              "WHERE r.id=? AND i.number='9001'", (x,))]
    summary = svc.db.one("SELECT owner_summary FROM drafts WHERE id=?", (r["draft_id"],))["owner_summary"]
    assert not reminded or ("9001" in summary and "מיכל" in summary), (len(reminded), summary)

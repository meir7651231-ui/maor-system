"""מבקר סבב 234 · 🟡×2 — בקשת פריסה («אפשר בשלושה תשלומים?») מטלפון משותף בלי שיוך / על חשבונית שעברה.

רכיבים: `app/inbox.py` → `ConversationInbox.handle` (רק PAID_CLAIM/PROMISE מקבלים כרטיס שיוך בכתובת משותפת בלי
שיוך — 18.11 / מנהל 233) + `_paid_claim_moved_note` (מנהל 395, רק ל-PAID_CLAIM).
(א) 7001 דויד + 7002 שרה באותו טלפון, אף אחד לא קיבל הודעה. «אפשר בשלושה תשלומים?» ⇒ `shared_contact_ambiguous`
    בלי השהיה ובלי שיוך ⇒ למחרת «טרם סומנה כשולמה» לשניהם. בפנייה ישירה plan_request = stop:pause.
(ב) 9001 עברה בקובץ מדנה למיכל (219א). מהטלפון של דנה: «אפשר לשלם את 9001 בשלושה תשלומים?» ⇒ דנה מושהית, הכרטיס
    «דנה כהן מבקש/ת הסדר» + «להציע הסדר» — לדנה אין חשבונית פתוחה; לא נאמר ש-9001 רשומה כעת על מיכל ולא הושהתה
    (כמו שהכרטיס של «שילמתי» אומר אחרי 395).
✓ נבדק בלי ממצא: כשיש שיוך (שרה קיבלה את התזכורת האחרונה) ההצעה נבנית על 7002 בלבד, בלי סכום/מספר של דויד.
הצעה: (א) כמו 233 — כרטיס שיוך + השהיית המקושרים; (ב) הערת «עברה» גם ל-plan_request (וכנראה לכל כוונה שמזכירה
חשבונית שעברה). xfail(strict=True)."""
from dataclasses import replace
from datetime import timedelta

import pytest

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
ROWS = "7001,דויד כהן,050-0000111,,1200,פתוח,01/10/26,15/10/26\n7002,שרה לוי,050-0000111,,450,פתוח,01/10/26,15/10/26\n"


def _csv(svc, body):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + body).encode())


def _numbers(svc, rids):
    return [svc.db.one("SELECT i.number FROM reminders r JOIN invoices i ON i.id=r.invoice_id WHERE r.id=?",
                       (rid,))["number"] for rid in rids]


def test_attributed_plan_request_only_own_invoice(svc, clock):
    """שומר: שרה קיבלה את התזכורת האחרונה ⇒ ההצעה על 7002 בלבד, בלי 7001/1,200 של דויד."""
    _csv(svc, ROWS)
    clock.now += timedelta(days=1)
    rids = svc.plan()
    sara = next(r for r, n in zip(rids, _numbers(svc, rids), strict=True) if n == "7002")
    svc.approve(sara, confirm_open=True)
    svc.dispatch()
    r = svc.inbound("sms", "050-0000111", "אפשר בשלושה תשלומים?")
    body = svc.db.one("SELECT body FROM drafts WHERE id=?", (r["draft_id"],))["body"]
    plan = svc.db.one("SELECT customer_id, invoice_ids FROM plans WHERE id=?", (r["plan_id"],))
    assert plan["invoice_ids"] == "[2]" and "7001" not in body and "1,200" not in body and "דויד" not in body


def test_shared_plan_request_is_assignable_or_pauses(svc, clock):
    _csv(svc, ROWS)
    r = svc.inbound("sms", "050-0000111", "אפשר בשלושה תשלומים?")
    clock.now += timedelta(days=1)
    reminded = _numbers(svc, svc.plan())
    assert r["intent"] in svc.inbox.SHARED_CARDS and not reminded, (r["intent"], reminded)


@pytest.mark.xfail(strict=True, reason="234ב🟡: פריסה על 9001 שעברה — הכרטיס לא אומר שהיא על מיכל ולא הושהתה")
def test_plan_request_on_moved_invoice_card_says_so(svc, clock):
    _csv(svc, "9001,דנה כהן,050-1234567,d@x.example,1200,פתוח,01/10/26,15/10/26\n")
    clock.now += timedelta(days=1)
    svc.import_csv((H + "9001,מיכל לוי,050-0000999,m@x.example,780,פתוח,01/10/26,15/10/26\n").encode())
    r = svc.inbound("sms", "050-1234567", "אפשר לשלם את 9001 בשלושה תשלומים?")
    assert r["intent"] == "plan_request"
    assert "9001" in r["owner_summary"] and "מיכל" in r["owner_summary"], r["owner_summary"]

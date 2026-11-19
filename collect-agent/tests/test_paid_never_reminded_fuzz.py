"""יעד «גבייה סוכן» — **אף לקוח שכבר שילם לא מקבל תזכורת**, כאינווריאנט על רצפים אקראיים (fuzz).

הבדיקות הממוקדות (test_paid_never_reminded / test_beta_paid_never_reminded / test_shared_paid_claim) מכסות
מסלול-מסלול. כאן: מאות רצפים אקראיים (זרע קבוע ⇒ דטרמיניסטי) של סנכרון, תכנון+אישור, שליחה, הזזת שעון,
תשלום ב-GI (סגירה/מחיקה/קבלה מקושרת), «שילמתי» ב-SMS/מייל, «שולם מחוץ למערכת», חשבונית חדשה ותשלום חלקי —
ובכל שליחה בודקים:
  (1) אף תזכורת שיצאה לא כוללת חשבונית ששולמה (בכל אחת מהדרכים), ו-
  (2) אף תזכורת לא יצאה ללקוח שכתב «שילמתי» (בעל העסק לא מחדש ברצפים האלה).
מספר טלפון משותף (דנה + רונית) נכלל בשליחה; «שילמתי» נשלח רק מכתובות ייחודיות (שיוך ודאי).
כשל ⇒ ההודעה מציגה את הזרע ואת רצף הפעולות לשחזור.
"""
import random
from datetime import timedelta

import pytest

from tests.conftest import gi_doc

# לקוח ⇒ כתובות ייחודיות שמהן מותר לשלוח «שילמתי» (שיוך ודאי)
CLAIM_FROM = {"cl1": ("email", "c1@example.com"), "cl2": ("sms", "+972-52-7654321"),
              "cl5": ("email", "c5@example.com")}
CLAIMS = ["שילמתי", "שילמתי אתמול בהעברה", "I already paid", "העברתי את הכסף", "כבר שולם"]


def _docs():
    dana2 = gi_doc(4, client_id="cl1", amount="350.00", due="2026-09-20")
    dana2["client"]["emails"] = ["c1@example.com"]   # אותו לקוח ⇒ אותו מייל (אחרת הסנכרון מעדכן את הכתובת)
    return [gi_doc(1), gi_doc(2, phone="+972-52-7654321", name="יוסי לוי"), dana2,
            gi_doc(5, name="רונית כהן", amount="800.00")]   # אותו טלפון כמו דנה — כתובת משותפת


def _receipt(doc, n):
    c = doc["client"]
    return {"id": f"rc{n}", "number": f"R{n}", "type": 400, "status": 1, "amount": doc["amount"],
            "currency": "ILS", "documentDate": "2026-10-20", "linkedDocumentIds": [doc["id"]],
            "client": dict(c)}


def _reminder_docs(svc, rid):
    rows = svc.db.q("SELECT i.external_id, c.external_id cl FROM invoices i JOIN customers c ON c.id=i.customer_id "
                    "WHERE i.id IN (SELECT invoice_id FROM reminders WHERE id=? UNION "
                    "SELECT invoice_id FROM reminder_invoices WHERE reminder_id=?)", (rid, rid))
    return {r["external_id"] for r in rows}, {r["cl"] for r in rows}


def _run(seed, svc, fake_gi, clock, steps=40):
    rnd = random.Random(seed)
    fake_gi.docs[:] = _docs()
    paid: set[str] = set()          # מזהי מסמך ששולמו (בכל דרך)
    claimed: set[str] = set()       # לקוחות שכתבו «שילמתי»
    log: list[str] = []
    sent = 0
    next_doc, next_rc = 6, 1
    svc.sync()
    for _ in range(steps):
        act = rnd.choice(["sync", "plan", "plan", "dispatch", "dispatch", "clock", "clock",
                          "pay_gi", "delete_gi", "receipt", "claim", "paid_outside", "new_doc", "partial"])
        open_docs = [d for d in fake_gi.docs if d.get("type") != 400 and d["status"] == 0 and d["id"] not in paid]
        if act == "sync":
            svc.sync()
        elif act == "plan":
            for rid in svc.plan():
                try:
                    svc.approve(rid, confirm_open=True)
                except ValueError:
                    pass
        elif act == "clock":
            clock.now += timedelta(hours=rnd.choice([3, 9, 20, 26, 50, 75]))
        elif act == "dispatch":
            for out in svc.dispatch():
                sent += 1
                docs, clients = _reminder_docs(svc, out["reminder_id"])
                bad_docs, bad_cl = docs & paid, clients & claimed
                assert not bad_docs and not bad_cl, (
                    f"seed={seed}: תזכורת {out['reminder_id']} יצאה ללקוח ששילם — "
                    f"חשבוניות ששולמו {bad_docs}, טענו ששילמו {bad_cl}\n" + "\n".join(log))
        elif act == "pay_gi" and open_docs:
            d = rnd.choice(open_docs)
            d["status"] = 1
            paid.add(d["id"])
            act += f" {d['id']}"
        elif act == "delete_gi" and open_docs:
            d = rnd.choice(open_docs)
            fake_gi.docs.remove(d)
            paid.add(d["id"])
            act += f" {d['id']}"
        elif act == "receipt" and open_docs:
            d = rnd.choice(open_docs)
            fake_gi.docs.append(_receipt(d, next_rc))
            next_rc += 1
            paid.add(d["id"])            # קבלה מקושרת = שולם, גם אם החשבונית עדיין «פתוחה» ב-GI
            act += f" {d['id']}"
        elif act == "claim":
            cl = rnd.choice(sorted(CLAIM_FROM))
            if any(d["client"]["id"] == cl for d in open_docs):
                ch, addr = CLAIM_FROM[cl]
                svc.inbound(ch, addr, rnd.choice(CLAIMS))
                claimed.add(cl)
                act += f" {cl}"
        elif act == "paid_outside":
            inv = svc.db.q("SELECT id, external_id FROM invoices WHERE status='open'")
            if inv:
                i = rnd.choice(inv)
                svc.mark_paid_outside(i["id"])
                paid.add(i["external_id"])
                act += f" {i['external_id']}"
        elif act == "new_doc":
            cl = rnd.choice(["cl1", "cl2", "cl5"])
            base = {"cl1": gi_doc(1), "cl2": gi_doc(2, phone="+972-52-7654321", name="יוסי לוי"),
                    "cl5": gi_doc(5, name="רונית כהן")}[cl]
            d = gi_doc(next_doc, client_id=cl, amount=f"{rnd.randint(1, 30) * 100}.00", due="2026-10-15",
                       phone=base["client"]["phone"], name=base["client"]["name"])
            d["client"]["emails"] = list(base["client"]["emails"])
            fake_gi.docs.append(d)
            next_doc += 1
            act += f" {d['id']}"
        elif act == "partial" and open_docs:
            d = rnd.choice(open_docs)
            d["amount"] = f"{max(1, int(float(d['amount']) // 2))}.00"
            act += f" {d['id']}"
        log.append(act)
    return sent


SENT: dict[int, int] = {}


@pytest.mark.parametrize("seed", range(120))
def test_paid_customer_never_reminded_random_sequences(seed, svc, fake_gi, clock):
    SENT[seed] = _run(seed, svc, fake_gi, clock)


def test_fuzz_actually_sends_reminders():
    """בקרה: הרצפים באמת שולחים תזכורות (אחרת האינווריאנט ריק). רץ אחרי הזרעים (סדר ההגדרה בקובץ)."""
    if len(SENT) < 120:
        pytest.skip("רץ רק יחד עם כל הזרעים")
    assert sum(1 for n in SENT.values() if n) >= 30, SENT
    assert sum(SENT.values()) >= 60, SENT


def test_sent_count_report():
    """מידע בלבד: כמה זרעים שלחו (נכשל רק אם הבקרה לא רצה)."""
    if len(SENT) == 120:
        print(f"\nfuzz: {sum(1 for n in SENT.values() if n)}/120 זרעים שלחו, {sum(SENT.values())} תזכורות")

"""גבייה סוכן · fuzz ב׳ — **רצון הלקוח מכובד בכל סדר אירועים** (20.11).

הרחבה של test_paid_never_reminded_fuzz עם מה שהשתנה מאז: הסרה (SMS/מייל), הסדרי תשלומים עם מחזור-חיים
(מנהל 332: הסדר שהוחמץ משחרר את החסימה), מחלוקת, ובעל עסק שמאשר כל טיוטה שממתינה (תשובות, הצעות הסדר).
אינווריאנטים, נבדקים אחרי **כל** צעד מול מה שיצא בפועל (svc.sender.sent):
  (1) אף הודעה לא יוצאת לכתובת של לקוח שביקש הסרה — מלבד אישור ההסרה עצמו;
  (2) אף **תזכורת** לא יוצאת על חשבונית ששולמה, או ללקוח שכתב «שילמתי» / שבמחלוקת (בעל העסק לא מחדש כאן).
זרע קבוע ⇒ דטרמיניסטי; כשל מציג זרע + רצף לשחזור.
"""
import json
import random
from datetime import timedelta

import pytest

from app.channels import normalize_il_phone, sent_mark, sent_since
from tests.test_paid_never_reminded_fuzz import CLAIMS, _docs, _receipt

ADDR = {"cl1": ("sms", "050-1234567", "c1@example.com"), "cl2": ("sms", "+972-52-7654321", "c2@example.com"),
        "cl5": ("sms", "050-1234567", "c5@example.com")}
# «שילמתי»/«הסר»/מחלוקת נשלחים רק מכתובת ייחודית (שיוך ודאי); הטלפון של דנה משותף עם רונית
UNIQUE_FROM = {"cl1": [("email", "c1@example.com")], "cl2": [("sms", "+972-52-7654321"), ("email", "c2@example.com")],
               "cl5": [("email", "c5@example.com")]}
OPT_OUT = ["הסר", "תסירו אותי", "stop", "אל תשלחו לי יותר"]
DISPUTE = ["הסכום לא נכון", "לא הזמנתי את זה"]
PLAN = ["אפשר לשלם ב-3 תשלומים?", "אין לי כסף כרגע, אפשר תשלומים?"]


def _norm(to):
    return to if "@" in to else normalize_il_phone(to)


def _contacts(cl):
    _, phone, email = ADDR[cl]
    return {normalize_il_phone(phone), email}


def _rem_targets(svc, rid):
    rows = svc.db.q("SELECT i.external_id, c.external_id cl FROM invoices i JOIN customers c ON c.id=i.customer_id "
                    "WHERE i.id IN (SELECT invoice_id FROM reminders WHERE id=? UNION "
                    "SELECT invoice_id FROM reminder_invoices WHERE reminder_id=?)", (rid, rid))
    return {r["external_id"] for r in rows}, {r["cl"] for r in rows}


def _run(seed, svc, fake_gi, clock, steps=45):
    rnd = random.Random(seed)
    fake_gi.docs[:] = _docs()
    paid: set[str] = set()
    claimed: set[str] = set()        # «שילמתי» / מחלוקת — אין תזכורת (בעל העסק לא מחדש)
    blocked: set[str] = set()        # כתובות שביקשו הסרה (מנורמלות)
    log: list[str] = []
    seen = 0
    quiet: dict[str, object] = {}    # q21-19: לקוח ⇒ עד איזה יום (לא כולל) אסורה תזכורת אחרי הבטחה רחוקה
    dead: set[str] = set()           # בעל העסק סימן «נפטר/ה» ⇒ אין תזכורת לעולם
    minor_phone: set[str] = set()    # «אני בן 15» מהטלפון המשותף ⇒ אין תזכורת לטלפון הזה לעולם
    svc.sync()

    def cid_of(cl):
        return svc.db.one("SELECT id FROM customers WHERE external_id=?", (cl,))["id"]

    def check(act):
        nonlocal seen
        new = sent_since(svc.sender.sent, seen)
        seen = sent_mark(svc.sender.sent)
        acks = {d["body"] for d in svc.db.q("SELECT body FROM drafts WHERE intent IN ('opt_out','wrong_person')")} \
            if svc.db.one("SELECT 1 FROM sqlite_master WHERE name='drafts'") else set()
        for m in new:
            if _norm(m["to"]) in blocked and m["body"] not in acks and m.get("audience") != "owner":
                raise AssertionError(f"seed={seed}: הודעה לכתובת שביקשה הסרה ({act}): {m['body'][:80]}\n"
                                     + "\n".join(log))

    for _ in range(steps):
        act = rnd.choice(["sync", "plan", "plan", "dispatch", "dispatch", "dispatch", "clock", "clock", "clock",
                          "pay_gi", "receipt", "claim", "opt_out", "dispute", "plan_req", "plan_flow", "plan_flow",
                          "accept",
                          "owner_drafts", "owner_drafts", "partial",
                          "promise_far", "promise_far", "owner_hold", "shared_minor"])
        open_docs = [d for d in fake_gi.docs if d.get("type") != 400 and d["status"] == 0 and d["id"] not in paid]
        if act == "sync":
            svc.sync()
        elif act == "plan":
            for rid in svc.plan():
                try:
                    svc.approve(rid, confirm_open=True)
                except (ValueError, PermissionError):
                    pass
        elif act == "clock":
            clock.now += timedelta(hours=rnd.choice([5, 20, 26, 75, 24 * 9, 24 * 33]))
        elif act == "dispatch":
            today = clock.now.date()
            for out in svc.dispatch():
                docs, clients = _rem_targets(svc, out["reminder_id"])
                assert not (docs & paid) and not (clients & claimed), (
                    f"seed={seed}: תזכורת {out['reminder_id']} — שולם {docs & paid}, טען/מחלוקת {clients & claimed}\n"
                    + "\n".join(log))
                early = {c for c in clients if c in quiet and today < quiet[c]}
                assert not early, f"seed={seed}: תזכורת לפני המועד שהתקבל/אושר ({early})\n" + "\n".join(log)
                assert not (clients & dead), f"seed={seed}: תזכורת ללקוח שסומן «נפטר/ה»\n" + "\n".join(log)
                tos = {_norm(m["to"]) for m in json.loads(svc.db.one(
                    "SELECT payload FROM reminders WHERE id=?", (out["reminder_id"],))["payload"])}
                assert not (tos & minor_phone), f"seed={seed}: תזכורת לטלפון שקטין ענה ממנו\n" + "\n".join(log)
        elif act == "pay_gi" and open_docs:
            d = rnd.choice(open_docs)
            d["status"] = 1
            paid.add(d["id"])
            act += f" {d['id']}"
        elif act == "receipt" and open_docs:
            d = rnd.choice(open_docs)
            fake_gi.docs.append(_receipt(d, len(fake_gi.docs) + 100))
            paid.add(d["id"])
            act += f" {d['id']}"
        elif act == "partial" and open_docs:
            d = rnd.choice(open_docs)
            d["amount"] = f"{max(1, int(float(d['amount']) // 2))}.00"
            act += f" {d['id']}"
        elif act in ("claim", "opt_out", "dispute", "plan_req", "accept"):
            cl = rnd.choice(sorted(UNIQUE_FROM))
            ch, addr = rnd.choice(UNIQUE_FROM[cl])
            text = rnd.choice({"claim": CLAIMS, "opt_out": OPT_OUT, "dispute": DISPUTE, "plan_req": PLAN,
                               "accept": ["מאשר", "מתאים לי"]}[act])
            svc.inbound(ch, addr, text)
            quiet.pop(cl, None)          # הלקוח כתב שוב ⇒ חלון ההבטחה הקודם כבר לא האחרון
            if act in ("claim", "dispute"):
                claimed.add(cl)
            if act == "opt_out":
                # «הסר» מכתובת ⇒ כל הכתובות של הלקוח, וגם של מי שחולק איתו כתובת (review חור 1)
                cls = {cl} | {o for o in ADDR if _contacts(o) & _contacts(cl)}
                for o in cls:
                    blocked |= _contacts(o)
            act += f" {cl} {ch} «{text}»"
        elif act == "plan_flow":
            # מסלול הסדר מלא (אחרת הסדר מאושר נדיר ברצף אקראי): בקשה ⇒ בעל העסק מאשר את ההצעה ⇒ «מאשר» ⇒ אישור
            cl = rnd.choice(sorted(UNIQUE_FROM))
            ch, addr = UNIQUE_FROM[cl][0]
            for text in (rnd.choice(PLAN), "מאשר"):
                r = svc.inbound(ch, addr, text)
                if r.get("draft_id"):
                    try:
                        svc.inbox.approve_draft(r["draft_id"])
                    except (ValueError, PermissionError, KeyError):
                        pass
            quiet.pop(cl, None)
            act += f" {cl}"
        elif act == "promise_far":
            # הכרעת q21-19: הבטחה ל-20 יום ⇒ מתקבלת עד 14 + «בדוק ואשר»; בעל העסק מכריע (או לא) באקראי
            cl = rnd.choice(sorted(UNIQUE_FROM))
            ch, addr = rnd.choice(UNIQUE_FROM[cl])
            want = clock.now.date() + timedelta(days=20)
            r = svc.inbound(ch, addr, f"אשלם ב-{want.day}.{want.month}")
            if "promise_over_limit" in (r.get("tags") or []):
                quiet[cl] = clock.now.date() + timedelta(days=15)
                choice = rnd.choice(["approve", "refuse", "none"])
                if choice != "none":
                    try:
                        out = svc.decide_promise_request(cid_of(cl), choice == "approve")
                        if out["approved"]:
                            quiet[cl] = want + timedelta(days=1)
                    except (ValueError, KeyError):
                        pass
                act += f" {cl} {choice}"
            else:
                quiet.pop(cl, None)
                act += f" {cl} (לא מעל המגבלה: {r.get('intent')})"
        elif act == "owner_hold":
            cl = rnd.choice(sorted(UNIQUE_FROM))
            svc.set_hold(cid_of(cl), "deceased", "המשפחה הודיעה", "owner")
            dead.add(cl)
            act += f" {cl}"
        elif act == "shared_minor":
            r = svc.inbound("sms", "050-1234567", "אני בן 15")    # הטלפון המשותף לדנה (cl1) ולרונית (cl5)
            if r.get("card_id"):
                pick = rnd.choice(["cl1", "cl5", None])
                # «אף אחד מהם» ⇒ הטלפון משתחרר — שאלת מדיניות פתוחה ל«גבי מנוע» (team/findings-gvia-sochen.md),
                # נעולה ב-tests/test_shared_minor_assign_none.py (xfail strict). כאן האינווריאנט רק כשנבחר לקוח.
                if pick:
                    minor_phone.add(normalize_il_phone("050-1234567"))
                try:
                    svc.inbox.assign_shared_card(r["card_id"], cid_of(pick) if pick else None)
                except (ValueError, KeyError):
                    pass
                act += f" ⇒ {pick}"
        elif act == "owner_drafts":
            pending = svc.db.q("SELECT id FROM drafts WHERE status='pending_approval'") \
                if svc.db.one("SELECT 1 FROM sqlite_master WHERE name='drafts'") else []
            for d in pending:
                try:
                    svc.inbox.approve_draft(d["id"])
                except (ValueError, PermissionError, KeyError):
                    pass
        log.append(act)
        check(act)
    return sent_mark(svc.sender.sent)


SENT: dict[int, int] = {}


@pytest.mark.parametrize("seed", range(200))
def test_customer_wishes_respected_random_sequences(seed, svc, fake_gi, clock):
    SENT[seed] = _run(seed, svc, fake_gi, clock)


def test_fuzz_b_actually_sends():
    """בקרה: הרצפים באמת שולחים (תזכורות ותשובות) — אחרת האינווריאנט ריק."""
    if len(SENT) < 200:
        pytest.skip("רץ רק יחד עם כל הזרעים")
    assert sum(1 for n in SENT.values() if n) >= 80, SENT

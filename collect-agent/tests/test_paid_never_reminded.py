"""יעד «גבייה סוכן» (מאיר, 15.11): **אף לקוח שכבר שילם לא מקבל תזכורת.**

מטריצה של כל הדרכים שבהן תשלום נודע, וכל רגע שבו הוא יכול להגיע (לפני התכנון / אחרי אישור / רגע
לפני שליחה). בכל מקרה בודקים את מה שיצא בפועל (svc.sender.sent), לא רק סטטוסים.
"""
from datetime import timedelta

import pytest

from tests.conftest import gi_doc

DANA_TO = {"972501234567", "c1@example.com"}


def _to_dana(svc):
    return [m for m in svc.sender.sent if m["to"] in DANA_TO]


def _approve_all(svc, ids):
    for i in ids:
        try:
            svc.approve(i)
        except ValueError:
            pass


def _receipt(i, *, linked=None, amount="1200.00", client_id="cl1", status=1):
    return {"id": f"rc{i}", "number": f"R{i}", "type": 400, "status": status, "amount": amount,
            "currency": "ILS", "documentDate": "2026-10-20",
            "linkedDocumentIds": linked or [],
            "client": {"id": client_id, "name": "דנה כהן", "phone": "050-1234567",
                       "emails": ["c1@example.com"]}}


# ── 1. שולם ונסגר בחשבונית ירוקה ─────────────────────────────────────────────
def test_closed_in_gi_before_plan(svc, fake_gi):
    fake_gi.docs[0]["status"] = 1
    svc.sync()
    _approve_all(svc, svc.plan())
    svc.dispatch()
    assert _to_dana(svc) == []


def test_closed_in_gi_after_approval_before_send(svc, fake_gi):
    svc.sync()
    _approve_all(svc, svc.plan())
    fake_gi.docs[0]["status"] = 1                  # שולם בין האישור לשליחה, בלי סנכרון
    svc.dispatch()
    assert _to_dana(svc) == []


def test_deleted_in_gi_after_approval(svc, fake_gi):
    svc.sync()
    _approve_all(svc, svc.plan())
    fake_gi.docs.pop(0)
    svc.dispatch()
    assert _to_dana(svc) == []


# ── 2. קבלה הופקה אבל החשבונית נשארה «פתוחה» (לא נסגרה/לא קושרה) ─────────────────
def test_receipt_linked_to_open_invoice_holds_customer(svc, fake_gi):
    fake_gi.docs.append(_receipt(1, linked=["doc1"]))
    svc.sync()
    _approve_all(svc, svc.plan())
    svc.dispatch()
    assert _to_dana(svc) == []
    c = svc.db.one("SELECT paused_reason FROM customers WHERE external_id='cl1'")
    assert c["paused_reason"] == svc.CREDIT_REVIEW
    msg = svc.db.one("SELECT body FROM messages WHERE needs_owner=1 AND body LIKE '%קבלה%'")
    assert msg and "ייתכן שהלקוח כבר שילם" in msg["body"]


def test_unlinked_receipt_same_client_same_amount_holds(svc, fake_gi):
    fake_gi.docs.append(_receipt(2))
    svc.sync()
    _approve_all(svc, svc.plan())
    svc.dispatch()
    assert _to_dana(svc) == []


@pytest.mark.parametrize("rc", [
    {"amount": "300.00"},            # סכום אחר ⇒ לא ניחוש
    {"client_id": "cl2"},            # לקוח אחר (ל-cl2 סכום אחר ממילא)
    {"status": 4},                   # קבלה מבוטלת לא מעידה על תשלום
])
def test_unrelated_receipt_does_not_block_reminder(svc, fake_gi, rc):
    fake_gi.docs[1]["amount"] = "450.00"
    fake_gi.docs.append(_receipt(3, **rc))
    svc.sync()
    _approve_all(svc, svc.plan())
    svc.dispatch()
    assert _to_dana(svc), "אין false positive: קבלה לא קשורה לא עוצרת תזכורת"


def test_receipt_appearing_after_approval_cancels_before_send(svc, fake_gi):
    svc.sync()
    _approve_all(svc, svc.plan())
    fake_gi.docs.append(_receipt(4, linked=["doc1"]))
    svc.sync()                                     # webhook «מסמך נוצר» ⇒ סנכרון
    svc.dispatch()
    assert _to_dana(svc) == []


# ── 3. שולם מחוץ למערכת (ביט/העברה) — בעל העסק מסמן ──────────────────────────
@pytest.mark.open_review
def test_owner_marks_paid_at_open_list(svc, fake_gi):
    svc.sync()
    dana = next(x["id"] for x in svc.open_list()["pending"] if x["number"] == "1001")
    rest = [x["id"] for x in svc.open_list()["pending"] if x["id"] != dana]
    svc.confirm_open_list(rest, [dana])
    for _ in range(3):
        _approve_all(svc, svc.plan())
        svc.dispatch()
        svc.sync()
        svc.clock.now += timedelta(days=8)
    assert _to_dana(svc) == []


@pytest.mark.open_review
def test_owner_marks_paid_later_cancels_approved_reminder(svc):
    svc.sync()
    ids = [x["id"] for x in svc.open_list()["pending"]]
    svc.confirm_open_list(ids, [])
    _approve_all(svc, svc.plan())
    dana = next(x["id"] for x in svc.open_list()["confirmed"] if x["number"] == "1001")
    svc.confirm_open_list([], [dana])              # שילם בביט אחרי האישור
    svc.dispatch()
    assert _to_dana(svc) == []


# ── 4. הלקוח אומר ששילם ───────────────────────────────────────────────────
@pytest.mark.parametrize("channel,sender", [("sms", "0501234567"), ("email", "c1@example.com")])
def test_customer_says_paid_stops_until_owner(svc, clock, channel, sender):
    svc.sync()
    _approve_all(svc, svc.plan())
    svc.inbound(channel, sender, "שילמתי אתמול בהעברה")
    svc.dispatch()
    for _ in range(4):                             # גם אחרי שבועות — לא חוזר לבד
        clock.now += timedelta(days=8)
        _approve_all(svc, svc.plan())
        svc.dispatch()
    assert _to_dana(svc) == []


def test_paid_button_on_short_link_page(svc):
    svc.sync()
    ids = svc.plan()
    _approve_all(svc, ids)
    inv = svc.db.one("SELECT * FROM invoices WHERE number='1001'")
    svc.landing_action(svc._short_code(inv), "paid")
    svc.dispatch()
    assert _to_dana(svc) == []


# ── 5. שולם חלקית — לא «שולם», אבל לעולם לא נשלח הסכום הישן ─────────────────
def test_partial_payment_never_sends_old_amount(svc, fake_gi):
    svc.sync()
    _approve_all(svc, svc.plan())
    fake_gi.docs[0]["amount"] = "200.00"
    svc.dispatch()
    assert all("1,200" not in m["body"] for m in _to_dana(svc))


def test_new_customer_with_receipt_only_is_not_a_debtor(svc, fake_gi):
    """קבלה בלבד (בלי חשבונית פתוחה) לא יוצרת חוב ולא תזכורת."""
    fake_gi.docs[:] = [gi_doc(2, phone="052-7654321", name="יוסי"), _receipt(9)]
    svc.sync()
    _approve_all(svc, svc.plan())
    svc.dispatch()
    assert _to_dana(svc) == []


# ── fuzz 19.11: קבלה אחרי האישור, **בלי סנכרון** בין לבין (ה-cron של השליחה רץ לפני הסנכרון) ─────────────
def test_receipt_after_approval_without_sync_holds_before_send(svc, fake_gi):
    svc.sync()
    _approve_all(svc, svc.plan())
    fake_gi.docs.append(_receipt(7, linked=["doc1"]))   # אין svc.sync() — רק הרענון שלפני השליחה
    svc.dispatch()
    assert _to_dana(svc) == []                           # היה: התזכורת יצאה
    c = svc.db.one("SELECT paused_reason FROM customers WHERE external_id='cl1'")
    assert c["paused_reason"] == svc.CREDIT_REVIEW


def test_unlinked_same_amount_receipt_after_approval_holds_before_send(svc, fake_gi):
    svc.sync()
    _approve_all(svc, svc.plan())
    fake_gi.docs.append(_receipt(8))
    svc.dispatch()
    assert _to_dana(svc) == []


def test_receipt_already_reviewed_by_owner_does_not_hold_again(svc, fake_gi, clock):
    """בעל העסק בדק את הקבלה (התראה קיימת) וחידש ⇒ ההכרעה שלו; הרענון לא משהה שוב על אותה קבלה."""
    fake_gi.docs.append(_receipt(9, linked=["doc1"]))
    svc.sync()                                           # השהיה + התראה
    cid = svc.db.one("SELECT id FROM customers WHERE external_id='cl1'")["id"]
    svc.resume_customer(cid)
    clock.now += timedelta(days=1)
    _approve_all(svc, svc.plan())
    svc.dispatch()
    assert len(_to_dana(svc)) >= 1

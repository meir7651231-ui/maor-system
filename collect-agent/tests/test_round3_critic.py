"""בדיקות משחזרות לממצאי המבקר (team/critic.md, סבב 3) ולהכרעות המוצר של מאיר (6.11.2026).

כל בדיקה נכתבה **לפני** התיקון, נכשלה מול הקוד הישן (`1327d6d`) ועוברת אחריו.
אין סגירת ממצא על סמך דיווח: כל שורה בטבלת סבב 3 מצביעה על בדיקה כאן.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.config import SafetyError, load_settings
from app.db import DB
from app.greeninvoice import Invoice, map_document
from app.main import create_app
from app.policy import BUILTIN_HOLIDAYS, MAX_REMINDERS_PER_INVOICE, TZ, Policy
from app.service import CollectService, customer_key
from tests.conftest import AUTH, OWNER_TOKEN

LINK = "https://www.greeninvoice.co.il/pay/studio"
DANA = "0501234567"


def _svc(clock, gi=None):
    s = load_settings({"BUSINESS_NAME": "סטודיו מאיר", "PAYMENT_LINK": LINK,
                       "PUBLIC_BASE_URL": "https://gabi.example"})
    return CollectService(s, DB(":memory:"), gi=gi, clock=clock)


def _inv(i, cid="", phone="", email="", amount=120000, due=date(2026, 10, 1)):
    return Invoice(f"d{i}", str(1000 + i), 305, amount, "ILS", None, due, cid, f"לקוח {i}",
                   phone, email)


def _first_sent(svc):
    rid = svc.plan()[0]
    svc.approve(rid)
    assert svc.dispatch(), "התזכורת הראשונה לא יצאה"
    return rid


# ───────── חשיפת חוב לצד ג' (סבב 2, 2.0 סעיף 2) ─────────
def test_email_only_customers_are_not_merged(clock):
    """באג: שני לקוחות בלי מזהה ובלי טלפון ⇒ `phone:` משותף ⇒ התמזגו, והמייל של ב' דרס את א'
    ⇒ תזכורת על החוב של א' יצאה ל-b@y.com."""
    svc = _svc(clock)
    svc.ingest([_inv(1, email="a@x.com"), _inv(2, email="b@y.com")])
    rows = svc.db.q("SELECT external_id, email FROM customers ORDER BY id")
    assert [(r["external_id"], r["email"]) for r in rows] == [
        ("email:a@x.com", "a@x.com"), ("email:b@y.com", "b@y.com")]
    for rid in svc.plan():
        svc.approve(rid)
    svc.dispatch()
    by_to = {m["to"]: m["body"] for m in svc.sender.sent}
    assert "1001" in by_to["a@x.com"] and "1002" not in by_to["a@x.com"]
    assert "1002" in by_to["b@y.com"] and "1001" not in by_to["b@y.com"]


def test_customer_key_never_empty_or_shared():
    assert customer_key(_inv(1)) == "doc:d1" and customer_key(_inv(2)) == "doc:d2"
    assert customer_key(_inv(1, phone="050-1234567")) == "phone:972501234567"
    assert customer_key(_inv(1, cid="gi-7", email="a@x.com")) == "gi-7"


# ───────── אימות סכום לפני שליחה + אישור קשור ל-hash ─────────
def test_amount_change_after_approval_requires_reapproval(clock):
    """באג (ר-4): אושר ₪1,200, תשלום חלקי ⇒ יתרה ₪200, ונשלח "1,200 ₪"."""
    svc = _svc(clock)
    svc.ingest([_inv(1, phone=DANA)])
    rid = svc.plan()[0]
    svc.approve(rid)
    svc.ingest([_inv(1, phone=DANA, amount=20000)])
    assert svc.dispatch() == [] and svc.sender.sent == []
    r = svc.db.one("SELECT * FROM reminders WHERE id=?", (rid,))
    assert r["status"] == "pending_approval" and "200 ₪" in r["body"] and "1,200" not in r["body"]
    svc.approve(rid)
    assert len(svc.dispatch()) == 1 and "200 ₪" in svc.sender.sent[-1]["body"]


def test_tampered_payload_after_approval_is_not_sent(clock):
    """האישור נקשר ל-sha256 של ההודעה המדויקת: שינוי בנמען/גוף אחרי האישור ⇒ לא נשלח."""
    svc = _svc(clock)
    svc.ingest([_inv(1, phone=DANA)])
    rid = svc.plan()[0]
    svc.approve(rid)
    svc.db.x("UPDATE customers SET phone='0529999999'")  # למשל עדכון ידני/סנכרון
    assert svc.dispatch() == []
    assert svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))["status"] == \
        "pending_approval"


def test_dispatch_resyncs_from_gi_and_fails_closed(svc, fake_gi):
    svc.sync()
    rid = svc.plan()[0]
    svc.approve(rid)
    fake_gi.docs[0]["amount"] = "300.00"           # שולם חלקית ב-GI אחרי האישור
    assert svc.dispatch() == []                    # סנכרון טרי ⇒ סכום שונה ⇒ אישור מחדש
    assert "300 ₪" in svc.db.one("SELECT body FROM reminders WHERE id=?", (rid,))["body"]
    svc.approve(rid)
    calls = fake_gi.search_calls
    fake_gi.handler, real = (lambda req: (_ for _ in ()).throw(RuntimeError("GI down"))), \
        fake_gi.handler
    svc.gi._http._transport.handler = fake_gi.handler
    assert svc.dispatch() == [] and svc.sender.sent == []   # GI לא זמין ⇒ לא שולחים
    assert fake_gi.search_calls == calls
    svc.gi._http._transport.handler = real
    assert len(svc.dispatch()) == 1


# ───────── 3 תזכורות, אישור פרטני ─────────
def test_max_three_reminders_each_approved(clock):
    assert MAX_REMINDERS_PER_INVOICE == 3
    svc = _svc(clock)
    svc.ingest([_inv(1, phone=DANA)])
    keys = []
    for _ in range(8):
        for rid in svc.plan():
            r = svc.db.one("SELECT * FROM reminders WHERE id=?", (rid,))
            assert r["status"] == "pending_approval", "תזכורת לא חיכתה לאישור"
            keys.append(r["template_key"])
            svc.approve(rid)
        svc.dispatch()
        clock.now += timedelta(days=8)
    assert keys == ["friendly", "second", "final"] and len(svc.sender.sent) == 3
    notes = svc.db.q("SELECT * FROM messages WHERE intent='ladder_done' AND needs_owner=1")
    assert len(notes) == 1


# ───────── שעות / שישי / שבת / חג ─────────
@pytest.mark.parametrize("dt,ok", [
    (datetime(2026, 11, 8, 8, 0), True), (datetime(2026, 11, 8, 7, 59), False),
    (datetime(2026, 11, 8, 19, 59), True), (datetime(2026, 11, 8, 20, 0), False),
    (datetime(2026, 11, 13, 11, 59), True), (datetime(2026, 11, 13, 12, 0), False),  # שישי
    (datetime(2026, 11, 14, 10, 0), False),                                           # שבת
    (datetime(2026, 9, 21, 10, 0), False),     # יום כיפור תשפ"ז — באג: היה מותר
    (datetime(2026, 9, 20, 11, 0), True), (datetime(2026, 9, 20, 15, 0), False),  # ערב יוה"כ
    (datetime(2027, 4, 21, 18, 30), False),    # ערב פסח אחרי הצהריים — באג: היה מותר
    (datetime(2031, 1, 5, 10, 0), False),      # אחרי סוף הלוח המובנה ⇒ fail-closed
])
def test_send_window(dt, ok):
    assert Policy().can_send_at(dt.replace(tzinfo=TZ)) is ok


def test_builtin_holidays_match_hebrew_calendar():
    """הטבלה נוצרה מ-Intl hebrew; דגימה של תאריכים ידועים (ר"ה, יוה"כ, פסח, שבועות)."""
    for d in ("2026-09-12", "2026-09-13", "2026-09-21", "2026-10-03", "2027-04-22",
              "2027-06-11", "2028-04-11", "2030-09-28"):
        assert d in BUILTIN_HOLIDAYS
    assert len(BUILTIN_HOLIDAYS) == 40     # 8 ימי יום-טוב × 5 שנים


# ───────── הצעת פריסה: שער שליחה + בלי כפילות ─────────
def _plan_ready(svc):
    svc.sync()
    _first_sent(svc)
    res = svc.inbound("sms", DANA, "אפשר לפרוס לשלושה תשלומים?")
    assert res["plan_id"]
    return res


def test_plan_approval_refused_after_opt_out(svc):
    """באג: אישור הסדר שלח ללקוח שביקש הסרה בינתיים."""
    res = _plan_ready(svc)
    svc.inbound("sms", DANA, "תסירו אותי")
    n = len(svc.sender.sent)
    with pytest.raises(ValueError, match="הסרה"):
        svc.approve_plan(res["plan_id"])
    assert len(svc.sender.sent) == n


def test_plan_approval_on_shabbat_waits_for_window(svc, clock):
    """באג: אישור הסדר בשבת שלח מיד (`_reply` עקף את שער השליחה)."""
    res = _plan_ready(svc)
    clock.now = datetime(2026, 11, 14, 11, 0, tzinfo=TZ)   # שבת
    n = len(svc.sender.sent)
    out = svc.approve_plan(res["plan_id"])
    assert out["queued"] is True and len(svc.sender.sent) == n
    clock.now = datetime(2026, 11, 15, 9, 0, tzinfo=TZ)
    assert svc.inbox.flush() == [out["draft_id"]] and len(svc.sender.sent) == n + 1
    assert "להפסקה:" in svc.sender.sent[-1]["body"]          # הסרה בכל הודעה


def test_plan_offer_not_sent_twice_draft_then_plans(svc):
    """באג (כיוון הפוך לתיקון 1327d6d): אישור הטיוטה בתור התשובות שלח את ההצעה,
    ואז /plans/approve שלח אותה שוב."""
    res = _plan_ready(svc)
    n = len(svc.sender.sent)
    svc.inbox.approve_draft(res["draft_id"])
    assert len(svc.sender.sent) == n + 1
    with pytest.raises(ValueError):
        svc.approve_plan(res["plan_id"])
    assert len(svc.sender.sent) == n + 1


def test_plan_offer_not_sent_twice_plans_then_draft(svc):
    res = _plan_ready(svc)
    n = len(svc.sender.sent)
    svc.approve_plan(res["plan_id"])
    with pytest.raises(ValueError):
        svc.inbox.approve_draft(res["draft_id"])
    assert len(svc.sender.sent) == n + 1


# ───────── הסרה לפי איש קשר + בכל הודעה ─────────
def test_opt_out_covers_every_customer_on_same_phone(clock):
    """באג: שני לקוחות על אותו נייד ⇒ "הסר" הסיר רק את הראשון."""
    svc = _svc(clock)
    svc.ingest([_inv(1, cid="a", phone=DANA), _inv(2, cid="b", phone="050-1234567")])
    rid = svc.plan()[0]
    svc.approve(rid)
    svc.dispatch()
    svc.inbound("sms", DANA, "תסירו אותי")
    assert [r["opted_out"] for r in svc.db.q("SELECT opted_out FROM customers")] == [1, 1]
    clock.now += timedelta(days=10)
    assert svc.plan() == []


def test_every_outgoing_reply_has_stop_option(svc):
    svc.sync()
    _first_sent(svc)
    d = svc.inbound("sms", DANA, "מי זה?")["draft_id"]
    svc.inbox.approve_draft(d)
    assert "להפסקה: https://gabi.example/p/" in svc.sender.sent[-1]["body"]


# ───────── הסרה ב-POST בלבד ─────────
def test_unsubscribe_get_does_not_remove(svc):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    svc.sync()
    tok = svc.db.one("SELECT unsub_token FROM customers WHERE id=1")["unsub_token"]
    assert len(tok) >= 21                                   # 16 בתים (היה 9)
    for _ in range(3):
        assert api.get(f"/u/{tok}").status_code == 200        # סורק קישורים
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 0
    assert api.post(f"/u/{tok}").status_code == 200
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1


# ───────── מסמכים מ-GI ─────────
def test_paid_document_ignored_even_if_server_filter_fails(svc, fake_gi):
    """באג: הסינון status=0 היה רק בצד השרת. פילטר שגוי ⇒ חשבוניות ששולמו בתור."""
    fake_gi.docs[0]["status"] = 1
    assert svc.sync()["open"] == 1


def test_missing_due_date_uses_terms_not_issue_date():
    """באג: בלי dueDate המועד היה תאריך ההנפקה ⇒ "טרם שולמה" יום אחרי ההנפקה."""
    doc = {"id": "x", "number": "1", "type": 305, "amount": "100", "documentDate": "2026-10-01",
           "client": {"id": "c", "phone": DANA}}
    assert map_document(doc).due == date(2026, 10, 31)


# ───────── תשלום: לא יוצרים קבלות ─────────
def test_receipt_creating_payment_form_mode_is_refused():
    assert load_settings({}).payment_link_mode == "static"
    with pytest.raises(SafetyError, match="קבלה"):
        load_settings({"PAYMENT_LINK_MODE": "greeninvoice_form"})

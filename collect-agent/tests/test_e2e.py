"""מקצה לקצה דרך ה-HTTP API בלבד (כמו שבעל העסק/ה-cron/ספק ה-SMS יפעילו אותו).

1. מסע מלא: sync ⇒ plan ⇒ אישור ⇒ dispatch ⇒ תשובת לקוח חתומה ⇒ הסדר ⇒ סגירת חשבונית.
2. סימולציה של 60 יום (cron כל 15 דק׳ בשעות פעילות) עם 12 לקוחות והתנהגויות שונות,
   ובסופה בדיקת אינווריאנטים על *כל* הודעה שיצאה:
     • שום הודעה יזומה בלי אישור בעלים להודעה הראשונה ולהודעה האחרונה
     • שום שליחה בשבת/חג/מחוץ לחלון
     • ≥72ש׳ בין הודעות יזומות לאותו לקוח
     • ≤4 תזכורות לחשבונית
     • שום הודעה אחרי הסר/מחלוקת/"שילמתי"/חשבונית שנסגרה
     • כל שליחה = dry-run, ושום socket אמיתי לא נפתח (conftest)
"""
from __future__ import annotations

import json
import random
import time
from datetime import datetime, timedelta

import httpx
import pytest
from fastapi.testclient import TestClient

from app import security
from app.config import load_settings
from app.db import DB
from app.greeninvoice import GreenInvoiceClient
from app.main import create_app
from app.policy import MAX_REMINDERS_PER_INVOICE, TZ, Policy
from app.service import CollectService
from tests.conftest import AUTH, OWNER_TOKEN, SANDBOX, Clock, FakeGreenInvoice, gi_doc

WH = "e2e-webhook-secret"


def build(docs, now, holidays=""):
    fake = FakeGreenInvoice(docs, page_size=5)
    gi = GreenInvoiceClient(SANDBOX, "test-id", "test-secret",
                            transport=httpx.MockTransport(fake.handler))
    clock = Clock(now)
    s = load_settings({"BUSINESS_NAME": "סטודיו מאיר", "SMS_SENDER_ID": "StudioMeir",
                       "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/studio",
                       "PUBLIC_BASE_URL": "https://gabi.example", "HOLIDAYS": holidays})
    svc = CollectService(s, DB(":memory:"), gi=gi, clock=clock)
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN, webhook_secret=WH), headers=AUTH)
    return api, svc, fake, clock


def customer_says(api, phone, text):
    """כמו ספק ה-SMS: בקשה חתומה, בלי טוקן בעלים."""
    body = json.dumps({"channel": "sms", "sender": phone, "text": text},
                      ensure_ascii=False).encode()
    ts = int(time.time())
    r = api.post("/inbound", content=body, headers={
        "Authorization": "", "Content-Type": "application/json",
        "X-Collect-Timestamp": str(ts),
        "X-Collect-Signature": security.sign_webhook(WH, ts, body)})
    assert r.status_code == 200, r.text
    return r.json()


# ---------------------------------------------------------------- 1. מסע מלא
def test_full_journey_over_http():
    docs = [gi_doc(1), gi_doc(2, phone="052-7654321", name="יוסי לוי", amount="999.99")]
    api, svc, fake, clock = build(docs, datetime(2026, 11, 8, 10, 0, tzinfo=TZ))

    assert api.post("/sync").json() == {"open": 2, "closed": 0}
    ids = api.post("/plan").json()["created"]
    assert [r["status"] for r in api.get("/reminders").json()] == ["pending_approval"] * 2
    assert api.post("/dispatch").json()["sent"] == []  # בלי אישור — כלום

    for rid in ids:
        assert api.post(f"/reminders/{rid}/approve").status_code == 200
    assert api.post(f"/reminders/{ids[0]}/approve").status_code == 409  # אין אישור כפול
    sent = api.post("/dispatch").json()["sent"]
    assert len(sent) == 2 and all(s["dry_run"] for s in sent)
    bodies = [m["body"] for m in svc.db.q("SELECT body FROM messages WHERE direction='out'")]
    assert any("999.99 ₪" in b for b in bodies) and all(("להסרה" in b or "להפסקה" in b) for b in bodies)
    chans = {m["channel"] for m in svc.db.q("SELECT channel FROM messages WHERE direction='out'")}
    assert chans == {"sms", "email"} and "whatsapp" not in json.dumps(svc.sender.sent).lower()

    # לקוח 1 שואל איך משלמים ⇒ מנוע השיחה מכין טיוטת תשובה עם הקישור, לאישור בעל העסק
    # (לא נשלח כלום אוטומטית — team/ai.md; היה auto_reply לפני חיבור מנוע השיחה)
    r = customer_says(api, "+972-50-123-4567", "איך משלמים?")
    assert r["intent"] == "how_to_pay" and r["draft_id"] and not r["auto_sent"]
    draft = next(d for d in api.get("/conversation/drafts").json() if d["id"] == r["draft_id"])
    assert "https://pay.greeninvoice.co.il/f/doc1" in json.dumps(draft, ensure_ascii=False)
    # לקוח 2 מבקש פריסה ⇒ הצעה ממתינה לבעלים, התזכורות נעצרות
    r = customer_says(api, "0527654321", "אפשר לפרוס לתשלומים?")
    assert r["plan_id"] and r["escalate"]
    plans = api.get("/plans").json()
    assert sum(i["amount_agorot"] for i in plans[0]["installments"]) == 99999  # אגורה לא הולכת לאיבוד
    assert api.post(f"/plans/{r['plan_id']}/approve").status_code == 200
    assert api.post(f"/plans/{r['plan_id']}/approve").status_code == 409

    # שבוע אחרי: חשבונית 1 שולמה (נעלמה מ-GI); לחשבונית 2 יש הסדר ⇒ אין תזכורות חדשות
    fake.docs = [docs[1]]
    clock.now += timedelta(days=7)
    assert api.post("/sync").json() == {"open": 1, "closed": 1}
    assert api.post("/plan").json()["created"] == []
    assert api.post("/dispatch").json()["sent"] == []

    inbox = api.get("/owner/inbox").json()
    assert any(m["intent"] == "plan_request" for m in inbox)
    actions = [a["action"] for a in api.get("/audit").json()]
    # "conversation" = רישום התשובה הנכנסת במנוע השיחה (היה "inbound" לפני החיבור)
    for a in ("sync", "plan", "approve", "dispatch_dry_run", "conversation", "plan_proposed",
              "plan_approved"):
        assert a in actions, a


# ---------------------------------------------------------------- 2. סימולציה
BEHAVIOURS = ["silent", "silent", "silent", "pays_day10", "opt_out", "dispute", "claims_paid",
              "asks_link", "plan", "silent_rejected", "bad_phone", "silent"]


def _docs():
    out = []
    for i, _b in enumerate(BEHAVIOURS, start=1):
        phone = "abc" if BEHAVIOURS[i - 1] == "bad_phone" else f"05{i % 10}-55500{i:02d}"
        d = gi_doc(i, phone=phone, name=f"לקוח {i}", amount=f"{100 * i}.50",
                   due=f"2026-10-{(i % 9) + 20:02d}")
        if BEHAVIOURS[i - 1] == "bad_phone":
            d["client"]["emails"] = []  # אין נייד ואין מייל ⇒ no_contact
        out.append(d)
    return out


@pytest.mark.parametrize("seed", [1, 2, 3])
def test_60_day_simulation_invariants(seed):
    rnd = random.Random(seed)
    docs = _docs()
    start = datetime(2026, 11, 1, 8, 0, tzinfo=TZ)
    holidays = "2026-11-17"
    api, svc, fake, clock = build(docs, start, holidays=holidays)
    policy = Policy(frozenset([holidays]))
    phone_of = {i + 1: d["client"]["phone"] for i, d in enumerate(docs)}
    stop_at: dict[str, datetime] = {}  # טלפון ⇒ רגע שאחריו אסור לשלוח יזום
    approved_by_owner: set[int] = set()
    got_first_msg: set[str] = set()
    sends: list[tuple[datetime, int, str, str]] = []  # (when, rid, phone, template)

    for _day in range(60):
        day0 = clock.now.replace(hour=8, minute=30)
        clock.now = day0
        api.post("/sync")
        api.post("/plan")
        # בעל העסק עובר על התור פעם ביום (לפעמים מדלג)
        if rnd.random() < 0.85:
            for r in api.get("/reminders", params={"status": "pending_approval"}).json():
                b = BEHAVIOURS[int(r["invoice_id"]) - 1]
                if b == "silent_rejected" or r["block_reason"]:
                    res = api.post(f"/reminders/{r['id']}/reject")
                else:
                    res = api.post(f"/reminders/{r['id']}/approve")
                    if res.status_code == 200:
                        approved_by_owner.add(r["id"])
                assert res.status_code in (200, 409)
        # cron: dispatch כל 15 דק׳ עד 20:00
        while clock.now.hour < 20:
            for s in api.post("/dispatch").json()["sent"]:
                rem = svc.db.one("SELECT r.*, c.phone FROM reminders r JOIN invoices i ON "
                                 "i.id=r.invoice_id JOIN customers c ON c.id=i.customer_id "
                                 "WHERE r.id=?", (s["reminder_id"],))
                sends.append((clock.now, rem["id"], rem["phone"], rem["template_key"]))
                b = BEHAVIOURS[int(rem["invoice_id"]) - 1]
                # הלקוח מגיב שעה אחרי ההודעה הראשונה שהוא מקבל
                if b in ("opt_out", "dispute", "claims_paid", "asks_link", "plan") \
                        and rem["phone"] not in stop_at and rem["phone"] not in \
                        got_first_msg:
                    text = {"opt_out": "הסר", "dispute": "זו טעות, לא הזמנתי",
                            "claims_paid": "שילמתי כבר", "asks_link": "שלחו קישור לתשלום",
                            "plan": "אפשר פריסה?"}[b]
                    customer_says(api, rem["phone"], text)
                    if b != "asks_link":
                        stop_at[rem["phone"]] = clock.now
                got_first_msg.add(rem["phone"])
            clock.now += timedelta(minutes=15)
        if _day == 9:  # לקוח 4 משלם ⇒ החשבונית נעלמת מ-GI
            fake.docs = [d for d in fake.docs if d["id"] != "doc4"]
            stop_at[phone_of[4]] = clock.now
        clock.now = (day0 + timedelta(days=1))

    assert sends, "הסימולציה לא שלחה כלום — הבדיקה לא בודקת דבר"

    per_phone: dict[str, list[datetime]] = {}
    per_invoice: dict[int, int] = {}
    for when, rid, phone, tkey in sends:
        rem = svc.db.one("SELECT * FROM reminders WHERE id=?", (rid,))
        # שעות/שבת/חג
        assert policy.can_send_at(when), f"שליחה בזמן אסור: {when}"
        assert when.weekday() != 5
        # אישור: הודעה ראשונה ללקוח והודעה אחרונה — רק אחרי אישור בעלים מפורש
        if tkey == "final" or not per_phone.get(phone):
            assert rid in approved_by_owner, f"תזכורת {rid} ({tkey}) יצאה בלי אישור בעלים"
        # עצירה
        if phone in stop_at:
            assert when <= stop_at[phone], f"שליחה ל-{phone} אחרי עצירה"
        per_phone.setdefault(phone, []).append(when)
        per_invoice[rem["invoice_id"]] = per_invoice.get(rem["invoice_id"], 0) + 1

    for phone, ts in per_phone.items():
        for a, b in zip(ts, ts[1:], strict=False):
            assert b - a >= timedelta(hours=72), f"פחות מ-72ש׳ ל-{phone}"
    assert max(per_invoice.values()) <= MAX_REMINDERS_PER_INVOICE
    # לקוח שבעל העסק דחה — לא קיבל כלום; טלפון לא תקין — לא קיבל כלום
    assert phone_of[10] not in per_phone and "abc" not in per_phone
    # לקוח שותק אמיתי מגיע לסוף הסולם (4 תזכורות) תוך 60 יום
    assert len(per_phone[phone_of[1]]) == MAX_REMINDERS_PER_INVOICE
    # כל היוצאות dry-run, וכל הודעה שיצאה מתועדת ב-messages
    out = svc.db.q("SELECT message_id, channel FROM messages WHERE direction='out'")
    assert {m["channel"] for m in out} <= {"sms", "email"}
    assert all(m["message_id"].startswith("dryrun.") for m in out)
    assert svc.db.one("SELECT COUNT(*) n FROM reminders WHERE status='sent'")["n"] == 0


# ---------------------------------------------------------------- ratchets מהסימולציה
def test_paid_claim_pauses_until_owner_resumes():
    """באג שנמצא בסימולציה (6.11.2026): "שילמתי" ביטל רק תזכורות פעילות; אחרי שבוע
    plan() יצר את השלב הבא, ומכיוון שהלקוח כבר "אושר" — הוא יצא אוטומטית בלי אישור."""
    api, svc, fake, clock = build([gi_doc(1)], datetime(2026, 11, 8, 10, 0, tzinfo=TZ))
    api.post("/sync")
    rid = api.post("/plan").json()["created"][0]
    api.post(f"/reminders/{rid}/approve")
    assert len(api.post("/dispatch").json()["sent"]) == 1
    customer_says(api, "050-1234567", "שילמתי כבר")
    for _ in range(5):
        clock.now += timedelta(days=7)
        api.post("/sync")
        assert api.post("/plan").json()["created"] == []
    # בעל העסק בדק — לא שולם ⇒ מחדש
    cid = svc.db.one("SELECT id FROM customers")["id"]
    assert api.post(f"/customers/{cid}/resume").status_code == 200
    assert api.post("/customers/999/resume").status_code == 404
    assert len(api.post("/plan").json()["created"]) == 1
    assert "resume_customer" in [a["action"] for a in api.get("/audit").json()]


@pytest.mark.parametrize("text", ["בבקשה הסירו אותי", "תסירו אותי מהרשימה", "STOP",
                                  "אני לא מעוניין בהודעות", "ותפסיקו לשלוח", "הסר"])
def test_opt_out_anywhere_in_message(text):
    from tests.test_units import Intent, classify
    assert classify(text) == Intent.OPT_OUT


@pytest.mark.parametrize("text", ["איך משלמים?", "איך אפשר לשלם", "שלחו קישור"])
def test_how_to_pay_variants(text):
    from tests.test_units import Intent, classify
    assert classify(text) == Intent.HOW_TO_PAY


def test_plan_word_not_opt_out():
    from tests.test_units import Intent, classify
    assert classify("אפשר הסדר תשלומים?") == Intent.PLAN_REQUEST

"""גבי בדיקות (BACKLOG): מסלול בטא מלא 60 יום, עם שער «אישור רשימת הפתוחות» דלוק (כמו במוצר) ועם
זיכויים מ-morning — **אף לקוח ששילם לא מקבל תזכורת**.

רץ על ה-mock האמיתי של חשבונית ירוקה (app/gi_mock.py) ועל ספרי החשבוניות של הבטא (app/beta_seeds.py).
לכל ענף, אירועי תשלום בכל הדרכים שבהן «שולם» קורה בפועל:
  A · שולם מחוץ למערכת (ביט/העברה) — בעל העסק מסמן «שולמה» ברשימת הפתוחות ביום 0, והמסמך נשאר פתוח ב-GI
  B · שולם במקור (קבלה ב-GI) ביום 4
  C · זוכה במלואו (זיכוי 330 מקושר) ביום 6
  D · זיכוי חלקי **לא מקושר** ביום 8 ⇒ credit_review: הלקוח מושהה עד שבעל העסק בודק (כאן לא חוזר)
  E · חשבונית חדשה ביום 10 — אסור לתזכר עליה לפני שבעל העסק מאשר אותה ברשימה (מאשר ביום 15)
בעל העסק מאשר כל יום את כל התזכורות שבתור; cron מסביב לשעון. אינווריאנט על **כל** הודעה שיצאה:
אחרי רגע התשלום/הזיכוי/ההשהיה — אין שום הודעה שמזכירה את החשבונית או פונה ללקוח המושהה.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

import httpx
import pytest

from app.beta_seeds import BETA_VERTICALS, beta_docs
from app.channels import normalize_il_phone, sent_mark, sent_since
from app.config import load_settings
from app.db import DB
from app.gi_mock import GreenInvoiceMock
from app.greeninvoice import GreenInvoiceClient
from app.policy import TZ
from app.service import CollectService
from tests.conftest import SANDBOX, Clock

START = datetime(2026, 11, 8, 8, 0, tzinfo=TZ)
DAYS = 60


def _book(vertical: str) -> list[dict]:
    """ספר החשבוניות של הענף + לקוח נוסף אחד באיחור (בדוי), כדי שיהיו 4 לקוחות שונים לאירועים."""
    docs = beta_docs(vertical)
    base = next(d for d in docs if d["client"].get("emails"))
    extra = dict(base, id=f"{vertical}x1", number="3999", amount="640.00", dueDate="2026-10-18",
                 description="")
    extra["client"] = {"id": f"{vertical}xcl", "name": "לקוח נוסף (דמו)", "phone": "058-0000999",
                       "emails": [f"extra.{vertical}@example.com"]}
    return [*docs, extra]


def _build(vertical: str):
    clock = Clock(START)
    mock = GreenInvoiceMock(api_id="test-id", api_secret="test-secret", docs=_book(vertical),
                            deliver=lambda url, payload: None)
    gi = GreenInvoiceClient(SANDBOX, "test-id", "test-secret",
                            transport=httpx.MockTransport(mock.handler))
    s = load_settings({"BUSINESS_NAME": "עסק הבטא", "SMS_SENDER_ID": "Beta",
                       "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/beta",
                       "PUBLIC_BASE_URL": "https://gabi.example", "SMS_WEBHOOK_KEY": "whk-test",
                       "EMAIL_REPLY_TO": "owner@beta.example", "EMAIL_WEBHOOK_KEY": "ewk-test",
                       "REAL_DATA_ALLOWED": "1", "OPEN_REVIEW": "1"})
    svc = CollectService(s, DB(":memory:"), gi=gi, clock=clock)
    assert svc.s.open_review, "השער חייב להיות דלוק בבדיקה הזו"
    return svc, mock, clock


def _admin(mock, path, body=None):
    status, out = mock.route("POST", path, {}, body)
    assert status == 200, (path, out)
    return out


def _remindable(docs):
    """חשבוניות שיש להן איך לפנות (נייד/מייל) ושמועדן עבר — מועמדות לאירועים."""
    out = []
    for d in docs:
        c = d["client"]
        has = (normalize_il_phone(c.get("phone") or "") or "").startswith("9725") or c.get("emails")
        if has and date.fromisoformat(d["dueDate"]) < START.date():
            out.append(d)
    return out


def _addresses(doc) -> set[str]:
    c = doc["client"]
    out = set(c.get("emails") or [])
    p = normalize_il_phone(c.get("phone") or "")
    if p:
        out.add(p)
    return out


@pytest.mark.open_review
@pytest.mark.parametrize("vertical", sorted(BETA_VERTICALS))
def test_no_paid_customer_is_ever_reminded(vertical):
    svc, mock, clock = _build(vertical)
    docs = _book(vertical)
    cand = _remindable(docs)
    # לקוחות שונים לכל אירוע, כדי שאירוע אחד לא יסתיר אחר
    by_client, seen = [], set()
    for d in cand:
        if d["client"]["id"] not in seen:
            seen.add(d["client"]["id"])
            by_client.append(d)
    if len(by_client) < 4:
        pytest.skip(f"{vertical}: פחות מ-4 לקוחות עם פרטי קשר — אין מספיק לכל האירועים")
    A, B, C, D = by_client[:4]

    stop_inv: dict[str, datetime] = {}      # מספר חשבונית ⇒ הרגע שאחריו אסור להזכיר אותה
    stop_addr: dict[str, datetime] = {}     # כתובת ⇒ הרגע שאחריו אסור לפנות (השהיה)
    not_before: dict[str, datetime] = {}    # מספר חשבונית ⇒ אסור לפני אישור בעל העסק
    sent: list[tuple[datetime, str, str]] = []
    E_number = None

    def owner_review(paid_numbers=()):
        lst = svc.open_list()
        pending = lst["pending"]
        paid = [x["id"] for x in pending if x["number"] in paid_numbers]
        still = [x["id"] for x in pending if x["number"] not in paid_numbers]
        svc.confirm_open_list(still, paid, actor="owner")

    for day in range(DAYS):
        clock.now = (START + timedelta(days=day)).replace(hour=8, minute=0)
        if day == 4:
            _admin(mock, f"/_mock/documents/{B['id']}/pay")
            stop_inv[B["number"]] = clock.now
        if day == 6:
            _admin(mock, f"/_mock/documents/{C['id']}/credit", {"amount": float(C["amount"])})
            stop_inv[C["number"]] = clock.now
        if day == 8:
            _admin(mock, f"/_mock/documents/{D['id']}/credit",
                   {"amount": round(float(D["amount"]) / 4, 2), "link": False})
            for a in _addresses(D):
                stop_addr[a] = clock.now
        if day == 10:
            new = _admin(mock, "/_mock/documents", {
                "type": 305, "amount": 777.0, "currency": "ILS", "documentDate": "2026-11-17",
                "dueDate": "2026-11-17", "client": A["client"] | {"id": "newcl", "name": "רון לוי (דמו)"}})
            E_number = str(new["number"])
            not_before[E_number] = START + timedelta(days=15)
        svc.sync()
        if day == 0:
            owner_review(paid_numbers={A["number"]})
            stop_inv[A["number"]] = clock.now
        if day == 15:
            owner_review()
        svc.plan()
        for r in svc.db.q("SELECT id FROM reminders WHERE status='pending_approval'"):
            try:
                svc.approve(r["id"])
            except ValueError:
                pass
        end = clock.now.replace(hour=0) + timedelta(days=1)
        clock.now = clock.now.replace(hour=0)
        while clock.now < end:
            mark = sent_mark(svc.sender.sent)
            svc.dispatch()
            for m in sent_since(svc.sender.sent, mark):
                sent.append((clock.now, m["to"], m["body"] + " " + str(m.get("subject", ""))))
            clock.now += timedelta(minutes=30)

    assert sent, f"{vertical}: לא יצאה אף הודעה — הבדיקה לא בודקת כלום"
    leaks = []
    for when, to, text in sent:
        for num, t in stop_inv.items():
            if when >= t and num in text:
                leaks.append(f"{when:%d.%m %H:%M} חשבונית {num} אחרי ששולמה/זוכתה ⇒ {to}")
        if to in stop_addr and when >= stop_addr[to]:
            leaks.append(f"{when:%d.%m %H:%M} פנייה ל-{to} בזמן השהיית בדיקת זיכוי")
        for num, t in not_before.items():
            if when < t and num in text:
                leaks.append(f"{when:%d.%m %H:%M} חשבונית {num} לפני שבעל העסק אישר אותה")
    assert not leaks, f"{vertical}:\n" + "\n".join(leaks[:10])
    # האירועים באמת קרו (לא בדיקה ריקה)
    cust_d = svc.db.one("SELECT paused_reason FROM customers WHERE external_id=?",
                        (D["client"]["id"],))
    assert cust_d and cust_d["paused_reason"] == "credit_review", cust_d
    assert E_number and any(E_number in t for _, _, t in sent), \
        "החשבונית החדשה לא תוזכרה גם אחרי שבעל העסק אישר אותה"

"""ערכת הבטא (גבי מכירות): לכל ענף בבטא — מספרה, מוסך, קליניקה, לקוח רו״ח — היום הראשון עובד
מקצה לקצה על נתונים בדויים (app/beta_seeds.py ⇒ gi_mock, בלי רשת):

סנכרון ⇒ «יש לך X פתוחות בסך ₪Y» ⇒ תזכורת לכל חשבונית שהגיע מועדה ⇒ **אף הודעה לא יוצאת לפני אישור**
⇒ SMS עד 2 חלקים ⇒ שם העסק בכל הודעה ⇒ בלי פרטי קשר = חסום (לא מנחשים) ⇒ חשבונית שטרם הגיע מועדה
= אין תזכורת ⇒ בקליניקה: תיאור הטיפול מהמסמך לא מופיע באף הודעה (פרטיות).

באג שנמצא כאן (קליניקה): לקוח שרשום בחשבונית ירוקה «הורי איתי» קיבל SMS «שלום הורי,». עכשיו
תיאור קבוצה בתחילת השם (הורי / משפחת / אמא של / אבא של) נשמר בשלמותו: «שלום הורי איתי».
"""
from __future__ import annotations

import time

import httpx
import pytest

from app import templates
from app.beta_seeds import BETA_VERTICALS, NOT_DUE, beta_business, beta_docs
from app.config import load_settings
from app.db import DB
from app.demo import DEMO_NOW, DEMO_PAY_LINK, FixedClock
from app.demo_data import DEMO_ID, DEMO_SECRET, SANDBOX
from app.gi_mock import GreenInvoiceMock
from app.greeninvoice import GreenInvoiceClient
from app.service import CollectService

VERTICALS = list(BETA_VERTICALS)
# 10 עסקי הבטא (הכרעת מאיר 6.11): 3 מספרות · 2 מוסכים · 2 קליניקות · 3 לקוחות רו״ח
BETA_SLOTS = {"barber": 3, "garage": 2, "clinic": 2, "cpa": 3}


def _svc(vertical: str) -> CollectService:
    mock = GreenInvoiceMock(api_id=DEMO_ID, api_secret=DEMO_SECRET, docs=beta_docs(vertical),
                            deliver=lambda url, payload: None)
    gi = GreenInvoiceClient(SANDBOX, DEMO_ID, DEMO_SECRET, transport=httpx.MockTransport(mock.handler))
    s = load_settings({"BUSINESS_NAME": beta_business(vertical), "SMS_SENDER_ID": "GabiDemo",
                       "PAYMENT_LINK_MODE": "static", "PAYMENT_LINK": DEMO_PAY_LINK,
                       "PAYMENT_DOMAINS": "pay.example", "EMAIL_FROM": "gabi@example.com",
                       "EMAIL_REPLY_TO": "owner@example.com", "TRIAL_START": "2026-11-03",
                       "PUBLIC_BASE_URL": "http://127.0.0.1:8000"})
    return CollectService(s, DB(":memory:"), gi=gi, clock=FixedClock(DEMO_NOW))


def test_beta_slots_cover_every_vertical():
    assert set(BETA_SLOTS) == set(BETA_VERTICALS)
    assert sum(BETA_SLOTS.values()) == 10


@pytest.mark.parametrize("vertical", VERTICALS)
def test_first_day_end_to_end(vertical):
    docs = beta_docs(vertical)
    svc = _svc(vertical)
    t0 = time.perf_counter()
    synced = svc.sync()
    created = svc.plan()
    dash = svc.dashboard()
    elapsed = time.perf_counter() - t0

    # «יש לך X פתוחות בסך ₪Y» — בדיוק מה שבחשבונית ירוקה (שקלים בלבד; דולר בנפרד)
    assert synced == {"open": len(docs), "closed": 0}
    t = dash["totals"]
    assert t["open_invoices"] == len(docs)
    ils = sum(round(float(d["amount"]) * 100) for d in docs if d["currency"] == "ILS")
    assert t["open_agorot"] == ils
    # החלק של המערכת ב«זמן עד wow» (הדבקת מפתח ע״י אדם לא נמדדת כאן)
    assert elapsed < 3.0, f"{vertical}: סנכרון+תכנון+דשבורד {elapsed:.2f}s"

    # אף הודעה לא יוצאת לפני אישור פרטני
    assert svc.dispatch() == []

    due = {d["number"] for d in docs if d["dueDate"] != NOT_DUE}
    not_due = {d["number"] for d in docs if d["dueDate"] == NOT_DUE}
    covered: set[str] = set()
    for rid in created:
        p = svc.preview(rid)
        covered |= set(p["numbers"])
        assert p["status"] == "pending_approval"
        if p["block_reason"] == "no_contact":
            assert p["messages"] == []                         # לא מנחשים ערוץ
            continue
        assert p["block_reason"] is None, p["block_reason"]
        assert p["messages"], "תזכורת בלי אף ערוץ"
        for m in p["messages"]:
            assert beta_business(vertical) in m["body"], "ההודעה לא מזהה את העסק"
            if m["channel"] == "sms":
                assert m["length"]["segments"] <= 2, m["body"]
            # שום תיאור שירות מהמסמך (טיפול, אבחון, רכב) לא יוצא ללקוח
            for d in docs:
                if d["description"]:
                    assert d["description"] not in m["body"], (vertical, d["description"])
    assert covered == due, "כל חשבונית שהגיע מועדה מקבלת תזכורת (או חסימה מנומקת)"
    assert not (covered & not_due), "תזכורת על חשבונית שעוד לא הגיע מועדה"


def test_clinic_privacy_no_treatment_words():
    """קליניקה: אף מילה מתחום הטיפול לא מופיעה בהודעות, גם לא בעקיפין."""
    svc = _svc("clinic")
    svc.sync()
    for rid in svc.plan():
        for m in svc.preview(rid)["messages"]:
            for w in ("טיפול", "אבחון", "קשב", "גמגום", "ריפוי", "קלינאות", "רגשי"):
                assert w not in m["body"], (w, m["body"][:80])


@pytest.mark.parametrize("name,exp", [
    ("הורי איתי", "הורי איתי"), ("משפחת כהן", "משפחת כהן"), ("אמא של נועה", "אמא של נועה"),
    ("הורי איתי (דמו)", "הורי איתי (דמו)"), ("הוריה של מאיה לוי", "הוריה של מאיה לוי"),
    ("דנה כהן", "דנה"),
])
def test_first_name_keeps_group_descriptor(name, exp):
    assert templates.first_name(name) == exp


def test_clinic_parent_greeting_is_not_just_parents():
    svc = _svc("clinic")
    svc.sync()
    bodies = [m["body"] for rid in svc.plan() for m in svc.preview(rid)["messages"]
              if m["channel"] == "sms"]
    assert bodies
    assert not any("שלום הורי," in b for b in bodies), bodies
    assert any("שלום הורי איתי" in b for b in bodies)

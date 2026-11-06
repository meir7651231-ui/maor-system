"""מצב הדגמה: sandbox מדומה של חשבונית ירוקה + תרחיש מוכן + הדפסת כל הודעה ללוג.

`DEMO=1 uvicorn app.main:_lazy_app --factory` (או ./demo.sh) ⇒ השרת עולה עם 6 חשבוניות
פתוחות בדויות, התרחיש רץ (סנכרון ⇒ תור ⇒ אישורים ⇒ שליחת dry-run ⇒ תשובות לקוחות ⇒
חשבונית ששולמה נסגרת), וכל SMS/מייל *שהיה* נשלח מודפס ללוג. אחר כך הדשבורד ב-/ui חי
ואפשר להמשיך ללחוץ (למשל לאשר את התזכורת של יוסי שנשארה ממתינה).

השעון קבוע: ראשון 8.11.2026 10:00 (שעון ישראל), כדי שכללי שבת/שעות לא יחסמו את ההדגמה.
אין שום קריאת רשת: חשבונית ירוקה מדומה בתוך התהליך, השולח DryRunSender, נתונים בדויים.
"""
from __future__ import annotations

import logging
import os
from collections.abc import Callable
from datetime import datetime

from .config import load_settings
from .db import DB
from .demo_data import demo_client
from .policy import TZ
from .service import CollectService

log = logging.getLogger("gabi.demo")
DEMO_PAY_LINK = "https://pay.example/gabi-demo"   # דומיין example ⇒ לא קיים באמת
DEMO_NOW = datetime(2026, 11, 8, 10, tzinfo=TZ)


class FixedClock:
    def __init__(self, dt: datetime):
        self.now = dt

    def __call__(self) -> datetime:
        return self.now


def demo_settings():
    return load_settings({"BUSINESS_NAME": "סטודיו דמו", "SMS_SENDER_ID": "StudioDemo",
                          "PAYMENT_LINK_MODE": "static", "PAYMENT_LINK": DEMO_PAY_LINK,
                          "PAYMENT_DOMAINS": "pay.example", "EMAIL_FROM": "gabi@example.com",
                          "EMAIL_REPLY_TO": "owner@example.com",
                          "TRIAL_START": "2026-11-03",   # שעון ההדגמה 8.11 ⇒ נותרו 9 ימים
                          # הקישור הקצר ב-SMS לחיץ בהדגמה (אותו פורט שעליו השרת רץ)
                          "PUBLIC_BASE_URL": f"http://127.0.0.1:{os.environ.get('PORT', '8000')}"})


def build_demo_service() -> tuple[CollectService, object, FixedClock]:
    gi, fake = demo_client()
    clock = FixedClock(DEMO_NOW)
    svc = CollectService(demo_settings(), DB(":memory:"), gi=gi, clock=clock)
    return svc, fake, clock


def _log_outbox(svc: CollectService, start: int, out: Callable[[str], None]) -> int:
    msgs = svc.sender.sent
    for m in msgs[start:]:
        if m["channel"] == "sms":
            seg = m.get("length", {}).get("segments", "?")
            out(f"📱 SMS  → {m['to']}  ({seg} חלקים, ספק {m['provider']}, dry-run)\n"
                f"         {m['body']}")
        else:
            out(f"✉️  מייל → {m['to']}  נושא: {m.get('subject', '')}\n"
                f"         {m['body'][:220].replace(chr(10), ' ')}…")
    return len(msgs)


def run_scenario(svc: CollectService, fake, out: Callable[[str], None] = print) -> dict:
    """התרחיש המלא. מחזיר סיכום. נכשל (AssertionError) אם משהו לא מתנהג כמצופה."""
    out("══ גבי · הדגמה (dry-run, נתונים בדויים, אף הודעה לא יוצאת) ══")
    r = svc.sync()
    out(f"① סנכרון חשבונית ירוקה (sandbox מדומה): {r['open']} חשבוניות פתוחות")
    assert r == {"open": 6, "closed": 0}, r
    created = svc.plan()
    out(f"② הוכנו {len(created)} תזכורות — כולן ממתינות לאישור בעל העסק")
    assert len(created) == 6
    assert svc.dispatch() == [], "נשלח משהו לפני אישור!"
    approved, left = [], None
    for rid in created:
        rem = svc._reminder(rid)
        if rem["block_reason"]:
            out(f"   ⛔ תזכורת #{rid} חסומה: {rem['block_reason']}")
            continue
        if left is None and rid == created[1]:
            left = rid  # נשארת ממתינה — כדי שבדשבורד יהיה מה לאשר
            continue
        svc.approve(rid)
        approved.append(rid)
    out(f"③ בעל העסק אישר {len(approved)} תזכורות (#{left} נשארה ממתינה לאישורך ב-/ui)")
    sent = svc.dispatch()
    out(f"④ שליחה (dry-run): {len(sent)} תזכורות ⇒")
    n = _log_outbox(svc, 0, out)
    assert len(sent) == len(approved)
    out("⑤ תשובות לקוחות:")
    for ch, who, text in [("sms", "050-0000001", "שילמתי אתמול בהעברה"),
                          ("sms", "054-0000004", "הסר"),
                          ("email", "clinic@example.com", "איך אפשר לשלם?")]:
        res = svc.inbound(ch, who, text)
        out(f"   {who}: «{text}» ⇒ {res['intent']}"
            + (" · הועבר לבעל העסק" if res["escalate"] else "")
            + (" · מענה אוטומטי" if res.get("auto_reply") else ""))
    n = _log_outbox(svc, n, out)
    fake.docs = [d for d in fake.docs if d["id"] != "demo5"]
    r = svc.sync()
    out(f"⑥ מיכל שילמה בחשבונית ירוקה ⇒ סנכרון: {r['open']} פתוחות, {r['closed']} נסגרה")
    assert r["closed"] == 1
    d = svc.dashboard()["totals"]
    out(f"⑦ דשבורד: חוב פתוח {d['open_agorot'] / 100:,.2f} ₪ ב-{d['open_invoices']} חשבוניות · "
        f"SMS {d['sent_sms']} · מיילים {d['sent_email']} · ממתינות לאישור {d['pending_approval']}"
        f" · בתיבת בעל העסק {d['owner_inbox']}")
    return d


def demo_service_ready() -> CollectService:
    svc, fake, _ = build_demo_service()
    run_scenario(svc, fake, out=lambda s: print(s, flush=True))
    return svc

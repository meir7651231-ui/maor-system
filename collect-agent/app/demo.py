"""מצב הדגמה: sandbox מדומה של חשבונית ירוקה + תרחיש מוכן + הדפסת כל הודעה ללוג.

`DEMO=1 uvicorn app.main:_lazy_app --factory` (או ./demo.sh) ⇒ השרת עולה עם 10 חשבוניות
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

from .channels import sent_mark, sent_since
from .config import load_settings
from .db import DB
from .demo_data import demo_client, demo_docs, demo_source_factory
from .policy import TZ
from .service import AMOUNT_CHECK, CollectService, is_synthetic_contact
from .templates import fmt_amount

log = logging.getLogger("gabi.demo")
DEMO_PAY_LINK = "https://pay.example/gabi-demo"   # דומיין example ⇒ לא קיים באמת
DEMO_NOW = datetime(2026, 11, 8, 10, tzinfo=TZ)


class FixedClock:
    def __init__(self, dt: datetime):
        self.now = dt

    def __call__(self) -> datetime:
        return self.now


def demo_source() -> str:
    """גבי חיבורים (משימת מקשר, 21.11): `DEMO=1 SOURCE_SYSTEM=csv` ⇒ הדגמה של עסק שעובד עם CSV. כל ערך אחר ⇒
    ההדגמה הרגילה (חשבונית ירוקה מדומה). קודם הסביבה התעלמה מ-SOURCE_SYSTEM ולא הייתה דרך להעלות דמו CSV."""
    return "csv" if os.environ.get("SOURCE_SYSTEM", "").strip().lower() == "csv" else "greeninvoice"


def demo_settings():
    return load_settings({"SOURCE_SYSTEM": demo_source(), "BUSINESS_NAME": "סטודיו דמו", "SMS_SENDER_ID": "StudioDemo",
                          "PAYMENT_LINK_MODE": "static", "PAYMENT_LINK": DEMO_PAY_LINK,
                          "PAYMENT_DOMAINS": "pay.example", "EMAIL_FROM": "gabi@example.com",
                          "EMAIL_REPLY_TO": "owner@example.com",
                          "GI_WEBHOOK_KEY": os.environ.get("GI_WEBHOOK_KEY", ""),   # webhook מה-mock
                          # גבי עיצוב: bounce/ARF בבדיקת דפדפן (e2e/app-email-state.mjs). ריק ⇒ ה-webhook סגור (403)
                          "EMAIL_WEBHOOK_KEY": os.environ.get("EMAIL_WEBHOOK_KEY", ""),
                          # שעון ההדגמה 8.11 ⇒ נותרו 9 ימים. DEMO_TRIAL_START=2026-10-28 ⇒ נותרו 3 (מציג trial_ending)
                          "TRIAL_START": os.environ.get("DEMO_TRIAL_START", "2026-11-03"),
                          # הקישור הקצר ב-SMS לחיץ בהדגמה (אותו פורט שעליו השרת רץ)
                          "PUBLIC_BASE_URL": f"http://127.0.0.1:{os.environ.get('PORT', '8000')}"})


def build_demo_service() -> tuple[CollectService, object, FixedClock]:
    gi, fake = demo_client(os.environ.get("GREENINVOICE_MOCK_URL", "")
                           if os.environ.get("GREENINVOICE_ENV") == "mock" else "")
    clock = FixedClock(DEMO_NOW)
    factory, _ = demo_source_factory()   # בחירת מקור אחר בהגדרות ⇒ mock בתוך התהליך (בלי רשת)
    svc = CollectService(demo_settings(), DB(":memory:"), gi=gi, clock=clock, source_factory=factory)
    return svc, fake, clock


def _log_outbox(svc: CollectService, start: int, out: Callable[[str], None]) -> int:
    msgs = svc.sender.sent
    for m in sent_since(msgs, start):
        if m["channel"] == "sms":
            seg = m.get("length", {}).get("segments", "?")
            out(f"📱 SMS  → {m['to']}  ({seg} חלקים, ספק {m['provider']}, dry-run)\n"
                f"         {m['body']}")
        else:
            out(f"✉️  מייל → {m['to']}  נושא: {m.get('subject', '')}\n"
                f"         {m['body'][:220].replace(chr(10), ' ')}…")
    return sent_mark(msgs)


def run_scenario(svc: CollectService, fake, out: Callable[[str], None] = print) -> dict:
    """התרחיש המלא. מחזיר סיכום. נכשל (AssertionError) אם משהו לא מתנהג כמצופה."""
    out("══ גבי · הדגמה (dry-run, נתונים בדויים, אף הודעה לא יוצאת) ══")
    r = svc.sync()
    out(f"① סנכרון חשבונית ירוקה (sandbox מדומה): {r['open']} חשבוניות פתוחות")
    assert r == {"open": 10, "closed": 0}, r
    pending = [x["id"] for x in svc.open_list()["pending"]]
    if pending:   # שער «אישור רשימת הפתוחות»: בעל העסק מאשר שכל החשבוניות בדמו עדיין פתוחות
        svc.confirm_open_list(pending, [], actor="owner:demo")
        out(f"①ב בעל העסק אישר את רשימת הפתוחות ({len(pending)} חשבוניות) — רק עליהן תיבנה תזכורת")
    created = svc.plan()
    out(f"② הוכנו {len(created)} תזכורות — כולן ממתינות לאישור בעל העסק"
        " (לגל שרון: הודעה אחת על 3 חשבוניות)")
    assert len(created) == 8
    assert svc.dispatch() == [], "נשלח משהו לפני אישור!"
    approved, left, odd = [], None, None
    for rid in created:
        rem = svc._reminder(rid)
        if rem["block_reason"] == AMOUNT_CHECK:   # הפעלה 125: נשארת לאישור מפורש של בעל העסק
            chk = svc.preview(rid)["amount_check"][0]
            out(f"   ⚠️ תזכורת #{rid}: חשבונית {chk['number']} על {fmt_amount(chk['amount_agorot'])}"
                f" — בדרך כלל {fmt_amount(chk['usual_agorot'])}. ממתינה לאישור «הסכום נכון» ב-/app/")
            odd = rid
            continue
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
    assert odd is not None, "סכום חריג (גל שרון) לא סומן לאישור מפורש"
    assert svc._reminder(odd)["status"] == "pending_approval", "סכום חריג נשלח בלי אישור!"
    out("⑤ תשובות לקוחות:")
    for ch, who, text in [("sms", "050-0000001", "שילמתי אתמול בהעברה"),
                          ("sms", "054-0000004", "הסר"),
                          ("email", "clinic@example.com", "איך אפשר לשלם?")]:
        res = svc.inbound(ch, who, text)
        out(f"   {who}: «{text}» ⇒ {res['intent']}"
            + (" · הועבר לבעל העסק" if res["escalate"] else "")
            + (" · מענה אוטומטי" if res.get("auto_reply") else ""))
    # כל תשובה היא טיוטה — בעל העסק מאשר (כאן: את כולן, כדי להראות את הזרימה המלאה)
    for dr in svc.inbox.drafts("pending_approval"):
        svc.inbox.approve_draft(dr["id"])
        out(f"   ✔ בעל העסק אישר תשובה ל{dr['customer']}: «{' '.join(dr['body'].split())[:60]}…»")
    n = _log_outbox(svc, n, out)
    paid = fake.pay("demo5")   # morning: המסמך נסגר + נוצרת קבלה (⇒ webhook לשרת, אם רץ)
    out(f"   🧾 חשבונית ירוקה (mock): מסמך {paid['closed']} נסגר, קבלה {paid['receipt']} נוצרה")
    usd = fake.pay("demo10")   # הפעלה 139: גם הלקוח בחו״ל שילם — חשבונית בדולר
    out(f"   🧾 חשבונית ירוקה (mock): מסמך {usd['closed']} (בדולר) נסגר, קבלה {usd['receipt']} נוצרה")
    r = svc.sync()
    out(f"⑥ מיכל והלקוח בחו״ל שילמו בחשבונית ירוקה ⇒ סנכרון: {r['open']} פתוחות, {r['closed']} נסגרו")
    assert r["closed"] == 2
    d = svc.dashboard()["totals"]
    out(f"⑦ דשבורד: חוב פתוח {open_debt_text(d)} ב-{d['open_invoices']} חשבוניות · "
        f"SMS {d['sent_sms']} · מיילים {d['sent_email']} · ממתינות לאישור {d['pending_approval']}"
        f" · בתיבת בעל העסק {d['owner_inbox']}")
    out(f"   נגבה: {collected_text(d)} (מטבע אחר מוצג בנפרד, בלי המרה)")
    assert [(o["currency"], o["collected_agorot"]) for o in d["other_currency"]] == [("USD", 50000)], \
        d["other_currency"]
    show_sensitive_settings_notice(svc, out)
    return d


DEMO_WORKER = "עובד/ת (דמו)"
DEMO_OTHER_LINK = "https://pay.example/gabi-other"


def show_sensitive_settings_notice(svc: CollectService, out: Callable[[str], None] = print) -> None:
    """הפעלה 202 («הבא» 2 מ-201): שלב ⑧ בהדגמה האינטראקטיבית — עובד מחליף את קישור התשלום ⇒ מייל לבעל העסק
    לכתובת ה-Reply-To שהייתה מוגדרת (owner@) + התראה בתיבה שנשארת פתוחה ב-/ui. אחר כך בעל העסק מחזיר את הקישור
    (כדי שהקישורים ב-SMS ימשיכו להוביל לדף הדמו) ומסמן «טופל» רק את ההתראה על השינוי שלו עצמו.
    רק קישור התשלום משתנה: שינוי Reply-To והחזרתו היו שולחים את מייל ההחזרה לכתובת הזמנית ומבלבלים.
    המיילים לא נרשמים בטבלת messages ⇒ מגיני ה-outbox ללקוחות לא מושפעים; הם כן נספרים ב-/outbox."""
    owner_to = svc.s.email_reply_to
    mark = sent_mark(svc.sender.sent)
    svc.update_settings({"payment_link": DEMO_OTHER_LINK}, DEMO_WORKER)
    mails = [m for m in sent_since(svc.sender.sent, mark)
             if m["channel"] == "email" and "שינוי בהגדרות רגישות" in m.get("subject", "")]
    assert len(mails) == 1 and mails[0]["to"] == owner_to, mails
    assert DEMO_OTHER_LINK in mails[0]["body"], mails[0]["body"]
    out(f"⑧ {DEMO_WORKER} החליף/ה את קישור התשלום ל-{DEMO_OTHER_LINK} ⇒")
    out(f"   ✉️  מייל לבעל העסק → {mails[0]['to']} (הכתובת שהייתה מוגדרת, dry-run)"
        f"  נושא: {mails[0]['subject']}")
    notice = svc.db.one("SELECT id FROM messages WHERE intent='settings_changed' AND needs_owner=1 "
                        "AND message_id=?", (f"settings_changed:{DEMO_WORKER}",))
    assert notice, "חסרה התראת settings_changed בתיבה"
    out(f"   🔔 התראה #{notice['id']} בתיבת בעל העסק (/ui) — נשארת פתוחה")
    mark = sent_mark(svc.sender.sent)
    svc.update_settings({"payment_link": DEMO_PAY_LINK}, "owner")
    assert svc.s.payment_link == DEMO_PAY_LINK
    back = [m for m in sent_since(svc.sender.sent, mark) if m["channel"] == "email"]
    assert [m["to"] for m in back] == [owner_to], back
    mine = svc.db.one("SELECT id FROM messages WHERE intent='settings_changed' AND needs_owner=1 "
                      "AND message_id='settings_changed:owner'")
    if mine:
        svc.owner_message_done(mine["id"], "owner")
    out(f"   ↩️  בעל העסק החזיר את הקישור ל-{DEMO_PAY_LINK} (מייל אישור נוסף → {owner_to})")


def collected_text(totals: dict) -> str:
    """«2,100.00 ₪ + $500»: מה שנגבה, כל מטבע בנפרד (אין שער המרה ⇒ לא מחברים)."""
    parts = [f"{totals['collected_agorot'] / 100:,.2f} ₪"]
    parts += [fmt_amount(o["collected_agorot"], o["currency"])
              for o in totals.get("other_currency", []) if o["collected_agorot"]]
    return " + ".join(parts)


def open_debt_text(totals: dict) -> str:
    """«8,725.00 ₪», ואם יש חוב פתוח במטבע אחר: «8,725.00 ₪ + $500». בלי חיבור בין מטבעות (אין שער המרה)."""
    parts = [f"{totals['open_agorot'] / 100:,.2f} ₪"]
    parts += [fmt_amount(o["open_agorot"], o["currency"])
              for o in totals.get("other_currency", []) if o["open_agorot"]]
    return " + ".join(parts)


def demo_csv() -> bytes:
    """אותם לקוחות בדויים כמו ב-mock (example.com · 05X-000XXXX), כקובץ שבעל עסק מייצא מ-Excel — Windows-1255,
    כמו «שמירה בשם ← CSV» בעברית. חשבונית במטבע זר נשארת עם עמודת מטבע."""
    rows = ["מספר מסמך,שם לקוח,טלפון,מייל,יתרה לתשלום,מטבע,תאריך,תאריך לתשלום"]
    for d in demo_docs():
        c = d["client"]
        # שער הבטא (נתוני דמו מסומנים בלבד) בודק טלפון בטווח 05X-000XXXX. הקווי של הקליניקה (מייל בלבד ממילא) ו-«123»
        # (אין ערוץ) נשארים בלי טלפון ⇒ הקליניקה במייל, «בלי פרטים» נדחה בייבוא עם הסבר — כמו בהדגמה הרגילה
        phone = c["phone"] if is_synthetic_contact(c["phone"], "") and c["phone"] else ""
        rows.append(",".join([d["number"], f'"{c["name"]}"', phone, (c["emails"] or [""])[0], d["amount"],
                              d["currency"], d["documentDate"], d["dueDate"]]))
    return ("\r\n".join(rows) + "\r\n").encode("cp1255")


def run_csv_scenario(svc: CollectService, out: Callable[[str], None] = print) -> dict:
    """הדגמת עסק CSV: אין סנכרון (sync זורק במכוון — אין API). ייבוא הקובץ ⇒ אישור רשימת הפתוחות ⇒ תזכורות
    שממתינות לאישור. **בלי שליחה** — כדי שבמסך יהיה מה לאשר, כמו בהדגמה הרגילה אחרי שלב ②."""
    out("══ גבי · הדגמה, עסק שעובד עם קובץ CSV (dry-run, נתונים בדויים, אף הודעה לא יוצאת) ══")
    r = svc.import_csv(demo_csv(), actor="owner:demo")
    out(f"① ייבוא קובץ CSV (Windows-1255, כמו Excel בעברית): {r['imported']} חשבוניות"
        + "".join(f" · שורה {e['row']} נדחתה: {e['error']}" for e in r["errors"]))
    assert r["imported"] >= 8, r
    pending = [x["id"] for x in svc.open_list()["pending"]]
    if pending:
        svc.confirm_open_list(pending, [], actor="owner:demo")
        out(f"①ב בעל העסק אישר את רשימת הפתוחות ({len(pending)} חשבוניות)")
    created = svc.plan()
    out(f"② הוכנו {len(created)} תזכורות — ממתינות לאישור בעל העסק. אחרי 24 שעות בלי קובץ חדש ⇒ «העלו קובץ עדכני»")
    assert created, "דמו CSV: לא נבנתה אף תזכורת"
    assert svc.dispatch() == [], "נשלח משהו לפני אישור!"
    return {"imported": r["imported"], "reminders": len(created)}


def demo_service_ready() -> CollectService:
    svc, fake, _ = build_demo_service()
    if svc.s.source_system == "csv":
        run_csv_scenario(svc, out=lambda s: print(s, flush=True))
    else:
        run_scenario(svc, fake, out=lambda s: print(s, flush=True))
    return svc

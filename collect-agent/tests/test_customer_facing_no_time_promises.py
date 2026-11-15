"""טקסט שהלקוח של העסק רואה לא מתחייב לזמן שגבי לא שולט בו (גבי שיווק, 15.11, legal §3.2):

• עמוד הקישור הקצר בלי קישור תשלום אמר «קישור התשלום יישלח בהקדם», אבל גבי לא שולח אותו לבד; בעל העסק
  צריך להגדיר. מעכשיו: «בעל העסק יעדכן אתכם», כמו בעמוד החייב ב-web (Pay.tsx).
• אחרי «מאשר» להצעת פריסה המנוע ניסח «ונשלח בקרוב את פרטי התשלום הראשון», אבל זה תלוי באישור סופי של
  בעל העסק. מעכשיו: «אחרי האישור נשלח…».
"""
from datetime import date
from pathlib import Path

from app import conversation as c

ROOT = Path(__file__).resolve().parents[1]


def test_pay_page_does_not_promise_link_delivery():
    src = (ROOT / "app/main.py").read_text(encoding="utf-8")
    assert "קישור התשלום יישלח בהקדם" not in src
    assert "בעל העסק יעדכן אתכם" in src


def test_plan_accept_reply_waits_for_owner_not_soon():
    plan = (c.Installment(1, date(2026, 11, 15), 60000), c.Installment(2, date(2026, 12, 15), 60000))
    ctx = c.Context(today=date(2026, 11, 8), business="סטודיו נועה", customer_name="דני כהן",
                    invoices=(c.OpenInvoice("1043", 120000),), payment_link="https://pay.example/x",
                    state=c.State.AWAITING_PLAN_REPLY, offered_plan=plan)
    d = c.respond("מאשר", ctx)
    assert d.intent == c.Intent.PLAN_ACCEPT, d.intent
    assert d.reply and "בקרוב" not in d.reply and "אחרי האישור" in d.reply, d.reply
    assert d.auto_send is False

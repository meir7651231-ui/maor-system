"""נתיב השליחה: ר-4 (רענון סכום מול gi_mock לפני כל שליחה) מקצה לקצה + adapter יחיד (019 ⇒ InforU).

הכרעות מאיר: "אימות סכום לפני כל שליחה" · 019 ראשי / InforU גיבוי · adapter יחיד · dry-run בלבד.
הכול מול app/gi_mock.py בתוך התהליך (MockTransport) — בלי רשת.
"""
from __future__ import annotations

import ast
from pathlib import Path

import httpx
import pytest

from app import templates
from app.channels import DryRunSender
from app.demo import build_demo_service
from app.integrations.email import SmtpEmail
from app.integrations.sms import InforUSms, Sms019

APP = Path(__file__).resolve().parents[1] / "app"


@pytest.fixture
def demo():
    svc, mock, clock = build_demo_service()
    svc.sync()
    return svc, mock, clock


def _dana(svc):
    """הלקוחה הראשונה בדמו (demo1, ‏1,200 ₪, נייד + מייל)."""
    inv = svc.db.one("SELECT * FROM invoices WHERE external_id='demo1'")
    rid = svc.db.one("SELECT id FROM reminders WHERE invoice_id=?", (inv["id"],))["id"]
    return inv, rid


def _sent_to(svc, inv):
    cust = svc.db.one("SELECT * FROM customers WHERE id=?", (inv["customer_id"],))
    return [m for m in svc.sender.sent if m["to"] in ("972" + cust["phone"].replace("-", "")[1:],
                                                       cust["email"])]


def test_partial_payment_rebuilds_and_returns_to_owner(demo):
    svc, mock, _ = demo
    svc.plan()
    inv, rid = _dana(svc)
    svc.approve(rid)
    # הלקוחה שילמה 500 ₪ בחשבונית ירוקה אחרי שהבעלים אישר — לפני השליחה
    mock.partial("demo1", 500)
    svc.dispatch()
    assert _sent_to(svc, inv) == []                      # לא יצא נוסח עם 1,200 ₪
    r = svc.db.one("SELECT * FROM reminders WHERE id=?", (rid,))
    assert (r["status"], r["block_reason"]) == ("pending_approval", "amount_changed")
    assert templates.fmt_amount(70000) in svc.preview(rid)["messages"][0]["body"]
    assert "1,200" not in r["payload"]
    assert svc.db.one("SELECT amount_agorot FROM invoices WHERE id=?", (inv["id"],))[0] == 70000
    # אישור מחדש ⇒ יוצא עם הסכום המעודכן
    svc.approve(rid)
    svc.dispatch()
    sent = _sent_to(svc, inv)
    assert sent and all("1,200" not in m["body"] for m in sent)
    assert any(templates.fmt_amount(70000) in m["body"] for m in sent)


def test_paid_in_full_before_send_cancels(demo):
    svc, mock, _ = demo
    svc.plan()
    inv, rid = _dana(svc)
    svc.approve(rid)
    mock.pay("demo1")
    svc.dispatch()
    assert _sent_to(svc, inv) == []
    r = svc.db.one("SELECT status, block_reason FROM reminders WHERE id=?", (rid,))
    assert tuple(r) == ("cancelled", "invoice_closed")
    assert svc.db.one("SELECT status FROM invoices WHERE id=?", (inv["id"],))[0] == "closed"


def test_gi_unreachable_means_no_send_then_retry(demo):
    svc, mock, _ = demo
    svc.plan()
    inv, rid = _dana(svc)
    svc.approve(rid)
    down = {"on": True}

    def flaky(req):
        if down["on"] and req.method == "GET" and "/documents/" in req.url.path:
            return httpx.Response(503)
        return mock.mock.handler(req)
    svc.gi._http._transport = httpx.MockTransport(flaky)
    svc.dispatch()
    assert _sent_to(svc, inv) == []                      # fail-closed
    r = svc.db.one("SELECT status, block_reason FROM reminders WHERE id=?", (rid,))
    assert tuple(r) == ("approved", "refresh_failed")
    down["on"] = False
    svc.dispatch()
    assert _sent_to(svc, inv)


# ---------------------------------------------------------------- adapter יחיד + גיבוי
def _sender(t019=None, tinf=None):
    return DryRunSender(
        sms=[Sms019("u", "t", "Gabi", transport=t019), InforUSms("u", "t", "Gabi", transport=tinf)],
        email=SmtpEmail("smtp.gabi.example", 587, "", "", "owner@example.com"),
        allow_mock_transport=True)


OK_XML = "<sms><status>0</status><message>ok</message><shipment_id>s-9</shipment_id></sms>"


def test_default_sender_is_019_then_inforu_dry_run():
    svc, _, _ = build_demo_service()
    assert [a.provider for a in svc.sender.chain] == ["019", "inforu"]
    assert all(a.dry_run for a in svc.sender.chain) and svc.sender.email.dry_run


def test_failover_019_to_inforu_on_temporary_error(demo):
    svc, _, _ = demo
    calls = []
    svc.sender = _sender(httpx.MockTransport(lambda r: calls.append("019") or httpx.Response(503)),
                         httpx.MockTransport(lambda r: calls.append("inforu") or httpx.Response(
                             200, json={"StatusId": 1, "Data": {"MessageId": "i-1"}})))
    svc.plan()
    inv, rid = _dana(svc)
    svc.approve(rid)
    svc.dispatch()
    sms = [m for m in _sent_to(svc, inv) if m["channel"] == "sms"]
    assert calls == ["019", "inforu"] and sms[0]["provider"] == "inforu"
    assert sms[0]["provider_message_id"] == "i-1"


def test_permanent_019_error_does_not_try_backup(demo):
    svc, _, _ = demo
    calls = []
    svc.sender = _sender(httpx.MockTransport(lambda r: calls.append("019") or httpx.Response(
                             200, text="<sms><status>5</status><message>bad sender</message></sms>")),
                         httpx.MockTransport(lambda r: calls.append("inforu") or httpx.Response(500)))
    svc.plan()
    inv, rid = _dana(svc)
    svc.approve(rid)
    svc.dispatch()
    assert calls == ["019"]                              # שגיאה קבועה ⇒ הגיבוי יחזיר אותה תוצאה
    # המייל יצא ⇒ התזכורת נשלחה; כשל ה-SMS נרשם ולא נרשם כהודעה יוצאת
    assert svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))[0] == "sent_dry_run"
    assert svc.db.one("SELECT 1 FROM audit WHERE action='send_failed'")
    assert not svc.db.one("SELECT 1 FROM messages WHERE customer_id=? AND direction='out' AND "
                          "channel='sms'", (inv["customer_id"],))


class _FailingSMTP:
    """SMTP מדומה שמחזיר 451 (תקלה זמנית) — בלי רשת."""
    is_mock = True
    up = False

    def __init__(self, host, port, timeout=None):
        pass

    def starttls(self, context=None):
        pass

    def login(self, u, p):
        pass

    def send_message(self, m):
        import smtplib
        if not _FailingSMTP.up:
            raise smtplib.SMTPResponseException(451, b"try later")
        return {}

    def quit(self):
        pass


def test_all_providers_down_nothing_marked_sent_then_recovers(demo):
    svc, _, _ = demo
    state = {"up": False}

    def h(r):
        return httpx.Response(200, text=OK_XML) if state["up"] else httpx.Response(503)
    svc.sender = _sender(httpx.MockTransport(h), httpx.MockTransport(lambda r: httpx.Response(503)))
    svc.sender.email = SmtpEmail("smtp.gabi.example", 587, "", "", "owner@example.com",
                                 factory=_FailingSMTP)
    _FailingSMTP.up = False
    svc.plan()
    inv, rid = _dana(svc)
    svc.approve(rid)
    svc.dispatch()
    assert svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))[0] == "approved"
    assert svc.sender.sent == [] and len(svc.db.q("SELECT 1 FROM audit WHERE "
                                                  "action='send_failed'")) == 2
    state["up"], _FailingSMTP.up = True, True
    svc.dispatch()
    assert svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))[0] == "sent_dry_run"


def test_single_sms_implementation_in_codebase():
    """אין מימוש כפול: כל מחלקה שבונה בקשת ספק (build_request) יושבת ב-app/integrations בלבד,
    ואין זכר ל-Twilio כספק SMS (לא נדרש ל-MVP)."""
    for f in APP.rglob("*.py"):
        if "integrations" in f.parts:
            continue
        for n in ast.walk(ast.parse(f.read_text("utf-8"))):
            if isinstance(n, ast.ClassDef):
                assert not any(isinstance(b, ast.FunctionDef) and b.name == "build_request"
                               for b in n.body), f"{f.name}: {n.name}"
    assert "Twilio" not in (APP / "integrations" / "sms.py").read_text("utf-8").split('"""')[2]


def test_partial_payment_creates_no_payment_form(svc, fake_gi):
    """היה: טופס תשלום של GI נבנה על הסכום ונזרק אחרי תשלום חלקי. מאז הכרעת מאיר (6.11) ו-review
    חור 3 לא יוצרים טופס/קבלה בכלל: הקישור הוא עמוד התשלום של העסק, ולא משנה מה הסכום."""
    svc.sync()
    svc.plan()
    fake_gi.docs[0]["amount"] = "700.00"
    svc.sync()
    row = svc.db.one("SELECT payment_url, amount_agorot FROM invoices WHERE external_id='doc1'")
    assert not row["payment_url"] and row["amount_agorot"] == 70000 and fake_gi.forms == 0


def test_refresh_with_new_amount_requires_reapproval_without_new_form(svc, fake_gi):
    """ר-4: תשלום חלקי לפני השליחה ⇒ חזרה לאישור עם הסכום החדש; לא נוצר טופס תשלום ב-GI."""
    svc.sync()
    rid = svc.plan()[0]
    svc.approve(rid)
    fake_gi.docs[0]["amount"] = "700.00"                  # תשלום חלקי — לפני השליחה
    svc.dispatch()
    assert svc.db.one("SELECT block_reason FROM reminders WHERE id=?", (rid,))[0] == "amount_changed"
    assert fake_gi.forms == 0 and svc.sender.sent == []


def test_live_guard_blocks_even_if_transport_guard_is_bypassed(monkeypatch):
    """הגנה כפולה: גם אם guard_transport ייעקף (באג/רפקטור), חוזה לא מאומת ⇒ אין רשת אמיתית."""
    from app.config import SafetyError
    from app.integrations import http as ihttp
    monkeypatch.setattr(ihttp, "guard_transport", lambda t: t)
    for cls in (Sms019, InforUSms):
        with pytest.raises(SafetyError):
            cls("u", "t", "Gabi", transport=httpx.HTTPTransport())

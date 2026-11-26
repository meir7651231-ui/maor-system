"""מנהל 426 (QA, BACKLOG 425 «הבא 1»): e2e רב-יומי של הגנת `api_mass_vanish` מול ה-mock האמיתי של חשבונית ירוקה
(app/gi_mock.py, דרך HTTP-transport — לא FakeGreenInvoice). עד היום כל בדיקות 416–422 רצו על ה-fake בתוך יום אחד.

התרחיש (12 חשבוניות פתוחות, 12 לקוחות, בעל העסק מאשר תזכורות כל יום, dispatch מסביב לשעון, עבודת בוקר כל יום):
  יום 0   תקין — תזכורות יוצאות.
  יום 1–3 תקלת ספק (`/_mock/outage`): חיפוש ריק / חשבון אחר (גם GET ⇒ 404). אסור: לסגור חוב בשקט, לבטל תזכורות,
          לפתוח כרטיס ליום. חובה: כרטיס פתוח אחד · עבודת בוקר ⇒ sync_suspect ⇒ check() מתריע · עובד/ת «טופל» ⇒ 403 ·
          בעל העסק «השאר פתוחות» ⇒ ההחזקה נשארת גם ב-dispatch על 404.
  יום 4   התקלה נגמרת; בינתיים 2 שולמו באמת במקור ⇒ נסגרות כרגיל, השאר פתוחות, הכרטיס יורד, ניטור תקין.
וריאנט ב: בעל העסק מאשר «כולן שולמו» ביום 2 ⇒ אין שום הודעה על החשבוניות האלה אחר כך.
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta

import httpx
import pytest

from app import morning
from app.channels import sent_mark, sent_since
from app.config import load_settings
from app.db import DB
from app.gi_mock import GreenInvoiceMock
from app.greeninvoice import GreenInvoiceClient
from app.policy import TZ
from app.service import CollectService, OwnerOnly
from app.users import Users
from tests.conftest import SANDBOX, Clock

START = datetime(2026, 11, 2, 8, 0, tzinfo=TZ)    # יום שני
N = 12


def _docs():
    return [{"id": f"vd{i}", "number": str(5000 + i), "type": 305, "status": 0, "amount": f"{300 + i}.00",
             "currency": "ILS", "documentDate": "2026-09-15", "dueDate": "2026-10-01",
             "client": {"id": f"vcl{i}", "name": f"לקוח {i} (דמו)", "phone": f"050-00002{i:02d}",
                        "emails": [f"v{i}@example.com"]}} for i in range(1, N + 1)]


def _build():
    clock = Clock(START)
    mock = GreenInvoiceMock(api_id="test-id", api_secret="test-secret", docs=_docs(),
                            clock=lambda: clock().timestamp(), deliver=lambda url, payload: None)
    gi = GreenInvoiceClient(SANDBOX, "test-id", "test-secret", transport=httpx.MockTransport(mock.handler))
    s = load_settings({"BUSINESS_NAME": "עסק הבדיקה", "SMS_SENDER_ID": "Test",
                       "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/test",
                       "PUBLIC_BASE_URL": "https://gabi.example", "SMS_WEBHOOK_KEY": "whk-test",
                       "EMAIL_REPLY_TO": "owner@test.example", "EMAIL_WEBHOOK_KEY": "ewk-test",
                       "REAL_DATA_ALLOWED": "1"})
    svc = CollectService(s, DB(":memory:"), gi=gi, clock=clock)
    return svc, mock, clock


def _admin(mock, path, body=None):
    status, out = mock.route("POST", path, {}, body)
    assert status == 200, (path, out)
    return out


def _open(svc):
    return svc.db.one("SELECT COUNT(*) n FROM invoices WHERE status='open'")["n"]


def _open_cards(svc):
    return svc.db.q("SELECT * FROM messages WHERE intent='api_mass_vanish' AND needs_owner=1")


def _day(svc, clock, day, sent):
    """בוקר: עבודת הבוקר (sync+plan), בעל העסק מאשר הכול; אחר כך dispatch כל חצי שעה עד חצות."""
    clock.now = (START + timedelta(days=day)).replace(hour=7, minute=0)
    out = morning.run_morning(svc)
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
            sent.append((day, m["to"], f'{m["body"]} {m.get("subject", "")}'))
        clock.now += timedelta(minutes=30)
    return out


@pytest.mark.parametrize("mode", ["empty", "account"])
def test_outage_multiday_never_closes_silently_then_recovers(mode):
    svc, mock, clock = _build()
    sent: list[tuple[int, str, str]] = []
    users = Users(svc.db, svc.clock)
    users.create("staff@t.example", "עובדת", "correct-horse-battery-9", role="staff")
    staff = svc.db.one("SELECT id FROM users WHERE email='staff@t.example'")

    out0 = _day(svc, clock, 0, sent)
    assert out0["status"] == "ok" and _open(svc) == N
    assert sent, "יום 0 תקין — חייבות לצאת תזכורות (אחרת הבדיקה לא בודקת כלום)"

    _admin(mock, "/_mock/outage", {"mode": mode})
    for day in (1, 2, 3):
        out = _day(svc, clock, day, sent)
        assert out["status"] == "sync_suspect", (day, out)
        assert out["sync"]["vanish_held"] == N and out["sync"]["closed"] == 0
        ok, msg = morning.check(svc.db, now=clock())
        assert not ok and "מוחזקים פתוחים" in msg, msg
        assert _open(svc) == N, f"יום {day}: חוב נסגר בשקט בזמן תקלה"
        assert svc.db.one("SELECT COUNT(*) n FROM reminders WHERE status='cancelled' "
                          "AND block_reason='invoice_closed'")["n"] == 0
        assert len(_open_cards(svc)) <= 1, f"יום {day}: יותר מכרטיס פתוח אחד לאותה תקלה"
        # 419: כרטיס אחד לתקלה (ימים 1–2). אחרי «השאר פתוחות» (יום 2) — תקלה שנמשכת מעלה כרטיס **אחד** חדש
        # ביום הבא (ההשתקה היא ליום בלבד, `_hold_mass_vanish`; בכוונה — החיבור עדיין שבור). ℹ️ להכרעת מאיר.
        assert svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent='api_mass_vanish'")["n"] == \
            (2 if day == 3 else 1), f"יום {day}: כרטיס חדש לכל יום/סנכרון"
        if day == 1:
            card = _open_cards(svc)
            assert len(card) == 1 and len(json.loads(card[0]["payload"])["invoice_ids"]) == N
            with pytest.raises(OwnerOnly):
                svc.owner_message_done(card[0]["id"], actor=f"user:{staff['id']}")
            assert len(_open_cards(svc)) == 1, "עובד/ת הוריד/ה את הכרטיס"
        if day == 2:
            svc.owner_message_done(_open_cards(svc)[0]["id"], actor="owner")   # «השאר פתוחות»
            assert not _open_cards(svc)
    assert _open(svc) == N
    if mode == "account":
        # GET ⇒ 404 על כל המסמכים: dispatch לא סוגר מוחזקות (417) — ולא שולח עליהן
        assert not [x for x in sent if x[0] in (2, 3)], "נשלחה תזכורת בזמן שהמקור לא מכיר את המסמך"
        assert svc.db.one("SELECT 1 FROM audit WHERE action='refresh_closed'") is None

    # יום 4: התקלה נגמרה; בינתיים 2 שולמו באמת במקור
    _admin(mock, "/_mock/outage", {"mode": "off"})
    _admin(mock, "/_mock/documents/vd1/pay")
    _admin(mock, "/_mock/documents/vd2/pay")
    out4 = _day(svc, clock, 4, sent)
    assert out4["status"] == "ok" and "vanish_held" not in out4["sync"], out4
    assert out4["sync"]["closed"] == 2 and _open(svc) == N - 2
    assert not _open_cards(svc)
    assert all(json.loads(r["payload"]).get("resolved")
               for r in svc.db.q("SELECT payload FROM messages WHERE intent='api_mass_vanish'"))
    assert morning.check(svc.db, now=clock())[0]
    leaks = [x for x in sent if x[0] >= 4 and ("5001" in x[2] or "5002" in x[2])]
    assert not leaks, leaks


def test_owner_accepts_all_paid_then_silence():
    svc, mock, clock = _build()
    sent: list[tuple[int, str, str]] = []
    _day(svc, clock, 0, sent)
    _admin(mock, "/_mock/outage", {"mode": "empty"})
    _day(svc, clock, 1, sent)
    clock.now = (START + timedelta(days=2)).replace(hour=6)
    res = svc.accept_mass_close(_open_cards(svc)[0]["id"], actor="owner")
    assert res and _open(svc) == 0
    before = len(sent)
    for day in (2, 3, 4):
        out = _day(svc, clock, day, sent)
        assert out["status"] == "ok", out          # רשימה ריקה כשאין פתוחות אצלנו — לא חשוד
    assert len(sent) == before, sent[before:]
    assert _open(svc) == 0 and not _open_cards(svc)


def test_mock_outage_route_contract():
    """כלי הבדיקה עצמו: מצבים תקינים, ערך לא חוקי ⇒ 400, hide מסתיר רק את המבוקש."""
    mock = GreenInvoiceMock(docs=_docs(), deliver=lambda url, payload: None)
    st, _ = mock.route("POST", "/_mock/outage", {}, {"mode": "bogus"})
    assert st == 400
    _admin(mock, "/_mock/outage", {"mode": "hide", "ids": ["vd3"]})
    tok = mock.route("POST", "/account/token", {}, {"id": "demo-id", "secret": "demo-secret",
                                                     "grant_type": "client_credentials"})[1]["token"]
    h = {"authorization": f"Bearer {tok}"}
    st, page = mock.route("POST", "/documents/search", h, {"pageSize": 100})
    assert st == 200 and page["total"] == N - 1 and "vd3" not in {d["id"] for d in page["items"]}
    assert mock.route("GET", "/documents/vd3", h, None)[0] == 200     # hide = חיפוש בלבד
    _admin(mock, "/_mock/outage", {"mode": "account"})
    assert mock.route("GET", "/documents/vd3", h, None)[0] == 404
    _admin(mock, "/_mock/outage", {"mode": "off"})
    assert mock.route("POST", "/documents/search", h, {"pageSize": 100})[1]["total"] == N

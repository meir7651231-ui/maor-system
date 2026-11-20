"""הכרעות ראש צוות 20.11 מול חוק הגנת הפרטיות (בדיקה משפטית, legal.md §12):

(2) ייצוא כל המידע על לקוח/ה = **בעל העסק בלבד**. אין התנגשות עם זכות העיון (§13): הזכות היא כלפי **בעל השליטה**
    (העסק), לא כלפי כל עובד/ת. התנאי: הבקשה נרשמת והמועד (30 יום) נספר גם כשעובד/ת קיבל/ה אותה, ובעל העסק יכול
    לייצא בפועל. לעובד/ת ⇒ 403 + audit (מזעור גישה, תקנות אבטחה).
(1) הבטחת תשלום: המענה האוטומטי **לא** מוותר על החוב ולא «מאשר» מועד מחייב — רק משהה תזכורות. מעבר ל-14 יום
    ההחלטה של בעל העסק (כרטיס). הבדיקה תקפה גם אחרי שגבי מנוע יממש «אישור עד 14 + כרטיס».
"""
from __future__ import annotations

import re
from datetime import date

import pytest
from fastapi.testclient import TestClient

from app import conversation, totp
from app.main import create_app
from app.users import Users
from tests.conftest import OWNER_TOKEN

PW = "correct-horse-battery-9"


def _api(svc, clock, monkeypatch):
    u = Users(svc.db, svc.clock)
    regs = {"owner": u.create("owner@s.example", "בעלים", PW), "staff": u.create("staff@s.example", "עובד", PW)}
    svc.sync()
    monkeypatch.setenv("REQUIRE_USER_LOGIN", "1")
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN))

    def hdr(who):
        tok = api.post("/auth/login", json={"email": f"{who}@s.example", "password": PW,
                                            "code": totp.code_at(regs[who]["totp_secret"], clock().timestamp())})
        return {"Authorization": f"Bearer {tok.json()['token']}"}
    return api, hdr


# ─────────── (2) ייצוא = בעל העסק בלבד ───────────
def test_staff_export_refused_and_audited(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    r = api.get("/customers/1/data", headers=hdr("staff"))
    assert r.status_code == 403 and "בעל העסק" in r.json()["detail"]
    assert svc.db.one("SELECT 1 FROM audit WHERE action='data_export_refused'")
    assert "דנה" not in r.text and "050" not in r.text                     # אין דליפה בתשובת הסירוב


def test_owner_can_export(svc, clock, monkeypatch):
    api, hdr = _api(svc, clock, monkeypatch)
    r = api.get("/customers/1/data", headers=hdr("owner"))
    assert r.status_code == 200 and "דנה" in r.text


def test_request_still_registered_and_counted_when_staff_cannot_export(svc, clock, monkeypatch):
    """אין התנגשות עם §13: גם כשהבקשה מגיעה דרך עובד/ת — היא במרשם, עם מועד, ובעל העסק מקבל התראה."""
    api, hdr = _api(svc, clock, monkeypatch)
    h = hdr("staff")
    assert api.post("/customers/1/dsr", json={"kind": "access", "note": "התקשרה לעובדת"}, headers=h).status_code == 200
    (row,) = [r for r in api.get("/dsr", headers=h).json() if r["customer_id"] == 1]
    assert row["status"] == "open" and row["days_left"] in (29, 30)
    alert = svc.db.one("SELECT body FROM messages WHERE intent='dsr' AND needs_owner=1")
    assert alert and "בעל העסק בלבד" in alert["body"]


# ─────────── (1) הבטחת תשלום: לא ויתור, לא הסכמה מחייבת ───────────
_WAIVER = re.compile(r"אישרנו|מאשרים את|הסכמנו|מסכימים|ויתור|נוותר|מוחלים|נמחק את החוב|החוב בוטל|הארכנו את")


@pytest.mark.parametrize("days", [3, 14, 15, 30, 60])
def test_promise_reply_pauses_but_never_waives_or_binds(days):
    today = date(2026, 11, 20)
    due = date.fromordinal(today.toordinal() + days)
    ctx = conversation.Context(today=today, business="סטודיו מאיר", customer_name="דנה כהן",
                               invoices=(conversation.OpenInvoice("1001", 1_200_00),))
    d = conversation.respond(f"אשלם ב-{due.day}.{due.month}", ctx)
    assert d.intent == conversation.Intent.PROMISE, d.intent
    assert d.stop != conversation.Stop.PERMANENT                         # לא סוגרים את החוב
    if d.reply:
        assert not _WAIVER.search(d.reply), d.reply
    if days > ctx.policy.max_defer_days:                                  # מעל 14: ההחלטה של בעל העסק
        assert d.escalate != conversation.Escalation.NONE
        assert d.auto_send is False

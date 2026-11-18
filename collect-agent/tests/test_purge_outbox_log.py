"""critic סבב 75 (ר-10, שמירת מידע): מחיקה אחרי 90 יום מחוב סגור ריקנה messages/drafts/conversations/reminders
והתממה את הלקוח — אבל **יומן ה-dry-run בזיכרון** (`sender.sent`, מוגש ב-`/outbox`) המשיך להחזיק את הנמען (טלפון/מייל),
הגוף (שם + סכום + מספר חשבונית) ובקשת הספק המלאה, כל עוד התהליך חי (תקרה 1,000 — אצל עסק קטן זה חודשים).
התיקון: _purge_rows מאתר את הכתובות של הלקוח **לפני** ההתממה ומשחיר את רשומות היומן שלו במקום (בלי למחוק —
מוני `total`/`sent_mark` נשארים נכונים)."""
from __future__ import annotations

import re
from datetime import timedelta

from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

PHONE, MAIL, NAME = "972501234567", "c1@example.com", "דנה"


def test_purge_scrubs_dryrun_outbox(svc, clock, fake_gi):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    rid = next(i for i in api.post("/plan").json()["created"]
               if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1)
    api.post(f"/reminders/{rid}/approve")
    api.post("/dispatch")
    before = api.get("/outbox").json()
    assert any(m["to"] in (PHONE, MAIL) for m in before["messages"])
    total = before.get("total", len(before["messages"]))
    fake_gi.docs = [d for d in fake_gi.docs if d["id"] != "doc1"]          # שולם
    api.post("/sync")
    clock.now += timedelta(days=91)
    api.post("/maintenance/purge")
    assert svc.db.one("SELECT name FROM customers WHERE id=1")["name"] is None   # הלקוח הותמם
    # Message-ID של הספק אקראי (<…digits…@domain>) ולא מכיל מידע של הלקוח — אבל ספרות אקראיות יכולות
    # להכיל «1001» במקרה (CI 769, 3.13 2cda454b: …9073887384620561001@example.com). מסירים אותו לפני הבדיקה.
    out = re.sub(r"<\d+(?:\.\d+)+@[^<>\s\"]+>", "<msgid>", api.get("/outbox").text)
    for pii in (PHONE, MAIL, NAME, "1001"):
        assert pii not in out, f"«{pii}» נשאר ב-/outbox אחרי מחיקת ר-10"
    assert api.get("/outbox", params={"limit": 50}).json()["total"] == total     # המונים לא נפגעו


def test_purge_keeps_other_customers_outbox(svc, clock, fake_gi):
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    api.post("/sync")
    for i in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    fake_gi.docs = [d for d in fake_gi.docs if d["id"] != "doc1"]
    api.post("/sync")
    clock.now += timedelta(days=91)
    api.post("/maintenance/purge")
    out = api.get("/outbox").json()["messages"]
    assert any(m["to"] == "972527654321" for m in out), "נמחקו גם רשומות של לקוח שלא הגיע זמנו"

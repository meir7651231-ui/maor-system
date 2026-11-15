"""critic · יעד «כל מסלול לקוח עובר מקצה לקצה» (הוראת מאיר 15.11): כל מסלול שחייב יכול לעבור, מהתזכורת הראשונה
ועד המצב הסופי, דרך ה-API ועמוד החייב — ומה הלקוח קיבל בפועל (יומן היוצאים) + מה המערכת עושה אחר כך.
כל מסלול נגמר בשאלה אחת: האם אחרי זה יוצאת תזכורת נוספת? (אסור: אחרי תשלום/הסרה/מספר שגוי/מחלוקת/מצוקה/פריסה.)"""
from __future__ import annotations

import re
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.channels import sent_mark, sent_since
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

PHONE, MAIL = "972501234567", "c1@example.com"


@pytest.fixture
def env(svc):
    app = create_app(svc, owner_token=OWNER_TOKEN)
    return svc, TestClient(app, headers=AUTH), TestClient(app)


def _first(env) -> str:
    svc, api, _ = env
    api.post("/sync")
    rid = next(i for i in api.post("/plan").json()["created"]
               if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1)
    assert api.post(f"/reminders/{rid}/approve").status_code == 200
    api.post("/dispatch")
    sms = [m for m in svc.sender.sent if m["to"] == PHONE]
    assert sms, "התזכורת הראשונה לא יצאה"
    return re.search(r"/p/(\w+)", sms[-1]["body"]).group(1)


def _to_c1(svc, mark):
    return [m for m in sent_since(svc.sender.sent, mark) if m["to"] in (PHONE, MAIL)]


def _week_later_nothing(env, clock):
    """שבוע אחרי: אין תזכורת חדשה ללקוח (גם לא אחרי אישור כל מה שבתור)."""
    svc, api, _ = env
    mark = sent_mark(svc.sender.sent)
    clock.now += timedelta(days=8)
    for i in api.post("/plan").json()["created"]:
        if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1:
            api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    late = [m for m in _to_c1(svc, mark) if "חשבונית" in m["body"] and "1001" in m["body"]]
    assert late == [], [m["body"][:60] for m in late]


def test_j01_pays_at_source(env, clock, fake_gi):
    svc, api, _ = env
    _first(env)
    fake_gi.docs = [d for d in fake_gi.docs if d["id"] != "doc1"]
    api.post("/sync")
    assert svc.db.one("SELECT status FROM invoices WHERE id=1")["status"] == "closed"
    _week_later_nothing(env, clock)


def test_j02_page_paid_claim(env, clock):
    svc, api, pub = env
    code = _first(env)
    r = pub.post(f"/p/{code}/paid", follow_redirects=False)
    assert r.status_code in (200, 303), r.status_code
    assert svc.db.one("SELECT paused_reason FROM customers WHERE id=1")["paused_reason"] == "paid_claim"
    _week_later_nothing(env, clock)


def test_j03_page_stop(env, clock):
    svc, api, pub = env
    code = _first(env)
    pub.post(f"/p/{code}/stop", follow_redirects=False)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    _week_later_nothing(env, clock)


def test_j04_page_plan_then_owner_approves(env, clock):
    svc, api, pub = env
    code = _first(env)
    pub.post(f"/p/{code}/plan", follow_redirects=False)
    plans = api.get("/plans").json()
    assert plans and plans[-1]["status"] == "proposed", plans
    mark = sent_mark(svc.sender.sent)
    assert api.post(f"/plans/{plans[-1]['id']}/approve").status_code == 200
    offer = _to_c1(svc, mark)
    assert offer and "ללא תוספת" in offer[-1]["body"], [m["body"][:60] for m in offer]
    _week_later_nothing(env, clock)


def test_j05_sms_hasar(env, clock):
    svc, api, _ = env
    _first(env)
    api.post("/inbound", json={"sender": "050-1234567", "text": "הסר בבקשה"})
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    _week_later_nothing(env, clock)


def test_j06_email_one_click_unsubscribe(env, clock):
    svc, api, pub = env
    _first(env)
    mail = [m for m in svc.sender.sent if m["to"] == MAIL][-1]
    lu = mail["request"]["headers"]["List-Unsubscribe"]
    tok = re.search(r"/u/([A-Za-z0-9_-]+)", lu).group(1)
    assert pub.post(f"/u/{tok}").status_code == 200
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    _week_later_nothing(env, clock)


def test_j07_wrong_person(env, clock):
    svc, api, _ = env
    _first(env)
    api.post("/inbound", json={"sender": "050-1234567", "text": "טעות במספר, אני לא דנה"})
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    _week_later_nothing(env, clock)


def test_j08_dispute_then_owner_resumes(env, clock):
    svc, api, _ = env
    _first(env)
    api.post("/inbound", json={"sender": "050-1234567", "text": "הסכום לא נכון, סגרנו על 800"})
    assert svc._customer_block(1) == "disputed"
    _week_later_nothing(env, clock)
    assert api.post("/customers/1/resume").status_code == 200
    clock.now += timedelta(days=1)
    assert [i for i in api.post("/plan").json()["created"]
            if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1], "אחרי «חידוש» התזכורות לא חזרו"


def test_j09_distress(env, clock):
    svc, api, _ = env
    _first(env)
    r = api.post("/inbound", json={"sender": "050-1234567", "text": "אני כבר לא יכולה יותר"}).json()
    assert r["escalation"] == "urgent" and not r.get("auto_sent"), r
    _week_later_nothing(env, clock)


def test_j10_how_to_pay_then_reminders_continue(env, clock):
    svc, api, _ = env
    _first(env)
    r = api.post("/inbound", json={"sender": "050-1234567", "text": "איך אפשר לשלם?"}).json()
    assert r["intent"] == "how_to_pay"
    if r.get("draft_id"):
        api.post(f"/conversation/drafts/{r['draft_id']}/approve", json={})
    assert svc.db.one("SELECT opted_out, paused_reason FROM customers WHERE id=1")["opted_out"] == 0


def test_j11_no_reply_three_then_stop(env, clock):
    svc, api, _ = env
    _first(env)
    for _ in range(4):
        clock.now += timedelta(days=8)
        for i in api.post("/plan").json()["created"]:
            if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1:
                api.post(f"/reminders/{i}/approve")
        api.post("/dispatch")
    sent = svc.db.one("SELECT COUNT(*) n FROM reminders r JOIN reminder_invoices x ON x.reminder_id=r.id "
                      "WHERE x.invoice_id=1 AND r.status='sent_dry_run'")["n"]
    assert sent == 3, sent
    assert [m for m in api.get("/owner/inbox").json() if m["intent"] == "max_reminders"]


def test_j12_email_only_customer(env, clock, fake_gi):
    svc, api, _ = env
    fake_gi.docs[0]["client"]["phone"] = "03-1234567"
    api.post("/sync")
    rid = next(i for i in api.post("/plan").json()["created"]
               if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1)
    api.post(f"/reminders/{rid}/approve")
    api.post("/dispatch")
    mine = [m for m in svc.sender.sent if m["to"] in (PHONE, MAIL)]
    assert [m["channel"] for m in mine] == ["email"]
    assert "List-Unsubscribe" in mine[0]["request"]["headers"]

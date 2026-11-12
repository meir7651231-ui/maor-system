"""critic סבב 55: הרחבת המגן של סבב 54 (יומן היוצאים) לתרחישים שאינם בהדגמה:
  A. שלוש תזכורות (friendly ⇒ plan_offer ⇒ final), עצירה, והתראה אחת לבעל העסק
  B. הצעת פריסה שבעל העסק אישר (נשלחת ללקוח)
  C. לקוח עם מייל בלבד (טלפון קווי): Reply-To לעסק + List-Unsubscribe בכותרות
בכל תרחיש: כל הודעה שיצאה עומדת בכללי הבעלים (הסרה · בלי איומים · חלון · SMS/מייל · לקוח קיים · שם העסק ·
דומיינים של העסק בלבד), ובנוסף: אין יותר מ-3 תזכורות לחשבונית, וסכום ההודעה = הסכום הפתוח בחשבונית."""
from __future__ import annotations

import json
import re
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.compliance import LEGAL_BLACKLIST
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

_URL = re.compile(r"https?://\S+")
_HOST = re.compile(r"^https?://([^/]+).*")


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _first(api, svc):
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    one = next(i for i in ids if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1)
    assert api.post(f"/reminders/{one}/approve").status_code == 200
    api.post("/dispatch")


def check_outbox(svc, *, min_rows: int) -> list:
    rows = svc.db.q("SELECT m.*, c.opted_out, c.name cname FROM messages m LEFT JOIN customers c "
                    "ON c.id=m.customer_id WHERE m.direction='out' ORDER BY m.id")
    assert len(rows) >= min_rows, [r["body"][:40] for r in rows]
    biz, base = svc.s.business_name, svc.s.public_base_url
    hosts = {_HOST.sub(r"\1", u) for u in (base, svc.s.payment_link) if u}
    for r in rows:
        tag = f"#{r['id']} {r['channel']}: {r['body'][:70]!r}"
        last = [x for x in rows if x["customer_id"] == r["customer_id"]][-1]
        opt_ack = bool(r["opted_out"]) and r["id"] == last["id"]
        assert opt_ack or f"{base}/u/" in r["body"] or re.search(r"הסר|להפסקה|להסרה", r["body"]), "בלי הסרה " + tag
        prose = _URL.sub(" ", r["body"])
        hits = [n for n, p in LEGAL_BLACKLIST if re.search(p, prose)]
        assert not hits, f"{hits} {tag}"
        assert svc.policy.can_send_at(datetime.fromisoformat(r["created_at"])), "מחוץ לחלון " + tag
        assert r["channel"] in ("sms", "email") and r["cname"] is not None, tag
        subj = (json.loads(r["payload"] or "{}") or {}).get("subject", "")
        assert biz in r["body"] or biz in subj, "בלי שם העסק " + tag
        if r["channel"] == "sms":
            assert r["body"].startswith(biz), "SMS לא מתחיל בשם העסק " + tag
        for u in _URL.findall(r["body"]):
            assert _HOST.sub(r"\1", u) in hosts, f"דומיין זר {u} " + tag
    over = svc.db.q("SELECT invoice_id, COUNT(*) n FROM reminders WHERE status IN ('sent_dry_run','send_unknown') "
                    "GROUP BY invoice_id HAVING n > 3")
    assert not over, [dict(o) for o in over]
    return rows


def test_A_three_reminders_then_stop(api, svc, clock):
    _first(api, svc)
    for _ in range(4):
        clock.now += timedelta(days=8)
        while not svc.policy.can_send_at(clock.now):
            clock.now += timedelta(hours=1)
        for i in api.post("/plan").json()["created"]:
            if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1:
                api.post(f"/reminders/{i}/approve")
        api.post("/dispatch")
    rows = check_outbox(svc, min_rows=6)   # 3 תזכורות × SMS+מייל
    rems = [r for r in api.get("/reminders").json() if r["invoice_id"] == 1]
    assert [r["template_key"] for r in rems] == ["friendly", "plan_offer", "final"]
    # הסכום בכל הודעה = הסכום הפתוח (1,200 ₪)
    assert all("1,200" in r["body"] for r in rows if r["customer_id"] == 1), [r["body"][:80] for r in rows]
    inbox = [m for m in api.get("/owner/inbox").json() if m["intent"] == "max_reminders"]
    assert len(inbox) == 1


def test_B_approved_plan_offer(api, svc):
    _first(api, svc)
    api.post("/inbound", json={"sender": "050-1234567", "text": "אפשר פריסה?"})
    pid = api.get("/plans").json()[-1]["id"]
    assert api.post(f"/plans/{pid}/approve").status_code == 200
    rows = check_outbox(svc, min_rows=3)
    offer = rows[-1]
    assert "ללא תוספת" in offer["body"] and offer["customer_id"] == 1


def test_C_email_only_customer_reply_to_and_list_unsubscribe(api, svc, fake_gi):
    fake_gi.docs[0]["client"]["phone"] = "03-1234567"   # קווי ⇒ אין SMS
    _first(api, svc)
    rows = check_outbox(svc, min_rows=1)
    mine = [r for r in rows if r["customer_id"] == 1]
    assert [r["channel"] for r in mine] == ["email"]
    sent = [m for m in svc.sender.sent if m["channel"] == "email" and m["to"] == "c1@example.com"]
    h = sent[-1]["request"]["headers"]
    assert h.get("Reply-To") == "owner@studio.example", h
    assert h.get("List-Unsubscribe-Post") == "List-Unsubscribe=One-Click" and "/u/" in h.get("List-Unsubscribe", ""), h

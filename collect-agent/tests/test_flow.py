"""זרימה מקצה לקצה דרך ה-API: סנכרון sandbox מדומה ⇒ תור ⇒ אישור ⇒ dry-run ⇒ תשובות."""
import re
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.config import SafetyError
from app.main import create_app
from app.policy import TZ
from app.service import CollectService


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc))


def first_cycle(api):
    assert api.post("/sync").json() == {"open": 2, "closed": 0}
    created = api.post("/plan").json()["created"]
    assert len(created) == 2
    return created


def test_health_reports_dry_run(api):
    h = api.get("/health").json()
    assert h["dry_run"] is True and h["send_mode"] == "dry_run"
    assert h["channels"] == ["sms", "email"] and "whatsapp" not in str(h)
    assert h["product"] == "גבי – העוזר לגביית חובות"


def test_first_message_needs_owner_approval(api, svc):
    ids = first_cycle(api)
    rems = api.get("/reminders").json()
    assert all(r["status"] == "pending_approval" for r in rems)
    # בלי אישור — שום דבר לא יוצא
    assert api.post("/dispatch").json()["sent"] == []
    assert svc.sender.sent == []
    api.post(f"/reminders/{ids[0]}/approve")
    api.post(f"/reminders/{ids[1]}/reject")
    sent = api.post("/dispatch").json()["sent"]
    assert len(sent) == 1 and all(m.startswith("dryrun.") for m in sent[0]["message_ids"])
    out = api.get("/outbox").json()["messages"]
    assert [m["channel"] for m in out] == ["sms", "email"]
    sms, mail = out
    assert sms["to"] == "972501234567" and sms["provider"] == "019"
    assert sms["body"].startswith("סטודיו מאיר: שלום דנה כהן")
    assert "1,200 ₪" in sms["body"] and "https://pay.greeninvoice.co.il/f/doc1" in sms["body"]
    assert "https://gabi.example/u/" in sms["body"]
    assert "<source>StudioMeir</source>" in sms["request"]["body"]
    assert sms["request"]["url"].endswith("/api/test")
    assert mail["to"] == "c1@example.com" and "1001" in mail["subject"]
    assert mail["request"]["headers"]["List-Unsubscribe-Post"] == "List-Unsubscribe=One-Click"


def test_second_reminder_auto_after_first_approved(api, svc, clock):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    # שבוע אחרי — שלב 2 ללקוח שכבר אושר ⇒ לא צריך אישור
    clock.now += timedelta(days=7)
    new = api.post("/plan").json()["created"]
    r = next(x for x in api.get("/reminders").json() if x["id"] in new and x["step"] == 1)
    assert r["status"] == "approved" and r["template_key"] == "second"


def test_72h_gap_and_shabbat(api, svc, clock):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    clock.now = datetime(2026, 11, 14, 10, tzinfo=TZ)  # שבת
    api.post("/plan")
    assert api.post("/dispatch").json()["sent"] == []


def test_final_step_always_needs_approval(api, svc, clock):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    for _ in range(3):
        clock.now += timedelta(days=8)
        api.post("/plan")
        api.post("/dispatch")
    sent_steps = [r["step"] for r in api.get("/reminders?status=sent_dry_run").json()]
    assert sent_steps == [0, 1, 2]
    finals = [r for r in api.get("/reminders").json() if r["template_key"] == "final"]
    assert finals and finals[0]["status"] == "pending_approval"


def test_opt_out_stops_everything(api, svc, clock):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    res = api.post("/inbound", json={"sender": "0501234567", "text": "הסר"}).json()
    assert res["intent"] == "opt_out" and res["auto_reply"]
    clock.now += timedelta(days=10)
    assert api.post("/plan").json()["created"] == []
    api.post("/dispatch")
    # SMS+מייל של התזכורת + אישור-ההסרה ב-SMS, ולא יותר
    assert [m["channel"] for m in svc.sender.sent] == ["sms", "email", "sms"]


def test_paid_claim_escalates_and_stops(api, svc):
    first_cycle(api)
    res = api.post("/inbound", json={"sender": "050-1234567", "text": "שילמתי כבר"}).json()
    assert res["escalate"] and res["auto_reply"] is None
    assert api.get("/reminders").json()[0]["status"] == "cancelled"
    assert len(api.get("/owner/inbox").json()) == 1


def test_no_auto_reply_before_first_approval(api, svc):
    first_cycle(api)
    res = api.post("/inbound", json={"sender": "050-1234567", "text": "איך אפשר לשלם?"}).json()
    assert res["intent"] == "how_to_pay" and res["auto_reply"] is None
    assert svc.sender.sent == []


def test_plan_request_flow(api, svc):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    res = api.post("/inbound", json={"sender": "050-1234567", "text": "אפשר פריסה?"}).json()
    plan = api.get("/plans").json()[0]
    assert res["plan_id"] == plan["id"] and plan["status"] == "proposed"
    assert sum(i["amount_agorot"] for i in plan["installments"]) == 120000
    msg = api.post(f"/plans/{plan['id']}/approve").json()
    assert msg["message_id"].startswith("dryrun.") and "ללא תוספת" in msg["text"]
    assert msg["channel"] == "sms"


def test_closed_invoice_cancels_reminder(api, svc, fake_gi):
    first_cycle(api)
    fake_gi.docs = [d for d in fake_gi.docs if d["id"] != "doc1"]  # שולמה בחשבונית ירוקה
    assert api.post("/sync").json()["closed"] == 1
    assert api.get("/reminders").json()[0]["status"] == "cancelled"


def test_invalid_phone_falls_back_to_email(api, svc, fake_gi):
    fake_gi.docs[0]["client"]["phone"] = "03-1234567"   # קווי ⇒ אין SMS
    ids = first_cycle(api)
    p = api.get(f"/reminders/{ids[0]}/preview").json()
    assert [m["channel"] for m in p["messages"]] == ["email"]


def test_no_contact_cannot_be_approved(api, svc, fake_gi):
    fake_gi.docs[0]["client"].update(phone="123", emails=[])
    ids = first_cycle(api)
    assert api.get("/reminders").json()[0]["block_reason"] == "no_contact"
    assert api.post(f"/reminders/{ids[0]}/approve").status_code == 409


def test_unknown_sender_goes_to_owner(api):
    first_cycle(api)
    res = api.post("/inbound", json={"sender": "054-0000000", "text": "מי אתם?"}).json()
    assert res["intent"] == "unknown_sender" and res["escalate"]


def test_service_refuses_non_dry_sender(svc):
    class Live:
        mode = "live"
        def send(self, p): ...
    with pytest.raises(SafetyError):
        CollectService(svc.s, svc.db, sender=Live())


def test_audit_trail(api):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    actions = [a["action"] for a in api.get("/audit").json()]
    assert {"sync", "plan", "approve"} <= set(actions)


def test_dispatch_rechecks_window(api, svc, clock):
    """תזכורת שאושרה ביום חול לא יוצאת אם ה-dispatch רץ בשבת."""
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    clock.now = datetime(2026, 11, 14, 10, tzinfo=TZ)  # שבת
    assert api.post("/dispatch").json()["sent"] == []
    clock.now = datetime(2026, 11, 15, 9, 30, tzinfo=TZ)  # ראשון
    assert len(api.post("/dispatch").json()["sent"]) == 1


def test_payment_form_failure_falls_back_to_static_link(api, svc, fake_gi):
    fake_gi.fail_forms = True
    ids = first_cycle(api)
    body = api.get(f"/reminders/{ids[0]}/preview").json()["messages"][0]["body"]
    assert "https://www.greeninvoice.co.il/pay/studio?invoice=1001" in body


def test_no_safe_payment_link_blocks(svc, gi_client, clock, fake_gi):
    from app.config import load_settings
    from app.db import DB
    fake_gi.fail_forms = True
    s = load_settings({"PAYMENT_LINK": "https://evil.example/pay"})   # לא ברשימה המותרת
    api = TestClient(create_app(CollectService(s, DB(":memory:"), gi=gi_client, clock=clock)))
    ids = first_cycle(api)
    assert api.get("/reminders").json()[0]["block_reason"] == "no_payment_link"
    assert api.post(f"/reminders/{ids[0]}/approve").status_code == 409


def test_payment_form_created_once(api, svc, fake_gi, clock):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    clock.now += timedelta(days=7)
    api.post("/plan")
    assert fake_gi.forms == 2   # אחד לכל חשבונית, לא לכל תזכורת


def test_unsubscribe_link_and_one_click(api, svc):
    ids = first_cycle(api)
    tok = svc.db.one("SELECT unsub_token FROM customers WHERE id=1")["unsub_token"]
    assert api.get(f"/u/{tok}").status_code == 200
    assert api.get("/reminders").json()[0]["status"] == "cancelled"
    assert api.post("/u/bogus").status_code == 404
    assert api.post(f"/reminders/{ids[0]}/approve").status_code == 409


def test_email_inbound_matches_customer(api, svc):
    first_cycle(api)
    res = api.post("/inbound", json={"channel": "email", "sender": "C1@example.com",
                                     "text": "שילמתי אתמול"}).json()
    assert res["intent"] == "paid_claim" and res["escalate"]


def test_how_to_pay_reply_uses_invoice_link(api, svc):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    res = api.post("/inbound", json={"sender": "0501234567", "text": "איך אפשר לשלם?"}).json()
    assert "https://pay.greeninvoice.co.il/f/doc1" in res["auto_reply"]


def test_ui_page_has_slogan_and_no_whatsapp(api):
    html = api.get("/ui").text
    assert "גבי – העוזר לגביית חובות" in html and "SMS" in html
    assert "whatsapp" not in html.lower() and "וואטסאפ" not in html


def test_landing_draft_price_demo_link_and_no_whatsapp(api):
    """דף הנחיתה (טיוטה): מחיר השערה 119 + 14 יום, מוביל להדגמה, noindex, בלי וואטסאפ ובלי משאבים חיצוניים."""
    html = api.get("/landing").text
    assert "₪119" in html and "14 יום" in html
    assert 'href="/ui"' in html and 'name="robots" content="noindex' in html
    assert "whatsapp" not in html.lower() and "וואטסאפ" not in html
    assert not re.search(r'(src|href)="https?://', html), "משאב חיצוני בדף הנחיתה"
    assert "fetch(" not in html and "action=" not in html, "טופס הטיוטה לא אמור לשלוח לשום מקום"


def test_019_webhook_inbound_idempotent(api, svc):
    first_cycle(api)
    body = "type=incoming_sms&phone=0501234567&message=%D7%94%D7%A1%D7%A8&dest=StudioMeir"
    h = {"content-type": "application/x-www-form-urlencoded"}
    r1 = api.post("/webhooks/sms/019?k=whk-test", content=body, headers=h).json()
    assert r1["intent"] == "opt_out"
    r2 = api.post("/webhooks/sms/019?k=whk-test", content=body, headers=h).json()
    assert r2["duplicate"] is True
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1


def test_019_webhook_blacklist_and_dlr(api, svc):
    first_cycle(api)
    h = {"content-type": "application/x-www-form-urlencoded"}
    assert api.post("/webhooks/sms/019?k=whk-test", content="type=dlr&phone=0501234567&status=2",
                    headers=h).json()["ignored"]
    api.post("/webhooks/sms/019?k=whk-test", content="type=blacklist&phone=0527654321", headers=h)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=2")["opted_out"] == 1


def test_019_webhook_requires_key(api, svc):
    first_cycle(api)
    h = {"content-type": "application/x-www-form-urlencoded"}
    for url in ("/webhooks/sms/019", "/webhooks/sms/019?k=wrong"):
        assert api.post(url, content="type=blacklist&phone=0501234567",
                        headers=h).status_code == 403
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 0


def test_paid_claim_pauses_next_rounds_until_owner_resumes(api, svc, clock):
    """באג שנתפס בהדגמה: אחרי "שילמתי" הסבב הבא שלח שוב תזכורת ללקוחה."""
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    api.post("/inbound", json={"sender": "050-1234567", "text": "שילמתי כבר"})
    clock.now += timedelta(days=7)
    api.post("/plan")
    rems = [r for r in api.get("/reminders").json() if r["invoice_id"] == 1]
    assert [r["status"] for r in rems] == ["sent_dry_run"]  # אין שלב 2 בזמן השהיה
    cid = next(c["id"] for c in api.get("/customers").json() if c["paused_reason"])
    assert api.post(f"/customers/{cid}/resume").status_code == 200
    assert api.post(f"/customers/{cid}/resume").status_code == 409
    api.post("/plan")
    rems = [r for r in api.get("/reminders").json() if r["invoice_id"] == 1]
    assert len(rems) == 2 and rems[-1]["template_key"] == "second"


def test_dashboard_totals_and_rows(api, svc, fake_gi):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    d = api.get("/dashboard").json()
    t = d["totals"]
    assert t["open_invoices"] == 2 and t["pending_approval"] == 1
    assert t["sent_sms"] == 1 and t["sent_email"] == 1
    row = next(x for x in d["invoices"] if x["number"] == "1001")
    assert row["reminders_sent"] == 1 and row["last_reminder"]["status"] == "sent_dry_run"
    assert row["days_overdue"] == 38  # 1.10 ⇒ 8.11
    fake_gi.docs = [x for x in fake_gi.docs if x["id"] != "doc1"]
    api.post("/sync")
    t = api.get("/dashboard").json()["totals"]
    assert t["open_invoices"] == 1 and t["closed_invoices"] == 1


def test_demo_scenario_end_to_end():
    """ההדגמה (./demo.sh) — התרחיש המלא רץ ומחזיר את המספרים הצפויים, בלי רשת."""
    from app.demo import build_demo_service, run_scenario
    svc2, fake, _ = build_demo_service()
    lines: list[str] = []
    t = run_scenario(svc2, fake, out=lines.append)
    assert t["open_invoices"] == 5 and t["closed_invoices"] == 1
    assert t["sent_sms"] == 4 and t["sent_email"] == 4 and t["owner_inbox"] == 1
    assert any("pay.example/gabi-demo" in x for x in lines)
    assert not any("whatsapp" in x.lower() for x in lines)



def test_landing_form_has_no_hidden_send_channel(api):
    """משלים את test_landing_draft_price_demo_link_and_no_whatsapp: גם בלי fetch/action אסור
    שהסקריפט של הטיוטה ישלח פרטים בערוץ אחר (XHR, beacon, websocket, form.submit, mailto)."""
    html = api.get("/landing").text
    for vec in ("XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource", ".submit()",
                "mailto:", "new Image(", "method=\"post\"", "localStorage"):
        assert vec not in html, f"ערוץ שליחה/שמירה בטיוטת דף הנחיתה: {vec}"

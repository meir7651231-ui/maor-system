"""זרימה מקצה לקצה דרך ה-API: סנכרון sandbox מדומה ⇒ תור ⇒ אישור ⇒ dry-run ⇒ תשובות."""
from datetime import datetime, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import SafetyError
from app.main import create_app
from app.policy import TZ
from app.service import CollectService
from tests.conftest import AUTH, OWNER_TOKEN


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def first_cycle(api):
    assert api.post("/sync").json() == {"open": 2, "closed": 0}
    created = api.post("/plan").json()["created"]
    assert len(created) == 2
    return created


def test_health_reports_dry_run(api):
    h = api.get("/health").json()
    assert h["dry_run"] is True and h["send_mode"] == "dry_run"
    assert h["channels"] == ["sms", "email"] and "whatsapp" not in str(h)
    assert h["product"] == "גבי – תזכורות תשלום" and h["tagline"] == "הכסף שלך חוזר. בלי שתצטרך לרדוף."


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
    assert sms["body"].startswith("סטודיו מאיר: שלום דנה,")
    assert "1,200 ₪" in sms["body"] and "https://gabi.example/p/" in sms["body"]
    assert sms["length"]["segments"] <= 2
    # הקישור הקצר מוביל לדף התשלום של חשבונית ירוקה
    code = sms["body"].split("/p/")[1].split()[0]
    r = api.get(f"/p/{code}/pay", follow_redirects=False)
    assert r.status_code == 302 and r.headers["location"] == "https://www.greeninvoice.co.il/pay/studio?invoice=1001"
    assert "https://www.greeninvoice.co.il/pay/studio?invoice=1001" in mail["body"]
    # שכבת ספקים אחת (app/integrations): 019 ב-XML (fixture תאימות, חוזה לא מאומת), /api/test, סוד מצונזר
    assert "<source>StudioMeir</source>" in sms["request"]["body"]
    assert sms["request"]["headers"]["authorization"] == "***"
    assert sms["request"]["url"].endswith("/api/test")
    assert mail["to"] == "c1@example.com" and "1001" in mail["subject"]
    assert mail["request"]["headers"]["List-Unsubscribe-Post"] == "List-Unsubscribe=One-Click"


def test_every_reminder_needs_individual_approval(api, svc, clock):
    """הכרעת מאיר: אישור פרטני לכל הודעה (גם אחרי שהראשונה ללקוח אושרה)."""
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    clock.now += timedelta(days=7)
    new = api.post("/plan").json()["created"]
    r = next(x for x in api.get("/reminders").json() if x["id"] in new and x["step"] == 1)
    assert r["status"] == "pending_approval" and r["template_key"] == "plan_offer"
    before = len(svc.sender.sent)
    api.post("/dispatch")
    assert len(svc.sender.sent) == before


def test_72h_gap_and_shabbat(api, svc, clock):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    clock.now = datetime(2026, 11, 14, 10, tzinfo=TZ)  # שבת
    api.post("/plan")
    assert api.post("/dispatch").json()["sent"] == []


def test_max_three_reminders_then_stop_and_notify_owner(api, svc, clock):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    for _ in range(4):
        clock.now += timedelta(days=8)
        for i in api.post("/plan").json()["created"]:
            if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1:
                api.post(f"/reminders/{i}/approve")
        api.post("/dispatch")
    rems = [r for r in api.get("/reminders").json() if r["invoice_id"] == 1]
    assert [r["template_key"] for r in rems] == ["friendly", "plan_offer", "final"]
    assert all(r["status"] == "sent_dry_run" for r in rems)          # אין רביעית
    inbox = [m for m in api.get("/owner/inbox").json() if m["intent"] == "max_reminders"]
    assert len(inbox) == 1 and "1001" in inbox[0]["body"]            # התראה אחת בלבד


def test_opt_out_stops_everything(api, svc, clock):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    res = api.post("/inbound", json={"sender": "0501234567", "text": "הסר"}).json()
    # ההסרה בתוקף מיד; אישור-ההסרה הוא טיוטה שבעל העסק מאשר (critic §4: כל הודעה באישור)
    assert res["intent"] == "opt_out" and res["auto_reply"] is None and res["draft_id"]
    api.post(f"/conversation/drafts/{res['draft_id']}/approve")
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


def test_payment_link_is_business_page_and_never_writes_to_gi(api, svc, fake_gi, clock):
    """הכרעת מאיר 6.11 + ממצא מבקר 2.0.5: רק קישור לעמוד התשלום של העסק; אין POST /payments/form."""
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    clock.now += timedelta(days=7)
    api.post("/plan")
    body = api.get(f"/reminders/{ids[0]}/preview").json()["messages"][1]["body"]   # מייל
    assert "https://www.greeninvoice.co.il/pay/studio?invoice=1001" in body
    assert fake_gi.forms == 0


def test_greeninvoice_form_mode_refused():
    from app.config import SafetyError, load_settings
    with pytest.raises(SafetyError):
        load_settings({"PAYMENT_LINK_MODE": "greeninvoice_form"})


@pytest.mark.parametrize("provider,host", [("greeninvoice", "greeninvoice.example"),
                                           ("meshulam", "meshulam.example"), ("bit", "bit.example")])
def test_mock_payment_page_per_provider(provider, host):
    from app.config import load_settings
    s = load_settings({"PAYMENT_PROVIDER": provider})
    assert host in s.payment_page and host in s.allowed_payment_domains


def test_no_safe_payment_link_blocks(svc, gi_client, clock, fake_gi):
    from app.config import load_settings
    from app.db import DB
    s = load_settings({"PAYMENT_LINK": "https://evil.example/pay"})   # לא ברשימה המותרת
    api = TestClient(create_app(CollectService(s, DB(":memory:"), gi=gi_client, clock=clock),
                                owner_token=OWNER_TOKEN), headers=AUTH)
    ids = first_cycle(api)
    assert api.get("/reminders").json()[0]["block_reason"] == "no_payment_link"
    assert api.post(f"/reminders/{ids[0]}/approve").status_code == 409


def test_payment_form_created_once(api, svc, fake_gi, clock):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    clock.now += timedelta(days=7)
    api.post("/plan")
    # הכרעת מאיר (6.11) + review חור 3: לא יוצרים דף תשלום שמנפיק קבלה. היה: אחד לכל חשבונית
    assert fake_gi.forms == 0


def test_unsubscribe_link_and_one_click(api, svc):
    ids = first_cycle(api)
    tok = svc.new_unsub_token(svc.db.one("SELECT id FROM customers WHERE id=1")["id"])
    page = api.get(f"/u/{tok}")
    assert page.status_code == 200 and 'method="post"' in page.text
    # GET לבד לא מסיר (סורקי קישורים פותחים כל URL) — רק הכפתור/POST
    assert api.get("/reminders").json()[0]["status"] == "pending_approval"
    assert "הוסרתם" in api.post(f"/u/{tok}", headers={"accept": "text/html"}).text
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
    draft = next(d for d in api.get("/conversation/drafts").json() if d["id"] == res["draft_id"])
    assert "https://www.greeninvoice.co.il/pay/studio?invoice=1001" in draft["body"]


def test_ui_page_has_slogan_and_no_whatsapp(api):
    html = api.get("/ui").text
    assert "גבי – תזכורות תשלום" in html and "SMS" in html
    assert "whatsapp" not in html.lower() and "וואטסאפ" not in html


def test_dashboard_exposes_paused_customer_and_resume_button(api, svc):
    """כפתור «חידוש» בדשבורד: שורה של לקוח מושהה נושאת customer_id+paused_reason, והחידוש משחרר אותו."""
    first_cycle(api)
    row = api.get("/dashboard").json()["invoices"][0]
    cid = row["customer_id"]
    svc.db.x("UPDATE customers SET paused_reason='paid_claim' WHERE id=?", (cid,))
    row = next(x for x in api.get("/dashboard").json()["invoices"] if x["customer_id"] == cid)
    assert row["paused_reason"] == "paid_claim" and row["customer_block"] == "paid_claim"
    assert api.post(f"/customers/{cid}/resume").status_code == 200
    row = next(x for x in api.get("/dashboard").json()["invoices"] if x["customer_id"] == cid)
    assert row["paused_reason"] is None and row["customer_block"] is None
    ui = api.get("/ui").text
    assert "button.resume" in ui and "/resume" in ui


WEB = Path(__file__).resolve().parent.parent / "web"


def test_landing_redirects_to_designed_app(api, tmp_path, monkeypatch, svc):
    """הכרעת מאיר 6.11: /app/ הוא דף הנחיתה היחיד; /landing = הפניה מקומית (לא דף שני)."""
    r = api.get("/landing", follow_redirects=False)
    assert r.status_code == 307 and r.headers["location"] in ("/app/", "/ui")
    from fastapi.testclient import TestClient

    from app.main import create_app
    (tmp_path / "index.html").write_text("<!doctype html>", encoding="utf-8")
    monkeypatch.setenv("WEB_DIST", str(tmp_path))
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    assert c.get("/landing", follow_redirects=False).headers["location"] == "/app/"
    monkeypatch.setenv("WEB_DIST", str(tmp_path / "missing"))
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    assert c.get("/landing", follow_redirects=False).headers["location"] == "/ui"


def test_designed_landing_final_decisions():
    """תוכן דף הנחיתה המעוצב לפי הכרעות מאיר 6.11: מחיר, ניסיון, מיצוב, טיוטה, noindex, בלי וואטסאפ,
    בלי 'העוזר לגביית חובות', בלי טענות גורפות ('חוקי', 'מוצפן', גבייה מובטחת)."""
    src = (WEB / "src/pages/Landing.tsx").read_text(encoding="utf-8")
    index = (WEB / "index.html").read_text(encoding="utf-8")
    assert "monthly: 119" in src and "yearly: 1190" in src and "trialDays: 14" in src
    assert "כולל מע״מ ככל שחל" in src and "בלי כרטיס אשראי" in src
    assert "הכסף שלך חוזר. בלי שתצטרך לרדוף." in src and "טיוטה, לא לפרסום" in src
    assert 'name="robots" content="noindex' in index and "גבי – תזכורות תשלום" in index
    for f in (src, index, (WEB / "src/components/Logo.tsx").read_text(encoding="utf-8")):
        assert "whatsapp" not in f.lower() and "וואטסאפ" not in f
        assert "העוזר לגביית חובות" not in f
        for claim in ("חוקי", "מוצפן", "מובטח", "מבטיח", "100%"):
            assert claim not in f, f"טענה גורפת בלי ראיות: {claim}"
    assert "לכל היותר 3" in src and "08:00" in src and "20:00" in src


def test_designed_landing_waitlist_sends_nothing():
    """טופס רשימת ההמתנה בטיוטה לא שולח ולא שומר: אין fetch/XHR/beacon/websocket/storage/mailto/action."""
    src = (WEB / "src/pages/Landing.tsx").read_text(encoding="utf-8")
    form = src[src.index("function Waitlist"):src.index("function HeroPhone")]
    for vec in ("fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource", ".submit()",
                "mailto:", "new Image(", "action=", "localStorage", "sessionStorage", "api."):
        assert vec not in form, f"ערוץ שליחה/שמירה בטופס הטיוטה: {vec}"
    assert "preventDefault" in form


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
    assert len(rems) == 2 and rems[-1]["template_key"] == "plan_offer"


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
    # 5 SMS: גם "שילמתי" מקבל עכשיו תשובה (תודה + בקשת אסמכתא) אחרי אישור בעל העסק
    assert t["sent_sms"] == 5 and t["sent_email"] == 4 and t["owner_inbox"] == 1
    assert any("pay.example/gabi-demo" in x for x in lines)
    assert not any("whatsapp" in x.lower() for x in lines)



def test_web_app_served_when_built(tmp_path, monkeypatch, svc):
    """web/dist קיים ⇒ מוגש ב-/app/ (הממשק המעוצב, אותו origin כמו ה-API). לא קיים ⇒ 404, /ui לא נפגע."""
    from fastapi.testclient import TestClient

    from app.main import create_app
    monkeypatch.setenv("WEB_DIST", str(tmp_path / "missing"))
    assert TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH).get("/app/").status_code == 404
    (tmp_path / "index.html").write_text("<title>גבי</title>", encoding="utf-8")
    monkeypatch.setenv("WEB_DIST", str(tmp_path))
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    r = c.get("/app/")
    assert r.status_code == 200 and "גבי" in r.text
    assert c.get("/health").json()["dry_run"] is True


def _code(svc, inv_id=1):
    row = svc.db.one("SELECT * FROM invoices WHERE id=?", (inv_id,))
    return svc._short_code(row)


def test_landing_page_and_actions(api, svc):
    first_cycle(api)
    code = _code(svc)
    page = api.get(f"/p/{code}").text
    assert "1,200 ₪" in page and "לתשלום מאובטח" in page and "הפסקת תזכורות" in page
    assert 'dir="rtl"' in page
    # באג שנתפס בדפדפן: קישורים יחסיים ("pay") מ-/p/{code} נפתרו ל-/p/pay
    for act in ("pay", "plan", "paid", "stop"):
        assert f'/p/{code}/{act}"' in page, act
    r = api.post(f"/p/{code}/plan", content="n=4",
                 headers={"content-type": "application/x-www-form-urlencoded"})
    assert r.status_code == 200 and "פריסה" in r.text
    plan = api.get("/plans").json()[0]
    assert len(plan["installments"]) == 4 and plan["status"] == "proposed"
    assert api.get("/owner/inbox").json()[0]["intent"] == "plan_request"
    assert svc.sender.sent == []          # פעולה מהעמוד לא שולחת הודעה


def test_landing_paid_pauses_and_stop_opts_out(api, svc):
    first_cycle(api)
    code = _code(svc)
    api.post(f"/p/{code}/paid")
    assert svc.db.one("SELECT paused_reason FROM customers WHERE id=1")["paused_reason"] == \
        "paid_claim"
    api.post(f"/p/{code}/stop")
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 1
    assert "הופסקו" in api.get(f"/p/{code}").text


def test_landing_unknown_and_closed(api, svc, fake_gi):
    first_cycle(api)
    assert api.get("/p/nope123").status_code == 404
    assert api.post("/p/nope123/stop").status_code == 404
    code = _code(svc)
    assert api.post(f"/p/{code}/hack").status_code == 400
    fake_gi.docs = [d for d in fake_gi.docs if d["id"] != "doc1"]
    api.post("/sync")
    assert "סגורה" in api.get(f"/p/{code}").text
    assert api.get(f"/p/{code}/pay", follow_redirects=False).status_code == 409


def test_plan_installments_from_text(api, svc):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/inbound", json={"sender": "050-1234567", "text": "אפשר לפרוס לשלושה תשלומים?"})
    assert len(api.get("/plans").json()[0]["installments"]) == 3


def test_short_codes_unique_and_stable(api, svc):
    first_cycle(api)
    a, b = _code(svc, 1), _code(svc, 2)
    assert a != b and len(a) == 7 and _code(svc, 1) == a


def test_dashboard_resume_paused_customer(api, svc, clock):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    api.post("/inbound", json={"sender": "050-1234567", "text": "שילמתי"})
    row = next(x for x in api.get("/dashboard").json()["invoices"] if x["invoice_id"] == 1)
    assert row["paused_reason"] == "paid_claim" and row["customer_id"] == 1
    assert 'class="resume"' in api.get("/ui").text or "button.resume" in api.get("/ui").text
    api.post(f"/customers/{row['customer_id']}/resume")
    clock.now += timedelta(days=7)
    assert any(r["invoice_id"] == 1 for r in
               [api.get("/reminders").json()[i - 1] for i in api.post("/plan").json()["created"]])


def test_email_webhook_inbound(api, svc):
    first_cycle(api)
    body = {"sender": "Dana Cohen <C1@Example.com>", "message_id": "<abc@mail>",
            "text": "שילמתי בהעברה בנקאית\n\nOn Sun wrote:\n> הסר"}   # "הסר" בציטוט לא נספר
    r = api.post("/webhooks/email?k=ewk-test", json=body).json()
    assert r.get("intent") == "paid_claim", r
    assert api.post("/webhooks/email?k=ewk-test", json=body).json()["duplicate"] is True
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=1")["opted_out"] == 0
    assert api.post("/webhooks/email?k=bad", json=body).status_code == 403
    assert api.post("/webhooks/email", json=body).status_code == 403


def test_compliance_filter_blocks_in_service(svc, gi_client, clock):
    """ר-1: מילה אסורה (למשל בשם העסק שהוזן) ⇒ התזכורת נחסמת ולא ניתנת לאישור."""
    from app.config import load_settings
    from app.db import DB
    s = load_settings({"BUSINESS_NAME": "גבייה דחוף בע\"מ",
                       "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/s"})
    api = TestClient(create_app(CollectService(s, DB(":memory:"), gi=gi_client, clock=clock),
                                owner_token=OWNER_TOKEN), headers=AUTH)
    ids = first_cycle(api)
    assert api.get("/reminders").json()[0]["block_reason"] == "compliance"
    assert api.post(f"/reminders/{ids[0]}/approve").status_code == 409


def test_trial_14_days_stops_sending_after(gi_client, clock):
    from app.config import load_settings
    from app.db import DB
    s = load_settings({"TRIAL_START": "2026-10-26", "SMS_SENDER_ID": "StudioMeir",
                       "PAYMENT_LINK": "https://www.greeninvoice.co.il/pay/s"})
    svc = CollectService(s, DB(":memory:"), gi=gi_client, clock=clock)
    api = TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)
    t = api.get("/health").json()["trial"]
    assert t["on_trial"] and t["days_left"] == 1 and t["price_ils_month"] == 119
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    clock.now += timedelta(days=1)          # יום 14 עבר
    assert api.get("/dashboard").json()["trial"]["active"] is False
    assert api.post("/dispatch").json()["sent"] == [] and svc.sender.sent == []
    assert api.post("/plan").json()["created"] == []
    assert api.get("/dashboard").json()["totals"]["open_invoices"] == 2   # הנתונים נשמרים


def test_no_trial_means_active(api):
    t = api.get("/health").json()["trial"]
    assert t["active"] is True and t["on_trial"] is False



# ───────── פערים שנמצאו בחיבור מנוע השיחה (בדיקה מול ההתנהגות, 6.11) ─────────
def test_wrong_number_phone_stays_deleted_after_resync(api, svc):
    """ר-3: אחרי «מספר שגוי» הסנכרון מחשבונית ירוקה החזיר את הטלפון (עדיין רשום שם)."""
    first_cycle(api)
    api.post("/inbound", json={"sender": "0501234567", "text": "טעות במספר, אני לא מכיר את דנה"})
    api.post("/sync")
    c = svc.db.one("SELECT phone, blocked_phone FROM customers WHERE id=1")
    assert not c["phone"] and c["blocked_phone"] == "050-1234567"


def test_corrected_phone_after_wrong_number_is_accepted(api, svc, fake_gi):
    first_cycle(api)
    api.post("/inbound", json={"sender": "0501234567", "text": "טעות במספר, אני לא מכיר את דנה"})
    fake_gi.docs[0]["client"]["phone"] = "052-1112222"   # בעל העסק תיקן בחשבונית ירוקה
    api.post("/sync")
    assert svc.db.one("SELECT phone FROM customers WHERE id=1")["phone"] == "052-1112222"


def test_promise_expired_returns_to_ladder(api, svc, clock):
    """באג: release_expired_pauses לא נקרא ⇒ הבטחה שלא קוימה השהתה את הלקוח לנצח."""
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    r = api.post("/inbound", json={"sender": "0501234567", "text": "אשלם ביום חמישי"}).json()
    assert r["intent"] == "promise" and r["pause_until"] == "2026-11-13"

    def cust1(created):
        return [i for i in created if svc._invoice(svc._reminder(i)["invoice_id"])["customer_id"] == 1]

    clock.now += timedelta(days=3)                       # 11.11 — לפני המועד: שקט
    assert cust1(api.post("/plan").json()["created"]) == []
    clock.now += timedelta(days=5)                       # 16.11 — עבר בלי תשלום
    assert cust1(api.post("/plan").json()["created"])
    assert any(a["action"] == "pause_expired" for a in api.get("/audit").json())


# ───────── שער יחיד + ממצאי המבקר (סבב 3 של הבקאנד) ─────────
def test_plan_approval_on_shabbat_waits_for_window(api, svc, clock):
    """ממצא 2.4: אישור פריסה נשלח מיד, גם בשבת וגם ללקוח שהוסר. עכשיו: תור + שער."""
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    api.post("/inbound", json={"sender": "0501234567", "text": "אפשר פריסה ל-3 תשלומים?"})
    pid = api.get("/plans").json()[-1]["id"]
    before = len(svc.sender.sent)
    clock.now = datetime(2026, 11, 14, 11, tzinfo=TZ)          # שבת
    r = api.post(f"/plans/{pid}/approve").json()
    assert r["queued"] is True and len(svc.sender.sent) == before
    clock.now = datetime(2026, 11, 15, 8, 30, tzinfo=TZ)       # ראשון
    svc.inbox.flush()
    sent = svc.sender.sent[before:]
    assert len(sent) == 1 and "להסרה:" in sent[0]["body"]       # ממצא 2.3.5: הסרה גם בתשובה


def test_plan_approval_to_opted_out_customer_not_sent(api, svc):
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/inbound", json={"sender": "0501234567", "text": "אפשר פריסה?"})
    pid = api.get("/plans").json()[-1]["id"]
    svc._opt_out(1, "test")
    before = len(svc.sender.sent)
    api.post(f"/plans/{pid}/approve")
    assert len(svc.sender.sent) == before


def test_shared_phone_suppressed_across_customers(api, svc, fake_gi):
    """ממצא 2.5: שני לקוחות על אותו טלפון — "הסר" מאחד חוסם את המספר גם לשני."""
    fake_gi.docs[1]["client"]["phone"] = "050-1234567"
    ids = first_cycle(api)
    api.post("/inbound", json={"sender": "0501234567", "text": "הסר"})
    for i in ids:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    assert all(m["to"] != "972501234567" for m in svc.sender.sent if m["channel"] == "sms")


def test_email_only_customers_not_merged(svc):
    """ממצא 2.0.2: שני לקוחות בלי מזהה ובלי טלפון התמזגו ⇒ חוב של א' למייל של ב'."""
    from datetime import date

    from app.greeninvoice import Invoice
    mk = lambda i, email: Invoice(f"d{i}", str(i), 305, 10000, "ILS", date(2026, 9, 1),  # noqa: E731
                                  date(2026, 10, 1), "", f"לקוח {i}", "", email)
    svc.ingest([mk(1, "a@x.com"), mk(2, "b@y.com"), mk(3, "")])
    rows = svc.db.q("SELECT external_id, email FROM customers ORDER BY id")
    assert [r["external_id"] for r in rows] == ["email:a@x.com", "email:b@y.com", "doc:d3"]
    assert [r["email"] for r in rows][:2] == ["a@x.com", "b@y.com"]


def test_non_open_status_not_ingested(svc):
    from datetime import date

    from app.greeninvoice import Invoice
    inv = Invoice("d9", "9", 305, 10000, "ILS", date(2026, 9, 1), date(2026, 10, 1), "c9",
                  "x", "0501234567", "", status=1)
    assert svc.ingest([inv])["open"] == 0


def test_missing_due_date_uses_terms_not_issue_date():
    from app.greeninvoice import map_document
    inv = map_document({"id": 1, "amount": 10, "documentDate": "2026-10-01", "status": 0})
    assert inv.due.isoformat() == "2026-10-31" and inv.due_estimated is True


def test_plan_offer_never_sent_twice(api, svc):
    """ממצא מכירות/מבקר: הצעת פריסה נשלחה פעמיים — פעם מ-/plans ופעם מטיוטת מנוע השיחה."""
    ids = first_cycle(api)
    api.post(f"/reminders/{ids[0]}/approve")
    api.post("/dispatch")
    api.post("/inbound", json={"sender": "0501234567", "text": "אפשר פריסה ל-3 תשלומים?"})
    pid = api.get("/plans").json()[-1]["id"]
    drafts = svc.db.q("SELECT id FROM drafts WHERE plan_id=? AND intent='plan_request'", (pid,))
    assert drafts, "המבחן חייב לכלול טיוטה מקבילה"
    before = len(svc.sender.sent)
    api.post(f"/plans/{pid}/approve")
    for d in drafts:                       # בעל העסק מנסה לאשר גם את הטיוטה המקבילה
        api.post(f"/conversation/drafts/{d['id']}/approve", json={})
    offers = [m for m in svc.sender.sent[before:] if m["to"] == "972501234567"]
    assert len(offers) == 1
    api.post(f"/plans/{pid}/approve")      # אישור כפול של ההסדר עצמו
    assert len([m for m in svc.sender.sent[before:] if m["to"] == "972501234567"]) == 1

"""מיפוי 14 הדרישות המשפטיות (team/legal.md §7) לבדיקות.

כל דרישה = בדיקה אחת לפחות, בשם test_r<N>_...
• בדיקה רגילה  = הדרישה נאכפת היום בקוד.
• xfail(strict) = פער ידוע (6.11 לילה: אין — 14/14 נאכפות; "נאכף" ≠ "מאושר משפטית").
  כשמישהו יממש את הדרישה, הבדיקה תתחיל לעבור ⇒ strict יפיל
  את הריצה ⇒ חובה להסיר את הסימון. כך הטבלה ב-legal.md לא יכולה להתיישן בשקט.
"""
from __future__ import annotations

import re
from datetime import timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import compliance, conversation, plans, templates
from app.main import create_app
from tests.conftest import AUTH, OWNER_TOKEN

APP_DIR = Path(__file__).resolve().parents[1] / "app"
LONG_LINK = "https://pay.greeninvoice.co.il/f/aB3dE5gH7jK9mN1pQ3sT5vW7"
LONG_UNSUB = "https://gabi.example/u/Zx9Yw8Vu7Ts6"


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc, owner_token=OWNER_TOKEN), headers=AUTH)


def _cycle(api, approve_all=True):
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    if approve_all:
        for i in ids:
            api.post(f"/reminders/{i}/approve")
        api.post("/dispatch")
    return ids


def _fields(biz="סטודיו מאיר", name="דנה כהן"):
    return templates.fields(biz=biz, name=name, num="10234", amount_agorot=1_250_00,
                            currency="ILS", link=LONG_LINK, unsub=LONG_UNSUB)


# ───────────── ר-1 · מסנן ניסוח על כל טקסט יוצא ─────────────
@pytest.mark.parametrize("step", templates.STEPS, ids=lambda s: s.key)
def test_r1_every_reminder_template_passes_filter(step):
    f = _fields()
    early = step.key in ("friendly", "second")  # "חוב" אסור בתזכורת 1–2
    rules = compliance.Rules(business=f["biz"], payment_link=LONG_LINK,
                             unsubscribe_url=LONG_UNSUB, allow_debt_word=not early,
                             max_sms_chars=10_000)  # אורך נבדק בנפרד ב-ר-2
    assert compliance.violations(templates.render_sms(step, f), rules) == []
    _subj, text, _html = templates.render_email(step, f)
    mail_rules = compliance.Rules(business="", payment_link=LONG_LINK,
                                  unsubscribe_url=LONG_UNSUB, channel="email",
                                  allow_debt_word=not early)
    assert compliance.violations(text, mail_rules) == []


@pytest.mark.parametrize("bad", [
    "סטודיו מאיר: אם לא תשלמו נעביר להוצאה לפועל",
    "סטודיו מאיר: נפנה למעסיק שלך",
    "סטודיו מאיר: יתווספו דמי פיגורים",
    "סטודיו מאיר: מבצע מיוחד ללקוחות! https://evil.example",
    "סטודיו מאיר: דחוף!! לשלם היום",
])
def test_r1_filter_blocks_threats_marketing_foreign_links(bad):
    assert compliance.violations(bad, compliance.Rules(business="סטודיו מאיר"))


def test_r1_live_auto_replies_pass_filter(api, svc):
    """כל תשובה שיוצאת בפועל מהשירות עובר את אותו מסנן (כולל שם העסק בהתחלה).
    התשובות הן טיוטות — בעל העסק מאשר כל אחת (team/critic.md §4) ואז הן יוצאות."""
    _cycle(api)
    for text in ("איך משלמים?", "שלחו העתק חשבונית"):
        r = api.post("/inbound", json={"channel": "sms", "sender": "0501234567", "text": text}).json()
        api.post(f"/conversation/drafts/{r['draft_id']}/approve")
    bodies = [m["body"] for m in svc.sender.sent if m["channel"] == "sms"
              and m["to"] == "972501234567"][1:]  # בלי התזכורת עצמה
    assert bodies, "לא יצא אף מענה אוטומטי"
    link = svc.db.one("SELECT payment_url FROM invoices WHERE number='1001'")["payment_url"]
    dana = svc.db.one("SELECT id FROM customers WHERE name='דנה כהן'")["id"]
    bad = {}
    for b in bodies:
        # טוקן הסרה חדש לכל הודעה (ב-DB רק hash — QA): הקישור חייב להיות תקף ושל אותו לקוח
        m = re.search(r"https://gabi\.example/u/([A-Za-z0-9_-]+)", b)
        assert m and svc._unsub_customer(m.group(1))["id"] == dana, b
        # מותר: קישור התשלום + עמוד ההסרה (§3.1 סעיף 5) — ההסרה מצורפת לכל תשובה
        rules = compliance.Rules(business="סטודיו מאיר", payment_link=link or "",
                                 unsubscribe_url=m.group(0))
        bad[b] = compliance.violations(b, rules)
    assert all(not v for v in bad.values()), bad


# ───────────── ר-2 · SMS/מייל בלבד, ≤3 מקטעים ─────────────
def test_r2_no_whatsapp_code_paths():
    src = "\n".join(p.read_text(encoding="utf-8") for p in APP_DIR.glob("*.py"))
    assert not (APP_DIR / "whatsapp.py").exists()
    assert "graph.facebook.com" not in src


# ר-2 נסגר (סבב 3): קישור קצר בדומיין שלנו (/p/{code}) במקום קישור GI + הסרה ⇒ ≤3 גם בערכים ארוכים
@pytest.mark.parametrize("step", templates.STEPS, ids=lambda s: s.key)
def test_r2_sms_within_three_segments_with_long_values(step):
    body = templates.render_sms(step, _fields(biz="מרכז הטיפולים של רונית", name="אלכסנדרה"))
    assert compliance.sms_segments(body) <= 3, (len(body), body)


# ───────────── ר-3 · "הסר" חוסם הכול ולצמיתות; מספר שגוי ─────────────
def test_r3_opt_out_blocks_all_channels_forever(api, svc, clock):
    _cycle(api)
    api.post("/inbound", json={"channel": "sms", "sender": "0501234567", "text": "הסר"})
    before = len(svc.sender.sent)
    for _ in range(4):
        clock.now += timedelta(days=8)
        api.post("/sync")
        for i in api.post("/plan").json()["created"]:
            api.post(f"/reminders/{i}/approve")
        api.post("/dispatch")
    new = svc.sender.sent[before:]
    assert all(m["to"] not in ("972501234567", "c1@example.com") for m in new)


def test_r3_wrong_number_deletes_phone_and_blocks(api, svc):
    """נסגר: service.inbound מחובר למנוע השיחה (app/inbox.py)."""
    _cycle(api)
    api.post("/inbound", json={"channel": "sms", "sender": "0501234567",
                               "text": "טעות במספר, אני לא מכיר את דנה"})
    row = svc.db.one("SELECT phone, opted_out FROM customers WHERE name='דנה כהן'")
    assert not row["phone"] and row["opted_out"] == 1


def test_r3_wrong_person_engine_hides_details():
    ctx = conversation.Context(today=__import__("datetime").date(2026, 11, 8),
                               business="סטודיו מאיר", customer_name="דנה כהן",
                               invoices=(conversation.OpenInvoice("10234", 1_250_00),))
    d = conversation.respond("טעות במספר, אני לא מכיר את דנה", ctx)
    assert d.intent == conversation.Intent.WRONG_PERSON
    assert d.stop == conversation.Stop.PERMANENT
    if d.reply:
        assert "דנה" not in d.reply and "₪" not in d.reply and "10234" not in d.reply


# ───────────── ר-4 · ריענון לפני שליחה (נגד הטעיה בסכום) ─────────────
# ר-4 נסגר: dispatch מרענן כל חשבונית מ-GI לפני שליחה. סכום שהשתנה ⇒ נבנה מחדש וחוזר לאישור
def test_r4_amount_change_after_plan_is_not_sent_stale(api, svc, fake_gi):
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    fake_gi.docs[0]["amount"] = "700.00"   # תשלום חלקי אחרי שהתזכורת נבנתה
    for i in ids:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    stale = [m for m in svc.sender.sent if m["to"] in ("972501234567", "c1@example.com")]
    assert stale == []                                       # לא נשלח הסכום הישן
    r = svc._reminder(ids[0])
    assert r["status"] == "pending_approval" and r["block_reason"] == "amount_changed"
    assert "700" in r["body"] and "1,200" not in r["body"]
    api.post(f"/reminders/{ids[0]}/approve")                 # בעל העסק מאשר את הסכום החדש
    api.post("/dispatch")
    sms = [m for m in svc.sender.sent if m["channel"] == "sms" and m["to"] == "972501234567"]
    assert sms and "700" in sms[0]["body"]


def test_r4_refresh_failure_blocks_send(api, svc, fake_gi):
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    for i in ids:
        api.post(f"/reminders/{i}/approve")
    fake_gi.fail_refresh = True
    api.post("/dispatch")
    assert svc.sender.sent == []
    assert svc._reminder(ids[0])["block_reason"] == "refresh_failed"
    assert svc._reminder(ids[0])["status"] == "approved"     # לא אבד: נשלח כשהרענון מצליח
    fake_gi.fail_refresh = False
    api.post("/dispatch")
    assert svc.sender.sent and svc._reminder(ids[0])["block_reason"] is None


def test_r4_refresh_hits_source_for_every_send(api, svc, fake_gi):
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    for i in ids:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    assert fake_gi.refresh_calls == len(ids)


def test_r4_status_closed_at_source_cancels(api, svc, fake_gi):
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    for i in ids:
        api.post(f"/reminders/{i}/approve")
    fake_gi.docs[0]["status"] = 1                             # נסגר ב-morning (ממצא 2.10)
    api.post("/dispatch")
    assert all(m["to"] not in ("972501234567", "c1@example.com") for m in svc.sender.sent)
    assert svc._reminder(ids[0])["status"] == "cancelled"


# ר-12: שינוי בגוף או בגרסת הנוסח אחרי אישור ⇒ האישור בטל
def test_r12_body_change_after_approval_invalidates(api, svc):
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    api.post(f"/reminders/{ids[0]}/approve")
    svc.db.x("UPDATE reminders SET payload=replace(payload, 'שלום', 'היי') WHERE id=?", (ids[0],))
    api.post("/dispatch")
    assert svc.sender.sent == []
    r = svc._reminder(ids[0])
    assert r["status"] == "pending_approval" and r["block_reason"] == "approval_invalidated"


def test_r12_template_version_change_invalidates(api, svc, monkeypatch):
    from app import templates as t
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    api.post(f"/reminders/{ids[0]}/approve")
    monkeypatch.setattr(t, "template_version", lambda: "ffffffffffff")
    api.post("/dispatch")
    assert svc.sender.sent == [] and svc._reminder(ids[0])["status"] == "pending_approval"


def test_r12_audit_records_hash_and_version(api, svc):
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    api.post(f"/reminders/{ids[0]}/approve")
    import json as _j
    a = next(x for x in api.get("/audit").json() if x["action"] == "approve")
    d = _j.loads(a["detail"])
    assert len(d["body_sha256"]) == 64 and len(d["template_version"]) == 12
    r = svc._reminder(ids[0])
    assert r["approved_by"] == "owner" and r["approved_hash"] == d["body_sha256"]


def test_r4_closed_invoice_cancels_pending_reminder(api, svc, fake_gi):
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    fake_gi.docs.pop(0)          # שולמה ⇒ נעלמה מהפתוחות
    api.post("/sync")
    for i in ids:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    assert all(m["to"] != "972501234567" for m in svc.sender.sent)


# ───────────── ר-5 · מצוקה/קושי ⇒ עצירה והעברה ─────────────
def test_r5_engine_stops_on_hardship():
    ctx = conversation.Context(today=__import__("datetime").date(2026, 11, 8),
                               business="סטודיו מאיר", customer_name="דנה כהן",
                               invoices=(conversation.OpenInvoice("10234", 1_250_00),))
    d = conversation.respond("פוטרתי החודש ואין לי כסף כרגע", ctx)
    assert d.intent in (conversation.Intent.CANT_PAY, conversation.Intent.DISTRESS)
    assert d.stop != conversation.Stop.NONE and d.escalate != conversation.Escalation.NONE


def test_r5_live_hardship_pauses_reminders(api, svc):
    """נסגר: service.inbound מחובר למנוע השיחה ('פוטרתי' ⇒ cant_pay ⇒ השהיה)."""
    _cycle(api)
    api.post("/inbound", json={"channel": "sms", "sender": "0501234567",
                               "text": "פוטרתי החודש ואין לי כסף כרגע"})
    c = svc.db.one("SELECT paused_reason, disputed, opted_out FROM customers "
                   "WHERE name='דנה כהן'")
    assert c["paused_reason"] or c["disputed"] or c["opted_out"]


# ───────────── ר-6 · חדלות פירעון / נפטר / קטין (סימון בעל העסק) ─────────────
@pytest.mark.parametrize("reason", ["insolvency", "deceased", "minor"])
def test_r6_owner_hold_stops_everything(api, svc, clock, reason):
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    cid = svc.db.one("SELECT id FROM customers WHERE name='דנה כהן'")["id"]
    r = api.post(f"/customers/{cid}/hold", json={"reason": reason, "note": "דווח בטלפון 6.11"})
    assert r.status_code == 200 and r.json()["paused_reason"] == reason
    for i in ids:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    clock.now += timedelta(days=10)
    for i in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    assert all(m["to"] not in ("972501234567", "c1@example.com") for m in svc.sender.sent)
    a = next(x for x in api.get("/audit").json() if x["action"] == "customer_hold")
    assert reason in a["detail"]


def test_r6_hold_rejects_unknown_reason(api, svc):
    api.post("/sync")
    cid = svc.db.one("SELECT id FROM customers LIMIT 1")["id"]
    assert api.post(f"/customers/{cid}/hold", json={"reason": "vip"}).status_code == 422
    assert api.post("/customers/999/hold", json={"reason": "minor"}).status_code == 404


# ───────────── ר-7 · חשבונית ישנה (>3 שנים) ⇒ טיפול ידני בלבד ─────────────
def test_r7_old_invoice_is_manual_only(api, svc, fake_gi):
    fake_gi.docs[0]["documentDate"] = "2022-01-01"
    fake_gi.docs[0]["dueDate"] = "2022-02-01"
    api.post("/sync")
    api.post("/plan")
    api.post("/plan")
    inv = svc.db.one("SELECT * FROM invoices WHERE number='1001'")
    assert svc.db.one("SELECT 1 FROM reminders WHERE invoice_id=?", (inv["id"],)) is None
    alerts = svc.db.q("SELECT * FROM messages WHERE needs_owner=1 AND intent='manual_only_old'")
    assert len(alerts) == 1 and "1001" in alerts[0]["body"]   # התראה אחת, לא בכל סבב
    # החשבונית החדשה של יוסי כן נכנסת לתור
    assert svc.db.one("SELECT COUNT(*) n FROM reminders")["n"] == 1


# ───────────── ר-8 · פריסה בלי ריבית ובלי עמלה ─────────────
@pytest.mark.parametrize("total,n", [(1_000_01, 3), (999_99, 6), (150_00, 4), (12_345_67, 5)])
def test_r8_plan_sum_exact_no_extra(total, n):
    from datetime import date
    inst = plans.propose(total, date(2026, 11, 8), n)
    assert sum(i.amount_agorot for i in inst) == total
    fields_ = set(plans.Installment.__dataclass_fields__)
    assert fields_ == {"n", "due", "amount_agorot"}  # אין interest/fee


# ───────────── ר-9 · LLM: מזעור + enum בלבד ─────────────
def test_r9_redaction_before_llm():
    ctx = conversation.Context(today=__import__("datetime").date(2026, 11, 8),
                               business="סטודיו מאיר", customer_name="דנה כהן",
                               invoices=(conversation.OpenInvoice("10234", 1_250_00),))
    out = conversation.redact_for_llm(
        "אני דנה כהן, ת\"ז 123456782, 050-1234567, dana@x.co.il, על חשבונית 10234 "
        "מסטודיו מאיר", ctx)
    for leak in ("דנה", "כהן", "123456782", "050-1234567", "dana@", "10234", "סטודיו מאיר"):
        assert leak not in out, (leak, out)


def test_r9_llm_cannot_invent_or_downgrade():
    ctx = conversation.Context(today=__import__("datetime").date(2026, 11, 8),
                               business="סטודיו מאיר")

    class Liar:
        def classify(self, _):
            return "approve_discount"

    d = conversation.respond("אממ", ctx, llm=Liar())
    assert d.intent == conversation.Intent.UNKNOWN and d.escalate != conversation.Escalation.NONE

    class Downgrader:
        def classify(self, _):
            return "thanks"

    d = conversation.respond("לא מגיע לכם כלום, זו טעות", ctx, llm=Downgrader())
    assert d.intent == conversation.Intent.DISPUTE


# ───────────── ר-10 · מחיקה/התממה אחרי 90 יום + legal hold + רשימת הסרה ─────────────
def _close_dana(api, svc, fake_gi):
    _cycle(api)
    fake_gi.docs[:] = [d for d in fake_gi.docs if d["id"] != "doc1"]
    api.post("/sync")


def test_r10_closed_debt_purged_after_90_days(api, svc, fake_gi, clock):
    _close_dana(api, svc, fake_gi)
    clock.now += timedelta(days=89)
    assert svc.purge_closed() == {"invoices": 0, "customers": 0}
    clock.now += timedelta(days=2)
    assert api.post("/maintenance/purge").json() == {"invoices": 1, "customers": 1}
    c = svc.db.one("SELECT * FROM customers WHERE external_id='cl1'")
    assert c["name"] is None and c["phone"] is None and c["email"] is None and c["purged_at"]
    assert all(r["body"] == "" for r in svc.db.q(
        "SELECT body FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
        "WHERE i.customer_id=?", (c["id"],)))
    assert all(m["body"] == "" for m in svc.db.q("SELECT body FROM messages WHERE customer_id=?",
                                                    (c["id"],)))
    assert svc.db.one("SELECT name FROM customers WHERE external_id='cl2'")["name"] == "יוסי לוי"
    assert "retention_purge" in [a["action"] for a in api.get("/audit").json()]


def test_r10_legal_hold_blocks_purge(api, svc, fake_gi, clock):
    _close_dana(api, svc, fake_gi)
    cid = svc.db.one("SELECT id FROM customers WHERE external_id='cl1'")["id"]
    assert api.post(f"/customers/{cid}/legal-hold", json={"note": "קצר"}).status_code == 409
    assert api.post(f"/customers/{cid}/legal-hold",
                    json={"note": "תיק 123 — שמירה לבקשת עו״ד"}).status_code == 200
    clock.now += timedelta(days=200)
    assert svc.purge_closed() == {"invoices": 0, "customers": 0}
    assert svc.db.one("SELECT name FROM customers WHERE id=?", (cid,))["name"] == "דנה כהן"
    assert all(r["body"] for r in svc.db.q("SELECT body FROM reminders"))
    api.post(f"/customers/{cid}/legal-hold", json={"note": None})   # ביטול ⇒ נמחק בסבב הבא
    assert svc.purge_closed()["customers"] == 1


def test_r10_suppression_survives_purge_and_is_hash_only(api, svc, fake_gi, clock):
    from tests.conftest import gi_doc
    _cycle(api)
    api.post("/inbound", json={"channel": "sms", "sender": "0501234567", "text": "הסר"})
    fake_gi.docs[:] = [d for d in fake_gi.docs if d["id"] != "doc1"]
    api.post("/sync")
    clock.now += timedelta(days=95)
    svc.purge_closed()
    rows = svc.db.q("SELECT * FROM suppressions")
    assert rows and not any("050" in str(tuple(r)) or "97250" in str(tuple(r)) for r in rows)
    fake_gi.docs.append(gi_doc(7, client_id="cl-new", due="2026-10-20"))   # אותו טלפון
    api.post("/sync")
    before = len(svc.sender.sent)
    for i in api.post("/plan").json()["created"]:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    assert all(m["to"] != "972501234567" for m in svc.sender.sent[before:])


# ───────────── ר-11 · סודות לא דולפים ─────────────
def test_r11_secrets_not_exposed(api, svc):
    _cycle(api)
    blob = " ".join(str(api.get(p).json()) for p in ("/health", "/audit", "/outbox"))
    for secret in ("test-secret", "whk-test"):
        assert secret not in blob


# ───────────── ר-12 · תיעוד אישור (מי ומתי) ─────────────
def test_r12_approval_audited_with_actor_and_time(api, svc):
    ids = _cycle(api)
    rows = svc.db.q("SELECT at, actor, detail FROM audit WHERE action='approve'")
    assert len(rows) == len(ids) and all(r["actor"] == "owner" and r["at"] for r in rows)


# ר-12 נסגר: reminders.template_version/body_hash/approved_hash/approved_version/approved_by
def test_r12_template_version_recorded(svc):
    from app.db import DB
    cols = {r["name"] for r in DB(":memory:").q("PRAGMA table_info(reminders)")}
    assert "template_version" in cols


# ───────────── ר-13 · עמוד הסרה/מידע ללקוח סופי ─────────────
def test_r13_unsubscribe_page_rtl_and_works(api, svc):
    _cycle(api)
    tok = svc.new_unsub_token(svc.db.one("SELECT id FROM customers WHERE name='דנה כהן'")["id"])
    page = api.get(f"/u/{tok}").text   # GET = דף אישור בלבד (סורקי קישורים לא מסירים)
    assert 'dir="rtl"' in page and 'lang="he"' in page and "הסירו אותי" in page
    page = api.post(f"/u/{tok}", headers={"accept": "text/html"}).text
    assert 'dir="rtl"' in page and "הוסרתם" in page


# ר-13 נסגר: שם העסק, למה קיבלתי, פרטיות, תווית טיוטה, פרטי מפעיל placeholder; הסרה ב-POST בלבד
def test_r13_landing_explains_who_and_privacy(api, svc):
    _cycle(api)
    tok = svc.new_unsub_token(svc.db.one("SELECT id FROM customers WHERE name='דנה כהן'")["id"])
    page = api.get(f"/u/{tok}").text
    assert "סטודיו מאיר" in page and "פרטיות" in page and "קיבלתם הודעה זו כי" in page
    assert "טיוטה – לבדיקת עו״ד" in page and "placeholder" in page
    assert "אינה הודעה פרסומית" in page


def test_r13_get_never_unsubscribes_and_token_is_128bit(api, svc):
    _cycle(api)
    tok = svc.new_unsub_token(svc.db.one("SELECT id FROM customers WHERE name='דנה כהן'")["id"])
    for _ in range(3):   # סורק קישורים פותח את הקישור כמה פעמים
        api.get(f"/u/{tok}")
        api.head(f"/u/{tok}")
    assert svc.db.one("SELECT opted_out FROM customers WHERE name='דנה כהן'")["opted_out"] == 0
    assert len(tok) >= 21     # token_urlsafe(16) = 22 תווים (128 ביט); ב-DB רק sha256 (QA)


def test_r13_page_escapes_business_name(api, svc):
    svc.s.__dict__  # noqa: B018
    _cycle(api)
    import dataclasses
    svc.s = dataclasses.replace(svc.s, business_name="<script>x</script>")
    tok = svc.new_unsub_token(svc.db.one("SELECT id FROM customers WHERE name='דנה כהן'")["id"])
    assert "<script>x" not in api.get(f"/u/{tok}").text


# ───────────── ר-14 · אין החזקת כסף ─────────────
def test_r14_no_money_handling_code():
    src = "\n".join(p.read_text(encoding="utf-8") for p in APP_DIR.glob("*.py"))
    for forbidden in (r"card_?number", r"\bcvv\b", r"stripe\.", r"/charges?\b", r"payout",
                      r"transfer_funds"):
        assert not re.search(forbidden, src, re.I), forbidden

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
    # review חור 3: אין payment_url שנוצר ב-GI — הקישור הוא עמוד התשלום של העסק
    link = svc._payment_link(svc.db.one("SELECT * FROM invoices WHERE number='1001'"))
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


def test_r7_old_invoice_no_auto_plan_or_auto_reply_in_conversation(api, svc, fake_gi):
    """critic סבב 23: ר-7 נאכף רק בתור התזכורות (`_plan_customer`). בשיחה, לקוח שכל החוב שלו
    בחשבונית מ-2022 שאל «אפשר בתשלומים?» ⇒ טיוטת פריסה 3×400 ₪ על החשבונית הישנה, הסדר
    נרשם, ובעל העסק לא קיבל שום סימן שזו חשבונית מעל 3 שנים. עכשיו: אין הצעה ואין הסדר,
    כרטיס «טיפול ידני» (תגית manual_only_old), ואין שליחה אוטומטית."""
    fake_gi.docs[0]["documentDate"] = "2022-01-01"
    fake_gi.docs[0]["dueDate"] = "2022-02-01"
    api.post("/sync")
    r = api.post("/inbound", json={"channel": "sms", "sender": "0501234567",
                                   "text": "אפשר לשלם בתשלומים?"}).json()
    assert r["plan_id"] is None and not r["auto_sent"]
    assert svc.db.one("SELECT COUNT(*) n FROM plans")["n"] == 0
    assert "manual_only_old" in r["tags"]
    assert any("3 שנים" in a for a in r["owner_actions"])
    assert "400" not in (r["owner_summary"] or "")


@pytest.mark.parametrize("amt,n", [("123456.77", 6), ("99999.97", 3), ("123456.79", 12)])
def test_plan_offer_fits_sms_with_longest_business_name(svc, fake_gi, clock, amt, n):
    """critic סבב 25: שם עסק של 40 תווים (המקסימום בהגדרות) + «קשה לי» + חלוקה לא שווה ⇒ הצעת
    הפריסה הגיעה ל-283–291 תווים (תקרת תשובה: 268). בעל העסק אישר ⇒ השליחה נכשלה, הטיוטה נסגרה
    כ«נדחתה», והלקוח שאמר שקשה לו לא קיבל כלום. עכשיו: נוסח מקוצר שנכנס בתקציב (כולל קישור ההסרה),
    ואם גם הוא לא נכנס ⇒ אין הצעה אוטומטית, כרטיס להציע ידנית."""
    import dataclasses

    from app.compliance import SMS_REPLY_MAX
    svc.s = dataclasses.replace(svc.s, business_name="א" * 20 + " " + "ב" * 19)
    fake_gi.docs[:] = [d for d in fake_gi.docs if d["number"] == "1001"]
    fake_gi.docs[0]["amount"] = amt
    fake_gi.docs[0]["client"]["name"] = "אלכסנדרה-מרגריטה בן-שושן"
    svc.sync()
    r = svc.inbound("sms", "050-1234567", f"קשה לי, אפשר לפרוס ל-{n} תשלומים?")
    out = svc.inbox.approve_draft(r["draft_id"])
    assert out["status"] == "sent_dry_run", out
    assert len(out["body"]) <= SMS_REPLY_MAX
    assert "/u/" in out["body"] and "₪" in out["body"]


def test_plan_offer_too_long_even_compact_goes_to_owner_without_plan():
    """critic סבב 25: אם גם הנוסח המקוצר לא נכנס ב-SMS ⇒ אין הצעה ואין הסדר, כרטיס לבעל העסק."""
    from datetime import date
    ctx = conversation.Context(today=date(2026, 11, 8), business="א" * 40, customer_name="דנה כהן",
                               invoices=(conversation.OpenInvoice("1", 123_456_77),),
                               footer_len=120)
    d = conversation.respond("קשה לי, אפשר לפרוס ל-6 תשלומים?", ctx)
    assert not d.plan and "plan_too_long_for_sms" in d.tags
    assert d.next_state == conversation.State.AWAITING_OWNER
    assert any("ידנית" in a for a in d.owner_actions) and "₪" not in (d.reply or "")


def test_invoice_without_any_date_notifies_owner_once(svc, fake_gi):
    """critic סבב 25: חשבונית בלי dueDate וגם בלי documentDate נשארה «פתוחה» לנצח — בלי תזכורת
    ובלי שום הודעה לבעל העסק (שבטוח שגבי מטפלת בה). עכשיו: התראה אחת «להשלים תאריך»."""
    for k in ("documentDate", "dueDate"):
        fake_gi.docs[0].pop(k)
    svc.sync()
    svc.plan()
    svc.plan()
    inv = svc.db.one("SELECT * FROM invoices WHERE number='1001'")
    assert svc.db.one("SELECT 1 FROM reminders WHERE invoice_id=?", (inv["id"],)) is None
    alerts = svc.db.q("SELECT * FROM messages WHERE needs_owner=1 AND intent='no_due_date'")
    assert len(alerts) == 1 and "1001" in alerts[0]["body"]
    assert inv["status"] == "open"   # לא סוגרים ולא מבטלים — רק מודיעים


def test_csv_same_phone_different_names_not_merged(svc):
    """critic סבב 26 (2.11, גרסת CSV): שתי שורות בלי מזהה לקוח, אותו טלפון ושמות שונים (רונית, משה)
    ⇒ לקוח אחד: השם של רונית נדרס ל«משה», והתזכורת המאוחדת אמרה למשה «2 חשבוניות, 700 ₪» — כולל
    החוב של רונית (חשיפת חוב לצד ג׳). עכשיו: לקוחות נפרדים + הודעה לבעל העסק. אותו שם ⇒ אותו לקוח."""
    raw = ("מספר חשבונית,לקוח,סכום,תאריך לתשלום,טלפון\n"
           "3,רונית לוי,300,2026-10-01,050-0001111\n4,משה כהן,400,2026-10-01,050-0001111\n"
           "5,משה  כהן,50,2026-10-01,050-0001111\n").encode()
    svc.import_csv(raw)
    custs = {r["name"]: r["id"] for r in svc.db.q("SELECT id,name FROM customers")}
    assert set(custs) == {"רונית לוי", "משה  כהן"} or set(custs) == {"רונית לוי", "משה כהן"}
    by = {r["number"]: r["customer_id"] for r in svc.db.q("SELECT number,customer_id FROM invoices")}
    assert by["3"] != by["4"] and by["4"] == by["5"]
    assert svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent='shared_contact'")["n"] == 1


def _shared_phone_csv(svc):
    raw = ("מספר חשבונית,לקוח,סכום,תאריך לתשלום,טלפון\n"
           "3,רונית לוי,300,2026-10-01,050-0001111\n4,משה כהן,400,2026-10-01,050-0001111\n").encode()
    svc.import_csv(raw)
    return {r["name"]: r["id"] for r in svc.db.q("SELECT id,name FROM customers")}


def test_shared_phone_reply_goes_to_customer_who_got_last_message(svc):
    """critic סבב 27: אחרי ההפרדה (סבב 26) — משה קיבל תזכורת ושאל «איך אפשר לשלם?» ⇒ טיוטה עם החוב
    של **רונית** (300 ₪, החשבונית שלה) לאותו מספר, ו«שילמתי» השהה את רונית בזמן שמשה המשיך לקבל
    תזכורות (`_find_customer` = הראשון בטבלה). עכשיו: מי שקיבל את ההודעה האחרונה למספר הזה."""
    ids = _shared_phone_csv(svc)
    svc.plan()
    rems = {r["customer_id"]: r["id"] for r in svc.db.q(
        "SELECT r.id, i.customer_id FROM reminders r JOIN invoices i ON i.id=r.invoice_id")}
    svc.approve(rems[ids["משה כהן"]], confirm_open=True)
    svc.dispatch()
    svc.inbound("sms", "050-0001111", "איך אפשר לשלם?")
    d = svc.db.one("SELECT * FROM drafts ORDER BY id DESC LIMIT 1")
    assert d["customer_id"] == ids["משה כהן"] and "300" not in d["body"]
    svc.inbound("sms", "050-0001111", "שילמתי")
    paused = {r["name"]: r["paused_reason"] for r in svc.db.q("SELECT name,paused_reason FROM customers")}
    assert paused["משה כהן"] and not paused["רונית לוי"]


def test_shared_phone_reply_without_any_outbound_is_not_attributed(svc):
    """אף אחד מהשניים לא קיבל הודעה ⇒ לא מנחשים: אין טיוטה עם חוב, כרטיס לבעל העסק."""
    _shared_phone_csv(svc)
    r = svc.inbound("sms", "050-0001111", "איך אפשר לשלם?")
    assert r["draft_id"] is None and r["intent"] == "shared_contact_ambiguous"
    assert svc.db.one("SELECT COUNT(*) n FROM drafts")["n"] == 0
    r = svc.inbound("sms", "050-0001111", "הסר")
    assert svc.suppressed("sms", "050-0001111")


def _expired_trial_then_join(svc, clock, text):
    import dataclasses
    from datetime import timedelta
    svc.s = dataclasses.replace(svc.s, trial_start=(clock.now.date() - timedelta(days=13)).isoformat())
    svc.sync()
    r = svc.inbound("sms", "050-1234567", text)
    clock.now += timedelta(days=2)                       # הניסיון נגמר
    assert svc.inbox.approve_draft(r["draft_id"])["status"] == "approved"   # מחכה (trial_expired)
    svc.s = dataclasses.replace(svc.s, trial_start="")   # הצטרף
    clock.now += timedelta(days=20)
    svc.dispatch()
    return svc.db.one("SELECT * FROM drafts WHERE id=?", (r["draft_id"],))


def test_stale_approved_reply_is_not_sent_weeks_later(svc, fake_gi, clock):
    """critic סבב 30: תשובה שאושרה אחרי סוף הניסיון חיכתה בתור, ויצאה 22 יום אחרי השאלה, כשבעל
    העסק הצטרף. «איך אפשר לשלם?» ⇒ תשובה שלושה שבועות אחר כך, על סמך אישור ישן. עכשיו: טיוטה
    שממתינה יותר מ-4 ימים מהשאלה חוזרת לאישור מחדש, ולא נשלחת."""
    d = _expired_trial_then_join(svc, clock, "איך אפשר לשלם?")
    assert d["status"] == "pending_approval" and d["sent_at"] is None
    assert "לאשר מחדש" in (d["owner_summary"] or "")


def test_stale_plan_offer_with_past_dates_is_withdrawn(svc, fake_gi, clock):
    """הצעת פריסה שאושרה וחיכתה 3 שבועות: התשלום הראשון (בעוד 7 ימים מהשאלה) כבר עבר ⇒ לא נשלחת,
    וההסדר המוצע מבוטל; כרטיס לבעל העסק."""
    d = _expired_trial_then_join(svc, clock, "אפשר לפרוס ל-3 תשלומים?")
    assert d["status"] == "rejected" and d["decided_by"] == "system:stale" and d["sent_at"] is None
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (d["plan_id"],))["status"] == "rejected"
    assert svc.db.one("SELECT 1 FROM messages WHERE intent='stale_draft' AND needs_owner=1")


def test_owner_approving_old_question_now_still_sends(svc, fake_gi, clock):
    """אישור עכשיו על שאלה מלפני 5 ימים = החלטה טרייה ⇒ נשלח (הספירה מהאישור, לא מהשאלה)."""
    from datetime import timedelta
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "איך אפשר לשלם?")
    clock.now += timedelta(days=5)
    assert svc.inbox.approve_draft(r["draft_id"])["status"] == "sent_dry_run"


def test_plan_offer_approved_after_first_due_date_is_withdrawn(svc, fake_gi, clock):
    """הצעה שהתשלום הראשון בה (שבוע מהשאלה) כבר עבר כשבעל העסק אישר ⇒ לא נשלחת."""
    from datetime import timedelta
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "אפשר לפרוס ל-3 תשלומים?")
    clock.now += timedelta(days=8)
    out = svc.inbox.approve_draft(r["draft_id"])
    assert out["status"] == "rejected" and out["decided_by"] == "system:stale"


def test_approve_plan_with_past_due_dates_is_refused(svc, fake_gi, clock):
    """critic סבב 30: גם המסלול השני (`approve_plan`) אישר הסדר שתאריך התשלום הראשון בו כבר עבר,
    ושלח ללקוח אישור עם תאריכים שחלפו. עכשיו: ההסדר מוחלף, ובעל העסק מתבקש להציע חדש."""
    from datetime import timedelta
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "אפשר לפרוס ל-3 תשלומים?")
    clock.now += timedelta(days=8)
    with pytest.raises(ValueError, match="תאריכ"):
        svc.approve_plan(r["plan_id"])
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (r["plan_id"],))["status"] == "superseded"


def test_reminder_approval_expires_after_7_days_waiting(svc, fake_gi, clock):
    """critic סבב 31: תזכורת שאושרה וחיכתה (סוף ניסיון) יצאה 22 יום אחרי האישור, ביום שבעל העסק
    הצטרף — יחד עם כל שאר התור, באותו בוקר. בינתיים הוא אולי כבר דיבר עם הלקוח. «אישור פרטני לכל
    הודעה» ⇒ אישור תקף 7 ימים מהמאוחר מבין האישור ומועד השליחה המתוכנן; אחרי זה חוזרת לאישור."""
    import dataclasses
    from datetime import timedelta
    svc.s = dataclasses.replace(svc.s, trial_start=(clock.now.date() - timedelta(days=13)).isoformat())
    svc.sync()
    rid = svc.plan()[0]
    clock.now += timedelta(days=2)              # הניסיון נגמר — מאשר בכל זאת
    svc.approve(rid)
    svc.s = dataclasses.replace(svc.s, trial_start="")
    clock.now += timedelta(days=20)
    n = len(svc.sender.sent)
    svc.dispatch()
    r = svc.db.one("SELECT status, block_reason FROM reminders WHERE id=?", (rid,))
    assert len(svc.sender.sent) == n
    assert r["status"] == "pending_approval" and r["block_reason"] == "approval_expired"
    # סבב 32: אישור מחדש עובד (זו לא חסימה קשה) ⇒ נשלחת
    svc.approve(rid)
    svc.dispatch()
    assert len(svc.sender.sent) > n
    assert svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))["status"] == "sent_dry_run"


def test_reminder_approved_in_advance_for_future_slot_still_sends(svc, fake_gi, clock):
    """אישור מראש לתזכורת שמתוכננת לעוד 10 ימים ⇒ נשלחת במועד (הספירה מהמועד, לא מהאישור)."""
    from datetime import timedelta
    svc.sync()
    rid = svc.plan()[0]
    svc.db.x("UPDATE reminders SET scheduled_for=? WHERE id=?",
             ((clock.now + timedelta(days=10)).isoformat(), rid))
    svc.approve(rid)
    clock.now += timedelta(days=10, minutes=5)
    svc.dispatch()
    assert svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))["status"] == "sent_dry_run"


def test_owner_can_mark_notice_done(api, svc):
    """critic סבב 34: לא הייתה שום דרך לסמן הודעה לבעל העסק כ«טופל» — «דורש טיפול שלך» רק הצטבר
    (סוף ניסיון, זיכוי יתום, הודעה ממספר לא מוכר...). עכשיו: POST /owner/inbox/{id}/done ⇒ יורד מהרשימה,
    נרשם ב-audit, ולא נוצר מחדש (הדה-דופ לפי message_id לא תלוי ב-needs_owner)."""
    svc.inbound("sms", "054-7777777", "מי אתם?")
    mid = api.get("/owner/inbox").json()[0]["id"]
    r = api.post(f"/owner/inbox/{mid}/done")
    assert r.status_code == 200
    assert all(m["id"] != mid for m in api.get("/owner/inbox").json())
    assert any(a["action"] == "owner_message_done" for a in api.get("/audit").json())
    assert api.post(f"/owner/inbox/{mid}/done").status_code == 404     # כבר טופל
    assert api.post("/owner/inbox/999999/done").status_code == 404


def test_crash_after_send_does_not_resend(svc, fake_gi, clock):
    """critic סבב 39: dispatch שולח ורק אחר כך מסמן «נשלח». נפילה ביניהם (שגיאה לא צפויה במייל אחרי
    שה-SMS כבר יצא, או קריסת תהליך) השאירה את התזכורת `approved` ⇒ הסבב הבא שלח **שוב** את ה-SMS.
    וגם שתי ריצות dispatch במקביל בחרו את אותן שורות. עכשיו: תפיסה אטומית (approved ⇒ sending) לפני
    השליחה; תקועה ב-sending ⇒ לא נשלחת שוב, מסומנת send_unknown והודעה לבעל העסק."""
    from datetime import timedelta
    svc.sync()
    rid = svc.plan()[0]
    svc.approve(rid)
    orig = svc.sender.send
    calls = {"n": 0}

    def flaky(msg):
        calls["n"] += 1
        if calls["n"] == 2:                      # ה-SMS יצא; המייל נופל בשגיאה לא צפויה
            raise RuntimeError("boom")
        return orig(msg)
    svc.sender.send = flaky
    with pytest.raises(RuntimeError):
        svc.dispatch()
    svc.sender.send = orig
    n_sent = len(svc.sender.sent)
    clock.now += timedelta(hours=2)
    svc.dispatch()
    assert len(svc.sender.sent) == n_sent        # לא נשלח שוב
    r = svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))
    assert r["status"] == "send_unknown"
    assert svc.db.one("SELECT 1 FROM messages WHERE intent='send_unknown' AND needs_owner=1")
    cid = svc.db.one("SELECT i.customer_id FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                     "WHERE r.id=?", (rid,))["customer_id"]
    assert len(svc.episode_sent(cid)) == 1      # נספרת לתקרת 3 (אולי יצאה)


def test_claim_prevents_concurrent_double_send(svc, fake_gi):
    """שתי ריצות במקביל: השנייה רואה את התזכורת כבר תפוסה ולא שולחת."""
    svc.sync()
    rid = svc.plan()[0]
    svc.approve(rid)
    assert svc._claim_reminder(rid) is True
    assert svc._claim_reminder(rid) is False
    assert svc.plan() == []                      # בזמן sending לא נבנית תזכורת נוספת ללקוח
    assert svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))["status"] == "sending"


def test_draft_crash_after_send_does_not_resend(svc, fake_gi, clock, monkeypatch):
    """critic סבב 40: אותו דפוס של 39.1 בטיוטות שיחה. _try_send שולח ואז מסמן; נפילה ביניהם (למשל ה-log
    נכשל) השאירה `approved` ⇒ flush של ה-cron שלח **שוב**. וגם: אישור של בעל העסק (בקשת HTTP) בדיוק
    כשה-cron מריץ flush ⇒ שתי שליחות. עכשיו: תפיסה אטומית; נתקעה ⇒ send_unknown בלי שליחה חוזרת."""
    from datetime import timedelta
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "איך אפשר לשלם?")
    orig = svc._log_out

    def boom(*a, **k):
        raise RuntimeError("disk full")
    monkeypatch.setattr(svc, "_log_out", boom)
    with pytest.raises(RuntimeError):
        svc.inbox.approve_draft(r["draft_id"])
    monkeypatch.setattr(svc, "_log_out", orig)
    n = len(svc.sender.sent)
    clock.now += timedelta(hours=2)
    svc.dispatch()                               # flush של ה-cron
    assert len(svc.sender.sent) == n
    d = svc.db.one("SELECT status FROM drafts WHERE id=?", (r["draft_id"],))
    assert d["status"] == "send_unknown"
    assert svc.db.one("SELECT 1 FROM messages WHERE intent='send_unknown' AND needs_owner=1")


def test_draft_claim_is_exclusive(svc, fake_gi):
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "איך אפשר לשלם?")
    svc.db.x("UPDATE drafts SET status='approved' WHERE id=?", (r["draft_id"],))
    assert svc.inbox._claim_draft(r["draft_id"]) is True
    assert svc.inbox._claim_draft(r["draft_id"]) is False
    assert svc.inbox.flush() == []               # ה-cron לא שולח טיוטה שתפוסה


def test_concurrent_approve_plan_sends_once(svc, fake_gi):
    """critic סבב 40: שני approve_plan במקביל (לחיצה כפולה / שתי לשוניות) עברו שניהם את `status=='proposed'`
    לפני שמישהו עדכן ⇒ שתי טיוטות ⇒ **שני אישורי הסדר** ללקוח. עכשיו: תפיסה אטומית proposed ⇒ approving."""
    import threading
    svc.sync()
    r = svc.inbound("sms", "050-1234567", "אפשר לפרוס ל-3 תשלומים?")
    bar = threading.Barrier(2, timeout=1.5)
    orig = svc.refresh_customer

    def slow(cid):
        try:
            bar.wait()                           # שני ה-threads נפגשים כאן (אם שניהם הגיעו)
        except threading.BrokenBarrierError:
            pass
        return orig(cid)
    svc.refresh_customer = slow
    n0 = len(svc.sender.sent)
    errs = []

    def go():
        try:
            svc.approve_plan(r["plan_id"])
        except ValueError as e:
            errs.append(str(e))
    ts = [threading.Thread(target=go) for _ in range(2)]
    for t in ts:
        t.start()
    for t in ts:
        t.join()
    assert len(svc.sender.sent) - n0 == 1, svc.sender.sent[n0:]
    assert len(errs) == 1

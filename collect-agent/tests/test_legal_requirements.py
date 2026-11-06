"""מיפוי 14 הדרישות המשפטיות (team/legal.md §7) לבדיקות.

כל דרישה = בדיקה אחת לפחות, בשם test_r<N>_...
• בדיקה רגילה  = הדרישה נאכפת היום בקוד.
• xfail(strict) = פער ידוע. כשמישהו יממש את הדרישה, הבדיקה תתחיל לעבור ⇒ strict יפיל
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

APP_DIR = Path(__file__).resolve().parents[1] / "app"
LONG_LINK = "https://pay.greeninvoice.co.il/f/aB3dE5gH7jK9mN1pQ3sT5vW7"
LONG_UNSUB = "https://gabi.example/u/Zx9Yw8Vu7Ts6"


@pytest.fixture
def api(svc):
    return TestClient(create_app(svc))


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
    rules = compliance.Rules(business="סטודיו מאיר", payment_link=link or "")
    bad = {b: compliance.violations(b, rules) for b in bodies}
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
@pytest.mark.xfail(strict=True, reason="ר-4: dispatch שולח את ה-payload שנבנה ב-plan; "
                   "אין ריענון של החשבונית מ-GI לפני שליחה")
def test_r4_amount_change_after_plan_is_not_sent_stale(api, svc, fake_gi):
    api.post("/sync")
    ids = api.post("/plan").json()["created"]
    fake_gi.docs[0]["amount"] = "700.00"   # תשלום חלקי אחרי שהתזכורת נבנתה
    for i in ids:
        api.post(f"/reminders/{i}/approve")
    api.post("/dispatch")
    sms = [m for m in svc.sender.sent if m["channel"] == "sms" and m["to"] == "972501234567"]
    assert sms and "1,200" not in sms[0]["body"]


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


# ───────────── ר-6 · חדלות פירעון / נפטר / קטין ─────────────
@pytest.mark.xfail(strict=True, reason="ר-6: אין עמודות insolvency/deceased/minor")
def test_r6_block_flags_exist():
    from app.db import DB
    cols = {r["name"] for r in DB(":memory:").q("PRAGMA table_info(customers)")}
    assert {"insolvency", "deceased", "minor"} <= cols


# ───────────── ר-7 · חשבונית ישנה (>3 שנים) ⇒ אישור ידני ─────────────
@pytest.mark.xfail(strict=True, reason="ר-7: אין בדיקת גיל חשבונית ב-plan")
def test_r7_old_invoice_requires_approval(api, svc, fake_gi):
    fake_gi.docs[:] = fake_gi.docs[:2]
    fake_gi.docs[0]["documentDate"] = "2022-01-01"
    fake_gi.docs[0]["dueDate"] = "2022-02-01"
    _cycle(api, approve_all=True)            # מאשרים ראשונה ⇒ approved_first
    from datetime import timedelta as td
    svc.clock.now += td(days=8)
    api.post("/sync")
    api.post("/plan")
    r = svc.db.one("SELECT status FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                   "WHERE i.number='1001' ORDER BY r.id DESC LIMIT 1")
    assert r["status"] == "pending_approval"


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


# ───────────── ר-10 · שמירה ומחיקה ─────────────
@pytest.mark.xfail(strict=True, reason="ר-10: אין מנגנון מחיקה/שמירה (retention) "
                   "ואין רשימת הסרה מגובבת")
def test_r10_retention_purge_exists(svc):
    assert hasattr(svc, "purge_closed_account")


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


@pytest.mark.xfail(strict=True, reason="ר-12: לא נשמרת גרסת הנוסח שאושרה")
def test_r12_template_version_recorded(svc):
    from app.db import DB
    cols = {r["name"] for r in DB(":memory:").q("PRAGMA table_info(reminders)")}
    assert "template_version" in cols


# ───────────── ר-13 · עמוד הסרה/מידע ללקוח סופי ─────────────
def test_r13_unsubscribe_page_rtl_and_works(api, svc):
    _cycle(api)
    tok = svc.db.one("SELECT unsub_token FROM customers WHERE name='דנה כהן'")["unsub_token"]
    page = api.get(f"/u/{tok}").text
    assert 'dir="rtl"' in page and 'lang="he"' in page and "הוסרתם" in page


@pytest.mark.xfail(strict=True, reason="ר-13: עמוד ההסרה לא מציג שם עסק / למה קיבלתי / "
                   "קישור מדיניות פרטיות")
def test_r13_landing_explains_who_and_privacy(api, svc):
    _cycle(api)
    tok = svc.db.one("SELECT unsub_token FROM customers WHERE name='דנה כהן'")["unsub_token"]
    page = api.get(f"/u/{tok}").text
    assert "סטודיו מאיר" in page and "פרטיות" in page


# ───────────── ר-14 · אין החזקת כסף ─────────────
def test_r14_no_money_handling_code():
    src = "\n".join(p.read_text(encoding="utf-8") for p in APP_DIR.glob("*.py"))
    for forbidden in (r"card_?number", r"\bcvv\b", r"stripe\.", r"/charges?\b", r"payout",
                      r"transfer_funds"):
        assert not re.search(forbidden, src, re.I), forbidden

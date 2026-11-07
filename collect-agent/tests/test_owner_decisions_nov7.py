"""רגרסיה לשלוש הכרעות מאיר (7.11.2026) — team/critic.md 15.1/2.12, 3.6.5, 3.6.6.

1. תזכורת מאוחדת ללקוח: לקוח עם כמה חשבוניות פתוחות מקבל הודעה **אחת** בכל שלב (סה״כ + מספרים,
   או כמה + סה״כ כשהרשימה ארוכה), וסולם 3 התזכורות נספר ללקוח לאפיזודת חוב. לפני: 5 חשבוניות = 15 SMS.
2. מותגים/בנקים/רשויות חסומים בניסוח; שם העסק המדויק מותר; שם עסק/שולח עם צירוף בנק — נחסם בהגדרות.
3. ימי שקט: תשעה באב, יום הזיכרון, יום השואה — עם הדחיות, מול לוח עברי מחושב בבדיקה (עצמאי).
"""
from __future__ import annotations

import json
from datetime import date, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app import compliance, templates
from app.config import load_settings
from app.db import DB
from app.main import create_app
from app.policy import HOLIDAYS_VALID_UNTIL, MAX_REMINDERS_PER_INVOICE, QUIET_DAYS, TZ, Policy
from app.service import CollectService
from app.settings_api import SettingsIn
from tests.conftest import AUTH, OWNER_TOKEN, gi_doc

PHONE = "972501234567"


def _docs(fake_gi, *docs):
    fake_gi.docs = list(docs)


def _run(svc, clock, days: int) -> list[dict]:
    """סבב יומי: תכנון ⇒ אישור בעל העסק לכל טיוטה ⇒ שליחה. מחזיר את מה שיצא."""
    out = []
    for _ in range(days):
        svc.plan()
        for r in svc.db.q("SELECT id FROM reminders WHERE status='pending_approval'"):
            try:
                svc.approve(r["id"])
            except ValueError:
                pass
        out += svc.dispatch()
        clock.now += timedelta(days=1)
    return out


def _sms_to(svc, to=PHONE) -> list[str]:
    return [m["body"] for m in svc.sender.sent if m["channel"] == "sms" and m["to"] == to]


def _one(n: int, due="2026-11-01", amount="1200.00", **kw):
    return gi_doc(n, client_id="A", due=due, amount=amount, **kw)


# ═════════════════════════ 1 · תזכורת מאוחדת ללקוח (15.1 / 2.12) ═════════════════════════
def test_five_invoices_three_messages_not_fifteen(svc, fake_gi, clock):
    """critic 15.1 שוחזר: 5 חשבוניות פתוחות ⇒ 15 SMS ב-49 יום. עכשיו: 3 לכל היותר, כל אחת על כולן."""
    _docs(fake_gi, *[_one(i) for i in range(1, 6)])
    svc.sync()
    sent = _run(svc, clock, 60)
    sms = _sms_to(svc)
    assert len(sent) == MAX_REMINDERS_PER_INVOICE == 3, sent
    assert len(sms) == 3
    for body in sms:
        assert "5 חשבוניות" in body or all(str(1000 + i) in body for i in range(1, 6)), body
        assert "6,000 ₪" in body                       # הסה״כ, לא חשבונית בודדת
        assert compliance.sms_segments(body) <= 2       # יעד עלות: ≤2 חלקים
    # סולם הנוסחים נשמר: ידידותית ⇒ פריסה ⇒ אחרונה
    keys = [r["template_key"] for r in svc.db.q(
        "SELECT template_key FROM reminders WHERE status LIKE 'sent%' ORDER BY sent_at")]
    assert keys == ["friendly", "plan_offer", "final"]
    notes = svc.db.q("SELECT body FROM messages WHERE intent='max_reminders'")
    assert len(notes) == 1 and "5 חשבוניות" in notes[0]["body"]


def test_two_invoices_numbers_and_total_in_sms(svc, fake_gi, clock):
    _docs(fake_gi, _one(1, amount="1200.00"), _one(2, amount="350.50", due="2026-11-03"))
    svc.sync()
    [rid] = svc.plan()
    assert svc.reminder_invoice_ids(rid) == [
        svc.db.one("SELECT id FROM invoices WHERE number='1001'")["id"],
        svc.db.one("SELECT id FROM invoices WHERE number='1002'")["id"]]
    r = svc.db.one("SELECT * FROM reminders WHERE id=?", (rid,))
    sms = next(m for m in json.loads(r["payload"]) if m["channel"] == "sms")["body"]
    assert "1001, 1002" in sms and "1,550.50 ₪" in sms and len(sms) <= templates.SMS_TARGET
    assert r["amount_agorot"] == 155050
    mail = next(m for m in json.loads(r["payload"]) if m["channel"] == "email")
    assert "1001" in mail["body"] and "1002" in mail["body"] and "350.50 ₪" in mail["body"]
    # אישור בעל העסק נשאר פר-הודעה: רשומה אחת, אישור אחד ⇒ SMS אחד ומייל אחד
    assert svc.db.one("SELECT COUNT(*) n FROM reminders")["n"] == 1
    svc.approve(rid)
    svc.dispatch()
    assert len(_sms_to(svc)) == 1
    assert sum(m["channel"] == "email" for m in svc.sender.sent) == 1


@pytest.mark.parametrize("two_way", [False, True])
@pytest.mark.parametrize("step", templates.STEPS_MULTI, ids=lambda s: s.key)
def test_many_invoices_sms_shows_count_and_total_within_two_segments(step, two_way):
    """הרבה חשבוניות ⇒ «N חשבוניות (סה״כ …)» והקישור מוביל לפירוט. ≤2 חלקים גם בערכים גרועים."""
    invs = [(str(10230 + i), 9_999_999 // 40) for i in range(40)]
    f = templates.fields_multi(biz="סטודיו מאיר", name="אלכסנדרה", invoices=invs, currency="ILS",
                               link="x", unsub="u", short="https://gabi.co.il/p/Ab3dE9x",
                               two_way=two_way)
    sms = templates.render_sms(step, f)
    assert "40 חשבוניות" in sms and "10231" not in sms and len(sms) <= templates.SMS_TARGET, sms
    assert compliance.violations(sms, compliance.Rules(
        business="סטודיו מאיר", payment_link="https://gabi.co.il/p/Ab3dE9x",
        max_sms_chars=templates.SMS_HARD_MAX, allow_debt_word=step.key != "friendly")) == []
    two = templates.fields_multi(biz="סטודיו מאיר", name="דנה", invoices=[("1001", 120000),
                                                                        ("1002", 35000)],
                                 currency="ILS", link="x", unsub="u",
                                 short="https://gabi.co.il/p/Ab3dE9x", two_way=two_way)
    assert "1001, 1002" in templates.render_sms(step, two)   # רשימה קצרה ⇒ המספרים עצמם


def test_single_invoice_wording_unchanged(svc, fake_gi):
    """חשבונית אחת ⇒ הנוסח הרגיל, אות-באות (בלי «חשבוניות»/«סה״כ»)."""
    _docs(fake_gi, _one(1))
    svc.sync()
    [rid] = svc.plan()
    body = svc.db.one("SELECT body FROM reminders WHERE id=?", (rid,))["body"]
    assert body.startswith("סטודיו מאיר: שלום דנה, חשבונית 1001 ע\"ס 1,200 ₪ טרם סומנה כשולמה.")


def test_new_invoice_joins_next_step_not_restart(svc, fake_gi, clock):
    """הכלל: חשבונית שנוספה באמצע אפיזודה מצטרפת לשלב הבא (לא מתחילה מ-1), ו-3 = סוף ללקוח."""
    _docs(fake_gi, _one(1))
    svc.sync()
    assert len(_run(svc, clock, 2)) == 1                   # ידידותית על 1001
    fake_gi.docs.append(_one(2, due=(clock.now.date() - timedelta(days=2)).isoformat()))
    svc.sync()
    sent = _run(svc, clock, 40)
    assert len(sent) == 2                                   # עוד 2 בלבד (סה״כ 3), לא 3 חדשות
    rows = svc.db.q("SELECT id, template_key FROM reminders WHERE status LIKE 'sent%' "
                    "ORDER BY sent_at")
    assert [r["template_key"] for r in rows] == ["friendly", "plan_offer", "final"]
    assert len(svc.reminder_invoice_ids(rows[1]["id"])) == 2  # החדשה בפנים משלב 2
    assert len(_sms_to(svc)) == 3


def test_episode_continues_when_the_old_invoice_is_paid(svc, fake_gi, clock):
    """1001 קיבלה ידידותית, 1002 נוספה, ו-1001 שולמה ⇒ 1002 ממשיכה מהשלב הבא (אותה אפיזודה)."""
    _docs(fake_gi, _one(1))
    svc.sync()
    _run(svc, clock, 2)
    fake_gi.docs.append(_one(2, due=clock.now.date().isoformat()))
    svc.sync()
    svc.plan()                                    # האפיזודה רצה: יש חוב פתוח לאורך כל הדרך
    fake_gi.docs[0]["status"] = 1                 # 1001 שולמה
    svc.sync()
    _run(svc, clock, 40)
    keys = [r["template_key"] for r in svc.db.q(
        "SELECT template_key FROM reminders WHERE status LIKE 'sent%' ORDER BY sent_at")]
    assert keys == ["friendly", "plan_offer", "final"], keys


def test_new_episode_after_all_debt_closed(svc, fake_gi, clock):
    """כל החוב נסגר (ונצפה בסבב תכנון) ⇒ אפיזודה חדשה: חשבונית חדשה מתחילה בידידותית."""
    _docs(fake_gi, _one(1))
    svc.sync()
    _run(svc, clock, 40)
    assert len(_sms_to(svc)) == 3
    fake_gi.docs[0]["status"] = 1
    svc.sync()
    svc.plan()
    assert svc.db.one("SELECT episode_since FROM customers")["episode_since"] is None
    fake_gi.docs.append(_one(2, due=clock.now.date().isoformat()))
    svc.sync()
    _run(svc, clock, 3)
    last = svc.db.one("SELECT template_key FROM reminders WHERE status LIKE 'sent%' "
                      "ORDER BY id DESC LIMIT 1")
    assert last["template_key"] == "friendly" and len(_sms_to(svc)) == 4


def test_legacy_per_invoice_reminders_count_toward_the_customer(tmp_path, fake_gi, gi_client, clock):
    """נתונים מלפני האיחוד: 2 חשבוניות × 2 תזכורות שנשלחו = 4 ≥ 3 ⇒ אין עוד תזכורת (שמרני)."""
    path = str(tmp_path / "g.db")
    s = load_settings({"BUSINESS_NAME": "סטודיו מאיר", "PAYMENT_LINK":
                       "https://www.greeninvoice.co.il/pay/studio", "PUBLIC_BASE_URL":
                       "https://gabi.example", "EMAIL_REPLY_TO": "owner@studio.example",
                       "REAL_DATA_ALLOWED": "1"})
    _docs(fake_gi, _one(1), _one(2))
    svc = CollectService(s, DB(path), gi=gi_client, clock=clock)
    svc.sync()
    for iid in (r["id"] for r in svc.db.q("SELECT id FROM invoices")):
        for step in (0, 1):
            svc.db.x("INSERT INTO reminders(invoice_id,step,template_key,scheduled_for,status,"
                     "requires_approval,body,payload,sent_at) VALUES(?,?,?,?, 'sent_dry_run', 1, "
                     "'', '[]', ?)", (iid, step, templates.STEPS[step].key,
                                      (clock.now - timedelta(days=20)).isoformat(),
                                      (clock.now - timedelta(days=20 - step)).isoformat()))
    svc.db.x("DELETE FROM reminder_invoices")
    svc2 = CollectService(s, DB(path), gi=gi_client, clock=clock)   # המיגרציה מקשרת
    assert svc2.db.one("SELECT COUNT(*) n FROM reminder_invoices")["n"] == 4
    assert svc2.plan() == []
    assert svc2.db.one("SELECT COUNT(*) n FROM messages WHERE intent='max_reminders'")["n"] == 1


def test_partial_close_rebuilds_and_returns_to_approval(svc, fake_gi, clock):
    """ר-4 על הודעה מאוחדת: 1002 נסגרה בין האישור לשליחה ⇒ נבנית מחדש על 1001 בלבד, לאישור מחדש."""
    _docs(fake_gi, _one(1), _one(2, amount="300.00"))
    svc.sync()
    [rid] = svc.plan()
    svc.approve(rid)
    fake_gi.docs[1]["status"] = 1
    assert svc.dispatch() == []
    r = svc.db.one("SELECT * FROM reminders WHERE id=?", (rid,))
    assert r["status"] == "pending_approval" and r["block_reason"] == "amount_changed"
    assert r["amount_agorot"] == 120000 and "1002" not in r["body"] and "1001" in r["body"]
    assert len(svc.reminder_invoice_ids(rid)) == 1
    svc.approve(rid)
    assert len(svc.dispatch()) == 1


def test_non_anchor_amount_change_refreshed_before_send(svc, fake_gi):
    """ר-4: כל חשבונית בהודעה מרועננת מהמקור, לא רק העוגן — יתרה של 1002 ירדה ⇒ סה״כ חדש, לאישור."""
    _docs(fake_gi, _one(1), _one(2, amount="300.00"))
    svc.sync()
    [rid] = svc.plan()
    svc.approve(rid)
    fake_gi.docs[1]["amount"] = "100.00"
    assert svc.dispatch() == []
    r = svc.db.one("SELECT * FROM reminders WHERE id=?", (rid,))
    assert r["status"] == "pending_approval" and r["amount_agorot"] == 130000
    assert "1,300 ₪" in r["body"]


def test_anchor_closed_cancels_then_replans_remaining_same_step(svc, fake_gi, clock):
    _docs(fake_gi, _one(1), _one(2, due="2026-11-02"))
    svc.sync()
    [rid] = svc.plan()
    svc.approve(rid)
    fake_gi.docs[0]["status"] = 1                 # העוגן (הוותיקה) שולמה
    assert svc.dispatch() == []
    assert svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))["status"] == "cancelled"
    [rid2] = svc.plan()
    r2 = svc.db.one("SELECT * FROM reminders WHERE id=?", (rid2,))
    assert r2["step"] == 0 and "1002" in r2["body"] and "1001" not in r2["body"]


def test_closing_any_included_invoice_cancels_the_merged_draft(svc, fake_gi):
    _docs(fake_gi, _one(1), _one(2))
    svc.sync()
    [rid] = svc.plan()
    iid = svc.reminder_invoice_ids(rid)[1]          # לא העוגן
    svc._cancel_invoice(iid, "invoice_closed")
    assert svc.db.one("SELECT status FROM reminders WHERE id=?", (rid,))["status"] == "cancelled"


def test_payer_page_lists_all_included_invoices(svc, fake_gi, clock):
    """/pay/{code} ו-/p/{code} של הודעה מאוחדת: כל החשבוניות + סה״כ; כל אחת ניתנת לתשלום; פריסה על הסה״כ."""
    _docs(fake_gi, _one(1), _one(2, amount="300.00"), _one(3, amount="50.00"))
    svc.sync()
    [rid] = svc.plan()
    lead = svc.db.one("SELECT i.* FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                      "WHERE r.id=?", (rid,))
    code = lead["short_code"]
    v = svc.payer_view(code)
    assert [i["number"] for i in v["invoices"]] == ["1001", "1002", "1003"]
    assert v["total_agorot"] == 155000 and v["count"] == 3 and v["open"]
    for i in v["invoices"]:
        assert i["can_pay"] and svc.payer_go(i["code"], "page").startswith("https://")
    # פריסה מהעמוד = על כלל החוב (plans.invoice_ids) — עקבי עם האיחוד
    svc.landing_action(code, "plan", 3)
    p = svc.db.one("SELECT * FROM plans ORDER BY id DESC LIMIT 1")
    assert p is not None and len(json.loads(p["invoice_ids"])) == 3
    assert sum(i["amount_agorot"] for i in json.loads(p["installments"])) == 155000


def test_payer_page_via_http(svc, fake_gi):
    """אותו דבר דרך ה-API (מסך /reminders עם invoice_ids, ועמודי החייב הציבוריים)."""
    c = TestClient(create_app(svc, owner_token=OWNER_TOKEN))
    _docs(fake_gi, _one(1), _one(2, amount="300.00"))
    c.post("/sync", headers=AUTH)
    [rid] = c.post("/plan", headers=AUTH).json()["created"]
    rem = next(r for r in c.get("/reminders", headers=AUTH).json() if r["id"] == rid)
    assert len(rem["invoice_ids"]) == 2
    code = svc.db.one("SELECT short_code FROM invoices WHERE id=?", (rem["invoice_id"],))[0]
    v = c.get(f"/api/pay/{code}").json()              # ציבורי — בלי טוקן
    assert v["count"] == 2 and v["total"] == "1,500 ₪"
    assert [i["number"] for i in v["invoices"]] == ["1001", "1002"]
    page = c.get(f"/p/{code}").text
    assert "1001" in page and "1002" in page and "1,500 ₪" in page and "2 חשבוניות" in page
    other = v["invoices"][1]["code"]
    assert c.get(f"/pay/{other}/go", follow_redirects=False).status_code == 302
    d = c.get("/dashboard", headers=AUTH).json()
    assert all(r["last_reminder"]["id"] == rid for r in d["invoices"] if r["status"] == "open")


# ═════════════════════════ 2 · מותגים/בנקים/רשויות (3.6.5) ═════════════════════════
BIZ = "סטודיו מאיר"


@pytest.mark.parametrize("text", [
    "שלום מבנק לאומי", "לבנק הפועלים", "בנק דיסקונט", "מזרחי טפחות", "מזרחי-טפחות",
    "הבנק הבינלאומי", "בנק מרכנתיל", "מרכנתיל", "בנק ירושלים", "בנק יהב", "בנק מסד", "אוצר החייל",
    "בנק פאג\"י", "פאג״י", "וואן זירו", "One Zero", "Bank Hapoalim", "Leumi", "Discount Bank",
    "Mizrahi Tefahot", "אפשר לשלם בביט", "ביט", "Bit", "PayBox", "פייבוקס", "Pepper", "בנק פפר",
    "רשות המסים", "רשות המיסים", "לשכת ההוצאה לפועל", "הוצאה לפועל", "משטרה", "משטרת ישראל",
    "בית משפט", "בית הדין", "בית דין רבני",
])
def test_brand_and_authority_names_blocked(text):
    assert compliance.violations(f"{BIZ}: {text}", compliance.Rules(business=BIZ)), text


@pytest.mark.parametrize("text", [
    "ירושלים רחוב יפו 1", "שלום דנה מזרחי", "שלום רונית פפר", "ביטוח לאומי", "הביט בחשבונית",
    "מביט קדימה", "בנקאות", "תודה רבה", "הבנק שלך",
])
def test_common_words_not_false_positives(text):
    """שמרנות מול חיובי-שווא: עיר בכתובת, שם משפחה של לקוח, «ביטוח לאומי», פעלים."""
    assert compliance.violations(f"{BIZ}: {text}", compliance.Rules(business=BIZ)) == [], text


@pytest.mark.parametrize("biz", ["Pepper Grill", "ביט סטודיו", "מאפיית ירושלים"])
def test_exact_business_name_allowed_even_with_listed_word(biz):
    rules = compliance.Rules(business=biz)
    assert compliance.violations(f"{biz}: שלום דנה", rules) == []
    assert compliance.violations(f"{biz}: שלמו בביט או ב-PayBox", rules)   # רק השם עצמו פטור
    # במייל (business="" ⇒ השם בנושא): הפטור עובר ב-own_name
    assert compliance.violations(f"שלום\n\nבברכה,\n{biz}", compliance.Rules(
        business="", channel="email", subject=f"תזכורת מ-{biz}", own_name=biz)) == []


def test_business_name_with_bank_phrase_rejected_in_settings():
    """critic 3.6.5: «בנק לאומי - מחלקת גבייה» היה מותר כשם עסק ⇒ התחזות בכל SMS."""
    with pytest.raises(ValueError):
        SettingsIn(business_name="בנק לאומי - מחלקת גבייה")
    with pytest.raises(ValueError):
        SettingsIn(business_name="רשות המסים - גבייה")
    assert SettingsIn(business_name="Pepper Grill").business_name == "Pepper Grill"


@pytest.mark.parametrize("sender", ["BankLeumi", "Hapoalim", "PayBox", "Bit", "Pepper"])
def test_sender_id_brand_rejected(sender):
    with pytest.raises(ValueError):
        SettingsIn(sms_sender_id=sender)


def test_sender_id_ordinary_allowed():
    assert SettingsIn(sms_sender_id="StudioMeir").sms_sender_id == "StudioMeir"
    assert SettingsIn(sms_sender_id="Orbit").sms_sender_id == "Orbit"


def test_reminder_with_brand_business_name_not_blocked(fake_gi, gi_client, clock):
    """אינטגרציה: עסק בשם «Pepper Grill» ⇒ התזכורת לא נחסמת במסנן (גם SMS וגם מייל)."""
    s = load_settings({"BUSINESS_NAME": "Pepper Grill", "PAYMENT_LINK":
                       "https://www.greeninvoice.co.il/pay/studio", "PUBLIC_BASE_URL":
                       "https://gabi.example", "EMAIL_REPLY_TO": "owner@studio.example",
                       "REAL_DATA_ALLOWED": "1"})
    _docs(fake_gi, _one(1))
    svc = CollectService(s, DB(":memory:"), gi=gi_client, clock=clock)
    svc.sync()
    [rid] = svc.plan()
    r = svc.db.one("SELECT block_reason, payload FROM reminders WHERE id=?", (rid,))
    assert r["block_reason"] is None and len(json.loads(r["payload"])) == 2


def test_conversation_reply_with_bank_name_blocked():
    """כל טקסט יוצא בשיחה (כולל טיוטה שבעל העסק ערך) עובר אותו מסנן ⇒ «בנק לאומי» נחסם."""
    from app.conversation import Context, Intent, check_reply
    ctx = Context(today=date(2026, 11, 8), business=BIZ)
    assert "brand_bank" in check_reply(f"{BIZ}: אפשר להעביר לבנק לאומי", ctx, Intent.UNKNOWN)
    assert "brand_bank" not in check_reply(f"{BIZ}: תודה רבה", ctx, Intent.UNKNOWN)


# ═════════════════════════ 3 · ימי שקט (3.6.6) ═════════════════════════
# לוח עברי עצמאי (Reingold & Dershowitz) — לא תלוי בטבלה ולא בספריה חיצונית
_EPOCH = -1373427


def _leap(y):
    return (7 * y + 1) % 19 < 7


def _elapsed(y):
    m = (235 * y - 234) // 19
    d = 29 * m + (12084 + 13753 * m) // 25920
    return d + 1 if (3 * (d + 1)) % 7 < 3 else d


def _new_year(y):
    corr = 2 if _elapsed(y + 1) - _elapsed(y) == 356 else 1 if _elapsed(y) - _elapsed(y - 1) == 382 else 0
    return _EPOCH + _elapsed(y) + corr


def _mlen(y, m):
    ylen = _new_year(y + 1) - _new_year(y)
    if m in (2, 4, 6, 10, 13) or (m == 12 and not _leap(y)) or (m == 8 and ylen % 10 != 5) \
            or (m == 9 and ylen % 10 == 3):
        return 29
    return 30


def heb_to_greg(y, m, d) -> date:
    f = _new_year(y) + d - 1
    last = 13 if _leap(y) else 12
    if m < 7:
        f += sum(_mlen(y, k) for k in range(7, last + 1)) + sum(_mlen(y, k) for k in range(1, m))
    else:
        f += sum(_mlen(y, k) for k in range(7, m))
    return date.fromordinal(f)


def quiet_days(y) -> dict[str, str]:
    """weekday(): שני=0 … ראשון=6. ניסן=1, אייר=2, אב=5."""
    av = heb_to_greg(y, 5, 9)
    if av.weekday() == 5:                       # שבת ⇒ נדחה לראשון
        av += timedelta(days=1)
    sh = heb_to_greg(y, 1, 27)
    sh += timedelta(days={4: -1, 6: 1}.get(sh.weekday(), 0))          # שישי⇒חמישי · ראשון⇒שני
    zk = heb_to_greg(y, 2, 4)
    zk += timedelta(days={3: -1, 4: -2, 6: 1}.get(zk.weekday(), 0))   # חמישי/שישי⇒רביעי · ראשון⇒שני
    return {sh.isoformat(): "יום השואה", zk.isoformat(): "יום הזיכרון", av.isoformat(): "תשעה באב"}


def test_hebrew_calculator_matches_existing_holiday_table():
    assert heb_to_greg(5787, 7, 10) == date(2026, 9, 21)     # יום כיפור
    assert heb_to_greg(5789, 1, 15) == date(2029, 3, 31)     # פסח


def test_quiet_days_match_hebrew_calendar_for_whole_table():
    want = {}
    for y in (5787, 5788, 5789):
        want |= {k: v for k, v in quiet_days(y).items()
                 if date.fromisoformat(k) <= HOLIDAYS_VALID_UNTIL}
    assert QUIET_DAYS == want


@pytest.mark.parametrize("iso,name", [
    ("2027-08-12", "תשעה באב"),        # חמישי, רגיל
    ("2029-07-22", "תשעה באב"),        # ט׳ באב בשבת 21.7 ⇒ נדחה לראשון
    ("2027-05-11", "יום הזיכרון"),
    ("2028-05-01", "יום הזיכרון"),     # ד׳ באייר בראשון 30.4 ⇒ שני
    ("2029-04-18", "יום הזיכרון"),     # ד׳ באייר בחמישי 19.4 ⇒ רביעי
    ("2027-05-04", "יום השואה"),
    ("2028-04-24", "יום השואה"),       # כ״ז בניסן בראשון 23.4 ⇒ שני
])
def test_quiet_day_blocks_all_day_with_reason(iso, name):
    d = date.fromisoformat(iso)
    for h in (8, 10, 15):
        when = datetime(d.year, d.month, d.day, h, tzinfo=TZ)
        assert not Policy().can_send_at(when)
        assert Policy().reason_closed(when) == f"יום שקט ({name})"


@pytest.mark.parametrize("iso", ["2029-07-21", "2028-04-30", "2029-04-19", "2028-04-23"])
def test_shifted_original_dates_follow_the_law(iso):
    """התאריך העברי המקורי שנדחה אינו יום שקט בעצמו (שבת נשארת שבת)."""
    assert iso not in QUIET_DAYS


def test_eve_of_quiet_day_short_window_and_next_allowed():
    p = Policy()
    assert p.can_send_at(datetime(2027, 8, 11, 10, tzinfo=TZ))         # ערב תשעה באב, בוקר
    assert not p.can_send_at(datetime(2027, 8, 11, 13, tzinfo=TZ))     # אחה״צ — הצום נכנס בערב
    nxt = p.next_allowed(datetime(2027, 8, 11, 13, tzinfo=TZ))
    assert nxt == datetime(2027, 8, 13, 8, tzinfo=TZ)                  # שישי 08:00
    assert p.next_allowed(datetime(2029, 7, 20, 13, tzinfo=TZ)) == datetime(2029, 7, 23, 8, tzinfo=TZ)


def test_quiet_day_holds_planned_reminder(svc, fake_gi, clock):
    """אינטגרציה: תזכורת שמתוכננת לערב תשעה באב אחה״צ נדחית אל אחרי הצום."""
    clock.now = datetime(2027, 8, 11, 14, tzinfo=TZ)
    _docs(fake_gi, _one(1, due="2027-08-01"))
    svc.sync()
    [rid] = svc.plan()
    when = datetime.fromisoformat(svc.db.one("SELECT scheduled_for FROM reminders WHERE id=?",
                                             (rid,))[0])
    assert when == datetime(2027, 8, 13, 8, tzinfo=TZ)
    svc.approve(rid)
    clock.now = datetime(2027, 8, 12, 10, tzinfo=TZ)
    assert svc.dispatch() == []

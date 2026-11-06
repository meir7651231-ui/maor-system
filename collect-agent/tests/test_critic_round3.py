"""רגרסיה לממצאי המבקר, סבב 3 (team/critic.md). כל בדיקה משחזרת את הסקריפט שלו ב-/tmp/claude-0/critic3."""
from datetime import timedelta

from tests.conftest import gi_doc


def _sent_to(svc, to):
    return [m for m in svc.sender.sent if m["to"] == to]


# 🔴 1 · ר-4: סנכרון בין האישור לשליחה עקף את הרענון (r4_sync.py)
def test_sync_between_approve_and_dispatch_does_not_send_stale_amount(svc, fake_gi):
    svc.sync()
    ids = svc.plan()
    for i in ids:
        svc.approve(i)
    fake_gi.docs[0]["amount"] = "200.00"      # תשלום חלקי
    svc.sync()                                 # webhook ⇒ סנכרון עדכן את invoices
    svc.dispatch()
    for m in _sent_to(svc, "972501234567") + _sent_to(svc, "c1@example.com"):
        assert "1,200" not in m["body"], m["body"]
    r = svc._reminder(ids[0])
    assert r["status"] == "pending_approval" and r["block_reason"] == "amount_changed"
    assert "200" in r["body"] and r["amount_agorot"] == 20000


# 🔴 1ב · אותו חור ב-CSV (csv_r4.py)
def test_csv_reimport_with_new_balance_not_sent_stale(svc):
    head = "number,client,phone,amount,due\n"
    svc.import_csv((head + "7,דנה,050-1234567,1200,2026-10-01\n").encode())
    rid = svc.plan()[0]
    svc.approve(rid, confirm_open=True)
    svc.import_csv((head + "7,דנה,050-1234567,200,2026-10-01\n").encode())
    svc.dispatch()
    assert not any("1,200" in m["body"] for m in svc.sender.sent)
    assert svc._reminder(rid)["block_reason"] == "amount_changed"


# 🔴 2 · טיוטות והסדר בלי רענון מול GI (plan_r4.py)
def test_plan_approval_refreshes_and_refuses_stale_total(svc, fake_gi):
    import pytest
    svc.sync()
    pid = svc.propose_plan(1, 3)                       # 3×400 על 1,200
    fake_gi.docs[0]["amount"] = "300.00"               # שולם חלקית ב-GI, עוד לא סונכרן
    with pytest.raises(ValueError, match="היתרה השתנתה"):
        svc.approve_plan(pid)
    assert svc.sender.sent == []


def test_plan_approval_blocked_when_gi_down(svc, fake_gi):
    import pytest
    svc.sync()
    pid = svc.propose_plan(1, 3)
    fake_gi.fail_refresh = True
    with pytest.raises(ValueError, match="לאמת"):
        svc.approve_plan(pid)
    assert svc.sender.sent == [] and svc._customer_block(1) == "plan_active"  # עדיין רק הוצע


def test_money_draft_not_sent_when_refresh_fails(svc, fake_gi):
    svc.sync()
    r = svc.inbound("sms", "0501234567", "איך משלמים?")
    fake_gi.fail_refresh = True
    svc.inbox.approve_draft(r["draft_id"])
    assert svc.sender.sent == []
    fake_gi.fail_refresh = False
    svc.inbox.flush()                                  # רענון הצליח ⇒ יוצא
    assert len(svc.sender.sent) == 1


def test_money_draft_calls_source_before_send(svc, fake_gi):
    svc.sync()
    r = svc.inbound("sms", "0501234567", "איך משלמים?")
    before = fake_gi.refresh_calls
    svc.inbox.approve_draft(r["draft_id"])
    assert fake_gi.refresh_calls > before


# 🔴 3 · הסדר של 6 תשלומים קרס ונעל את הלקוח (plan6.py)
def test_six_installment_offer_fits_sms_and_does_not_lock(svc, fake_gi):
    fake_gi.docs[0]["amount"] = "1200.00"
    svc.sync()
    pid = svc.propose_plan(1, 6)
    res = svc.approve_plan(pid)
    assert res["draft_status"] == "sent_dry_run"
    body = svc.sender.sent[-1]["body"]
    assert len(body) <= 201 and "6 תשלומים" in body and "להסרה:" in body


def test_send_error_rejects_draft_and_flush_continues(svc, fake_gi, monkeypatch):
    svc.sync()
    r1 = svc.inbound("sms", "0501234567", "איך משלמים?")
    r2 = svc.inbound("sms", "0527654321", "איך משלמים?")
    svc.clock.now = svc.clock.now.replace(hour=22)     # מחוץ לחלון ⇒ שתיהן ממתינות
    svc.inbox.approve_draft(r1["draft_id"])
    svc.inbox.approve_draft(r2["draft_id"])
    real = svc.sender.send

    def flaky(msg):
        if msg.to == "972501234567":
            from app.integrations.base import IntegrationError
            raise IntegrationError("הודעה ארוכה מדי")
        return real(msg)
    monkeypatch.setattr(svc.sender, "send", flaky)
    svc.clock.now = svc.clock.now.replace(day=9, hour=10)
    sent = svc.inbox.flush()
    assert sent == [r2["draft_id"]]                    # השנייה יצאה למרות הכישלון של הראשונה
    st = svc.db.one("SELECT status, decided_by FROM drafts WHERE id=?", (r1["draft_id"],))
    assert st["status"] == "rejected" and st["decided_by"] == "system:send_error"
    assert svc.db.one("SELECT 1 FROM messages WHERE intent='send_error' AND needs_owner=1")


# 🟠 6 · המסנן לא רץ על מייל (inj2.py)
def test_email_with_blacklisted_name_is_blocked(svc, fake_gi):
    fake_gi.docs[0]["client"]["name"] = "דנה תביעה"
    fake_gi.docs[0]["client"]["phone"] = ""
    svc.sync()
    rid = next(i for i in svc.plan() if svc._reminder(i)["invoice_id"] == 1)
    assert svc._reminder(rid)["block_reason"] == "compliance"


# 🟠 7 · ביטויי הסרה + blacklist/הסר ממספר לא מוכר (optout2.py, bl.py)
def test_more_opt_out_phrases(svc):
    from app.conversation import Intent, detect
    for t in ("נא להסיר", "די, תפסיקו", "לא מעוניין", "remove me", "please stop"):
        assert Intent.OPT_OUT in detect(t), t
    assert Intent.OPT_OUT not in detect("לא מעוניין בפריסה, אשלם בחמישי")


def test_blacklist_and_opt_out_from_unknown_number_suppress_future_customer(svc, fake_gi):
    svc.sms_webhook_019(b"type=blacklist&phone=0521112222")
    svc.inbound("sms", "0523334444", "הסר")
    fake_gi.docs[:] = [gi_doc(5, phone="052-1112222"), gi_doc(6, phone="052-3334444")]
    svc.sync()
    for i in svc.plan():
        svc.approve(i)
    svc.dispatch()
    assert [m for m in svc.sender.sent if m["channel"] == "sms"] == []


# 🟠 8 · מונה התזכורות ספר מבוטלות (max3.py)
def test_cancelled_reminders_do_not_advance_the_ladder(svc, clock):
    svc.sync()
    first = None
    for _ in range(3):
        ids = [i for i in svc.plan() if svc._reminder(i)["invoice_id"] == 1]
        if ids:
            first = first or svc._reminder(ids[0])["template_key"]
            assert svc._reminder(ids[0])["template_key"] == "friendly"   # עדיין השלב הראשון
        svc.inbound("sms", "0501234567", "שילמתי")
        svc.resume_customer(1)
        clock.now += timedelta(days=10)
    assert first == "friendly"


# 🟠 9 · CSV: «יתרה» גוברת על «סה"כ» גם כשסה"כ מופיע קודם, וסטטוס סגור מסונן
def test_csv_prefers_balance_column_and_skips_closed():
    from app import csv_import
    r = csv_import.parse('מספר מסמך,שם לקוח,טלפון,סה"כ,יתרה,סטטוס\n'
                         '1,א,0501234567,1000,250,פתוח\n2,ב,0501234568,500,500,שולם\n')
    assert [(i.number, i.amount_agorot) for i in r.invoices] == [("1", 25000)]



def test_csv_non_finite_amounts_rejected_per_row():
    from app import csv_import
    r = csv_import.parse("number,client,phone,amount\n1,א,0501234567,Infinity\n2,ב,0501234568,NaN\n"
                         "3,ג,0501234569,1e12\n4,ד,0501234560,10\n")
    assert [i.number for i in r.invoices] == ["4"] and {e["row"] for e in r.errors} == {2, 3, 4}

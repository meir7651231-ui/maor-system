"""critic סבב 188 · 🟠 לתיקון בונה — רכיב: `app/service.py` → `_email_bounce` («בלי הסרה אוטומטית») מול `gate()` / בניית
ההודעות: אחרי **bounce קבוע** (Status 5.1.1 — הכתובת לא קיימת) ההודעה מסומנת failed ונפתח כרטיס לבעל העסק, אבל
הכתובת **ממשיכה לקבל** מיילים בכל שלב: [מאומת] תזכורת ⇒ DSN 5.1.1 ⇒ 3 סבבים ⇒ עוד 2 מיילים לאותה כתובת מתה.
שליחה חוזרת לכתובות שחזרו פוגעת במוניטין השליחה של העסק (שיעור bounce ⇒ רשימות חסימה), ואם הכתובת תוקצה מחדש
— פרטי חוב מגיעים לזר. הצעה: bounce קבוע ⇒ דגל «מייל לא תקין» לכתובת (לא הסרה משפטית — לא suppressions), שמדלג
על ערוץ המייל עד שהכתובת משתנה במקור/בעל העסק מאשר; SMS ממשיך.
תוקן במנהל 339 (email_bounces + שער email_bounced); הבקרה (bounce זמני 4.x ⇒
ממשיכים) נשארת ירוקה."""
from datetime import timedelta

DANA_MAIL = "c1@example.com"


def _cycle(svc):
    for rid in svc.plan():
        try:
            svc.approve(rid, confirm_open=True)
        except (ValueError, PermissionError):
            pass
    svc.dispatch()


def _first_mail_and_bounce(svc, clock, status):
    svc.sync()
    clock.now += timedelta(days=3)
    _cycle(svc)
    mid = [m for m in svc.sender.sent if m["to"] == DANA_MAIL][0]["provider_message_id"]
    dsn = f"Final-Recipient: rfc822; {DANA_MAIL}\nStatus: {status}\nOriginal-Message-ID: <{mid}>\n"
    svc.email_webhook("MAILER-DAEMON@mx.example", dsn, f"b-{status}", subject="Undelivered Mail Returned to Sender")
    before = len([m for m in svc.sender.sent if m["to"] == DANA_MAIL])
    for _ in range(3):
        clock.now += timedelta(days=8)
        svc.sync()
        _cycle(svc)
    return before, len([m for m in svc.sender.sent if m["to"] == DANA_MAIL])


def test_no_more_email_after_hard_bounce(svc, clock):
    before, after = _first_mail_and_bounce(svc, clock, "5.1.1")
    assert after == before, (before, after)


def test_control_soft_bounce_keeps_sending(svc, clock):
    before, after = _first_mail_and_bounce(svc, clock, "4.2.2")
    assert after > before


def test_sms_continues_after_hard_bounce(svc, clock):
    """הסימון רק על המייל — ה-SMS ממשיך."""
    _first_mail_and_bounce(svc, clock, "5.1.1")
    sms_before = len([m for m in svc.sender.sent if m.get("channel") == "sms"])
    clock.now += timedelta(days=8)
    svc.sync()
    _cycle(svc)
    assert svc.email_bounced(DANA_MAIL)
    assert len([m for m in svc.sender.sent if m.get("channel") == "sms"]) >= sms_before


def test_owner_alert_says_mail_stopped(svc, clock):
    _first_mail_and_bounce(svc, clock, "5.1.1")
    row = svc.db.one("SELECT body FROM messages WHERE intent='email_bounced'")
    assert "נעצרו" in row["body"] and "SMS" in row["body"]


def test_verified_inbound_from_address_lifts_flag(svc, clock):
    _first_mail_and_bounce(svc, clock, "5.1.1")
    assert svc.email_bounced(DANA_MAIL)
    svc.email_webhook(DANA_MAIL, "שאלה על החשבונית", "in-1", auth_results="dmarc=pass")
    assert not svc.email_bounced(DANA_MAIL)


def test_unverified_inbound_does_not_lift_flag(svc, clock):
    _first_mail_and_bounce(svc, clock, "5.1.1")
    svc.email_webhook(DANA_MAIL, "שאלה על החשבונית", "in-2", auth_results="dmarc=fail")
    assert svc.email_bounced(DANA_MAIL)


def test_gate_reason_is_email_bounced(svc, clock):
    _first_mail_and_bounce(svc, clock, "5.1.1")
    cust = svc.db.one("SELECT * FROM customers WHERE lower(email)=?", (DANA_MAIL,))
    assert svc.gate(cust, "email", DANA_MAIL) in ("email_bounced", "outside_window")
    assert svc.gate(cust, "email", "new-addr@example.com") != "email_bounced"


# ───────── גבי משפט: מזעור — סימון bounce לא נשמר אחרי שהלקוח הותמם (ר-10) ─────────
def _close_and_purge(svc, clock, fake_gi, doc_id="doc1"):
    fake_gi.docs[:] = [d for d in fake_gi.docs if d["id"] != doc_id]
    svc.sync()
    clock.now += timedelta(days=91)
    svc.purge_closed()


def test_bounce_mark_deleted_when_customer_purged(svc, clock, fake_gi):
    _first_mail_and_bounce(svc, clock, "5.1.1")
    assert svc.email_bounced(DANA_MAIL)
    _close_and_purge(svc, clock, fake_gi)
    assert svc.db.one("SELECT purged_at FROM customers WHERE external_id='cl1'")["purged_at"]
    assert svc.db.one("SELECT COUNT(*) n FROM email_bounces")["n"] == 0


def test_bounce_mark_kept_while_another_live_customer_shares_address(svc, clock, fake_gi):
    from tests.conftest import gi_doc
    _first_mail_and_bounce(svc, clock, "5.1.1")
    other = gi_doc(9, client_id="cl-shared", name="משה כהן", phone="052-9998887", due="2026-12-30")
    other["client"]["emails"] = [DANA_MAIL]
    fake_gi.docs.append(other)
    svc.sync()
    _close_and_purge(svc, clock, fake_gi)
    assert svc.email_bounced(DANA_MAIL)          # הכתובת עדיין מתה עבור הלקוח החי


def test_spam_complaint_suppression_survives_purge(svc, clock, fake_gi):
    """תלונת ספאם = סירוב (30א) ⇒ נשמרת גם אחרי ההתממה (שונה מ-bounce)."""
    svc.sync()
    clock.now += timedelta(days=3)
    _cycle(svc)
    mid = [m for m in svc.sender.sent if m["to"] == DANA_MAIL][0]["provider_message_id"]
    arf = (f"Feedback-Type: abuse\nOriginal-Rcpt-To: {DANA_MAIL}\nMessage-ID: <{mid}>\n")
    svc.email_webhook("fbl@isp.example", arf, "arf-1", subject="Abuse report")
    assert svc.suppressed("email", DANA_MAIL)
    _close_and_purge(svc, clock, fake_gi)
    assert svc.suppressed("email", DANA_MAIL)

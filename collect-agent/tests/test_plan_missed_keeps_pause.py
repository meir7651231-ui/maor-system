"""גבייה סוכן · fuzz ב׳ (20.11): מנהל 332 הוסיף מחזור-חיים להסדר — הסדר שהוחמץ ⇒ missed והחסימה משתחררת ⇒
התזכורות הרגילות חוזרות לאישור. נעילה: השחרור הוא של **חסימת ההסדר** בלבד. לקוח שכתב «שילמתי» / שבמחלוקת /
שביקש הסרה בזמן ההסדר נשאר עצור גם אחרי שההסדר הוחמץ (ב-fuzz זה נתפס רק בזרע אחד מ-200 — לכן בדיקה ממוקדת)."""
from datetime import timedelta

import pytest

from tests.conftest import customer_sent

DANA = "050-1234567"


def _approved_plan(svc):
    svc.sync()
    r = svc.inbound("sms", DANA, "אפשר לשלם ב-3 תשלומים?")
    svc.inbox.approve_draft(r["draft_id"])                 # ההצעה נשלחה
    r = svc.inbound("sms", DANA, "מאשר")
    if r.get("draft_id"):
        svc.inbox.approve_draft(r["draft_id"])
    return svc.db.one("SELECT * FROM plans ORDER BY id DESC LIMIT 1")


def _to_dana_reminders(svc):
    return [m for m in customer_sent(svc) if m["to"] == "972501234567" and "טרם סומנה" in m["body"]]


@pytest.mark.parametrize("text,reason", [("שילמתי את הכל", "paid_claim"), ("הסכום לא נכון", "dispute"),
                                         ("הסר", None)])
def test_missed_plan_does_not_release_customer_pause(svc, clock, text, reason):
    p = _approved_plan(svc)
    assert p["status"] == "approved"
    svc.inbound("sms", DANA, text)
    before = len(_to_dana_reminders(svc))
    for _ in range(6):                                      # חצי שנה: כל התשלומים הוחמצו
        clock.now += timedelta(days=30)
        for rid in svc.plan():
            try:
                svc.approve(rid, confirm_open=True)
            except (ValueError, PermissionError):
                pass
        svc.dispatch()
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (p["id"],))["status"] == "missed"
    assert len(_to_dana_reminders(svc)) == before
    c = svc.db.one("SELECT paused_reason, opted_out FROM customers WHERE external_id='cl1'")
    if reason:
        assert (c["paused_reason"] or "").startswith(reason)
    else:
        assert c["opted_out"] == 1


def test_control_missed_plan_alone_resumes_reminders(svc, clock):
    """בקרה (מנהל 332): בלי השהיה — הסדר שהוחמץ מחזיר את התזכורות לאישור, והן יוצאות."""
    _approved_plan(svc)
    for _ in range(6):
        clock.now += timedelta(days=30)
        for rid in svc.plan():
            try:
                svc.approve(rid, confirm_open=True)
            except (ValueError, PermissionError):
                pass
        svc.dispatch()
    assert _to_dana_reminders(svc)


def _missed_card(svc):
    return svc.db.one("SELECT body FROM messages WHERE intent='plan_missed'")["body"]


def _miss(svc, clock):
    for _ in range(2):
        clock.now += timedelta(days=30)
        svc.plan()


def test_card_tells_truth_when_pause_released(svc, clock):
    _approved_plan(svc)
    _miss(svc, clock)
    assert "חוזרות לאישורכם" in _missed_card(svc)
    assert svc.db.one("SELECT paused_reason FROM customers WHERE external_id='cl1'")["paused_reason"] is None
    assert svc.db.one("SELECT 1 FROM audit WHERE action='plan_missed_pause_released'")


def test_card_does_not_promise_reminders_when_other_pause_remains(svc, clock):
    _approved_plan(svc)
    svc.inbound("sms", DANA, "שילמתי את הכל")
    _miss(svc, clock)
    body = _missed_card(svc)
    assert "חוזרות לאישורכם" not in body and "לא חוזרות" in body


# ── נמצא ב-fuzz ב׳ (זרע 63): קבלה על לקוח בהשהיה רכה לא נרשמה כ-credit_review ──────────────────────
def _receipt_doc1(fake_gi):
    from tests.test_paid_never_reminded import _receipt
    fake_gi.docs.append(_receipt(31, linked=["doc1"]))


def test_receipt_during_plan_pause_survives_missed_plan(svc, clock, fake_gi):
    _approved_plan(svc)
    _receipt_doc1(fake_gi)
    svc.sync()
    assert svc.db.one("SELECT paused_reason FROM customers WHERE external_id='cl1'")["paused_reason"] == \
        svc.CREDIT_REVIEW
    before = len(_to_dana_reminders(svc))
    for _ in range(4):
        clock.now += timedelta(days=30)
        for rid in svc.plan():
            try:
                svc.approve(rid, confirm_open=True)
            except (ValueError, PermissionError):
                pass
        svc.dispatch()
    assert len(_to_dana_reminders(svc)) == before


def test_receipt_during_promise_pause_survives_promise_expiry(svc, clock, fake_gi):
    """לא תלוי בשינוי ההסדר: «אשלם ביום שלישי» (משתחררת לבד) + קבלה ⇒ אחרי המועד לא יוצאת תזכורת."""
    svc.sync()
    svc.inbound("sms", DANA, "אשלם ביום שלישי")
    _receipt_doc1(fake_gi)
    svc.sync()
    for _ in range(4):
        clock.now += timedelta(days=7)
        svc.inbox.release_expired_pauses()
        for rid in svc.plan():
            try:
                svc.approve(rid, confirm_open=True)
            except (ValueError, PermissionError):
                pass
        svc.dispatch()
    assert _to_dana_reminders(svc) == []


def test_hard_pause_not_overwritten_by_credit_review(svc, fake_gi):
    svc.sync()
    svc.inbound("sms", DANA, "הסכום לא נכון")
    _receipt_doc1(fake_gi)
    svc.sync()
    assert svc.db.one("SELECT paused_reason FROM customers WHERE external_id='cl1'")["paused_reason"] == "dispute"


# ── fuzz ב׳ זרעים 5170 / 5494: בקשת הסדר **אחרי** «שילמתי» / קבלה דורסת את ההשהיה (paid_claim / credit_review אינן
#    קשות) ⇒ ההסדר הוחמץ ⇒ שחרור ההשהיה של ההסדר ⇒ תזכורת למי שכנראה שילם. עכשיו לא משחררים אם מאז החידוש האחרון
#    של בעל העסק נכתב משהו מגן או נמצאה קבלה/זיכוי לבדיקה.
def _plan_after(svc, clock, first):
    svc.sync()
    first()
    p = _approved_plan(svc)
    before = len(_to_dana_reminders(svc))
    for _ in range(5):
        clock.now += timedelta(days=30)
        for rid in svc.plan():
            try:
                svc.approve(rid, confirm_open=True)
            except (ValueError, PermissionError):
                pass
        svc.dispatch()
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (p["id"],))["status"] == "missed"
    return before


def test_paid_claim_then_plan_request_then_missed_no_reminder(svc, clock):
    before = _plan_after(svc, clock, lambda: svc.inbound("sms", DANA, "כבר שולם"))
    assert len(_to_dana_reminders(svc)) == before
    assert "לא חוזרות" in _missed_card(svc)


def test_receipt_then_plan_request_then_missed_no_reminder(svc, clock, fake_gi):
    def first():
        _receipt_doc1(fake_gi)
        svc.sync()
    before = _plan_after(svc, clock, first)
    assert len(_to_dana_reminders(svc)) == before


def test_owner_resume_after_paid_claim_then_missed_plan_does_release(svc, clock):
    """בעל העסק בדק את «שילמתי» וחידש ⇒ ההכרעה שלו; הסדר שנולד אחר כך והוחמץ כן מחזיר תזכורות."""
    def first():
        svc.inbound("sms", DANA, "כבר שולם")
        clock.now += timedelta(minutes=5)
        svc.resume_customer(svc.db.one("SELECT id FROM customers WHERE external_id='cl1'")["id"])
        clock.now += timedelta(minutes=5)
    _plan_after(svc, clock, first)
    assert "חוזרות לאישורכם" in _missed_card(svc)


# ── fuzz ב׳ זרעים 40605/40950 (21.11): הבטחה בזמן הסדר מאושר ⇒ _keeps_old_pause שומר את השהיית ההסדר (plan_accept) ולא
#    רושם את השהיית ההבטחה — אבל ללקוח נאמר «עד X לא נשלח תזכורות». ההסדר הוחמץ ⇒ השחרור (ec6b043) איפס ל«אין השהיה» ⇒
#    תזכורת לפני המועד שנאמר ללקוח. עכשיו: שחרור השהיית-הסדר כשהשיחה ב-PROMISED עם מועד עתידי ⇒ promise:until=המועד.
def test_missed_plan_release_keeps_later_promise_window(svc, clock):
    _approved_plan(svc)
    clock.now += timedelta(days=8)                          # 16.11 — התשלום הראשון (15.11) עוד בחסד
    svc.inbound("sms", DANA, "אשלם ב-30")                    # 14 ימים ⇒ «עד 30.11 לא נשלח תזכורות»
    assert svc.db.one("SELECT paused_reason FROM customers WHERE external_id='cl1'")["paused_reason"] \
        .startswith("plan_accept")                          # ההבטחה לא נרשמה כהשהיה (המצב היום)
    before = len(_to_dana_reminders(svc))
    clock.now += timedelta(days=7)                          # 23.11 — החסד (7 ימים) עבר ⇒ ההסדר הוחמץ
    for rid in svc.plan():
        try:
            svc.approve(rid, confirm_open=True)
        except (ValueError, PermissionError):
            pass
    svc.dispatch()
    assert svc.db.one("SELECT status FROM plans ORDER BY id DESC LIMIT 1")["status"] == "missed"
    assert len(_to_dana_reminders(svc)) == before            # היה: תזכורת ב-23.11 למרות «עד 30.11»
    assert svc.db.one("SELECT paused_reason FROM customers WHERE external_id='cl1'")["paused_reason"] == \
        "promise:until=2026-12-01"

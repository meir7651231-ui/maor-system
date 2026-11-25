"""מנהל 395 — חשבונית שעברה בקובץ CSV ללקוח אחר (219א) מול «שילמתי» (מבקר 231🟡) ואישור מועד-הבטחה (מבקר 232🟡).

231: הכרטיס של «שילמתי» מהטלפון הישן אמר «התזכורות הושהו» — אבל 9001 (עכשיו על מיכל) ממשיכה. לא משהים אדם אחר
על סמך הודעה ממספר אחר; הכרטיס אומר את האמת (מספר החשבונית + על מי היא רשומה + «לא הושהו»).
232: אישור «לא לפני 5.12» הוארך רק לדנה; מיכל, שירשה את השהיית ההבטחה, קיבלה תזכורת ב-23.11. עכשיו האישור מאריך
גם את מי שירש — רק כשההשהיה שלו היא בדיוק הירושה."""
from dataclasses import replace
from datetime import timedelta

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"
DANA = "9001,דנה כהן,050-1234567,d@x.example,1200,פתוח,01/10/26,15/10/26\n"
MICHAL = "9001,מיכל לוי,050-0000999,m@x.example,780,פתוח,01/10/26,15/10/26\n"


def _csv(svc, *rows):
    svc.import_csv((H + "".join(rows)).encode())


def _start(svc):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")


def _cid(svc, phone):
    return svc.db.one("SELECT id FROM customers WHERE phone=?", (phone,))["id"]


def _summary(svc, did):
    return svc.db.one("SELECT owner_summary FROM drafts WHERE id=?", (did,))["owner_summary"]


# ---------- 231 ----------
def test_paid_claim_card_names_moved_invoice_and_says_not_paused(svc, clock):
    _start(svc)
    _csv(svc, DANA)
    clock.now += timedelta(days=1)
    _csv(svc, MICHAL)
    r = svc.inbound("sms", "050-1234567", "שילמתי אתמול")
    s = _summary(svc, r["draft_id"])
    assert "9001" in s and "מיכל לוי" in s and "לא הושהו" in s, s
    # לא משהים את מיכל על סמך הודעה ממספר אחר
    assert svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (_cid(svc, "050-0000999"),))[
        "paused_reason"] is None
    acts = svc.db.one("SELECT owner_actions FROM drafts WHERE id=?", (r["draft_id"],))["owner_actions"]
    assert "שעברה ללקוח אחר" in acts


def test_paid_claim_without_move_unchanged(svc, clock):
    _start(svc)
    _csv(svc, DANA)
    r = svc.inbound("sms", "050-1234567", "שילמתי אתמול על חשבונית 9001")
    s = _summary(svc, r["draft_id"]) or ""
    assert "לא הושהו" not in s and "רשומה כעת" not in s, s


def test_moved_invoice_already_closed_no_note(svc, clock):
    _start(svc)
    _csv(svc, DANA)
    clock.now += timedelta(days=1)
    _csv(svc, MICHAL)
    svc.db.x("UPDATE invoices SET status='paid' WHERE number='9001'")
    r = svc.inbound("sms", "050-1234567", "שילמתי")
    assert "רשומה כעת" not in (_summary(svc, r["draft_id"]) or "")


def test_other_intent_no_note(svc, clock):
    _start(svc)
    _csv(svc, DANA)
    clock.now += timedelta(days=1)
    _csv(svc, MICHAL)
    r = svc.inbound("sms", "050-1234567", "איך משלמים?")
    if r.get("draft_id"):
        assert "רשומה כעת" not in (_summary(svc, r["draft_id"]) or "")


# ---------- 232 ----------
def _promise_then_move(svc, clock):
    _start(svc)
    _csv(svc, DANA)
    r = svc.inbound("sms", "050-1234567", "אשלם ב-5 לחודש הבא")
    assert "promise_over_limit" in r["tags"]
    clock.now += timedelta(days=1)
    _csv(svc, MICHAL)
    return _cid(svc, "050-1234567"), _cid(svc, "050-0000999")


def _pause(svc, cid):
    return svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (cid,))["paused_reason"]


def test_approval_extends_inheritor(svc, clock):
    dana, michal = _promise_then_move(svc, clock)
    svc.decide_promise_request(dana, True)
    assert _pause(svc, michal) == _pause(svc, dana) == "promise:until=2026-12-06"
    a = svc.db.one("SELECT detail FROM audit WHERE action='promise_extended_moved_invoice'")
    assert a is not None and "מיכל" not in a["detail"] and "050" not in a["detail"]


def test_refusal_leaves_inheritor_at_cap(svc, clock):
    dana, michal = _promise_then_move(svc, clock)
    svc.decide_promise_request(dana, False)
    assert _pause(svc, michal) == "promise:until=2026-11-23"


def test_stronger_pause_on_inheritor_not_overwritten(svc, clock):
    dana, michal = _promise_then_move(svc, clock)
    svc.db.x("UPDATE customers SET paused_reason='dispute' WHERE id=?", (michal,))
    svc.decide_promise_request(dana, True)
    assert _pause(svc, michal) == "dispute"


def test_move_before_request_not_extended(svc, clock):
    """המעבר קרה **לפני** הבקשה ⇒ ההבטחה של דנה לא הייתה על 9001 — מיכל לא מוארכת."""
    _start(svc)
    _csv(svc, DANA, "9002,דנה כהן,050-1234567,d@x.example,500,פתוח,01/10/26,15/10/26\n")
    clock.now += timedelta(days=1)
    _csv(svc, MICHAL, "9002,דנה כהן,050-1234567,d@x.example,500,פתוח,01/10/26,15/10/26\n")
    michal = _cid(svc, "050-0000999")
    svc.db.x("UPDATE customers SET paused_reason='promise:until=2026-11-23' WHERE id=?", (michal,))
    dana = _cid(svc, "050-1234567")
    r = svc.inbound("sms", "050-1234567", "אשלם ב-5 לחודש הבא")
    assert "promise_over_limit" in r["tags"]
    svc.decide_promise_request(dana, True)
    assert _pause(svc, michal) == "promise:until=2026-11-23"


def test_source_guard():
    import inspect

    from app import inbox, service
    assert "moved_away_open" in inspect.getsource(service.CollectService.decide_promise_request)
    assert "_paid_claim_moved_note" in inspect.getsource(inbox)

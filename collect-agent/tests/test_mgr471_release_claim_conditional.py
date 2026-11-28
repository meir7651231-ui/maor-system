"""מנהל 471 (STATUS 469–470 «הבא» מנוע): שחרור תפיסת תזכורת מותנה ב-sending.

תרחיש: `sender.send` נתקע מעל CLAIM_STALE ⇒ `_recover_stuck_sends` מסמן send_unknown ופותח לבעל העסק כרטיס «היא
לא תישלח שוב אוטומטית. בדקו… לפני שליחה ידנית». ואז כל הערוצים נכשלו. קודם: `UPDATE … status='approved'` בלי תנאי
⇒ הסבב הבא שלח אוטומטית בזמן שבעל העסק אולי כבר שלח ידנית (כפילות), בניגוד להבטחה בכרטיס.
וגם: כל הערוצים נחסמו (הסרה) ⇒ התזכורת בוטלה אבל הכרטיס «לפני שליחה ידנית» נשאר פתוח ⇒ מזמין שליחה ללקוח שביקש הסרה.
"""
from __future__ import annotations

from datetime import timedelta

from app.integrations import IntegrationError


def _card(svc, mid):
    return svc.db.one("SELECT needs_owner FROM messages WHERE message_id=? AND intent='send_unknown'", (mid,))


def _approved(svc):
    svc.sync()
    rid = svc.plan()[0]
    svc.approve(rid)
    assert svc._reminder(rid)["status"] == "approved"
    return rid


def test_all_failed_after_send_unknown_stays_unknown(svc, clock):
    rid = _approved(svc)
    real = svc.sender.send
    hit = {"n": 0}

    def stuck_then_fail(msg):
        hit["n"] += 1
        if hit["n"] == 1:
            svc._recover_stuck_sends(clock.now + timedelta(minutes=31))
            assert svc._reminder(rid)["status"] == "send_unknown"
        raise IntegrationError("provider down")
    svc.sender.send = stuck_then_fail
    try:
        assert not svc.dispatch()
    finally:
        svc.sender.send = real
    assert svc._reminder(rid)["status"] == "send_unknown"           # לא חזרה ל-approved
    assert _card(svc, f"sendunk:{rid}")["needs_owner"] == 1           # הכרטיס נשאר — בעל העסק מחליט
    assert svc.db.one("SELECT 1 FROM audit WHERE action='send_release_skipped'")
    # הסבב הבא לא שולח אותה אוטומטית
    assert not [o for o in svc.dispatch() if o["reminder_id"] == rid]


def test_all_failed_normal_release_to_approved(svc, clock):
    rid = _approved(svc)
    real = svc.sender.send

    def fail(msg):
        raise IntegrationError("provider down")
    svc.sender.send = fail
    try:
        svc.dispatch()
    finally:
        svc.sender.send = real
    r = svc._reminder(rid)
    assert r["status"] == "approved" and r["claimed_at"] is None       # כמו קודם — ננסה בסבב הבא
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='send_release_skipped'")


def test_all_gated_after_send_unknown_closes_card(svc, clock):
    rid = _approved(svc)
    cid = svc._invoice(svc._reminder(rid)["invoice_id"])["customer_id"]
    real_gate = svc.gate

    def gate(cust, ch, to):
        if svc._reminder(rid)["status"] == "sending":
            svc._recover_stuck_sends(clock.now + timedelta(minutes=31))
        return "opted_out"
    svc.gate = gate
    try:
        svc.dispatch()
    finally:
        svc.gate = real_gate
    r = svc._reminder(rid)
    assert r["status"] == "cancelled" and r["block_reason"] == "opted_out"
    assert _card(svc, f"sendunk:{rid}")["needs_owner"] == 0           # לא מזמינים שליחה ידנית ללקוח שהוסר
    assert svc.db.one("SELECT 1 FROM audit WHERE action='send_unknown_resolved'")
    assert cid

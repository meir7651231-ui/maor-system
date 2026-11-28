"""מנהל 474 (STATUS 471–473 «הבא» מנוע): עצירת טיוטות מותנית במצב שה-SELECT ראה.

אותו דפוס כמו 464/471: חמישה מסלולים בחרו טיוטות `approved`/`pending_approval` ואז הריצו
`UPDATE drafts SET status='superseded' … WHERE id=?` **בלי תנאי מצב**. אם בין ה-SELECT ל-UPDATE ריצת flush מקבילה
תפסה את הטיוטה (approved ⇒ sending) — ההודעה כבר בדרך ללקוח, אבל הטיוטה סומנה «נעצרה» ובעל העסק קיבל
«התשובה שאישרתם לא נשלחה» על תשובה שיצאה (ובהסרה: «אסור לשלוח, פנו ללקוח אישית»).
המסלולים: הסרה (`_stop_drafts`) · סימון קטין/פטירה (`_hold_pending_drafts`) · פנייה מגוננת (`_stop_approved_ids`) ·
הצעת פריסה בתור (`_drop_queued_plan_offers`) · החלטה על הבטחה (`decide_promise_request`).
הבדיקות מדמות את המרוץ: מיד אחרי ה-SELECT הטיוטה עוברת ל-sending.
"""
from __future__ import annotations


def _race(svc, marker: str):
    """אחרי SELECT על drafts שמכיל `marker` — כל הטיוטות שנבחרו נתפסות לשליחה (כמו flush מקביל)."""
    real = svc.db.q

    def q(sql, args=()):
        rows = real(sql, args)
        if "FROM drafts" in sql and marker in sql:
            for r in rows:
                svc.db.x("UPDATE drafts SET status='sending', claimed_at='2026-11-08T10:00:00' WHERE id=?",
                         (r["id"],))
        return rows
    svc.db.q = q
    return lambda: setattr(svc.db, "q", real)


def _draft(svc, status="approved", intent="how_to_pay", owner_actions=None):
    svc.sync()
    svc.inbound("sms", "050-1234567", "תודה")          # יוצר את טבלת הטיוטות
    svc.db.x("UPDATE drafts SET status='rejected'")      # רק הטיוטה של הבדיקה רלוונטית
    return svc.db.x("INSERT INTO drafts(customer_id,channel,to_addr,intent,escalate,body,status,owner_actions,"
                    "created_at) VALUES(1,'sms','0501234567',?,'none','לתשלום: קישור',?,?,'2026-11-08T10:00:00')",
                    (intent, status, owner_actions))


def _status(svc, did):
    return svc.db.one("SELECT status FROM drafts WHERE id=?", (did,))["status"]


def _stopped_cards(svc):
    return svc.db.q("SELECT body FROM messages WHERE intent='draft_stopped_opt_out'")


def test_opt_out_does_not_claim_in_flight_draft(svc):
    did = _draft(svc)
    undo = _race(svc, "'pending_approval','approved'")
    try:
        svc._stop_drafts(svc.db.q("SELECT id, customer_id, status FROM drafts WHERE customer_id=1 AND status IN "
                                  "('pending_approval','approved')"))
    finally:
        undo()
    assert _status(svc, did) == "sending"                       # לא נדרסה ל-superseded
    assert not _stopped_cards(svc)                              # בלי «לא נשלחה» על הודעה שבדרך
    assert svc.db.one("SELECT 1 FROM audit WHERE action='draft_stop_skipped'")


def test_opt_out_normal_still_stops_and_notifies(svc):
    did = _draft(svc)
    svc._stop_drafts(svc.db.q("SELECT id, customer_id, status FROM drafts WHERE id=?", (did,)))
    row = svc.db.one("SELECT status, decided_by FROM drafts WHERE id=?", (did,))
    assert (row["status"], row["decided_by"]) == ("superseded", "system:opted_out")
    assert len(_stopped_cards(svc)) == 1


def test_hold_counts_only_really_stopped(svc):
    did = _draft(svc)
    undo = _race(svc, "('pending_approval','approved')")
    try:
        n = svc._hold_pending_drafts(1)
    finally:
        undo()
    assert n == 0
    assert _status(svc, did) == "sending"


def test_hold_normal_stops(svc):
    did = _draft(svc, status="pending_approval")
    assert svc._hold_pending_drafts(1) == 1
    assert _status(svc, did) == "superseded"


def test_protective_stop_skips_in_flight(svc):
    did = _draft(svc)
    undo = _race(svc, "escalate!='urgent'")
    try:
        ids = svc.inbox._stop_approved_ids(1, "complaint")
    finally:
        undo()
    assert ids == []
    assert _status(svc, did) == "sending"
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='approved_drafts_stopped_protective'")


def test_protective_stop_normal(svc):
    did = _draft(svc)
    assert svc.inbox._stop_approved_ids(1, "complaint") == [did]
    assert _status(svc, did) == "superseded"


def test_queued_plan_offer_drop_skips_in_flight(svc):
    did = _draft(svc, intent="plan_request")
    undo = _race(svc, "intent='plan_request'")
    try:
        svc.inbox._drop_queued_plan_offers(1, "plan_accept")
    finally:
        undo()
    assert _status(svc, did) == "sending"
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='queued_plan_offer_dropped'")


def test_queued_plan_offer_drop_normal(svc):
    did = _draft(svc, intent="plan_request")
    svc.inbox._drop_queued_plan_offers(1, "plan_accept")
    assert _status(svc, did) == "superseded"


def test_source_no_unconditional_superseded_by_id():
    """הגנת-מקור: אין עוד `SET status='superseded' … WHERE id=?` בלי תנאי מצב בנתיבי העצירה."""
    import re
    from pathlib import Path
    root = Path(__file__).resolve().parents[1] / "app"
    for name in ("inbox.py", "service.py"):
        src = (root / name).read_text(encoding="utf-8")
        bad = re.findall(r"UPDATE drafts SET status='superseded'[^\"]*\"?\s*\"?[^\"]*WHERE id=\?\"", src)
        assert not bad, (name, bad)

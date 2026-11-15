"""הפעלה 211 — כרטיס יתום של הסדר שנדחה (ממצא פתוח מ-210).

לפני: בקשת פריסה שונה (3 ⇒ 4 תשלומים) דחתה את ההסדר הקודם (`plans.status='rejected'`), אבל הכרטיס
`needs_owner` שלו נשאר פתוח — `_draft` סוגר רק טיוטות `pending_approval`. בעל העסק ראה שני כרטיסי פריסה,
ואחד מהם מצביע על הסדר שכבר אינו בתוקף (אישור שלו נכשל, כי `approve_plan` דורש 'proposed').
אחרי: כשהסדר `proposed` נדחה בגלל הצעה חדשה, הכרטיסים הפתוחים שמצביעים עליו נסגרים (`superseded`).
"""
from __future__ import annotations

from tests.test_landing_prg import _setup

FORM = {"content-type": "application/x-www-form-urlencoded"}


def _open(svc):
    return svc.db.q("SELECT d.id, d.plan_id, p.status ps FROM drafts d LEFT JOIN plans p ON p.id=d.plan_id "
                    "WHERE d.status IN ('pending_approval','needs_owner') ORDER BY d.id")


def test_new_plan_request_closes_card_of_rejected_plan(svc):
    api, code = _setup(svc)
    api.post(f"/p/{code}/plan", content="n=3", headers=FORM)
    api.post(f"/p/{code}/plan", content="n=4", headers=FORM)
    plans = svc.db.q("SELECT id, status FROM plans ORDER BY id")
    assert [p["status"] for p in plans] == ["rejected", "proposed"]
    cards = _open(svc)
    assert len(cards) == 1                                   # רק הכרטיס של ההסדר בתוקף
    assert cards[0]["plan_id"] == plans[1]["id"] and cards[0]["ps"] == "proposed"
    assert not [c for c in _open(svc) if c["ps"] == "rejected"]


def test_closed_card_is_marked_and_audited(svc):
    api, code = _setup(svc)
    api.post(f"/p/{code}/plan", content="n=3", headers=FORM)
    first = svc.db.one("SELECT id FROM plans")["id"]
    api.post(f"/p/{code}/plan", content="n=4", headers=FORM)
    row = svc.db.one("SELECT status, decided_by FROM drafts WHERE plan_id=?", (first,))
    assert row["status"] == "superseded" and row["decided_by"] == "system:plan_replaced"
    assert svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='plan_drafts_superseded'")["n"] >= 1


def test_card_without_plan_is_untouched(svc):
    """«שילמתי» פתוח (בלי plan_id) לא נסגר ע״י בקשת פריסה חדשה — רק כרטיסים של ההסדר שנדחה."""
    api, code = _setup(svc)
    api.post(f"/p/{code}/paid")
    paid = svc.db.one("SELECT id, status FROM drafts ORDER BY id DESC LIMIT 1")
    api.post(f"/p/{code}/plan", content="n=3", headers=FORM)
    api.post(f"/p/{code}/plan", content="n=4", headers=FORM)
    assert svc.db.one("SELECT status FROM drafts WHERE id=?", (paid["id"],))["status"] == paid["status"]


def test_approving_remaining_plan_still_works(svc):
    api, code = _setup(svc)
    api.post(f"/p/{code}/plan", content="n=3", headers=FORM)
    api.post(f"/p/{code}/plan", content="n=4", headers=FORM)
    pid = svc.db.one("SELECT id FROM plans WHERE status='proposed'")["id"]
    svc.approve_plan(pid)
    assert svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"] == "approved"
    assert not _open(svc)


def test_new_proposal_branch_closes_card_when_state_reset(svc):
    """הענף הכללי (הצעה חדשה מחליפה 'proposed') — גם כשמצב השיחה כבר לא «ממתין לתשובה על פריסה»
    (למשל אופס בין הבקשות), הכרטיס של ההסדר שנדחה נסגר. בלי זה רק ענף «הלקוח דחה/ביקש אחרת» מכוסה."""
    api, code = _setup(svc)
    api.post(f"/p/{code}/plan", content="n=3", headers=FORM)
    svc.db.x("UPDATE conversations SET state='idle'")
    api.post(f"/p/{code}/plan", content="n=4", headers=FORM)
    assert [p["status"] for p in svc.db.q("SELECT status FROM plans ORDER BY id")] == ["rejected", "proposed"]
    assert [c["ps"] for c in _open(svc)] == ["proposed"]

"""מנהל 332 (מבקר סבב 183 🟠): מחזור-חיים להסדר תשלומים — `_sweep_plans` בכל סבב תכנון.
היה: `approved` (= ההצעה נשלחה) חסם כל תזכורת ללקוח לתמיד, גם אחרי שכל המועדים עברו, ובלי כרטיס לבעל העסק.
עכשיו: הושלם ⇒ `completed`; תשלום שהוחמץ (אחרי PLAN_GRACE_DAYS) ⇒ `missed` + כרטיס אחד + החסימה משתחררת;
הצעה שבעל העסק לא אישר ומועדה עבר ⇒ `superseded`. לקוח שמשלם לפי הלוח — נשאר חסום (לא מקבל תזכורת על כל החוב)."""
import json
from datetime import timedelta


def _approved(svc):
    svc.sync()
    pid = svc.propose_plan(1, 3)
    svc.approve_plan(pid, confirm_amount=True)
    return pid


def _status(svc, pid):
    return svc.db.one("SELECT status FROM plans WHERE id=?", (pid,))["status"]


def _cards(svc):
    return svc.db.q("SELECT body FROM messages WHERE intent='plan_missed' AND needs_owner=1 AND customer_id=1")


def _items(svc, pid):
    return json.loads(svc.db.one("SELECT installments FROM plans WHERE id=?", (pid,))["installments"])


def test_on_track_stays_blocked_and_no_card(svc, clock):
    pid = _approved(svc)
    first = _items(svc, pid)[0]
    svc.db.x("UPDATE invoices SET amount_agorot=amount_agorot-? WHERE customer_id=1", (first["amount_agorot"],))
    clock.now += timedelta(days=7 + 10 + svc.PLAN_GRACE_DAYS)   # התשלום הראשון שולם, השני עוד לא בשל
    assert svc._sweep_plans()["missed"] == []
    assert _status(svc, pid) == "approved" and svc._customer_block(1) == "plan_active" and not _cards(svc)


def test_within_grace_not_missed(svc, clock):
    pid = _approved(svc)
    clock.now += timedelta(days=7 + svc.PLAN_GRACE_DAYS - 1)   # המועד הראשון עבר, עדיין בתוך החסד
    svc._sweep_plans()
    assert _status(svc, pid) == "approved"


def test_missed_card_once_and_block_released(svc, clock):
    pid = _approved(svc)
    clock.now += timedelta(days=7 + svc.PLAN_GRACE_DAYS + 1)
    assert svc._sweep_plans()["missed"] == [pid]
    assert _status(svc, pid) == "missed"
    cards = _cards(svc)
    assert len(cards) == 1
    body = cards[0]["body"]
    assert "תשלום 1 מתוך 3" in body and "400" in body and "דנה כהן" in body
    assert "050" not in body and "@" not in body           # בלי פרטי קשר בכרטיס
    assert svc._customer_block(1) != "plan_active"
    assert svc._customer_blocks()[1] != "plan_active"       # זהות מול הגרסה המרוכזת
    svc._sweep_plans()
    assert len(_cards(svc)) == 1                             # לא כפול


def test_second_installment_missed_names_it(svc, clock):
    pid = _approved(svc)
    first = _items(svc, pid)[0]
    svc.db.x("UPDATE invoices SET amount_agorot=amount_agorot-? WHERE customer_id=1", (first["amount_agorot"],))
    clock.now += timedelta(days=60)
    svc._sweep_plans()
    assert _status(svc, pid) == "missed" and "תשלום 2 מתוך 3" in _cards(svc)[0]["body"]


def test_completed_when_paid(svc, clock):
    pid = _approved(svc)
    svc.db.x("UPDATE invoices SET status='paid' WHERE customer_id=1")
    clock.now += timedelta(days=200)
    assert svc._sweep_plans()["completed"] == [pid]
    assert _status(svc, pid) == "completed" and not _cards(svc)


def test_stale_proposal_expires(svc, clock):
    svc.sync()
    pid = svc.propose_plan(1, 3)
    assert svc._customer_block(1) == "plan_active"
    clock.now += timedelta(days=8)                            # המועד הראשון (היום+7) עבר בלי אישור
    assert svc._sweep_plans()["expired"] == [pid]
    assert _status(svc, pid) == "superseded" and svc._customer_block(1) != "plan_active"
    assert not _cards(svc)


def test_plan_runs_sweep(svc, clock):
    pid = _approved(svc)
    clock.now += timedelta(days=130)
    svc.sync()
    svc.plan()
    assert _status(svc, pid) == "missed" and len(_cards(svc)) == 1

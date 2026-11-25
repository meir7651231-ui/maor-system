"""מנהל 402 · הסדר «מוחמץ» וקובץ חדש מראה שהחשבונית שולמה ⇒ ההסדר «הושלם» והכרטיס יורד.

לפני: `_sweep_plans` בודק רק proposed/approved ⇒ הסדר שסומן «הוחמץ» (לפי קובץ טרי שהראה יתרה) נשאר «הוחמץ» לנצח,
והכרטיס «תשלום 1 מתוך 3 … לא התקבל» נשאר ב«דורש טיפול» גם אחרי שהקובץ הבא סימן את החשבונית «שולם».
אחרי: כל חשבוניות ההסדר סגורות (פחות תוספת שנרשמה, כמו ב-sweep) ⇒ missed→completed (audit
`plan_completed` עם `after_missed`) + הכרטיס יורד (`plan_card_resolved`, why=plan_completed), בלי PII.
תשלום חלקי בלבד ⇒ נשאר «הוחמץ» והכרטיס נשאר (חזרה ל-approved = הכרעת בעל העסק, לא אוטומטית)."""
import json
from dataclasses import replace
from datetime import timedelta

from tests.test_critic_round236_plan_missed_stale_csv import DANA, H, _plan_accepted, _row, _until


def _paid_row():
    return (H + f"9001,דנה כהן,{DANA},d@x.example,1200,שולם,01/10/26,15/10/26\n").encode()


def _missed(svc, clock):
    _plan_accepted(svc, clock)
    _until(svc, clock, "2026-11-30", upload=("2026-11-30", 1200))
    assert svc.db.one("SELECT status FROM plans")["status"] == "missed"
    assert svc.db.one("SELECT needs_owner FROM messages WHERE intent='plan_missed'")["needs_owner"] == 1


def _card(svc):
    return svc.db.one("SELECT needs_owner FROM messages WHERE intent='plan_missed'")["needs_owner"]


def test_paid_file_completes_missed_plan_and_clears_card(svc, clock):
    _missed(svc, clock)
    clock.now += timedelta(days=2)
    svc.import_csv(_paid_row())
    assert svc.db.one("SELECT status FROM invoices WHERE number='9001'")["status"] == "closed"
    assert svc.db.one("SELECT status FROM plans")["status"] == "completed"
    assert _card(svc) == 0
    a = svc.db.one("SELECT detail FROM audit WHERE action='plan_card_resolved'")
    d = json.loads(a["detail"])
    assert d["card"] == "plan_missed" and d["why"] == "plan_completed"
    assert "דנה" not in a["detail"] and "050" not in a["detail"]
    c = json.loads(svc.db.one("SELECT detail FROM audit WHERE action='plan_completed'")["detail"])
    assert c.get("after_missed") is True
    # אין תזכורת פעילה על החשבונית ששולמה
    assert svc.db.one("SELECT 1 FROM reminders WHERE status IN ('pending','approved')") is None


def test_partial_payment_keeps_missed_and_card(svc, clock):
    _missed(svc, clock)
    clock.now += timedelta(days=2)
    svc.import_csv(_row(800))
    assert svc.db.one("SELECT status FROM plans")["status"] == "missed"
    assert _card(svc) == 1
    assert svc.db.one("SELECT 1 FROM audit WHERE action='plan_card_resolved'") is None


def test_same_file_again_is_idempotent(svc, clock):
    _missed(svc, clock)
    clock.now += timedelta(days=2)
    svc.import_csv(_paid_row())
    svc.import_csv(_paid_row())
    clock.now += timedelta(days=1)
    svc.plan()
    assert svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='plan_card_resolved'")["n"] == 1
    assert svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='plan_completed'")["n"] == 1


def test_card_handled_by_owner_still_completes_plan(svc, clock):
    """בעל העסק כבר סימן «טופל» ⇒ ההסדר עדיין עובר ל«הושלם» (בלי resolved על כרטיס שכבר ירד)."""
    _missed(svc, clock)
    svc.db.x("UPDATE messages SET needs_owner=0 WHERE intent='plan_missed'")
    clock.now += timedelta(days=2)
    svc.import_csv(_paid_row())
    assert svc.db.one("SELECT status FROM plans")["status"] == "completed"
    assert svc.db.one("SELECT 1 FROM audit WHERE action='plan_card_resolved'") is None


def test_unrelated_source_api_path_same_rule(svc, clock):
    """הכלל יושב ב-_resolve_plan_cards, שנקרא גם אחרי sync וגם בתכנון — לא רק ב-CSV."""
    _missed(svc, clock)
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("UPDATE invoices SET status='closed', closed_at=? WHERE number='9001'",
             (clock.now.isoformat(),))
    clock.now += timedelta(days=1)
    svc.plan()
    assert svc.db.one("SELECT status FROM plans")["status"] == "completed"
    assert _card(svc) == 0

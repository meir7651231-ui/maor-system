"""מנהל 357 · מבקר 203🟠/🟡 — חשבונית שעלתה בזמן הסדר פעיל, ותשלום חלקי בכרטיס «הוחמץ».

תיקון: עלייה בסכום חשבונית של הסדר `approved` (בסנכרון או ברענון) נרשמת ב-`plans.raised_agorot` + כרטיס
`plan_amount_changed` לבעל העסק ⇒ «שולם» נמדד מול הסכום שאושר (`plan_progress` ו-`_sweep_plans`); כל תשלומי ההסדר
התקבלו ⇒ `completed` גם כשהתוספת עדיין פתוחה. הכרטיס «הוחמץ» מציין כמה התקבל מהתשלום שלא הושלם."""
from datetime import timedelta

from app.service import plan_missed_text, plan_raised_text


def _approved(svc):
    svc.sync()
    pid = svc.propose_plan(1, 3)
    svc.approve_plan(pid, confirm_amount=True)
    return pid


def _plan(svc, pid):
    return svc.db.one("SELECT * FROM plans WHERE id=?", (pid,))


def test_raise_creates_owner_card_once(svc, fake_gi):
    pid = _approved(svc)
    fake_gi.docs[0]["amount"] = "1500.00"
    svc.sync()
    svc.sync()
    cards = svc.db.q("SELECT body FROM messages WHERE intent='plan_amount_changed' AND needs_owner=1")
    assert len(cards) == 1
    assert "1,200" in cards[0]["body"] and "1,500" in cards[0]["body"] and "300" in cards[0]["body"]
    assert _plan(svc, pid)["raised_agorot"] == 30000


def test_progress_counts_on_time_payment_after_raise(svc, fake_gi):
    pid = _approved(svc)
    fake_gi.docs[0]["amount"] = "1500.00"
    svc.sync()
    fake_gi.docs[0]["amount"] = "1100.00"
    svc.sync()
    pr = svc.plan_progress(_plan(svc, pid))
    assert pr["paid_agorot"] == 40000 and pr["done"] == 1 and pr["next"]["n"] == 2


def test_all_installments_paid_after_raise_completes_plan(svc, clock, fake_gi):
    pid = _approved(svc)
    fake_gi.docs[0]["amount"] = "1500.00"
    svc.sync()
    fake_gi.docs[0]["amount"] = "300.00"      # כל 1,200 של ההסדר שולמו; התוספת עוד פתוחה
    svc.sync()
    clock.now += timedelta(days=1)
    svc.plan()
    assert _plan(svc, pid)["status"] == "completed"


def test_decrease_is_payment_not_raise(svc, fake_gi):
    pid = _approved(svc)
    fake_gi.docs[0]["amount"] = "800.00"
    svc.sync()
    assert _plan(svc, pid)["raised_agorot"] == 0
    assert not svc.db.one("SELECT 1 FROM messages WHERE intent='plan_amount_changed'")


def test_raise_before_approval_is_not_counted(svc, fake_gi):
    svc.sync()
    pid = svc.propose_plan(1, 3)
    fake_gi.docs[0]["amount"] = "1500.00"
    svc.sync()
    assert _plan(svc, pid)["raised_agorot"] == 0


def test_missed_card_mentions_partial_amount():
    t = plan_missed_text("דנה", 1, 3, 40000, "2026-11-15", 100000, partial_agorot=20000)
    assert "התקבלו רק 200" in t and "לא התקבל" not in t


def test_missed_card_unchanged_without_partial():
    t = plan_missed_text("דנה", 1, 3, 40000, "2026-11-15", 120000)
    assert "לא התקבל" in t and "התקבלו רק" not in t


def test_raised_text_has_no_contact_details():
    t = plan_raised_text("דנה", "1001", 120000, 150000)
    assert "דנה" in t and "1001" in t and "@" not in t

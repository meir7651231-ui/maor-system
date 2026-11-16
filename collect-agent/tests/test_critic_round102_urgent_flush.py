"""critic סבב 102 · 1bfd415b (מייל לבעלים על כרטיס דחוף — המלצת סבב 99): כרטיס שנבלע ב-throttle «נספר במייל הבא»,
אבל אם לא מגיע עוד כרטיס דחוף — **אין מייל הבא**. מצוקה ב-10:00 (מייל), בעל העסק טיפל, מצוקה שנייה ב-10:10
(throttled) ⇒ שקט לנצח, אדם במצוקה מחכה. תיקון: dispatch (רץ מתוזמן) שולח מייל השלמה כשיש כרטיס דחוף פתוח
שנבלע ב-throttle אחרי המייל האחרון והפער עבר — בלי טקסט לקוח, אותו throttle."""
from datetime import timedelta

from tests.test_urgent_owner_email import _owner_mails


def test_throttled_urgent_is_emailed_later_by_dispatch(svc, clock):
    svc.sync()
    svc.inbound("sms", "0501234567", "אני רוצה למות")
    assert len(_owner_mails(svc)) == 1
    clock.now += timedelta(minutes=10)
    svc.inbound("sms", "0527654321", "לא הזמנתי את זה, זו טעות")       # נבלע ב-throttle
    assert len(_owner_mails(svc)) == 1
    clock.now += timedelta(minutes=25)
    svc.dispatch()                                                       # אין כרטיס דחוף חדש — רק הזמן עבר
    mails = _owner_mails(svc)
    assert len(mails) == 2, "הכרטיס שנבלע ב-throttle לא קיבל מייל אף פעם"
    assert "לא הזמנתי" not in mails[1]["body"]


def test_no_flush_when_nothing_was_throttled(svc, clock):
    svc.sync()
    svc.inbound("sms", "0501234567", "אני רוצה למות")
    clock.now += timedelta(hours=2)
    svc.dispatch()
    assert len(_owner_mails(svc)) == 1


def test_no_flush_when_throttled_card_already_handled(svc, clock):
    svc.sync()
    svc.inbound("sms", "0501234567", "אני רוצה למות")
    clock.now += timedelta(minutes=10)
    r = svc.inbound("sms", "0527654321", "לא הזמנתי את זה, זו טעות")
    for d in svc.db.q("SELECT id FROM drafts WHERE status IN ('pending_approval','needs_owner')"):
        svc.db.x("UPDATE drafts SET status='rejected' WHERE id=?", (d["id"],))
    clock.now += timedelta(minutes=25)
    svc.dispatch()
    assert len(_owner_mails(svc)) == 1, r


def test_dispatch_inside_throttle_window_does_not_spam_audit(svc, clock):
    svc.sync()
    svc.inbound("sms", "0501234567", "אני רוצה למות")
    clock.now += timedelta(minutes=5)
    svc.inbound("sms", "0527654321", "לא הזמנתי את זה, זו טעות")
    n0 = svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='urgent_owner_email_throttled'")["n"]
    for _ in range(5):
        clock.now += timedelta(minutes=2)
        svc.dispatch()
    assert svc.db.one("SELECT COUNT(*) n FROM audit WHERE action='urgent_owner_email_throttled'")["n"] == n0

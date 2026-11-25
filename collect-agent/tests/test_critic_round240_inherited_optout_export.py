"""מבקר סבב 240 · 🟡×2 — אחרי מעבר חשבונית בקובץ (219א): (א) כרטיס «ההסרה עברה בירושה» מבקש הכרעה שאין דרך לבצע;
(ב) ייצוא זכות-עיון של הלקוחה החדשה כולל את התזכורת שנשלחה ללקוחה הקודמת.

רכיבים: (א) `app/service.py` → `_inherited_optout_card` (מנהל 404: «אם זה אדם אחר שלא ביקש הסרה — עדכנו בכרטיס
הלקוח») — אבל אין שום מסלול שמבטל `opted_out` (אין `SET opted_out=0` בקוד; `resume_customer` ⇒ «הלקוח לא מושהה»;
«טופל» רק מוריד את הכרטיס) ⇒ מיכל, שלא ביקשה, נשארת מוסרת לתמיד, בלי תזכורות. (ב) `customer_data_export`
(reminders לפי `invoice_id` של החשבוניות הנוכחיות של הלקוח) ⇒ ייצוא של מיכל מכיל «סטודיו מאיר: שלום דנה, חשבונית
9001 ע"ס 1,200 ₪…» שנשלחה לטלפון של דנה לפני המעבר — מידע על צד שלישי (שם + שפנו אליה), בניגוד לעיקרון של
critic 164 בייצוא; בייצוא של דנה עצמה רשימת reminders ריקה.
✓ נבדק: 239 (מנהל 404) — «איך משלמים?» לא נרשם כהסרה; «הסר אותי» אמיתי של מיכל אחרי הירושה ⇒ נרשם (suppression).
הצעה: (א) פעולה «זה אדם אחר — בטל את ההסרה שעברה» (בעלים, audit) מהכרטיס, או ניסוח שלא מבטיח הכרעה; (ב) בייצוא —
תזכורת שנשלחה לכתובת שאינה של הלקוח (to/payload) או לפני `csv_contact_changed` אליו ⇒ שייכת לייצוא של הלקוח הקודם.
xfail(strict=True). תוקן במנהל 405 (`lift_inherited_optout` + `_export_reminders_by_owner`)."""
from datetime import timedelta

import pytest

from tests.test_critic_round239_inherited_optout import DANA, MICHAL, _row, _sent_to_dana


def _michal(svc):
    return svc.db.one("SELECT id FROM customers WHERE phone=?", (MICHAL,))["id"]


def test_real_optout_after_inheritance_is_recorded(svc, clock):
    """שומר: «הסר אותי» אמיתי מהלקוחה החדשה אחרי הירושה ⇒ נרשם (suppression)."""
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "הסר אותי")
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    svc.inbound("sms", MICHAL, "הסר אותי")
    assert svc.suppressed("sms", MICHAL)


def test_inherited_optout_can_be_lifted_by_owner(svc, clock):
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "הסר אותי")
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    svc.inbound("sms", MICHAL, "איך אפשר לשלם?")
    m = _michal(svc)
    lift = getattr(svc, "lift_inherited_optout", None)
    if lift is None:
        try:
            svc.resume_customer(m)
        except ValueError:
            pass
    else:
        lift(m)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (m,))["opted_out"] == 0


def test_export_of_new_customer_excludes_previous_contact_reminders(svc, clock):
    _sent_to_dana(svc, clock)
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    bodies = [r["body"] for r in svc.customer_data_export(_michal(svc))["reminders"]]
    assert not any("דנה" in b for b in bodies), bodies


def _inherited(svc, clock):
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "הסר אותי")
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    svc.inbound("sms", MICHAL, "איך אפשר לשלם?")
    return _michal(svc)


def test_lift_closes_card_and_audits_without_pii(svc, clock):
    m = _inherited(svc, clock)
    card = "SELECT 1 FROM messages WHERE customer_id=? AND intent='inherited_optout' AND needs_owner=1"
    assert svc.db.one(card, (m,))
    svc.lift_inherited_optout(m, "owner")
    assert not svc.db.one(card, (m,))
    a = svc.db.one("SELECT actor, detail FROM audit WHERE action='inherited_optout_lifted'")
    assert a["actor"] == "owner" and MICHAL not in a["detail"] and "מיכל" not in a["detail"]
    # דנה נשארת מוסרת — הביטול רק למיכל
    assert svc.suppressed("sms", DANA)
    assert svc.db.one("SELECT opted_out FROM customers WHERE phone=?", (DANA,))["opted_out"] == 1


def test_lift_refused_for_real_optout(svc, clock):
    """הסרה אמיתית (שלה) לא מתבטלת במסלול הירושה."""
    _sent_to_dana(svc, clock)
    d = svc.db.one("SELECT id FROM customers WHERE phone=?", (DANA,))["id"]
    svc.inbound("sms", DANA, "הסר אותי")
    with pytest.raises(ValueError):
        svc.lift_inherited_optout(d)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (d,))["opted_out"] == 1


def test_lift_refused_after_her_own_optout(svc, clock):
    m = _inherited(svc, clock)
    svc.inbound("sms", MICHAL, "הסר אותי")
    with pytest.raises(ValueError):
        svc.lift_inherited_optout(m)


def test_after_lift_new_reminder_is_planned_for_her(svc, clock):
    m = _inherited(svc, clock)
    svc.lift_inherited_optout(m)
    # התשובה ל«איך משלמים?» ממתינה לבעל העסק ⇒ AWAITING_OWNER (critic 64) — בעל העסק מטפל בה קודם
    for d in svc.db.q("SELECT id FROM drafts WHERE customer_id=? AND status='pending_approval'", (m,)):
        svc.inbox.reject_draft(d["id"])
    planned = []
    for _ in range(10):
        clock.now += timedelta(days=3)
        planned += svc.plan()
    assert planned, "אחרי ביטול ההסרה שעברה — התזכורת הבאה מתוכננת (לאישור)"
    bodies = [r["body"] for r in svc.customer_data_export(m)["reminders"]]
    assert bodies and all("דנה" not in b for b in bodies), bodies


def test_previous_customer_export_keeps_her_reminder(svc, clock):
    """הצד השני של 240ב: התזכורת שנשלחה לדנה נשארת בייצוא העיון **שלה** גם אחרי שהחשבונית עברה."""
    _sent_to_dana(svc, clock)
    d = svc.db.one("SELECT id FROM customers WHERE phone=?", (DANA,))["id"]
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    bodies = [r["body"] for r in svc.customer_data_export(d)["reminders"]]
    assert any("דנה" in b for b in bodies), bodies


def test_export_legacy_move_audit_without_upto_uses_time(svc, clock):
    """מעבר ישן (לפני 405, בלי upto_reminder) ⇒ לפי זמן השליחה מול זמן המעבר."""
    _sent_to_dana(svc, clock)
    clock.now += timedelta(days=1)
    svc._last_reminder_id = lambda _iid: None   # audit של מעבר ישן — append-only, אז מדמים את הכתיבה עצמה
    svc.import_csv(_row("מיכל לוי", MICHAL))
    assert svc.db.one("SELECT json_extract(detail,'$.upto_reminder') u FROM audit "
                      "WHERE action='csv_contact_changed'")["u"] is None
    bodies = [r["body"] for r in svc.customer_data_export(_michal(svc))["reminders"]]
    assert not any("דנה" in b for b in bodies), bodies


def test_lift_api_owner_only(svc, clock, monkeypatch):
    """הביטול = הכרעה על הסרה (§30א) ⇒ בעל העסק בלבד; עובד/ת 403 + audit, ההסרה נשארת."""
    from tests.test_manager342_staff_owner_settings import _actions, _api
    api, hdr = _api(svc, clock, monkeypatch)
    m = _inherited(svc, clock)
    r = api.post(f"/customers/{m}/lift-inherited-optout", headers=hdr("staff"))
    assert r.status_code == 403 and "בעל העסק" in r.json()["detail"]
    assert _actions(svc, "inherited_optout_lift_refused")
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (m,))["opted_out"] == 1
    assert api.post(f"/customers/{m}/lift-inherited-optout", headers=hdr("owner")).status_code == 200
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (m,))["opted_out"] == 0
    # פעם שנייה ⇒ כבר לא ירושה ⇒ 4xx (לא 500)
    assert 400 <= api.post(f"/customers/{m}/lift-inherited-optout", headers=hdr("owner")).status_code < 500

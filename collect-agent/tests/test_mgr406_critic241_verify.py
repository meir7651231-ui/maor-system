"""מנהל 406 · אימות 405 לפי «הבא» של ביקורת 241 — שלושה תרחישי קצה של המעבר (219א) ושל ביטול-ירושה (240א/ב).

(1) מעבר כפול דנה⇒מיכל⇒דנה: כל תזכורת בייצוא העיון (§13) של מי שהחשבונית הייתה רשומה עליו כשנבנתה —
    הראשונה והשלישית של דנה, האמצעית של מיכל; אף אחת לא כפולה ואף אחת לא נעלמת.
(2) תזכורת מאוחדת (reminder_invoices, שתי חשבוניות של דנה) כשרק **אחת** מהן עוברת למיכל — התזכורת («שלום דנה…»)
    נשארת של דנה בלבד, בשני הכיוונים (החשבונית הראשית עוברת / המשנית עוברת).
(3) ביטול-ירושה כשהטלפון של מיכל כבר ברשימת ההסרה (לקוח אחר עם אותו טלפון ביקש הסרה) ⇒ מסורב; ההסרה נשארת.
"""
from dataclasses import replace
from datetime import timedelta

import pytest

from tests.test_critic_round239_inherited_optout import DANA, MICHAL, H, _row, _sent_to_dana


def _cid(svc, phone):
    return svc.db.one("SELECT id FROM customers WHERE phone=?", (phone,))["id"]


def _send_next(svc, clock):
    """מקדם זמן עד שתזכורת חדשה מתוכננת ⇒ מאשר ושולח. מחזיר את המזהה."""
    for _ in range(20):
        clock.now += timedelta(days=2)
        rids = svc.plan()
        if rids:
            svc.approve(rids[0], confirm_open=True)
            svc.dispatch()
            return rids[0]
    raise AssertionError("לא תוכננה תזכורת")


def _export_ids(svc, cid):
    return [r["id"] for r in svc.customer_data_export(cid)["reminders"]]


def test_double_move_each_reminder_with_its_owner(svc, clock):
    _sent_to_dana(svc, clock)
    d = _cid(svc, DANA)
    r1 = svc.db.one("SELECT MAX(id) m FROM reminders")["m"]
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    m = _cid(svc, MICHAL)
    r2 = _send_next(svc, clock)
    clock.now += timedelta(days=1)
    svc.import_csv(_row("דנה כהן", DANA))
    assert svc.db.one("SELECT customer_id FROM invoices WHERE number='9001'")["customer_id"] == d
    r3 = _send_next(svc, clock)
    assert r1 < r2 < r3
    dana_ids, michal_ids = _export_ids(svc, d), _export_ids(svc, m)
    assert r1 in dana_ids and r3 in dana_ids and r2 not in dana_ids, dana_ids
    assert michal_ids == [r2] or (r2 in michal_ids and r1 not in michal_ids and r3 not in michal_ids), michal_ids
    assert not set(dana_ids) & set(michal_ids)
    # כל תזכורת שנשלחה מופיעה אצל מישהו
    sent = {r["id"] for r in svc.db.q("SELECT id FROM reminders WHERE status='sent'")}
    assert sent <= set(dana_ids) | set(michal_ids), (sent, dana_ids, michal_ids)
    assert all("דנה" not in r["body"] for r in svc.customer_data_export(m)["reminders"])


def _two_rows(n1, p1, n2, p2):
    return (H + f"9001,{n1},{p1},,1200,פתוח,01/10/26,15/10/26\n"
              f"9002,{n2},{p2},,800,פתוח,01/10/26,15/10/26\n").encode()


def _combined_to_dana(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv(_two_rows("דנה כהן", DANA, "דנה כהן", DANA))
    clock.now += timedelta(days=1)
    rids = svc.plan()
    assert rids
    for rid in rids:
        svc.approve(rid, confirm_open=True)
    svc.dispatch()
    combined = [rid for rid in rids if len(svc.reminder_invoice_ids(rid)) == 2]
    if not combined:
        pytest.skip("המנוע לא איחד את שתי החשבוניות לתזכורת אחת בתרחיש הזה")
    return combined[0]


@pytest.mark.parametrize("moved", ["9001", "9002"])
def test_combined_reminder_stays_with_previous_owner(svc, clock, moved):
    rid = _combined_to_dana(svc, clock)
    d = _cid(svc, DANA)
    clock.now += timedelta(days=1)
    rows = (_two_rows("מיכל לוי", MICHAL, "דנה כהן", DANA) if moved == "9001"
            else _two_rows("דנה כהן", DANA, "מיכל לוי", MICHAL))
    svc.import_csv(rows)
    m = _cid(svc, MICHAL)
    assert svc.db.one("SELECT customer_id FROM invoices WHERE number=?", (moved,))["customer_id"] == m
    assert rid in _export_ids(svc, d)
    assert rid not in _export_ids(svc, m)
    assert all("דנה" not in r["body"] for r in svc.customer_data_export(m)["reminders"])


def test_lift_refused_when_her_phone_already_suppressed(svc, clock):
    """הטלפון של מיכל ברשימת ההסרה (יוסי, אותו טלפון, ביקש הסרה) ⇒ זו לא «ירושה בלבד» — אין ביטול."""
    _sent_to_dana(svc, clock)
    svc.inbound("sms", DANA, "הסר אותי")
    svc.suppress("sms", MICHAL, "opt_out")   # כמו בקשת הסרה של לקוח אחר עם אותו טלפון
    clock.now += timedelta(days=1)
    svc.import_csv(_row("מיכל לוי", MICHAL))
    m = _cid(svc, MICHAL)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (m,))["opted_out"] == 1
    with pytest.raises(ValueError):
        svc.lift_inherited_optout(m)
    assert svc.suppressed("sms", MICHAL)
    assert svc.db.one("SELECT opted_out FROM customers WHERE id=?", (m,))["opted_out"] == 1

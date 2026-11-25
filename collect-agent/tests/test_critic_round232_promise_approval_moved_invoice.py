"""מבקר סבב 232 · 🟡 — אישור מועד-הבטחה אחרי שהחשבונית עברה ללקוח אחר (219א) מאריך רק את הלקוח הישן.

רכיבים: `app/service.py` → `_csv_contact_moved` (מעתיק את ההשהיה `promise:until=…` של הלקוח הישן לחדש **פעם אחת**,
ברגע המעבר) + `decide_promise_request` (מאריך `paused_reason`/`conversations.pause_until` רק ל-`cid` שביקש).
תרחיש: 8.11 דנה (050-1234567) כותבת «אשלם ב-5 לחודש הבא» ⇒ promise_over_limit, השהיה עד 23.11 וכרטיס «לאשר את
5.12?». 9.11 קובץ CSV: 9001 עוברת למיכל (050-0000999) — מיכל יורשת `promise:until=2026-11-23`. בעל העסק מאשר את
הבקשה ⇒ דנה (בלי חשבונית פתוחה) מושהית עד 6.12, מיכל נשארת עד 23.11 ⇒ ב-23.11 נבנית תזכורת על 9001 — אחרי שבעל
העסק אישר «לא לפני 5.12» על אותה חשבונית. ✓ נבדק בלי ממצא: גוף התזכורת למיכל לא מזכיר את מועד ההבטחה/שם של דנה;
הסדר פעיל לא זז (`_in_live_plan`). הצעה: ההכרעה מאריכה גם את מי שהחשבונית עברה אליו (audit csv_contact_changed),
או שהכרטיס יגיד «9001 רשומה כעת על מיכל לוי — האישור לא חל עליה». xfail(strict=True)."""
from dataclasses import replace
from datetime import timedelta

import pytest

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def _setup(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + "9001,דנה כהן,050-1234567,d@x.example,1200,פתוח,01/10/26,15/10/26\n").encode())
    r = svc.inbound("sms", "050-1234567", "אשלם ב-5 לחודש הבא")
    assert "promise_over_limit" in r["tags"]
    clock.now += timedelta(days=1)
    svc.import_csv((H + "9001,מיכל לוי,050-0000999,m@x.example,780,פתוח,01/10/26,15/10/26\n").encode())
    inv = svc.db.one("SELECT customer_id FROM invoices WHERE number='9001'")
    dana = svc.db.one("SELECT id FROM customers WHERE phone='050-1234567'")["id"]
    assert inv["customer_id"] != dana
    return dana, inv["customer_id"]


def _reminders_until(svc, clock, until):
    out = []
    while clock.now.date().isoformat() < until:
        clock.now += timedelta(days=1)
        for rid in svc.plan():
            if svc.db.one("SELECT 1 FROM reminders r JOIN invoices i ON i.id=r.invoice_id "
                          "WHERE r.id=? AND i.number='9001'", (rid,)):
                out.append(clock.now.date().isoformat())
    return out


def test_move_inherits_promise_pause_without_leak(svc, clock):
    """שומר: המעבר מעתיק את ההשהיה, והתזכורת אחריה לא מזכירה את דנה/מועד ההבטחה שלה."""
    dana, michal = _setup(svc, clock)
    assert (svc.db.one("SELECT paused_reason FROM customers WHERE id=?", (michal,))["paused_reason"]
            == "promise:until=2026-11-23")
    days = _reminders_until(svc, clock, "2026-11-24")
    assert days and days[0] >= "2026-11-23", days
    body = svc.db.one("SELECT r.body FROM reminders r JOIN invoices i ON i.id=r.invoice_id WHERE i.number='9001' "
                      "ORDER BY r.id DESC")["body"]
    assert "דנה" not in body and "5.12" not in body, body


@pytest.mark.xfail(strict=True, reason="232🟡: אישור 5.12 אחרי מעבר מאריך רק את דנה — 9001 של מיכל ב-23.11")
def test_promise_approval_after_move_covers_moved_invoice(svc, clock):
    dana, michal = _setup(svc, clock)
    svc.decide_promise_request(dana, True)
    days = _reminders_until(svc, clock, "2026-12-05")
    assert not days, days

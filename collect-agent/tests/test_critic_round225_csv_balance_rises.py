"""מבקר סבב 225 · 🟡 — עסק CSV: יתרה שעולה בחזרה בין קבצים (קובץ ישן) לא מסומנת כחשודה.

רכיבים: `app/service.py` → `ingest` (source=csv) + כרטיס `plan_amount_changed` (מנהל 357). 219ב (55ca86b3) הוסיף כרטיס
`csv_reopened` לחשבונית שנסגרה ושבה כפתוחה (קובץ ישן בטעות) ✓ — אבל לא ליתרה שעולה בחזרה על אותו מסמך פתוח:
  א. **בהסדר פעיל:** 1,200 ⇒ קובץ עם 800 (שולם תשלום 1) ⇒ קובץ ישן עם 1,200 ⇒ כרטיס «הסכום… עלה מ-800 ל-1,200 בזמן
     שההסדר פעיל… התוספת (400 ₪) לא כלולה בו — **כדאי לתאם עם הלקוח**» — ה«תוספת» היא תשלום שהלקוח כבר שילם;
     בעל העסק עלול לדרוש אותו שוב. ב-CSV הסיבה הסבירה היא קובץ ישן — הכרטיס לא מזכיר אותה.
  ב. **בלי הסדר:** 1,200 ⇒ 800 ⇒ 1,200 ⇒ אין שום כרטיס; התזכורת חוזרת לאישור על 1,200 (amount_changed).
הצעה: ב-CSV, יתרה שעולה על מסמך קיים ⇒ כרטיס כמו csv_reopened («ייתכן שהועלה קובץ ישן…»), וגם בכרטיס ההסדר.
xfail(strict=True) ×2."""
from dataclasses import replace
from datetime import timedelta

import pytest

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def _row(amt):
    return f"9001,דנה כהן,050-1234567,d@x.example,{amt},פתוח,01/10/26,15/10/26\n"


def _up_down_up(svc, clock, with_plan):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    svc.import_csv((H + _row("1200")).encode())
    if with_plan:
        cid = svc.db.one("SELECT customer_id FROM invoices WHERE number='9001'")["customer_id"]
        svc.approve_plan(svc.propose_plan(cid, 3), confirm_amount=True)
    clock.now += timedelta(days=5)
    svc.import_csv((H + _row("800")).encode())
    clock.now += timedelta(days=1)
    svc.import_csv((H + _row("1200")).encode())


def _cards(svc):
    return [m["body"] or "" for m in svc.db.q("SELECT body FROM messages WHERE needs_owner=1")]


@pytest.mark.xfail(strict=True, reason="225א🟡: בהסדר — «כדאי לתאם» על תוספת שכבר שולמה, בלי אזכור קובץ ישן")
def test_plan_card_mentions_old_file(svc, clock):
    _up_down_up(svc, clock, with_plan=True)
    assert any("9001" in c and "קובץ" in c for c in _cards(svc)), _cards(svc)


@pytest.mark.xfail(strict=True, reason="225ב🟡: בלי הסדר — יתרה שעולה בחזרה בקובץ CSV בלי כרטיס")
def test_no_plan_balance_rise_is_carded(svc, clock):
    _up_down_up(svc, clock, with_plan=False)
    assert any("9001" in c for c in _cards(svc)), _cards(svc)

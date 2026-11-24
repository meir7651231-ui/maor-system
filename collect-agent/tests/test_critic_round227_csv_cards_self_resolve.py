"""מבקר סבב 227 · 🟡 — כרטיסי CSV (csv_reopened, csv_balance_rose) נשארים ב«דורש טיפול» אחרי שהקובץ הבא פתר את המצב.

רכיבים: `app/service.py` → `_notify_csv_reopened` (219ב) / כרטיס `csv_balance_rose` (b4c6e02e, 225) — נוצרים בייבוא,
אבל ייבוא שאחריו לא מוריד אותם. אותו עיקרון כמו 224 (a6622f08 — כרטיס «שילמתי» יורד כשהמקור סגר).
נבדק (source_system=csv):
  א. 9001 «שולם» ⇒ «פתוח» (כרטיס csv_reopened ✓) ⇒ הקובץ הבא «שולם» שוב ⇒ החשבונית closed, **הכרטיס נשאר**.
  ב. 1,200 ⇒ 800 ⇒ 1,200 (כרטיס csv_balance_rose ✓) ⇒ הקובץ הבא 800 ⇒ **הכרטיס נשאר** («עלתה… אולי קובץ ישן»).
  ג. אותו כרטיס אחרי שהחשבונית סומנה «שולם» ונסגרה ⇒ **נשאר**.
בעל העסק בודק «קובץ ישן?» על חשבונית שכבר נסגרה / חזרה ליתרה הנכונה. הצעה: כשהקובץ הבא מחזיר את המצב (נסגרה /
היתרה ירדה ל≤ הקודמת) ⇒ הכרטיס יורד (או מתעדכן). xfail(strict=True) ×3."""
from dataclasses import replace
from datetime import timedelta

import pytest

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def _r(amt, st="פתוח"):
    return f"9001,דנה כהן,050-1234567,d@x.example,{amt},{st},01/10/26,15/10/26\n"


def _seq(svc, clock, rows):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    for row in rows:
        svc.import_csv((H + row).encode())
        clock.now += timedelta(days=1)


def _open(svc, intent):
    return bool(svc.db.one("SELECT 1 FROM messages WHERE needs_owner=1 AND intent=?", (intent,)))


@pytest.mark.xfail(strict=True, reason="227א🟡: csv_reopened נשאר אחרי שהקובץ הבא סגר את החשבונית שוב")
def test_reopened_card_clears_when_closed_again(svc, clock):
    _seq(svc, clock, [_r(500), _r(500, "שולם"), _r(500), _r(500, "שולם")])
    assert svc.db.one("SELECT status FROM invoices WHERE number='9001'")["status"] == "closed"
    assert not _open(svc, "csv_reopened")


@pytest.mark.xfail(strict=True, reason="227ב🟡: csv_balance_rose נשאר אחרי שהיתרה חזרה לנמוכה")
def test_balance_rose_card_clears_when_back_down(svc, clock):
    _seq(svc, clock, [_r(1200), _r(800), _r(1200), _r(800)])
    assert not _open(svc, "csv_balance_rose")


@pytest.mark.xfail(strict=True, reason="227ג🟡: csv_balance_rose נשאר אחרי שהחשבונית נסגרה")
def test_balance_rose_card_clears_when_paid(svc, clock):
    _seq(svc, clock, [_r(1200), _r(800), _r(1200), _r(1200, "שולם")])
    assert svc.db.one("SELECT status FROM invoices WHERE number='9001'")["status"] == "closed"
    assert not _open(svc, "csv_balance_rose")

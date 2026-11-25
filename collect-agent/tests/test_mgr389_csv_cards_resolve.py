"""מנהל 389 (מבקר 227🟡): כרטיסי CSV יורדים כשהקובץ הבא פתר — ובקרות שהם **נשארים** כשלא פתר.

`app/service.py` → `_resolve_csv_cards()` נקרא אחרי כל `import_csv`:
  · csv_reopened יורד רק כשהחשבונית נסגרה **אחרי** הכרטיס.
  · csv_balance_rose יורד כשנסגרה, או כשהיתרה חזרה ל≤ הסכום שלפני העלייה (מה-audit של הכרטיס).
  · יתרה שירדה אבל עדיין מעל הסכום הקודם / עלתה עוד / נשארה פתוחה ⇒ הכרטיס נשאר.
  · audit `csv_card_resolved` בלי PII (בלי שם/טלפון/מייל)."""
import json
from dataclasses import replace
from datetime import timedelta
from pathlib import Path

H = "מספר מסמך,שם לקוח,טלפון,מייל,סכום,סטטוס,תאריך,תאריך לתשלום\n"


def _r(amt, st="פתוח", num="9001"):
    return f"{num},דנה כהן,050-1234567,d@x.example,{amt},{st},01/10/26,15/10/26\n"


def _seq(svc, clock, rows):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    for row in rows:
        svc.import_csv((H + row).encode())
        clock.now += timedelta(days=1)


def _open(svc, intent):
    return bool(svc.db.one("SELECT 1 FROM messages WHERE needs_owner=1 AND intent=?", (intent,)))


def test_reopened_card_stays_while_still_open(svc, clock):
    _seq(svc, clock, [_r(500), _r(500, "שולם"), _r(500), _r(500)])
    assert _open(svc, "csv_reopened")


def test_balance_rose_stays_when_partially_down_but_above_previous(svc, clock):
    _seq(svc, clock, [_r(1200), _r(800), _r(1200), _r(1000)])
    assert _open(svc, "csv_balance_rose")


def test_balance_rose_stays_when_same_or_higher(svc, clock):
    _seq(svc, clock, [_r(1200), _r(800), _r(1200), _r(1200)])
    assert _open(svc, "csv_balance_rose")


def test_balance_rose_clears_below_previous(svc, clock):
    _seq(svc, clock, [_r(1200), _r(800), _r(1200), _r(300)])
    assert not _open(svc, "csv_balance_rose")


def test_other_invoice_closing_does_not_clear_card(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    svc.db.x("DELETE FROM invoices")
    for rows in ([_r(1200), _r(700, num="9002")], [_r(800), _r(700, num="9002")],
                 [_r(1200), _r(700, num="9002")], [_r(1200), _r(700, "שולם", num="9002")]):
        svc.import_csv((H + "".join(rows)).encode())
        clock.now += timedelta(days=1)
    assert _open(svc, "csv_balance_rose")


def test_audit_without_pii(svc, clock):
    _seq(svc, clock, [_r(500), _r(500, "שולם"), _r(500), _r(500, "שולם")])
    rows = svc.db.q("SELECT detail FROM audit WHERE action='csv_card_resolved'")
    assert len(rows) == 1
    d = json.loads(rows[0]["detail"])
    assert d["card"] == "csv_reopened" and d["why"] == "closed"
    blob = rows[0]["detail"]
    for pii in ("דנה", "050", "1234567", "d@x.example"):
        assert pii not in blob


def test_source_guard_called_after_csv_import():
    src = (Path(__file__).resolve().parents[1] / "app" / "service.py").read_text(encoding="utf-8")
    i = src.index("closed = self._csv_close_paid(res)")
    assert "self._resolve_csv_cards()" in src[i:i + 300]


def test_same_day_old_file_again_reopens_card(svc, clock):
    """הכרטיס ירד (800) ובאותו יום הקובץ הישן (1,200) הועלה שוב ⇒ הכרטיס חוזר, לא נבלע במפתח היומי."""
    svc.s = replace(svc.s, source_system="csv")
    for a in ("1200", "800", "1200", "800", "1200"):
        svc.import_csv((H + _r(a)).encode())
    assert _open(svc, "csv_balance_rose")
    assert svc.db.one("SELECT COUNT(*) n FROM messages WHERE intent='csv_balance_rose'")["n"] == 1


def test_same_day_reopened_again_reopens_card(svc, clock):
    svc.s = replace(svc.s, source_system="csv")
    for st in ("פתוח", "שולם", "פתוח", "שולם", "פתוח"):
        svc.import_csv((H + _r(500, st)).encode())
    assert _open(svc, "csv_reopened")

"""הפעלה 131: ה-KPI בדשבורד לא מחברים מטבעות שונים.

הבאג: `open_agorot`/`overdue_agorot`/`collected_agorot`/`at_risk_agorot` (וגם שיעור ההחזר וגרף הגבייה)
חיברו אגורות של כל החשבוניות בלי להסתכל על המטבע, והממשק הציג את התוצאה ב-₪: חשבונית של $500
ליד 1,200 ₪ ⇒ «חוב פתוח 1,700 ₪». התיקון: הסכומים ב-₪ בלבד; מטבע אחר ב-`other_currency`, לכל מטבע בנפרד."""
from app.service import _other_currency


def _split(svc):
    svc.sync()
    rows = svc.db.q("SELECT id, amount_agorot FROM invoices WHERE status='open' ORDER BY id")
    assert len(rows) >= 2
    usd, eur = rows[0], rows[1]
    svc.db.x("UPDATE invoices SET currency='USD', due='2026-01-01' WHERE id=?", (usd["id"],))
    svc.db.x("UPDATE invoices SET currency='EUR', status='closed', closed_at=? WHERE id=?",
             (svc.clock().isoformat(), eur["id"]))
    return usd, eur, rows[2:]


def test_totals_are_ils_only_and_other_currency_is_separate(svc):
    svc.sync()
    before = svc.dashboard()["totals"]
    usd, eur, rest = _split(svc)
    d = svc.dashboard()
    t = d["totals"]
    assert t["open_agorot"] == sum(r["amount_agorot"] for r in rest)
    assert t["open_agorot"] == before["open_agorot"] - usd["amount_agorot"] - eur["amount_agorot"]
    assert t["collected_agorot"] == before["collected_agorot"]          # ה-€ שנסגר לא נספר כ-₪
    assert t["open_invoices"] == len(rest) + 1                            # ספירה: כל החשבוניות
    assert t["other_currency"] == [
        {"currency": "EUR", "open_invoices": 0, "open_agorot": 0, "overdue_agorot": 0,
         "at_risk_agorot": 0, "collected_agorot": eur["amount_agorot"]},
        {"currency": "USD", "open_invoices": 1, "open_agorot": usd["amount_agorot"],
         "overdue_agorot": usd["amount_agorot"], "at_risk_agorot": usd["amount_agorot"],
         "collected_agorot": 0}]
    # גרף הגבייה: רק ₪
    assert sum(w["collected_agorot"] for w in d["series"]) <= t["collected_agorot"]
    assert all(w["count"] == 0 or w["collected_agorot"] > 0 for w in d["series"])


def test_ils_only_business_has_empty_other_currency(svc):
    svc.sync()
    assert svc.dashboard()["totals"]["other_currency"] == []


def test_other_currency_blank_and_lowercase():
    rows = [{"currency": None, "amount_agorot": 100, "days_overdue": 5},
            {"currency": "", "amount_agorot": 100, "days_overdue": 0},
            {"currency": "usd", "amount_agorot": 700, "days_overdue": 61},
            {"currency": "USD", "amount_agorot": 300, "days_overdue": 0}]
    assert _other_currency(rows, []) == [
        {"currency": "USD", "open_invoices": 2, "open_agorot": 1000, "overdue_agorot": 700,
         "at_risk_agorot": 700, "collected_agorot": 0}]
